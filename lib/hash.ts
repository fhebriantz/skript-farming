/** Hash isi teks -> dipakai sebagai kunci cache supaya paste yang sama tidak menghabiskan kuota API. */
export async function hashText(text: string): Promise<string> {
  const norm = text.replace(/\r\n/g, "\n").trim();
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(norm));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  }
  let h = 0;
  for (let i = 0; i < norm.length; i++) h = (Math.imul(31, h) + norm.charCodeAt(i)) | 0;
  return "fnv" + (h >>> 0).toString(16);
}
