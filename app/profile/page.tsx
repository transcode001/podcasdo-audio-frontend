"use client";

import { googleLoginUrl } from "../../lib/api";
import { AccountDeletion } from "../../components/AccountDeletion";
import { MyReviews } from "../../components/MyReviews";
import { ProfileEditor } from "../../components/ProfileEditor";
import { useSession } from "../../components/SessionProvider";

// Authenticated profile page: nickname + icon editing and the user's own review
// list. There is no public profile page (B3-4).
export default function ProfilePage() {
  const { status, profile } = useSession();

  if (status === "loading") {
    return <p className="status">読み込み中…</p>;
  }
  if (status === "anonymous" || profile === null) {
    return (
      <div className="status">
        <h1>プロフィール</h1>
        <p>
          プロフィールの表示にはログインが必要です。{" "}
          <a href={googleLoginUrl()}>Googleでログイン</a>
        </p>
      </div>
    );
  }

  return (
    <>
      <ProfileEditor profile={profile} />
      <MyReviews />
      <AccountDeletion />
    </>
  );
}
