import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podcas堂",
  description: "Podcastを検索・発見し、評価やレビューを参考にできるサービス",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
