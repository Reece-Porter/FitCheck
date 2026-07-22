"use client";

import { useEffect, useState } from "react";

/* Fire a toast from anywhere: toast("Saved to My Fits"). */
export function toast(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("fitted:toast", { detail: message }));
}

export default function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;
    function onToast(e: Event) {
      const detail = (e as CustomEvent).detail as string;
      setMsg(detail);
      setShow(true);
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
      hideTimer = setTimeout(() => setShow(false), 2600);
      clearTimer = setTimeout(() => setMsg(null), 3100);
    }
    window.addEventListener("fitted:toast", onToast);
    return () => {
      window.removeEventListener("fitted:toast", onToast);
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
    };
  }, []);

  if (!msg) return null;
  return (
    <div className={"toast" + (show ? " show" : "")} role="status" aria-live="polite">
      <span className="tick">✦</span>
      {msg}
    </div>
  );
}
