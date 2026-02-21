import type { LuminaInsight } from './geminiService';

export interface Entry {
  id: number;
  content: string;
  type: string;
  created_at: string;
  metadata: LuminaInsight;
}

const STORAGE_KEY = 'lumina_entries';

function readEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: Entry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

let nextId = 0;

function initNextId(): void {
  const entries = readEntries();
  nextId = entries.reduce((max, e) => Math.max(max, e.id), 0) + 1;
}

// Initialize on module load
initNextId();

export function getAllEntries(): Entry[] {
  return readEntries().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function addEntry(content: string, type: string, metadata: LuminaInsight): Entry {
  const entries = readEntries();
  const entry: Entry = {
    id: nextId++,
    content,
    type,
    created_at: new Date().toISOString(),
    metadata,
  };
  entries.push(entry);
  writeEntries(entries);
  return entry;
}

export function deleteEntry(id: number): void {
  const entries = readEntries().filter((e) => e.id !== id);
  writeEntries(entries);
}
