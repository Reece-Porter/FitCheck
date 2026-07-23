"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFits, useWishlist } from "@/lib/store";

const LINKS = [
  { href: "/", label: "Build" },
  { href: "/fits", label: "My Fits", badge: "fits" as const },
  { href: "/wishlist", label: "Wishlist", badge: "wish" as const },
  { href: "/trips", label: "Trips" },
  { href: "/for-you", label: "For You" }
];

export default function Nav() {
  const pathname = usePathname();
  const { fits } = useFits();
  const { items: wishlist } = useWishlist();

  const counts: Record<string, number> = { fits: fits.length, wish: wishlist.length };

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="masthead">
      <div className="wrap bar">
        <Link href="/" className="wordmark" aria-label="Fitted home">
          Fitted<span className="dot">.</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
              {l.label}
              {l.badge && counts[l.badge] > 0 ? <span className="badge">{counts[l.badge]}</span> : null}
            </Link>
          ))}
          <Link href="/style-check" className={"cta" + (isActive("/style-check") ? " active" : "")}>
            Style Check
          </Link>
        </nav>
      </div>
    </header>
  );
}
