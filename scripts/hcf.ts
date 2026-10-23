// Command-line editor for the team site.
// Signs in as a registered editor and saves through the same database functions as the site,
// so the database still checks permissions, validation, and revisions. No service-role key is used.
import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { createInterface } from "node:readline/promises";
import { dirname, join } from "node:path";
import {
  recordKindSchema,
  validateData,
  validationErrorMessage,
  type RecordKind,
} from "../lib/model.ts";

type Row = {
  id: string;
  kind: RecordKind;
  data: Record<string, unknown>;
  revision: number;
  sort_order: number;
};
type Stored = {
  pendingEmail?: string;
  session?: Pick<Session, "access_token" | "refresh_token">;
};

const statePath =
  process.env.HCF_CLI_STATE ??
  join(homedir(), ".config", "hcf-teamsite", "session.json");

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function client(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    fail(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set (.env.local).",
    );
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      flowType: "implicit",
    },
  });
}

async function load(): Promise<Stored> {
  try {
    return JSON.parse(await readFile(statePath, "utf8")) as Stored;
  } catch {
    return {};
  }
}

async function save(state: Stored) {
  await mkdir(dirname(statePath), { recursive: true, mode: 0o700 });
  await writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
  await chmod(statePath, 0o600);
}

async function storeSession(session: Session | null) {
  if (!session) fail("Sign-in failed: no session returned.");
  await save({
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    },
  });
}

// Restores the saved session (refreshing it if needed) and saves the rotated tokens.
async function signedIn(): Promise<SupabaseClient> {
  const db = client();
  const { session } = await load();
  if (!session) fail("Not signed in. Run: npm run hcf -- login <email>");
  const { data, error } = await db.auth.setSession(session);
  if (error || !data.session)
    fail("Session expired. Run: npm run hcf -- login <email>");
  await storeSession(data.session);
  return db;
}

async function rpc<T>(
  db: SupabaseClient,
  name: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await db.rpc(name, args);
  if (error) fail(`${name} failed: ${error.message}`);
  return data as T;
}

async function readRecords(db: SupabaseClient): Promise<Row[]> {
  const { data, error } = await db
    .from("hcf_records")
    .select("id,kind,data,revision,sort_order")
    .eq("deleted", false)
    .order("sort_order")
    .order("id");
  if (error) fail(`Read failed: ${error.message}`);
  return data as Row[];
}

async function find(db: SupabaseClient, id: string): Promise<Row> {
  const row = (await readRecords(db)).find((r) => r.id === id);
  if (!row) fail(`Record not found: ${id}`);
  return row;
}

function parseJson(text: string | undefined): Record<string, unknown> {
  if (!text) fail("Pass the fields as a JSON object.");
  try {
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value as Record<string, unknown>;
  } catch {
    fail('Fields must be a JSON object, e.g. \'{"role":"..."}\'');
  }
}

// Reads the fields argument, or stdin when it is "-" (handy for long multi-line text).
async function fieldsArg(arg: string | undefined) {
  if (arg !== "-") return parseJson(arg);
  let text = "";
  for await (const chunk of process.stdin) text += chunk;
  return parseJson(text);
}

function valid(kind: RecordKind, data: unknown) {
  try {
    return validateData(kind, data);
  } catch (error) {
    fail(`Invalid input: ${validationErrorMessage(error)}`);
  }
}

const print = (value: unknown) => console.log(JSON.stringify(value, null, 2));
const view = (r: Row) => ({
  id: r.id,
  kind: r.kind,
  revision: r.revision,
  sortOrder: r.sort_order,
  data: r.data,
});

