import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SessionProvider } from "../components/SessionProvider";
import { AuthControls } from "../components/AuthControls";

export const metadata: Metadata = {
  title: "Podcas堂",
  description: "Podcastを検索・発見し、評価やレビューを参考にできるサービス",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <SessionProvider>
          <header className="site-header">
            <div className="container">
              <p className="site-title">
                <Link href="/">Podcas堂</Link>
              </p>
              <span className="header-spacer" />
              <AuthControls />
            </div>
          </header>
          <main className="container">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
