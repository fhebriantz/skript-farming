"use client";

export function Pratinjau({ html }: { html: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {/* Scroll dua arah: dokumen memakai satuan pt dan tabelnya bisa lebih lebar dari layar HP. */}
      <div
        className="pratinjau max-h-[60vh] overflow-auto px-4 py-4 sm:max-h-[70vh] sm:px-6 sm:py-5"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
