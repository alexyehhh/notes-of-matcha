import { supabase } from '../lib/supabase';
import type { MatchaEntry } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

// Convert a Supabase row (with nested taste_analysis + flavor_profiles) to MatchaEntry
function rowToEntry(row: any): MatchaEntry {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    prefecture: row.prefecture,
    notes: row.notes,
    color: row.color,
    favorite: row.favorite,
    image: row.image_url ?? undefined,
    tasteAnalysis: {
      sweetness: row.taste_analysis?.sweetness ?? 5,
      bitterness: row.taste_analysis?.bitterness ?? 5,
      green: row.taste_analysis?.green ?? 5,
      umami: row.taste_analysis?.umami ?? 5,
      astringency: row.taste_analysis?.astringency ?? 5,
    },
    flavorProfile: {
      grassy: row.flavor_profiles?.grassy ?? false,
      nutty: row.flavor_profiles?.nutty ?? false,
      floral: row.flavor_profiles?.floral ?? false,
    },
  };
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchMatchaEntries(): Promise<MatchaEntry[]> {
  const { data, error } = await supabase
    .from('matcha_entries')
    .select(`
      *,
      taste_analysis (*),
      flavor_profiles (*)
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true }); // tiebreaker for entries with same sort_order

  if (error) throw error;
  return (data ?? []).map(rowToEntry);
}

// ─── Seed ────────────────────────────────────────────────────────────────────

export async function seedIfEmpty(defaultEntries: MatchaEntry[]): Promise<MatchaEntry[]> {
  const existing = await fetchMatchaEntries();
  if (existing.length > 0) return existing;

  // Insert all default entries with explicit sort_order
  for (let i = 0; i < defaultEntries.length; i++) {
    await createMatchaEntry(defaultEntries[i], i);
  }

  return fetchMatchaEntries();
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createMatchaEntry(entry: MatchaEntry, sortOrder?: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // If no sort_order provided, place the new entry at the end
  let resolvedSortOrder = sortOrder;
  if (resolvedSortOrder === undefined) {
    const { count } = await supabase
      .from('matcha_entries')
      .select('*', { count: 'exact', head: true });
    resolvedSortOrder = count ?? 0;
  }

  // 1. Insert the main entry row
  const { data: newEntry, error: entryError } = await supabase
    .from('matcha_entries')
    .insert({
      name: entry.name,
      brand: entry.brand,
      prefecture: entry.prefecture,
      notes: entry.notes,
      color: entry.color,
      favorite: entry.favorite,
      image_url: entry.image ?? null,
      user_id: user.id,
      sort_order: resolvedSortOrder,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  // 2. Insert taste analysis
  const { error: tasteError } = await supabase
    .from('taste_analysis')
    .insert({
      entry_id: newEntry.id,
      sweetness: entry.tasteAnalysis.sweetness,
      bitterness: entry.tasteAnalysis.bitterness,
      green: entry.tasteAnalysis.green,
      umami: entry.tasteAnalysis.umami,
      astringency: entry.tasteAnalysis.astringency,
    });

  if (tasteError) throw tasteError;

  // 3. Insert flavor profile
  const { error: flavorError } = await supabase
    .from('flavor_profiles')
    .insert({
      entry_id: newEntry.id,
      grassy: entry.flavorProfile.grassy,
      nutty: entry.flavorProfile.nutty,
      floral: entry.flavorProfile.floral,
    });

  if (flavorError) throw flavorError;
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateMatchaEntry(id: string, updates: Partial<MatchaEntry>): Promise<void> {
  // Update main entry fields if any top-level fields changed
  const entryUpdates: Record<string, any> = {};
  if (updates.name !== undefined) entryUpdates.name = updates.name;
  if (updates.brand !== undefined) entryUpdates.brand = updates.brand;
  if (updates.prefecture !== undefined) entryUpdates.prefecture = updates.prefecture;
  if (updates.notes !== undefined) entryUpdates.notes = updates.notes;
  if (updates.color !== undefined) entryUpdates.color = updates.color;
  if (updates.favorite !== undefined) entryUpdates.favorite = updates.favorite;
  if (updates.image !== undefined) entryUpdates.image_url = updates.image;

  if (Object.keys(entryUpdates).length > 0) {
    const { error } = await supabase
      .from('matcha_entries')
      .update(entryUpdates)
      .eq('id', id);
    if (error) throw error;
  }

  // Update taste analysis if changed
  if (updates.tasteAnalysis) {
    const { error } = await supabase
      .from('taste_analysis')
      .update({
        sweetness: updates.tasteAnalysis.sweetness,
        bitterness: updates.tasteAnalysis.bitterness,
        green: updates.tasteAnalysis.green,
        umami: updates.tasteAnalysis.umami,
        astringency: updates.tasteAnalysis.astringency,
      })
      .eq('entry_id', id);
    if (error) throw error;
  }

  // Update flavor profile if changed
  if (updates.flavorProfile) {
    const { error } = await supabase
      .from('flavor_profiles')
      .update({
        grassy: updates.flavorProfile.grassy,
        nutty: updates.flavorProfile.nutty,
        floral: updates.flavorProfile.floral,
      })
      .eq('entry_id', id);
    if (error) throw error;
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteMatchaEntry(id: string): Promise<void> {
  // taste_analysis and flavor_profiles are deleted automatically via CASCADE
  const { error } = await supabase
    .from('matcha_entries')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Reorder ─────────────────────────────────────────────────────────────────

export async function reorderMatchaEntries(orderIds: string[]): Promise<void> {
  // Update each entry with a sort_order value based on its position
  const updates = orderIds.map((id, index) =>
    supabase
      .from('matcha_entries')
      .update({ sort_order: index })
      .eq('id', id)
  );

  await Promise.all(updates);
}
