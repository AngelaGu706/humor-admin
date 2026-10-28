import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "AI Workspace · Admin", description: "Explore AI generation and manage course and food workspaces.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
