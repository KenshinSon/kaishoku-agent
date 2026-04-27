"use client";

import { useState } from "react";

export default function CautionToggle({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1"
      >
        <span>{open ? "▲" : "▼"}</span>
        <span>{open ? "注意点を閉じる" : "注意点を見る"}</span>
      </button>
      {open && (
        <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg leading-relaxed">
          {note}
        </p>
      )}
    </div>
  );
}
