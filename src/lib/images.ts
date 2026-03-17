import { supabase } from './supabase';

const IMAGE_BUCKET =
  import.meta.env.VITE_SUPABASE_IMAGE_BUCKET || 'matcha-images';
const IMAGE_PATH_PREFIX =
  import.meta.env.VITE_SUPABASE_IMAGE_PATH_PREFIX || 'matcha-entries';
const SIGNED_URL_TTL =
  Number(import.meta.env.VITE_SUPABASE_IMAGE_SIGNED_TTL) || 3600;

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isDataLikeUrl(value: string) {
  return value.startsWith('data:') || value.startsWith('blob:');
}

export function isStoragePath(value: string) {
  return !isAbsoluteUrl(value) && !isDataLikeUrl(value);
}

function normalizeFileName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'image';
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function resolveImageUrl(imageUrl?: string) {
  if (!imageUrl) return undefined;
  if (!isStoragePath(imageUrl)) return imageUrl;

  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(imageUrl, SIGNED_URL_TTL);
  if (error) return imageUrl;
  return data.signedUrl || imageUrl;
}

export async function uploadEntryImage(file: File, entryId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Not authenticated');

  const safeName = normalizeFileName(file.name || 'image');
  const timestamp = Date.now();
  const filePath = `${IMAGE_PATH_PREFIX}/${user.id}/${entryId}/${timestamp}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type || undefined,
    });
  if (uploadError) throw uploadError;

  const signedUrl = await resolveImageUrl(filePath);
  if (!signedUrl) throw new Error('Failed to resolve image URL');

  return { signedUrl, path: filePath };
}
