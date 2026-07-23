"use client";

import { useState } from "react";
import { Fit, TripDay, TripEvent } from "@/lib/types";
import { weekday, dayOfMonth, monthShort } from "@/lib/trips";
import FitThumb from "@/components/trips/FitThumb";

export default function TripDayCard({
  date,
  index,
  day,
  expanded,
  onToggle,
  getFit,
  onAddEvent,
  onRemoveEvent,
  onAttachDay,
  onDetachDay
}: {
  date: string;
  index: number;
  day: TripDay;
  expanded: boolean;
  onToggle: () => void;
  getFit: (id: string) => Fit | undefined;
  onAddEvent: (e: TripEvent) => void;
  onRemoveEvent: (id: string) => void;
  onAttachDay: () => void;
  onDetachDay: (fitId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const outfits = day.outfits.map(getFit).filter(Boolean) as Fit[];
  const eventCount = day.events.length;

  function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() && !notes.trim()) return;
    onAddEvent({
      id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: title.trim() || "Untitled",
      time: time.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined
    });
    setTitle("");
    setTime("");
    setLocation("");
    setNotes("");
  }

  return (
    <article className={"day-card" + (expanded ? " open" : "")}>
      <button className="day-head" onClick={onToggle} aria-expanded={expanded}>
        <span className="day-date">
          <span className="dow">{weekday(date).slice(0, 3)}</span>
          <span className="dom">{dayOfMonth(date)}</span>
          <span className="mon">{monthShort(date)}</span>
        </span>
        <span className="day-summary">
          <span className="day-idx">Day {index + 1}</span>
          <span className="day-line">
            {eventCount > 0 ? `${eventCount} ${eventCount === 1 ? "event" : "events"}` : "No events yet"}
            {outfits.length > 0 ? ` · ${outfits.length} outfit${outfits.length === 1 ? "" : "s"}` : ""}
          </span>
        </span>
        <span className="day-peek">
          {!expanded &&
            outfits.slice(0, 3).map((f) => (
              <span className="peek-thumb" key={f.id}>
                <FitThumb fit={f} label={false} />
              </span>
            ))}
          <span className="chev">{expanded ? "–" : "+"}</span>
        </span>
      </button>

      {expanded && (
        <div className="day-body">
          {/* Events */}
          <div className="day-block">
            <h4>Events</h4>
            {day.events.length > 0 ? (
              <ul className="event-list">
                {day.events.map((ev) => (
                  <li className="event-row" key={ev.id}>
                    {ev.time && <span className="ev-time">{ev.time}</span>}
                    <span className="ev-body">
                      <span className="ev-title">{ev.title}</span>
                      {ev.location && <span className="ev-loc">{ev.location}</span>}
                      {ev.notes && <span className="ev-notes">{ev.notes}</span>}
                    </span>
                    <button className="icon-btn danger" aria-label="Remove event" onClick={() => onRemoveEvent(ev.id)} style={{ width: 28, height: 28, fontSize: "0.8rem" }}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="day-none">Nothing planned — add the first thing below.</p>
            )}

            <form className="event-add" onSubmit={submitEvent}>
              <div className="ea-row">
                <input className="input" placeholder="Time (e.g. 09:30)" value={time} onChange={(e) => setTime(e.target.value)} style={{ maxWidth: "9rem" }} />
                <input className="input" placeholder="What's happening?" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="ea-row">
                <input className="input" placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
                <input className="input" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button type="submit" className="btn sm ghost">
                + Add event
              </button>
            </form>
          </div>

          {/* Outfits */}
          <div className="day-block">
            <h4>Outfit{outfits.length === 1 ? "" : "s"} for the day</h4>
            {outfits.length > 0 ? (
              <div className="day-outfits">
                {outfits.map((f) => (
                  <FitThumb key={f.id} fit={f} onRemove={() => onDetachDay(f.id)} />
                ))}
              </div>
            ) : (
              <p className="day-none">No outfit attached yet.</p>
            )}
            <button className="btn sm" onClick={onAttachDay} style={{ marginTop: "0.8rem" }}>
              ♡ Attach an outfit
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
