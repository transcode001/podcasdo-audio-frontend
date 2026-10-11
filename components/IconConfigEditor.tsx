"use client";

import { BACKGROUND_OPTIONS, CHARACTER_OPTIONS, DECORATION_OPTIONS } from "../lib/icon";

export interface IconSelection {
  character: string;
  background: number;
  decoration: string;
}

// IconConfigEditor selects character / background / decoration from the allowed
// vocabulary and shows a text preview. Only allowed values can be chosen, so
// only allowed values are ever submitted.
export function IconConfigEditor({
  value,
  onChange,
}: {
  value: IconSelection;
  onChange: (next: IconSelection) => void;
}) {
  const characterLabel = CHARACTER_OPTIONS.find((o) => o.value === value.character)?.label ?? value.character;
  const decorationLabel = DECORATION_OPTIONS.find((o) => o.value === value.decoration)?.label ?? value.decoration;

  return (
    <fieldset>
      <legend>アイコン</legend>

      <div className="field">
        <label htmlFor="icon-character">キャラクター</label>
        <select
          id="icon-character"
          value={value.character}
          onChange={(e) => onChange({ ...value, character: e.target.value })}
        >
          {CHARACTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="icon-background">背景</label>
        <select
          id="icon-background"
          value={value.background}
          onChange={(e) => onChange({ ...value, background: Number(e.target.value) })}
        >
          {BACKGROUND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="icon-decoration">装飾</label>
        <select
          id="icon-decoration"
          value={value.decoration}
          onChange={(e) => onChange({ ...value, decoration: e.target.value })}
        >
          {DECORATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <p className="field-hint" aria-live="polite">
        プレビュー：{characterLabel} ・ 背景{value.background} ・ {decorationLabel}
      </p>
    </fieldset>
  );
}
