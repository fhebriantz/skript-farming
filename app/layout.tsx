import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Script Farming",
  description: "Paste JSON ide konten, jadi halaman & file HTML siap copy ke Google Docs",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0f14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">{children}</div>
      </body>
    </html>
  );
}
