"use client";

import type { Group } from "./types";

const DB = "script-farming";
const VER = 1;
const TOKO_GRUP = "grup";
const TOKO_CACHE = "cache";

function buka(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TOKO_GRUP)) db.createObjectStore(TOKO_GRUP, { keyPath: "id" });
      if (!db.objectStoreNames.contains(TOKO_CACHE)) db.createObjectStore(TOKO_CACHE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function jalan<T>(toko: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return buka().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(toko, mode);
        const req = fn(tx.objectStore(toko));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
  );
}

export const simpanGrup = (g: Group) => jalan<void>(TOKO_GRUP, "readwrite", (s) => s.put(g));
export const ambilGrup = (id: string) => jalan<Group | undefined>(TOKO_GRUP, "readonly", (s) => s.get(id));
export const hapusGrup = (id: string) => jalan<void>(TOKO_GRUP, "readwrite", (s) => s.delete(id));

export async function semuaGrup(): Promise<Group[]> {
  const list = await jalan<Group[]>(TOKO_GRUP, "readonly", (s) => s.getAll());
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

/** Cache hasil parsing berdasarkan hash isi teks supaya paste yang sama tidak memakai kuota lagi. */
export const simpanCache = (kunci: string, nilai: unknown) =>
  jalan<void>(TOKO_CACHE, "readwrite", (s) => s.put({ nilai, waktu: Date.now() }, kunci));

export async function ambilCache<T>(kunci: string, maksHari = 14): Promise<T | null> {
  try {
    const row = await jalan<{ nilai: T; waktu: number } | undefined>(TOKO_CACHE, "readonly", (s) => s.get(kunci));
    if (!row) return null;
    if (Date.now() - row.waktu > maksHari * 864e5) return null;
    return row.nilai;
  } catch {
    return null;
  }
}
