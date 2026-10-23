import { HttpError } from "@/lib/access";
import { parseIcs } from "@/lib/google-calendar";
import { apiResponse } from "@/lib/permissions";
const DAY = 86400000;
const REFRESH_SECONDS = 300;
export async function GET() {
  return apiResponse(async () => {
    const url = process.env.GOOGLE_CALENDAR_ICS_URL;
    if (!url) return { configured: false, events: [] };
    const res = await fetch(url, {
      next: { revalidate: REFRESH_SECONDS },
    }).catch(() => null);
    if (!res?.ok)
      throw new HttpError(502, "Google カレンダーの予定を取得できませんでした");
    const now = Date.now();
    const date = (ms: number) =>
      new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(ms);
    return {
      configured: true,
      events: parseIcs(
        await res.text(),
        date(now - 366 * DAY),
        date(now + 366 * DAY),
      ),
    };
  });
}
