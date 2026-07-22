"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import FitCard from "@/components/FitCard";
import OutfitSlots from "@/components/OutfitSlots";
import Modal from "@/components/Modal";
import { useFits, useBuilder, setReviewTarget } from "@/lib/store";
import { Fit } from "@/lib/types";
import { money, totalPrice } from "@/lib/format";
import { toast } from "@/components/Toast";

export default function FitsPage() {
  const router = useRouter();
  const { fits, remove } = useFits();
  const { replace } = useBuilder();
  const [viewing, setViewing] = useState<Fit | null>(null);

  const totalPieces = fits.reduce((n, f) => n + f.items.length, 0);
  const reviewed = fits.filter((f) => f.review).length;

  function reviewFit(id: string) {
    setReviewTarget(id);
    router.push("/style-check");
  }

  function loadIntoBuilder(fit: Fit) {
    replace(JSON.parse(JSON.stringify(fit.items)));
    toast("Loaded into the builder");
    router.push("/");
  }

  return (
    <div className="wrap">
      <PageHead
        index="№ 02 — The Archive"
        title={
          <>
            My <span className="serif-italic">Fits</span>
          </>
        }
        lede="Every look you've saved, kept together. Open one to see the full outfit, send it for a style check, or load it back into the builder."
      />

      {fits.length > 0 && (
        <div className="ledger">
          <div className="cell">
            <div className="num">{fits.length}</div>
            <div className="lbl">Saved fits</div>
          </div>
          <div className="cell">
            <div className="num">{totalPieces}</div>
            <div className="lbl">Pieces styled</div>
          </div>
          <div className="cell">
            <div className="num">{reviewed}</div>
            <div className="lbl">Style-checked</div>
          </div>
        </div>
      )}

      {fits.length === 0 ? (
        <div className="empty">
          <div className="mark">Ø</div>
          <h3>No saved fits yet</h3>
          <p>Build a look in the studio and hit “Save fit” to start your archive.</p>
          <Link href="/" className="btn accent">
            Open the builder
          </Link>
        </div>
      ) : (
        <div className="fits-grid">
          {fits.map((fit) => (
            <FitCard
              key={fit.id}
              fit={fit}
              onOpen={() => setViewing(fit)}
              onReview={() => reviewFit(fit.id)}
              onDelete={() => {
                if (confirm(`Delete “${fit.name}”?`)) {
                  remove(fit.id);
                  toast("Fit deleted");
                }
              }}
            />
          ))}
        </div>
      )}

      <Modal open={!!viewing} title={viewing?.name || "Fit"} onClose={() => setViewing(null)}>
        {viewing && (
          <>
            <OutfitSlots items={viewing.items} />
            <div className="tally" style={{ marginTop: "1.6rem" }}>
              <div>
                <div className="amount">{money(totalPrice(viewing.items))}</div>
                <div className="meta">{viewing.items.length} pieces</div>
              </div>
              <div className="actions">
                <button
                  className="btn ghost"
                  onClick={() => {
                    const id = viewing.id;
                    setViewing(null);
                    reviewFit(id);
                  }}
                >
                  Style Check
                </button>
                <button className="btn accent" onClick={() => loadIntoBuilder(viewing)}>
                  Load into builder
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
