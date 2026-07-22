"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import PieceCard from "@/components/PieceCard";
import { useWishlist, useBuilder, uid } from "@/lib/store";
import { money, totalPrice } from "@/lib/format";
import { Item } from "@/lib/types";
import { toast } from "@/components/Toast";

export default function WishlistPage() {
  const router = useRouter();
  const { items, remove } = useWishlist();
  const { add: addToBuilder } = useBuilder();

  function actionsFor(item: Item) {
    return [
      {
        key: "build",
        label: "Send to builder",
        glyph: "→",
        onClick: () => {
          addToBuilder({ ...JSON.parse(JSON.stringify(item)), id: uid() });
          toast("Added to the builder");
        }
      },
      {
        key: "remove",
        label: "Remove",
        glyph: "✕",
        danger: true,
        onClick: () => {
          remove(item.id);
          toast("Removed from wishlist");
        }
      }
    ];
  }

  return (
    <div className="wrap">
      <PageHead
        index="№ 03 — The List"
        title={
          <>
            The <span className="serif-italic">Wishlist</span>
          </>
        }
        lede="Pieces you're coveting, saved for later. Send any of them to the builder when you're ready to style a look around them."
      />

      {items.length > 0 && (
        <div className="ledger">
          <div className="cell">
            <div className="num">{items.length}</div>
            <div className="lbl">Items saved</div>
          </div>
          <div className="cell">
            <div className="num">{money(totalPrice(items))}</div>
            <div className="lbl">Total value</div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty">
          <div className="mark">Ø</div>
          <h3>Your wishlist is empty</h3>
          <p>Tap the ♡ on any piece in the builder to save it here for later.</p>
          <Link href="/" className="btn accent">
            Start building
          </Link>
        </div>
      ) : (
        <div className="wish-grid">
          {items.map((it) => (
            <PieceCard key={it.id} item={it} actions={actionsFor(it)} />
          ))}
        </div>
      )}
    </div>
  );
}
