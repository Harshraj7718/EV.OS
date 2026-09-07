import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";

export const metadata: Metadata = {
  title: "Booklynk EV — The Operating System for India's EV Economy",
  description:
    "One Platform. Three Stakeholders. Infinite Possibilities. Booklynk EV connects investors, riders, and fleet businesses in India's EV economy.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
