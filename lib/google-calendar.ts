// Parses a Google Calendar iCal feed into site events (dates and times in Asia/Tokyo).
export type CalendarEvent = {
  id: string;
  data: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description: string;
    url?: string;
  };
};
type Prop = { name: string; params: Record<string, string>; value: string };
type Stamp = { wall: number; zone: string; allDay: boolean }; // wall: wall-clock time in `zone`, encoded as a UTC epoch
const SITE_ZONE = "Asia/Tokyo";
const DAY = 86400000;
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const MAX_ALL_DAY_SPAN = 31;
const MAX_ITERATIONS = 5000;

function unfold(text: string): Prop[] {
  return text
    .replace(/\r?\n[ \t]/g, "")
    .split(/\r?\n/)
    .flatMap((line) => {
      const match =
        /^([A-Za-z0-9-]+)((?:;[^:;]+=(?:"[^"]*"|[^:;]*))*):(.*)$/.exec(line);
      if (!match) return [];
      const params = Object.fromEntries(
        [...match[2].matchAll(/;([^=;]+)=("[^"]*"|[^:;]*)/g)].map((p) => [
          p[1].toUpperCase(),
          p[2].replace(/^"|"$/g, ""),
        ]),
      );
      return [{ name: match[1].toUpperCase(), params, value: match[3] }];
    });
}
const unescape = (v: string) =>
  v.replace(/\\([nN,;\\])/g, (_, c: string) =>
    c === "n" || c === "N" ? "\n" : c,
  );

function offset(zone: string, ms: number) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(ms)
      .map((x) => [x.type, x.value]),
  );
  return (
    Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms
  );
}
function instant(s: Stamp) {
  return s.zone === "UTC"
    ? s.wall
    : s.wall - offset(s.zone, s.wall - offset(s.zone, s.wall));
}
function validZone(zone: string | undefined) {
  if (!zone) return SITE_ZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return SITE_ZONE;
  }
}
function stamp(value: string, params: Record<string, string>): Stamp | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(
    value.trim(),
  );
  if (!m) return null;
  const wall = Date.UTC(
    +m[1],
    +m[2] - 1,
    +m[3],
    +(m[4] ?? 0),
    +(m[5] ?? 0),
    +(m[6] ?? 0),
  );
  if (!m[4]) return { wall, zone: SITE_ZONE, allDay: true };
  return { wall, zone: m[7] ? "UTC" : validZone(params.TZID), allDay: false };
}
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
function inSite(s: Stamp) {
  if (s.allDay) return { date: isoDate(s.wall), time: "" };
  const local = instant(s) + offset(SITE_ZONE, instant(s));
  return {
    date: isoDate(local),
    time: new Date(local).toISOString().slice(11, 16),
  };
}
const key = (s: Stamp) => (s.allDay ? isoDate(s.wall) : String(instant(s)));

// Yields candidate wall-clock starts per recurrence period, in order.
function* periods(
  rule: Record<string, string>,
  base: number,
): Generator<number[]> {
  const interval = Math.max(1, Number(rule.INTERVAL) || 1);
  const time = base - Math.floor(base / DAY) * DAY;
  const start = new Date(base);
  const byday = (rule.BYDAY ?? "")
    .split(",")
    .filter(Boolean)
    .map((d) => {
      const m = /^([+-]?\d+)?([A-Z]{2})$/.exec(d);
      return m
        ? { n: m[1] ? Number(m[1]) : 0, day: WEEKDAYS.indexOf(m[2]) }
        : null;
    })
    .filter((d): d is { n: number; day: number } => !!d && d.day >= 0);
  const bymonthday = (rule.BYMONTHDAY ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);
  for (let i = 0; ; i++) {
    const step = i * interval;
    if (rule.FREQ === "DAILY") {
      yield [base + step * DAY];
      continue;
    }
    if (rule.FREQ === "WEEKLY") {
      const wkst = Math.max(0, WEEKDAYS.indexOf(rule.WKST ?? "MO"));
      const weekStart =
        base - ((start.getUTCDay() - wkst + 7) % 7) * DAY + step * 7 * DAY;
      const days = byday.length
        ? byday.map((d) => (d.day - wkst + 7) % 7).sort((a, b) => a - b)
        : [(start.getUTCDay() - wkst + 7) % 7];
      yield days.map((d) => weekStart + d * DAY);
      continue;
    }
    if (rule.FREQ === "MONTHLY" || rule.FREQ === "YEARLY") {
      const year = start.getUTCFullYear() + (rule.FREQ === "YEARLY" ? step : 0);
      const month = start.getUTCMonth() + (rule.FREQ === "MONTHLY" ? step : 0);
      const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const at = (day: number) => Date.UTC(year, month, day) + time;
      let days: number[];
      if (rule.FREQ === "MONTHLY" && byday.length) {
        days = byday.flatMap((d) => {
          const all = Array.from({ length }, (_, k) => k + 1).filter(
            (k) => new Date(Date.UTC(year, month, k)).getUTCDay() === d.day,
          );
          return d.n === 0
            ? all
            : [all[d.n > 0 ? d.n - 1 : all.length + d.n]].filter(
                (k): k is number => k !== undefined,
              );
        });
      } else
        days = (bymonthday.length ? bymonthday : [start.getUTCDate()])
          .map((d) => (d < 0 ? length + d + 1 : d))
          .filter((d) => d >= 1 && d <= length);
      yield [...new Set(days)].sort((a, b) => a - b).map(at);
      continue;
    }
    return;
  }
}

