// Icon vocabulary (B3-5/B3-7). These are stable asset identifiers and selection
// indices, not design values — the actual art, color values and line work are
// decided at design time and intentionally not encoded here.

export interface Option<T> {
  value: T;
  label: string;
}

export const CHARACTER_OPTIONS: Option<string>[] = [
  { value: "cat", label: "猫" },
  { value: "dog", label: "犬" },
  { value: "fox", label: "狐" },
  { value: "bear", label: "熊" },
  { value: "rabbit", label: "兎" },
  { value: "panda", label: "パンダ" },
];

export const DECORATION_OPTIONS: Option<string>[] = [
  { value: "none", label: "なし" },
  { value: "glasses", label: "眼鏡" },
  { value: "hat", label: "帽子" },
  { value: "headphone", label: "ヘッドホン" },
];

export const BACKGROUND_OPTIONS: Option<number>[] = Array.from({ length: 8 }, (_, i) => ({
  value: i + 1,
  label: `背景${i + 1}`,
}));

const CHARACTER_SET = new Set(CHARACTER_OPTIONS.map((o) => o.value));
const DECORATION_SET = new Set(DECORATION_OPTIONS.map((o) => o.value));

export function isValidCharacter(v: string): boolean {
  return CHARACTER_SET.has(v);
}

export function isValidDecoration(v: string): boolean {
  return DECORATION_SET.has(v);
}

export function isValidBackground(v: number): boolean {
  return Number.isInteger(v) && v >= 1 && v <= 8;
}
