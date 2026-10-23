import test from "node:test";
import assert from "node:assert/strict";
import { parseIcs } from "../lib/google-calendar.ts";
const ics = (...events: string[][]) =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    ...events.flatMap((e) => ["BEGIN:VEVENT", ...e, "END:VEVENT"]),
    "END:VCALENDAR",
  ].join("\r\n");
test("converts timed events to Tokyo date and time", () => {
  const [event] = parseIcs(
    ics([
      "UID:a",
      "DTSTART:20261101T150000Z",
      "DTEND:20261101T160000Z",
      "SUMMARY:定例\\, 振り返り",
      "LOCATION:Zoom",
      "DESCRIPTION:議題\\n共有",
    ]),
    "2026-10-01",
    "2026-12-31",
  );
  assert.deepEqual(event.data, {
    title: "定例, 振り返り",
    date: "2026-11-02",
    startTime: "00:00",
    endTime: "01:00",
  });
});
test("reads TZID times and folded lines", () => {
  const [event] = parseIcs(
    ics([
      "UID:b",
      "DTSTART;TZID=Asia/Tokyo:20261105T190000",
      "DTEND;TZID=Asia/Tokyo:20261105T203000",
      "SUMMARY:長い",
      "  タイトル",
    ]),
    "2026-10-01",
    "2026-12-31",
  );
  assert.equal(event.data.title, "長い タイトル");
  assert.equal(event.data.startTime, "19:00");
  assert.equal(event.data.endTime, "20:30");
});
test("keeps the end date of timed events that end on a later day", () => {
  const [event] = parseIcs(
    ics([
      "UID:c",
      "DTSTART;TZID=Asia/Tokyo:20260821T160000",
      "DTEND;TZID=Asia/Tokyo:20260822T140000",
      "SUMMARY:合宿",
    ]),
    "2026-08-01",
    "2026-08-31",
  );
  assert.deepEqual(event.data, {
    title: "合宿",
    date: "2026-08-21",
    startTime: "16:00",
    endTime: "14:00",
    endDate: "2026-08-22",
  });
});
test("shows events ending at the next midnight as ending at 24:00", () => {
  const [event] = parseIcs(
    ics([
      "UID:d",
      "DTSTART;TZID=Asia/Tokyo:20260807T190000",
      "DTEND;TZID=Asia/Tokyo:20260808T000000",
      "SUMMARY:夜",
    ]),
    "2026-08-01",
    "2026-08-31",
  );
  assert.deepEqual(event.data, {
    title: "夜",
    date: "2026-08-07",
    startTime: "19:00",
    endTime: "24:00",
  });
});
test("keeps the end date of recurring events that cross midnight", () => {
  const events = parseIcs(
    ics([
      "UID:e",
      "DTSTART;TZID=Asia/Tokyo:20260803T230000",
      "DTEND;TZID=Asia/Tokyo:20260804T010000",
      "RRULE:FREQ=WEEKLY;COUNT=2",
      "SUMMARY:深夜",
    ]),
    "2026-08-01",
    "2026-08-31",
  );
  assert.deepEqual(
    events.map((e) => [e.data.date, e.data.endDate, e.data.endTime]),
    [
      ["2026-08-03", "2026-08-04", "01:00"],
      ["2026-08-10", "2026-08-11", "01:00"],
    ],
  );
});
test("spreads multi-day all-day events over each day", () => {
  const events = parseIcs(
    ics([
      "UID:c",
      "DTSTART;VALUE=DATE:20261110",
      "DTEND;VALUE=DATE:20261113",
      "SUMMARY:合宿",
    ]),
    "2026-10-01",
    "2026-12-31",
  );
  assert.deepEqual(
    events.map((e) => e.data.date),
    ["2026-11-10", "2026-11-11", "2026-11-12"],
  );
  assert.equal(events[0].data.startTime, "");
});
test("expands weekly recurrences with exclusions and overrides", () => {
  const events = parseIcs(
    ics(
      [
        "UID:d",
        "DTSTART;TZID=Asia/Tokyo:20261104T200000",
        "DTEND;TZID=Asia/Tokyo:20261104T210000",
        "RRULE:FREQ=WEEKLY;BYDAY=WE;COUNT=4",
        "EXDATE;TZID=Asia/Tokyo:20261111T200000",
        "SUMMARY:週次",
      ],
      [
        "UID:d",
        "RECURRENCE-ID;TZID=Asia/Tokyo:20261118T200000",
        "DTSTART;TZID=Asia/Tokyo:20261119T210000",
        "DTEND;TZID=Asia/Tokyo:20261119T220000",
        "SUMMARY:週次（振替）",
      ],
    ),
    "2026-10-01",
    "2026-12-31",
  );
  assert.deepEqual(
    events.map((e) => [e.data.date, e.data.startTime, e.data.title]).sort(),
    [
      ["2026-11-04", "20:00", "週次"],
      ["2026-11-19", "21:00", "週次（振替）"],
      ["2026-11-25", "20:00", "週次"],
    ],
  );
});
test("expands monthly nth-weekday rules until the end date", () => {
  const events = parseIcs(
    ics([
      "UID:e",
      "DTSTART;TZID=Asia/Tokyo:20261013T100000",
      "RRULE:FREQ=MONTHLY;BYDAY=2TU;UNTIL=20261231T145959Z",
      "SUMMARY:月例",
    ]),
    "2026-10-01",
    "2027-03-31",
  );
  assert.deepEqual(
    events.map((e) => e.data.date),
    ["2026-10-13", "2026-11-10", "2026-12-08"],
  );
});
test("limits recurrences to the requested window and skips cancelled events", () => {
  const events = parseIcs(
    ics(
      [
        "UID:f",
        "DTSTART;VALUE=DATE:20200101",
        "RRULE:FREQ=DAILY",
        "SUMMARY:毎日",
      ],
      ["UID:g", "DTSTART:20261101T000000Z", "STATUS:CANCELLED", "SUMMARY:中止"],
    ),
    "2026-11-01",
    "2026-11-03",
  );
  assert.deepEqual(
    events.map((e) => e.data.date),
    ["2026-11-01", "2026-11-02", "2026-11-03"],
  );
});
test("never exposes descriptions, locations, or links", () => {
  const events = parseIcs(
    ics([
      "UID:m",
      "DTSTART:20261101T000000Z",
      "SUMMARY:定例",
      "LOCATION:会議室",
      "DESCRIPTION:Join with Google Meet: https://meet.google.com/abc-defg-hij\\nPIN: 123",
      "URL:https://example.com/x",
    ]),
    "2026-10-01",
    "2026-12-31",
  );
  assert.deepEqual(Object.keys(events[0].data).sort(), [
    "date",
    "endTime",
    "startTime",
    "title",
  ]);
  assert.equal(JSON.stringify(events).includes("meet.google.com"), false);
});
test("hides details of private and confidential events", () => {
  const events = parseIcs(
    ics(
      [
        "UID:p",
        "DTSTART:20261101T000000Z",
        "CLASS:PRIVATE",
        "SUMMARY:通院",
        "LOCATION:病院",
        "DESCRIPTION:メモ",
        "URL:https://example.com/p",
      ],
      [
        "UID:q",
        "DTSTART:20261101T010000Z",
        "CLASS:CONFIDENTIAL",
        "SUMMARY:面談",
      ],
      ["UID:r", "DTSTART:20261101T020000Z", "CLASS:PUBLIC", "SUMMARY:定例"],
    ),
    "2026-10-01",
    "2026-12-31",
  );
  assert.deepEqual(
    events.map((e) => e.data.title),
    ["予定あり", "予定あり", "定例"],
  );
});
test("modified occurrences of a private series stay hidden", () => {
  const events = parseIcs(
    ics(
      [
        "UID:s",
        "DTSTART;TZID=Asia/Tokyo:20261102T090000",
        "RRULE:FREQ=WEEKLY;COUNT=2",
        "CLASS:PRIVATE",
        "SUMMARY:通院",
      ],
      [
        "UID:s",
        "RECURRENCE-ID;TZID=Asia/Tokyo:20261109T090000",
        "DTSTART;TZID=Asia/Tokyo:20261110T090000",
        "SUMMARY:通院（変更）",
        "DESCRIPTION:メモ",
      ],
    ),
    "2026-10-01",
    "2026-12-31",
  );
  assert.deepEqual(events.map((e) => [e.data.date, e.data.title]).sort(), [
    ["2026-11-02", "予定あり"],
    ["2026-11-10", "予定あり"],
  ]);
});
