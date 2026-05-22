import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pet Guardian",
  description: "AI dog-care handover agent with verified care check-ins."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
