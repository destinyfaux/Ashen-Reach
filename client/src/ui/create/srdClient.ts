// client/src/ui/create/srdClient.ts
// Client-side cache and fetcher for dynamic SRD race, subrace, class, and subclass data.

export interface SrdSubrace {
  name: string;
  source: string;
  ability_score_increase: Record<string, number>;
  traits: { name: string; description?: string }[];
}

export interface SrdRaceData {
  name: string;
  source: string;
  size: string;
  speed: number;
  darkvision: number | null;
  languages: string[];
  ability_score_increase: Record<string, number>;
  traits: { name: string; description?: string }[];
  subraces: string[];
  subraces_list: SrdSubrace[];
}

export interface SrdSubclass {
  name: string;
  source: string;
  description: string;
  features: { level?: number; name: string; description?: string }[];
}

export interface SrdClassData {
  name: string;
  source: string;
  hit_die: number;
  primary_ability: string[];
  saving_throws: string[];
  subclasses: string[];
  subclasses_list: SrdSubclass[];
  features: { level?: number; name: string; description?: string }[];
}

const raceCache = new Map<string, SrdRaceData>();
const classCache = new Map<string, SrdClassData>();
let cachedRacesList: string[] | null = null;
let cachedClassesList: string[] | null = null;

export function getCachedRace(raceName: string): SrdRaceData | null {
  if (!raceName) return null;
  return raceCache.get(raceName.trim().toLowerCase()) ?? null;
}

export function getCachedClass(className: string): SrdClassData | null {
  if (!className) return null;
  return classCache.get(className.trim().toLowerCase()) ?? null;
}

export function getCachedRacesList(): string[] | null {
  return cachedRacesList;
}

export function getCachedClassesList(): string[] | null {
  return cachedClassesList;
}

export async function fetchSrdRacesList(): Promise<string[]> {
  if (cachedRacesList) return cachedRacesList;
  try {
    const res = await fetch('/api/srd/races');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: string[] = await res.json();
    cachedRacesList = data;
    return data;
  } catch (err) {
    console.error('[srdClient] Failed to fetch races list:', err);
    return [];
  }
}

export async function fetchSrdClassesList(): Promise<string[]> {
  if (cachedClassesList) return cachedClassesList;
  try {
    const res = await fetch('/api/srd/classes');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: string[] = await res.json();
    cachedClassesList = data;
    return data;
  } catch (err) {
    console.error('[srdClient] Failed to fetch classes list:', err);
    return [];
  }
}

export async function fetchSrdRace(raceName: string): Promise<SrdRaceData | null> {
  if (!raceName) return null;
  const key = raceName.trim().toLowerCase();
  if (raceCache.has(key)) return raceCache.get(key)!;

  try {
    const res = await fetch(`/api/srd/race/${encodeURIComponent(raceName)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: SrdRaceData = await res.json();
    raceCache.set(key, data);
    return data;
  } catch (err) {
    console.error(`[srdClient] Failed to fetch race "${raceName}":`, err);
    return null;
  }
}

export async function fetchSrdClass(className: string): Promise<SrdClassData | null> {
  if (!className) return null;
  const key = className.trim().toLowerCase();
  if (classCache.has(key)) return classCache.get(key)!;

  try {
    const res = await fetch(`/api/srd/class/${encodeURIComponent(className)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: SrdClassData = await res.json();
    classCache.set(key, data);
    return data;
  } catch (err) {
    console.error(`[srdClient] Failed to fetch class "${className}":`, err);
    return null;
  }
}
