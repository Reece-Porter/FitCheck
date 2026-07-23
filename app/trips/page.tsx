"use client";

import { useEffect, useMemo, useState } from "react";
import PageHead from "@/components/PageHead";
import Modal from "@/components/Modal";
import TripDayCard from "@/components/trips/TripDayCard";
import OutfitPicker from "@/components/trips/OutfitPicker";
import { useTrips, useFits } from "@/lib/store";
import { eachDay, fmtRange, tripLength, todayKey } from "@/lib/trips";
import { Fit, Trip, TripEvent } from "@/lib/types";
import { toast } from "@/components/Toast";

const SEL_KEY = "fitted:trip";

export default function TripsPage() {
  const { trips, create, remove, patch, updateDay } = useTrips();
  const { fits } = useFits();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ date: string } | null>(null);

  // trip form (create + edit)
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.sessionStorage.getItem(SEL_KEY) : null;
    if (saved) setSelectedId(saved);
  }, []);

  function select(id: string | null) {
    setSelectedId(id);
    setExpanded(null);
    if (typeof window !== "undefined") {
      if (id) window.sessionStorage.setItem(SEL_KEY, id);
      else window.sessionStorage.removeItem(SEL_KEY);
    }
  }

  const fitsById = useMemo(() => {
    const m = new Map<string, Fit>();
    fits.forEach((f) => m.set(f.id, f));
    return m;
  }, [fits]);

  const trip = selectedId ? trips.find((t) => t.id === selectedId) || null : null;

  function openCreate() {
    setEditId(null);
    setFName("");
    setFStart(todayKey());
    setFEnd(todayKey());
    setFormOpen(true);
  }
  function openEdit(t: Trip) {
    setEditId(t.id);
    setFName(t.name);
    setFStart(t.start);
    setFEnd(t.end);
    setFormOpen(true);
  }
  function submitForm() {
    if (!fStart || !fEnd) return toast("Pick a start and end date");
    if (fEnd < fStart) return toast("End date is before the start date");
    if (editId) {
      patch(editId, { name: fName.trim() || "Untitled trip", start: fStart, end: fEnd });
      toast("Trip updated");
    } else {
      const id = create(fName.trim() || "Untitled trip", fStart, fEnd);
      select(id);
      toast("Trip created");
    }
    setFormOpen(false);
  }

  return (
    <div className="wrap">
      {!trip ? (
        <>
          <PageHead
            index="№ 06 — The Itinerary"
            title={
              <>
                <span className="serif-italic">Trips</span>
              </>
            }
            lede="Plan what you'll wear, day by day. Give a trip its dates, fill in the days, and pin outfits from My Fits to each one."
          />

          <div className="section-label">
            <h2>Your Trips</h2>
            <div className="tools">
              <button className="btn accent sm" onClick={openCreate}>
                + Plan a trip
              </button>
            </div>
          </div>

          {trips.length === 0 ? (
            <div className="empty">
              <div className="mark">Ø</div>
              <h3>No trips planned yet</h3>
              <p>Create a trip with its dates and you'll get a day-by-day itinerary to plan outfits against.</p>
              <button className="btn accent" onClick={openCreate}>
                Plan your first trip
              </button>
            </div>
          ) : (
            <div className="trip-grid">
              {trips.map((t) => {
                const days = tripLength(t.start, t.end);
                const events = Object.values(t.days).reduce((n, d) => n + d.events.length, 0);
                const outfits = Object.values(t.days).reduce((n, d) => n + d.outfits.length, 0);
                return (
                  <article className="trip-card fade-up" key={t.id}>
                    <button className="trip-open" onClick={() => select(t.id)}>
                      <span className="trip-kicker">{days} {days === 1 ? "day" : "days"}</span>
                      <h3>{t.name}</h3>
                      <span className="trip-range">{fmtRange(t.start, t.end)}</span>
                      <span className="trip-meta">
                        {events} {events === 1 ? "event" : "events"} · {outfits} outfit{outfits === 1 ? "" : "s"} pinned
                      </span>
                    </button>
                    <div className="trip-foot">
                      <button className="text-link" onClick={() => openEdit(t)}>Edit</button>
                      <button
                        className="icon-btn danger"
                        aria-label="Delete trip"
                        onClick={() => {
                          if (confirm(`Delete “${t.name}”?`)) {
                            remove(t.id);
                            toast("Trip deleted");
                          }
                        }}
                        style={{ width: 28, height: 28, fontSize: "0.8rem" }}
                      >
                        ✕
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="trip-detail-head">
            <button className="back-link" onClick={() => select(null)}>
              ← All trips
            </button>
            <p className="index" style={{ marginTop: "1.4rem" }}>
              № 06 — The Itinerary
            </p>
            <div className="tdh-row">
              <h1 className="display">{trip.name}</h1>
              <div className="tdh-tools">
                <button className="btn ghost sm" onClick={() => openEdit(trip)}>Edit dates</button>
              </div>
            </div>
            <p className="trip-range big">
              {fmtRange(trip.start, trip.end)} · {tripLength(trip.start, trip.end)} days
            </p>
          </div>

          <div className="agenda">
            {eachDay(trip.start, trip.end).map((date, i) => {
              const day = trip.days[date] || { events: [], outfits: [] };
              return (
                <TripDayCard
                  key={date}
                  date={date}
                  index={i}
                  day={day}
                  expanded={expanded === date}
                  onToggle={() => setExpanded((cur) => (cur === date ? null : date))}
                  getFit={(id) => fitsById.get(id)}
                  onAddEvent={(ev: TripEvent) => updateDay(trip.id, date, (d) => ({ ...d, events: [...d.events, ev] }))}
                  onRemoveEvent={(id) => updateDay(trip.id, date, (d) => ({ ...d, events: d.events.filter((e) => e.id !== id) }))}
                  onAttachDay={() => setPicker({ date })}
                  onDetachDay={(fitId) => updateDay(trip.id, date, (d) => ({ ...d, outfits: d.outfits.filter((x) => x !== fitId) }))}
                />
              );
            })}
          </div>
        </>
      )}

      {/* New / edit trip modal */}
      <Modal open={formOpen} title={editId ? "Edit trip" : "Plan a trip"} onClose={() => setFormOpen(false)}>
        <div className="field">
          <label htmlFor="t-name">Trip name</label>
          <input id="t-name" className="input" autoFocus placeholder="Japan, autumn" value={fName} onChange={(e) => setFName(e.target.value)} />
        </div>
        <div className="field-2">
          <div className="field">
            <label htmlFor="t-start">Start date</label>
            <input id="t-start" className="input" type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="t-end">End date</label>
            <input id="t-end" className="input" type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button className="btn ghost" onClick={() => setFormOpen(false)}>Cancel</button>
          <button className="btn accent" onClick={submitForm}>{editId ? "Save changes" : "Create trip"}</button>
        </div>
      </Modal>

      {/* Outfit picker */}
      <OutfitPicker
        open={!!picker}
        title="Attach an outfit"
        attached={picker && trip ? (trip.days[picker.date]?.outfits || []) : []}
        onPick={(fitId) => {
          if (!picker || !trip) return;
          updateDay(trip.id, picker.date, (d) => ({
            ...d,
            outfits: d.outfits.includes(fitId) ? d.outfits.filter((x) => x !== fitId) : [...d.outfits, fitId]
          }));
        }}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}
