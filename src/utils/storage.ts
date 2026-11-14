import { HistoryEntry } from '../types/subsetSum';

const HISTORY_STORAGE_KEY = 'subsetsum_lab_history_v1';
const THEME_STORAGE_KEY = 'subsetsum_lab_theme_v1';
const MAX_HISTORY_ITEMS = 25;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const existing = loadHistory();
  const updated = [entry, ...existing].slice(0, MAX_HISTORY_ITEMS);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors cleanly
  }
  return updated;
}

export function deleteHistoryEntry(id: string): HistoryEntry[] {
  const existing = loadHistory().filter((item) => item.id !== id);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore
  }
  return existing;
}

export function clearHistoryStorage(): HistoryEntry[] {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore
  }
  return [];
}

export function loadThemePreference(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore
  }
  return 'light';
}

export function saveThemePreference(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore
  }
}
