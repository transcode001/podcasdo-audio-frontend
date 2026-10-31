import { countChars } from "./reviewInput";

// Nickname validation mirroring the Backend (auth-profile A3 / B3-2): trim
// surrounding spaces/tabs, reject empty, over-length, and newline/control chars.
export const NICKNAME_MAX = 20;

const NAME_TRIM = /^[ 　\t]+|[ 　\t]+$/g;
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;

export type NicknameValidation = { ok: true; value: string } | { ok: false; message: string };

export function validateNickname(raw: string): NicknameValidation {
  const trimmed = raw.replace(NAME_TRIM, "");
  if (trimmed.length === 0) {
    return { ok: false, message: "ニックネームを入力してください" };
  }
  if (CONTROL.test(trimmed)) {
    return { ok: false, message: "ニックネームに改行や制御文字は使用できません" };
  }
  if (countChars(trimmed) > NICKNAME_MAX) {
    return { ok: false, message: `ニックネームは${NICKNAME_MAX}文字以内で入力してください` };
  }
  return { ok: true, value: trimmed };
}