const usage = `Usage: npm run hcf -- <command>
  login <email>                 Send a sign-in email (editors only)
  verify [link-or-code]         Finish sign-in (asks for it if omitted) with the email link (copied, not opened) or 6-digit code
  whoami                        Show whether the saved session can edit
  logout                        Sign out and delete the saved session
  list [kind]                   List records (kinds: ${recordKindSchema.options.join(", ")})
  get <id>                      Show one record
  update <id> <json|->          Merge fields into a record and save
  create <kind> <json|-> [sort] Create a record
  delete <id>                   Delete a record`;

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "login": {
    const email = args[0]?.trim().toLowerCase();
    if (!email) fail(usage);
    const { error } = await client().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) fail(`Could not send the sign-in email: ${error.message}`);
    await save({ ...(await load()), pendingEmail: email });
    console.log(
      `Sign-in email sent to ${email}. Copy the link in the email (do not open it) and run: npm run hcf -- verify`,
    );
    break;
  }
  case "verify": {
    // Without an argument, ask for the link so it never has to be typed into the command line.
    let input = args[0]?.trim();
    if (!input) {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      input = (
        await rl.question("Paste the link (or code) from the email: ")
      ).trim();
      rl.close();
    }
    if (!input) fail(usage);
    const db = client();
    let result;
    if (/^\d{6,10}$/.test(input)) {
      const email = (await load()).pendingEmail;
      if (!email) fail("Run login first.");
      result = await db.auth.verifyOtp({ email, token: input, type: "email" });
    } else {
      let tokenHash: string | null = null;
      try {
        const url = new URL(input);
        tokenHash =
          url.searchParams.get("token_hash") ?? url.searchParams.get("token");
      } catch {
        tokenHash = input;
      }
      if (!tokenHash) fail("No token found in the link.");
      result = await db.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });
    }
    if (result.error) fail(`Sign-in failed: ${result.error.message}`);
    await storeSession(result.data.session);
    const db2 = await signedIn();
    print({
      email: result.data.user?.email,
      ...(await rpc<object>(db2, "hcf_access_status")),
    });
    break;
  }
  case "whoami": {
    const db = await signedIn();
    const { data } = await db.auth.getUser();
    print({
      email: data.user?.email,
      ...(await rpc<object>(db, "hcf_access_status")),
    });
    break;
  }
  case "logout": {
    const { session } = await load();
    if (session) {
      const db = client();
      const { error } = await db.auth.setSession(session);
      if (!error) await db.auth.signOut();
    }
    await rm(statePath, { force: true });
    console.log("Signed out.");
    break;
  }
  case "list": {
    const kind = args[0];
    if (kind && !recordKindSchema.safeParse(kind).success) fail(usage);
    const rows = await readRecords(client());
    print(rows.filter((r) => !kind || r.kind === kind).map(view));
    break;
  }
  case "get": {
    if (!args[0]) fail(usage);
    print(view(await find(client(), args[0])));
    break;
  }
  case "update": {
    if (!args[0]) fail(usage);
    const fields = await fieldsArg(args[1]);
    const db = await signedIn();
    const current = await find(db, args[0]);
    const data = valid(current.kind, { ...current.data, ...fields });
    const row = await rpc<Row>(db, "hcf_change_record", {
      p_id: current.id,
      p_revision: current.revision,
      p_data: data,
      p_sort_order: null,
      p_remove: false,
    });
    print(view(row));
    break;
  }
  case "create": {
    const kind = recordKindSchema.safeParse(args[0]);
    if (!kind.success) fail(usage);
    const fields = await fieldsArg(args[1]);
    const sortOrder = args[2] === undefined ? 0 : Number(args[2]);
    if (!Number.isInteger(sortOrder)) fail("sort must be an integer.");
    const db = await signedIn();
    const data = valid(kind.data, fields);
    print(
      view(
        await rpc<Row>(db, "hcf_create_record", {
          p_kind: kind.data,
          p_data: data,
          p_sort_order: sortOrder,
        }),
      ),
    );
    break;
  }
  case "delete": {
    if (!args[0]) fail(usage);
    const db = await signedIn();
    const current = await find(db, args[0]);
    await rpc(db, "hcf_change_record", {
      p_id: current.id,
      p_revision: current.revision,
      p_data: null,
      p_sort_order: null,
      p_remove: true,
    });
    console.log(`Deleted ${current.id}.`);
    break;
  }
  default:
    console.log(usage);
}
