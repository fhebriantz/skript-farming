import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Script Farming",
  description: "Paste banyak ide konten sekaligus, jadi halaman & file HTML siap copy ke Google Docs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
