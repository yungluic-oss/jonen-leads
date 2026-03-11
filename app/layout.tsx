import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jonen Leads — Business Outreach Dashboard",
  description: "Businesses near Jonen 8916 with no or bad websites",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
