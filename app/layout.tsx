import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Link from "next/link";
import { EVENT } from "@/lib/config";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: `${EVENT.name} | SSI`,
  description: `${EVENT.name}: register, read the rules and use cases, and submit your AI product.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand">
              <span className="brand-mark">SSI</span>
              <span>{EVENT.name}</span>
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/use-cases">Use cases</Link>
              <Link href="/rules">Rules &amp; rubric</Link>
              <Link href="/guide">Guide</Link>
              <Link href="/register">Register</Link>
              <Link href="/submit" className="cta">Submit</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <span>{EVENT.org}</span>
            <span>{EVENT.name}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
