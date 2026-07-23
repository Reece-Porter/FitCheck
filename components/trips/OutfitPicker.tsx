"use client";

import Link from "next/link";
import Modal from "@/components/Modal";
import FitThumb from "@/components/trips/FitThumb";
import { useFits } from "@/lib/store";

/* Pick one of the user's saved fits to attach to a day or event. */
export default function OutfitPicker({
  open,
  title,
  attached,
  onPick,
  onClose
}: {
  open: boolean;
  title: string;
  attached: string[];
  onPick: (fitId: string) => void;
  onClose: () => void;
}) {
  const { fits } = useFits();

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {fits.length === 0 ? (
        <div className="empty" style={{ padding: "2.5rem 1rem" }}>
          <div className="mark">Ø</div>
          <h3>No saved fits yet</h3>
          <p>Build a look and hit “Save fit” first — your saved outfits show up here to attach to any day.</p>
          <Link href="/" className="btn accent">
            Open the builder
          </Link>
        </div>
      ) : (
        <div className="picker-grid">
          {fits.map((fit) => {
            const isOn = attached.includes(fit.id);
            return (
              <div key={fit.id} className={"picker-item" + (isOn ? " on" : "")}>
                <FitThumb
                  fit={fit}
                  onClick={() => {
                    onPick(fit.id);
                  }}
                />
                {isOn && <span className="picker-check">Attached ✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
