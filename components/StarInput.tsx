"use client";

import { STAR_OPTIONS } from "../lib/rating";

// Accessible star selector: a labeled select of 0.5..5.0 in 0.5 steps.
export function StarInput({
  value,
  onChange,
  id = "stars",
}: {
  value: number | null;
  onChange: (stars: number | null) => void;
  id?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>星評価（必須）</label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
      >
        <option value="">未選択</option>
        {STAR_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.toFixed(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
