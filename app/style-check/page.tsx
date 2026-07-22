"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import { useBuilder, useFits, getReviewTarget } from "@/lib/store";
import { critique } from "@/lib/styleScore";
import { CAT_ICON } from "@/components/icons";
import { cap, safeImageSrc } from "@/lib/format";
import { Item } from "@/lib/types";

const TONE_MARK: Record<string, string> = { good: "✓", tip: "→", warn: "!" };

export default function StyleCheckPage() {
  const { items: builder } = useBuilder();
  const { fits, setReview } = useFits();
  const [target, setTarget] = useState<string>("builder");
  const [stars, setStars] = useState(0);
  const [notes, setNotes] = useState("");

  // Pick up the outfit chosen from the builder / a fit card.
  useEffect(() => {
    const t = getReviewTarget();
    if (t) setTarget(t);
  }, []);

  const activeFit = target === "builder" ? null : fits.find((f) => f.id === target) || null;
  const items: Item[] = activeFit ? activeFit.items : builder;

  const result = useMemo(() => critique(items), [items]);

  // Load any saved rating when switching to a saved fit.
  useEffect(() => {
    if (activeFit?.review) {
      setStars(activeFit.review.stars);
      setNotes(activeFit.review.notes);
    } else {
      setStars(0);
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  function persist(nextStars: number, nextNotes: string) {
    if (!activeFit) return;
    setReview(activeFit.id, { score: result.score, stars: nextStars, notes: nextNotes, at: Date.now() });
  }

  return (
    <div className="wrap">
      <PageHead
        index="№ 05 — The Critic"
        title={
          <>
            Style <span className="serif-italic">Check</span>
          </>
        }
        lede="An editorial read on your outfit — a style score, a candid critique, and space to log your own verdict."
      />

      <div className="check">
        {/* Verdict panel */}
        <aside className="verdict">
          <div className="grade">{result.grade}</div>
          <div className="dial">
            <span className="score">{result.score}</span>
            <span className="out">/100</span>
          </div>
          <p className="headline">{result.headline}</p>
          <div className="track">
            <span className="fill" style={{ width: `${result.score}%` }} />
          </div>

          {result.styles.length > 0 && (
            <div className="styles">
              {result.styles.slice(0, 5).map((s) => (
                <span className="chip" key={s}>
                  {cap(s)}
                </span>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="mini-strip" aria-hidden="true">
              {items.slice(0, 8).map((it) => (
                <div className="mini" key={it.id}>
                  <div className="frame">
                    {safeImageSrc(it.image) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={safeImageSrc(it.image)} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
                    ) : (
                      <div className="noimg">{CAT_ICON[it.category]}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Your own rating */}
          <div className="rate">
            <div className="grade" style={{ color: "var(--gold)" }}>
              Your verdict
            </div>
            {activeFit ? (
              <>
                <div className="stars" role="group" aria-label="Your star rating">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      className={s <= stars ? "on" : ""}
                      aria-label={`${s} star${s > 1 ? "s" : ""}`}
                      onClick={() => {
                        setStars(s);
                        persist(s, notes);
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Note what works and what you'd change…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => persist(stars, notes)}
                />
              </>
            ) : (
              <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.6)", margin: "0.5rem 0 0" }}>
                Save this look as a fit to keep a rating and notes against it.
              </p>
            )}
          </div>
        </aside>

        {/* Critique */}
        <section className="critique">
          <div className="picker field">
            <label htmlFor="check-target">Reviewing</label>
            <select
              id="check-target"
              className="select"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="builder">Current builder outfit ({builder.length} pieces)</option>
              {fits.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.items.length} pieces)
                </option>
              ))}
            </select>
          </div>

          {items.length === 0 ? (
            <div className="empty">
              <div className="mark">Ø</div>
              <h3>Nothing to check yet</h3>
              <p>Build an outfit or pick a saved fit above to get your style score.</p>
              <Link href="/" className="btn accent">
                Open the builder
              </Link>
            </div>
          ) : (
            <>
              <div className="section-label" style={{ marginBottom: "0.4rem" }}>
                <h2>The Critique</h2>
                <span className="kicker">{result.present.length} of 6 categories</span>
              </div>
              <ul className="notes">
                {result.notes.map((note, i) => (
                  <li className={note.tone} key={i}>
                    <span className="tone">{TONE_MARK[note.tone]}</span>
                    <p>{note.text}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
