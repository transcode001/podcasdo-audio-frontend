import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Podcas堂",
  description: "Podcastを検索・発見し、評価やレビューを参考にできるサービス",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <div className="container">
            <p className="site-title">
              <Link href="/">Podcas堂</Link>
            </p>
            <span className="field-hint">Podcastを検索して番組を見つけよう</span>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
