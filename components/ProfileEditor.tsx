"use client";

import { useState } from "react";
import { ApiError, updateMyProfile } from "../lib/api";
import { toUserMessage, retryAfterMessage } from "../lib/errorMessage";
import { NICKNAME_MAX, validateNickname } from "../lib/profileInput";
import type { Profile } from "../lib/types";
import { IconConfigEditor, type IconSelection } from "./IconConfigEditor";
import { useSession } from "./SessionProvider";

// ProfileEditor edits the nickname and icon configuration. Nickname and icon are
// saved separately: the nickname save is subject to the rename limit (429).
export function ProfileEditor({ profile }: { profile: Profile }) {
  const { setProfile } = useSession();

  const [nickname, setNickname] = useState(profile.nickname);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameNote, setNameNote] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [icon, setIcon] = useState<IconSelection>({
    character: profile.icon_config.character,
    background: profile.icon_config.background,
    decoration: profile.icon_config.decoration,
  });
  const [iconError, setIconError] = useState<string | null>(null);
  const [iconNote, setIconNote] = useState<string | null>(null);
  const [savingIcon, setSavingIcon] = useState(false);

  async function saveNickname(event: React.FormEvent) {
    event.preventDefault();
    if (savingName) return;
    setNameError(null);
    setNameNote(null);
    const check = validateNickname(nickname);
    if (!check.ok) {
      setNameError(check.message);
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateMyProfile({ nickname: check.value });
      setProfile(updated);
      setNickname(updated.nickname);
      setNameNote("ニックネームを保存しました。");
    } catch (err) {
      setNameError(nameErrorFor(err));
    } finally {
      setSavingName(false);
    }
  }

  async function saveIcon(event: React.FormEvent) {
    event.preventDefault();
    if (savingIcon) return;
    setIconError(null);
    setIconNote(null);
    setSavingIcon(true);
    try {
      const updated = await updateMyProfile({ icon_config: icon });
      setProfile(updated);
      setIconNote("アイコンを保存しました。");
    } catch (err) {
      setIconError(toUserMessage(err));
    } finally {
      setSavingIcon(false);
    }
  }

  return (
    <section aria-labelledby="profile-heading">
      <h1 id="profile-heading">プロフィール</h1>

      <form onSubmit={saveNickname}>
        <div className="field">
          <label htmlFor="nickname">ニックネーム（1〜{NICKNAME_MAX}文字）</label>
          <input
            id="nickname"
            value={nickname}
            maxLength={NICKNAME_MAX * 2}
            onChange={(e) => setNickname(e.target.value)}
            aria-invalid={nameError ? true : undefined}
          />
        </div>
        {nameError ? (
          <p className="field-error" role="alert">
            {nameError}
          </p>
        ) : null}
        {nameNote ? (
          <p className="field-hint" role="status">
            {nameNote}
          </p>
        ) : null}
        <button type="submit" disabled={savingName}>
          {savingName ? "保存中…" : "ニックネームを保存"}
        </button>
      </form>

      <form onSubmit={saveIcon}>
        <IconConfigEditor value={icon} onChange={setIcon} />
        {iconError ? (
          <p className="field-error" role="alert">
            {iconError}
          </p>
        ) : null}
        {iconNote ? (
          <p className="field-hint" role="status">
            {iconNote}
          </p>
        ) : null}
        <button type="submit" disabled={savingIcon}>
          {savingIcon ? "保存中…" : "アイコンを保存"}
        </button>
      </form>
    </section>
  );
}

function nameErrorFor(err: unknown): string {
  if (err instanceof ApiError && err.status === 429) {
    const hint = retryAfterMessage(err.retryAfter ?? null);
    return `ニックネームの変更回数の上限に達しました。${hint}`.trim();
  }
  return toUserMessage(err);
}
