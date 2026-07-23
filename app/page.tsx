"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import AddItemForm from "@/components/AddItemForm";
import OutfitSlots from "@/components/OutfitSlots";
import HomePreview from "@/components/HomePreview";
import Modal from "@/components/Modal";
import { useBuilder, useFits, useWishlist, setReviewTarget } from "@/lib/store";
import { money, totalPrice } from "@/lib/format";
import { CATEGORIES } from "@/lib/categories";
import { sampleOutfit } from "@/lib/sample";
import { toast } from "@/components/Toast";
import { Item } from "@/lib/types";

export default function BuilderPage() {
  const router = useRouter();
  const { items, remove, clear, replace } = useBuilder();
  const { save } = useFits();
  const { add: addWish } = useWishlist();
  const [saveOpen, setSaveOpen] = useState(false);
  const [fitName, setFitName] = useState("");

  const categoriesUsed = CATEGORIES.filter((c) => items.some((i) => i.category === c.id)).length;

  function actionsFor(item: Item) {
    return [
      {
        key: "wish",
        label: "Save to wishlist",
        glyph: "♡",
        onClick: () => {
          const added = addWish(item);
          toast(added ? "Saved to wishlist" : "Already in your wishlist");
        }
      },
      {
        key: "remove",
        label: "Remove",
        glyph: "✕",
        danger: true,
        onClick: () => {
          remove(item.id);
          toast("Removed");
        }
      }
    ];
  }

  function confirmSave() {
    save(fitName.trim() || "Untitled fit", items);
    setSaveOpen(false);
    setFitName("");
    toast("Saved to My Fits");
  }

  function saveAllToWishlist() {
    if (!items.length) return;
    items.forEach(addWish);
    toast("Whole outfit saved to wishlist");
  }

  function reviewNow() {
    setReviewTarget("builder");
    router.push("/style-check");
  }

  return (
    <div className="wrap">
      <PageHead
        index="№ 01 — The Studio"
        title={
          <>
            See the whole
            <br />
            <span className="serif-italic">look</span> before you buy
          </>
        }
        lede="Pull pieces in from any shop by pasting a link, lay them out head to toe, then save the fit or send it for a style check."
      />

      <div className="builder">
        <section aria-label="Outfit board">
          <div className="section-label">
            <h2>Your Outfit</h2>
            <div className="tools">
              <button className="btn ghost sm" onClick={() => { clear(); toast("Board cleared"); }} disabled={!items.length}>
                Clear
              </button>
              <button className="btn ghost sm" onClick={saveAllToWishlist} disabled={!items.length} title="Add every piece to your wishlist">
                ♡ Wishlist all
              </button>
              <button className="btn sm" onClick={reviewNow} disabled={!items.length}>
                Style Check
              </button>
              <button className="btn accent sm" onClick={() => setSaveOpen(true)} disabled={!items.length}>
                Save fit
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="empty-home">
              <p className="empty-lead">
                Add pieces from the panel on the right — or see the payoff first. Here&rsquo;s a finished look and the
                Style Check it earns:
              </p>
              <HomePreview
                onLoad={() => {
                  replace(sampleOutfit());
                  toast("Sample outfit loaded");
                }}
              />
            </div>
          ) : (
            <>
              <OutfitSlots items={items} actionsFor={actionsFor} />
              <div className="tally">
                <div>
                  <div className="amount">{money(totalPrice(items))}</div>
                  <div className="meta">
                    {items.length} {items.length === 1 ? "piece" : "pieces"} · {categoriesUsed}{" "}
                    {categoriesUsed === 1 ? "category" : "categories"}
                  </div>
                </div>
                <div className="actions">
                  <button className="btn ghost" onClick={reviewNow}>Style Check</button>
                  <button className="btn accent" onClick={() => setSaveOpen(true)}>Save this fit</button>
                </div>
              </div>
            </>
          )}
        </section>

        <AddItemForm />
      </div>

      <Modal open={saveOpen} title="Save this fit" onClose={() => setSaveOpen(false)}>
        <div className="field">
          <label htmlFor="fit-name">Name your fit</label>
          <input
            id="fit-name"
            className="input"
            autoFocus
            placeholder="Weekend layers"
            value={fitName}
            onChange={(e) => setFitName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmSave()}
          />
        </div>
        <p className="hint" style={{ marginBottom: "1.2rem" }}>
          {items.length} pieces · {money(totalPrice(items))} — you can review or edit it any time from{" "}
          <Link href="/fits" style={{ borderBottom: "1px solid currentColor" }}>My Fits</Link>.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
          <button className="btn ghost" onClick={() => setSaveOpen(false)}>Cancel</button>
          <button className="btn accent" onClick={confirmSave}>Save fit</button>
        </div>
      </Modal>
    </div>
  );
}
