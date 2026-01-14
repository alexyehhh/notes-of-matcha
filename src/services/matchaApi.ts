import type { MatchaEntry } from "../types";

const STORAGE_KEY = "matcha_entries_v1";

function read(): MatchaEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MatchaEntry[];
  } catch {
    return [];
  }
}

function write(entries: MatchaEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function fetchMatchaEntries(): Promise<MatchaEntry[]> {
  return read();
}

export async function seedIfEmpty(defaultEntries: MatchaEntry[]): Promise<MatchaEntry[]> {
  const current = read();
  if (current.length > 0) return current;

  write(defaultEntries);
  return defaultEntries;
}

// keep your other CRUD functions as-is, but make sure they also import MatchaEntry from "../types"
export async function createMatchaEntry(entry: MatchaEntry): Promise<void> {
  const entries = read();
  entries.push(entry);
  write(entries);
}

export async function updateMatchaEntry(id: string, updates: Partial<MatchaEntry>): Promise<void> {
  const entries = read().map((e) => (e.id === id ? { ...e, ...updates } : e));
  write(entries);
}

export async function deleteMatchaEntry(id: string): Promise<void> {
  const entries = read().filter((e) => e.id !== id);
  write(entries);
}

export async function reorderMatchaEntries(orderIds: string[]): Promise<void> {
  const entries = read();
  const byId = new Map(entries.map((e) => [e.id, e]));
  const reordered = orderIds.map((id) => byId.get(id)).filter(Boolean) as MatchaEntry[];
  write(reordered);
}


// import { projectId, publicAnonKey } from '../utils/supabase/info';
// import type { MatchaEntry } from '../App';

// const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-eaf62665`;

// const headers = {
//   'Content-Type': 'application/json',
//   'Authorization': `Bearer ${publicAnonKey}`,
// };

// // LocalStorage keys
// const STORAGE_KEY = 'matcha_entries';
// const ORDER_KEY = 'matcha_order';

// // Check if backend is available
// let backendAvailable: boolean | null = null;

// async function checkBackendAvailability(): Promise<boolean> {
//   if (backendAvailable !== null) {
//     return backendAvailable;
//   }

//   try {
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

//     const response = await fetch(`${BASE_URL}/health`, {
//       method: 'GET',
//       headers,
//       signal: controller.signal,
//     });

//     clearTimeout(timeoutId);
//     backendAvailable = response.ok;
//     return backendAvailable;
//   } catch (error) {
//     console.log('Backend not available, using local storage:', error);
//     backendAvailable = false;
//     return false;
//   }
// }

// // LocalStorage fallback functions
// function getLocalEntries(): MatchaEntry[] {
//   try {
//     const data = localStorage.getItem(STORAGE_KEY);
//     return data ? JSON.parse(data) : [];
//   } catch (error) {
//     console.error('Error reading from localStorage:', error);
//     return [];
//   }
// }

// function setLocalEntries(entries: MatchaEntry[]): void {
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
//   } catch (error) {
//     console.error('Error writing to localStorage:', error);
//   }
// }

// function getLocalOrder(): string[] {
//   try {
//     const data = localStorage.getItem(ORDER_KEY);
//     return data ? JSON.parse(data) : [];
//   } catch (error) {
//     console.error('Error reading order from localStorage:', error);
//     return [];
//   }
// }

// function setLocalOrder(order: string[]): void {
//   try {
//     localStorage.setItem(ORDER_KEY, JSON.stringify(order));
//   } catch (error) {
//     console.error('Error writing order to localStorage:', error);
//   }
// }

// export async function fetchMatchaEntries(): Promise<MatchaEntry[]> {
//   const isBackendAvailable = await checkBackendAvailability();

//   if (!isBackendAvailable) {
//     console.log('Using local storage for entries');
//     return getLocalEntries();
//   }

//   try {
//     const response = await fetch(`${BASE_URL}/matcha-entries`, {
//       method: 'GET',
//       headers,
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}`);
//     }

//     const data = await response.json();
//     const entries = data.entries || [];
    
//     // Sync to localStorage as cache
//     setLocalEntries(entries);
    
//     return entries;
//   } catch (error) {
//     console.log('Backend fetch failed, using local storage:', error);
//     backendAvailable = false; // Mark backend as unavailable
//     return getLocalEntries();
//   }
// }

// export async function createMatchaEntry(entry: MatchaEntry): Promise<MatchaEntry> {
//   const isBackendAvailable = await checkBackendAvailability();

//   // Always update localStorage first
//   const localEntries = getLocalEntries();
//   const updatedEntries = [...localEntries, entry];
//   setLocalEntries(updatedEntries);

//   const localOrder = getLocalOrder();
//   if (!localOrder.includes(entry.id)) {
//     setLocalOrder([...localOrder, entry.id]);
//   }

//   if (!isBackendAvailable) {
//     console.log('Using local storage for create');
//     return entry;
//   }

//   try {
//     const response = await fetch(`${BASE_URL}/matcha-entries`, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify(entry),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}`);
//     }

//     const data = await response.json();
//     return data.entry;
//   } catch (error) {
//     console.log('Backend create failed, using local storage:', error);
//     backendAvailable = false;
//     return entry;
//   }
// }

// export async function updateMatchaEntry(id: string, updates: Partial<MatchaEntry>): Promise<MatchaEntry> {
//   const isBackendAvailable = await checkBackendAvailability();

//   // Always update localStorage first
//   const localEntries = getLocalEntries();
//   const index = localEntries.findIndex(e => e.id === id);
//   if (index !== -1) {
//     localEntries[index] = { ...localEntries[index], ...updates };
//     setLocalEntries(localEntries);
//   }

//   if (!isBackendAvailable) {
//     console.log('Using local storage for update');
//     return localEntries[index];
//   }

//   try {
//     const response = await fetch(`${BASE_URL}/matcha-entries/${id}`, {
//       method: 'PUT',
//       headers,
//       body: JSON.stringify(updates),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}`);
//     }

//     const data = await response.json();
//     return data.entry;
//   } catch (error) {
//     console.log('Backend update failed, using local storage:', error);
//     backendAvailable = false;
//     return localEntries[index];
//   }
// }

// export async function deleteMatchaEntry(id: string): Promise<void> {
//   const isBackendAvailable = await checkBackendAvailability();

//   // Always update localStorage first
//   const localEntries = getLocalEntries();
//   const filteredEntries = localEntries.filter(e => e.id !== id);
//   setLocalEntries(filteredEntries);

//   const localOrder = getLocalOrder();
//   const filteredOrder = localOrder.filter(entryId => entryId !== id);
//   setLocalOrder(filteredOrder);

//   if (!isBackendAvailable) {
//     console.log('Using local storage for delete');
//     return;
//   }

//   try {
//     const response = await fetch(`${BASE_URL}/matcha-entries/${id}`, {
//       method: 'DELETE',
//       headers,
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}`);
//     }
//   } catch (error) {
//     console.log('Backend delete failed, using local storage:', error);
//     backendAvailable = false;
//   }
// }

// export async function reorderMatchaEntries(order: string[]): Promise<void> {
//   const isBackendAvailable = await checkBackendAvailability();

//   // Always update localStorage first
//   setLocalOrder(order);

//   if (!isBackendAvailable) {
//     console.log('Using local storage for reorder');
//     return;
//   }

//   try {
//     const response = await fetch(`${BASE_URL}/matcha-entries-reorder`, {
//       method: 'PUT',
//       headers,
//       body: JSON.stringify({ order }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}`);
//     }
//   } catch (error) {
//     console.log('Backend reorder failed, using local storage:', error);
//     backendAvailable = false;
//   }
// }