type Raw = { props: Prop[]; get: (name: string) => Prop | undefined };
function occurrences(
  event: Raw,
  start: Stamp,
  from: string,
  to: string,
  overridden: Set<string>,
): Stamp[] {
  const rrule = event.get("RRULE");
  if (!rrule) return [start];
  const rule = Object.fromEntries(
    rrule.value
      .split(";")
      .map((p) => p.split("=") as [string, string])
      .map(([k, v]) => [k.toUpperCase(), v?.toUpperCase() ?? ""]),
  );
  const until = rule.UNTIL ? stamp(rule.UNTIL, { TZID: start.zone }) : null;
  const count = rule.COUNT ? Number(rule.COUNT) : Infinity;
  const excluded = new Set(
    event.props
      .filter((p) => p.name === "EXDATE")
      .flatMap((p) =>
        p.value
          .split(",")
          .map((v) => stamp(v, p.params))
          .filter((s): s is Stamp => !!s)
          .map((s) => (start.allDay ? isoDate(s.wall) : String(instant(s)))),
      ),
  );
  const result: Stamp[] = [];
  let seen = 0,
    iterations = 0;
  for (const candidates of periods(rule, start.wall)) {
    for (const wall of candidates) {
      if (wall < start.wall) continue;
      const s: Stamp = { ...start, wall };
      if (
        until &&
        (start.allDay || until.allDay
          ? isoDate(wall) > isoDate(until.wall)
          : instant(s) > instant(until))
      )
        return result;
      if (++seen > count) return result;
      const date = inSite(s).date;
      if (date > to) return result;
      if (date >= from && !excluded.has(key(s)) && !overridden.has(key(s)))
        result.push(s);
    }
    if (++iterations > MAX_ITERATIONS) return result;
  }
  return result;
}

export function parseIcs(
  text: string,
  from: string,
  to: string,
): CalendarEvent[] {
  const props = unfold(text);
  const raws: Raw[] = [];
  let current: Prop[] | null = null;
  let depth = 0;
  for (const p of props) {
    if (p.name === "BEGIN" && p.value === "VEVENT") {
      current = [];
      depth = 0;
      continue;
    }
    if (!current) continue;
    if (p.name === "BEGIN") {
      depth++;
      continue;
    }
    if (p.name === "END" && depth > 0) {
      depth--;
      continue;
    }
    if (p.name === "END" && p.value === "VEVENT") {
      const own = current;
      raws.push({ props: own, get: (n) => own.find((x) => x.name === n) });
      current = null;
      continue;
    }
    if (depth === 0) current.push(p);
  }
  const overrides = new Map<string, Set<string>>();
  for (const r of raws) {
    const id = r.get("RECURRENCE-ID");
    const uid = r.get("UID")?.value ?? "";
    const s = id && stamp(id.value, id.params);
    if (s) {
      const set = overrides.get(uid) ?? new Set();
      set.add(key(s));
      overrides.set(uid, set);
    }
  }
  const events: CalendarEvent[] = [];
  for (const r of raws) {
    if (r.get("STATUS")?.value.toUpperCase() === "CANCELLED") continue;
    const dtstart = r.get("DTSTART");
    const start = dtstart && stamp(dtstart.value, dtstart.params);
    if (!start) continue;
    const dtend = r.get("DTEND");
    const end = dtend ? stamp(dtend.value, dtend.params) : null;
    const uid = r.get("UID")?.value ?? "";
    // The site is public: private events only show that the time is taken.
    const hidden = ["PRIVATE", "CONFIDENTIAL"].includes(
      r.get("CLASS")?.value.trim().toUpperCase() ?? "",
    );
    const location = hidden ? "" : unescape(r.get("LOCATION")?.value ?? "");
    const description = hidden
      ? ""
      : [
          location && `場所：${location}`,
          unescape(r.get("DESCRIPTION")?.value ?? ""),
        ]
          .filter(Boolean)
          .join("\n")
          .slice(0, 20000);
    const link = hidden ? "" : (r.get("URL")?.value.trim() ?? "");
    const url = /^https?:\/\//i.test(link) ? link : undefined;
    const title = hidden
      ? "予定あり"
      : unescape(r.get("SUMMARY")?.value ?? "")
          .trim()
          .slice(0, 200) || "（タイトルなし）";
    const overridden = r.get("RECURRENCE-ID")
      ? new Set<string>()
      : (overrides.get(uid) ?? new Set<string>());
    for (const s of occurrences(r, start, from, to, overridden)) {
      const base = `google:${uid}:${key(s)}`;
      if (start.allDay) {
        const span = end?.allDay
          ? Math.min(
              MAX_ALL_DAY_SPAN,
              Math.max(1, Math.round((end.wall - start.wall) / DAY)),
            )
          : 1;
        for (let d = 0; d < span; d++)
          events.push({
            id: span > 1 ? `${base}:${d}` : base,
            data: {
              title,
              date: isoDate(s.wall + d * DAY),
              startTime: "",
              endTime: "",
              description,
              url,
            },
          });
      } else {
        const at = inSite(s);
        const endTime =
          end && !end.allDay
            ? inSite({
                wall: instant(s) + instant(end) - instant(start),
                zone: "UTC",
                allDay: false,
              }).time
            : "";
        events.push({
          id: base,
          data: {
            title,
            date: at.date,
            startTime: at.time,
            endTime,
            description,
            url,
          },
        });
      }
    }
  }
  return events.filter((e) => e.data.date >= from && e.data.date <= to);
}
