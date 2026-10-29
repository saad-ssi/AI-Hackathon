import type { Metadata } from "next";
import { EVENT } from "@/lib/config";
import "./globals.css";
// Arcade theme for the public pages; every rule is scoped to .arcade, so /admin and /judge are unaffected
import "./arcade.css";

export const metadata: Metadata = {
  title: `${EVENT.name} | SSI`,
  description: `${EVENT.name}: register, read the rules and use cases, and submit your agentic AI product.`,
};

// Public pages use the arcade theme (app/(site)/layout.tsx); /admin and /judge keep the plain SSI look (components/StaffShell.tsx).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded by the browser rather than at build time, so a Google Fonts hiccup can't break a deploy */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&family=Press+Start+2P&family=Silkscreen&family=IBM+Plex+Sans:wght@400;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
