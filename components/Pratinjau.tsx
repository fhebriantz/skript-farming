"use client";

export function Pratinjau({ html }: { html: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="pratinjau max-h-[70vh] overflow-y-auto px-6 py-5" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
