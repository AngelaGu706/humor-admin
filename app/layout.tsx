import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "NYC Food Spots · Admin", description: "Manage the NYC Food Spots community.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
