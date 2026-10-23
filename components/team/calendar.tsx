"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { type Entry, type Editing, today, dateLabel } from "./types";
import { Empty, External, Edit, Add } from "./common";
import type { CalendarEvent } from "@/lib/google-calendar";
type Item = {
  id: string;
  data: CalendarEvent["data"] & { description?: string; url?: string };
  entry?: Entry<"event">;
};
export default function Calendar({
  events,
  googleEvents,
  googleError,
  canEdit,
  onEdit,
}: {
  events: Entry<"event">[];
  googleEvents: CalendarEvent[];
  googleError: string;
  canEdit: boolean;
  onEdit: (e: Editing) => void;
}) {
  const [month, setMonth] = useState(today().slice(0, 7));
  const [day, setDay] = useState("");
  const [year, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const offset = new Date(Date.UTC(year, m - 1, 1)).getUTCDay();
  const items: Item[] = [
    ...events.map((e) => ({ id: e.id, data: e.data, entry: e })),
    ...googleEvents,
  ];
  const monthEvents = items
    .filter((e) => e.data.date.startsWith(month))
    .sort((a, b) =>
      (a.data.date + a.data.startTime).localeCompare(
        b.data.date + b.data.startTime,
      ),
    );
  const selected = day
    ? monthEvents.filter((e) => e.data.date === day)
    : monthEvents;
  function navigate(amount: number) {
    const d = new Date(Date.UTC(year, m - 1 + amount, 1));
    setMonth(d.toISOString().slice(0, 7));
    setDay("");
  }
  return (
    <div className="calendar-panel panel">
      <div className="panel-title">
        <h3>
          <CalendarDays size={18} />
          カレンダー
        </h3>
        {canEdit && (
          <Add label="予定を追加" onClick={() => onEdit({ kind: "event" })} />
        )}
      </div>
      {googleError && (
        <p className="error-box" role="alert">
          {googleError}
        </p>
      )}
      <div className="calendar-controls">
        <h4>
          {year}年 <strong>{m}月</strong>
        </h4>
        <div>
          <button
            className="icon-button"
            aria-label="前の月"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="text-button"
            onClick={() => {
              setMonth(today().slice(0, 7));
              setDay("");
            }}
          >
            今月
          </button>
          <button
            className="icon-button"
            aria-label="次の月"
            onClick={() => navigate(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="calendar-week">
        {"日月火水木金土".split("").map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: offset }, (_, i) => (
          <div key={"blank" + i} className="calendar-blank" />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const daily = monthEvents.filter((e) => e.data.date === date);
          return (
            <button
              key={date}
              className={
                "calendar-day " +
                (date === today() ? "is-today " : "") +
                (day === date ? "is-selected" : "")
              }
              onClick={() => setDay(day === date ? "" : date)}
              aria-label={`${dateLabel(date)}、予定${daily.length}件`}
              aria-pressed={day === date}
            >
              <span>{i + 1}</span>
              {daily.slice(0, 2).map((e) => (
                <span
                  className={"calendar-event" + (e.entry ? "" : " is-google")}
                  key={e.id}
                >
                  {e.data.title}
                </span>
              ))}
              {daily.length > 2 && <small>+{daily.length - 2}件</small>}
            </button>
          );
        })}
      </div>
      <div className="event-list">
        <div className="list-caption">
          {day ? dateLabel(day) : `${m}月`}の予定{" "}
          <span>{selected.length}件</span>
          {day && (
            <button className="text-button" onClick={() => setDay("")}>
              月全体を表示
            </button>
          )}
        </div>
        {selected.length ? (
          selected.map((e) => (
            <div className="event-row" key={e.id}>
              <time>{dateLabel(e.data.date)}</time>
              <div>
                <strong>{e.data.title}</strong>
                {!e.entry && <span className="event-source">Google</span>}
                {e.data.startTime && (
                  <p className="muted">
                    {e.data.startTime}
                    {e.data.endTime && " – " + e.data.endTime}
                  </p>
                )}
                {e.data.description && (
                  <p className="pre-wrap">{e.data.description}</p>
                )}
                {e.data.url && (
                  <External href={e.data.url}>詳細リンク</External>
                )}
              </div>
              {canEdit && e.entry && (
                <Edit
                  label={e.data.title}
                  onClick={() => onEdit({ kind: "event", entry: e.entry })}
                />
              )}
            </div>
          ))
        ) : (
          <Empty>この{day ? "日" : "月"}の予定はまだありません。</Empty>
        )}
      </div>
    </div>
  );
}
