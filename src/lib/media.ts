import type { SupabaseClient } from "@supabase/supabase-js"
import type { ProductMedia } from "@/types/database"

export type MediaType = "image" | "video"

export const PRODUCT_MEDIA_BUCKET = "product-images"

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]
export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"]

export const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024
export const VIDEO_MAX_SIZE_BYTES = 50 * 1024 * 1024

export interface MediaUploadResult {
  url: string
  path: string
  media_type: MediaType
}

export interface MediaInput {
  url: string
  storage_path?: string | null
  alt_text?: string | null
  media_type?: MediaType
}

export function validateMediaFile(
  file: File,
  mediaType: MediaType
): { ok: true } | { ok: false; error: string } {
  return validateMediaMetadata(file.name, file.type, file.size, mediaType)
}

export function validateMediaMetadata(
  fileName: string,
  mimeType: string,
  size: number,
  mediaType: MediaType
): { ok: true } | { ok: false; error: string } {
  if (mediaType === "image") {
    if (!IMAGE_MIME_TYPES.includes(mimeType)) {
      return { ok: false, error: "Invalid image type. Allowed: JPG, PNG, WebP, AVIF" }
    }
    if (size > IMAGE_MAX_SIZE_BYTES) {
      return { ok: false, error: "Image too large. Max 5MB" }
    }
  } else {
    if (!VIDEO_MIME_TYPES.includes(mimeType)) {
      return { ok: false, error: "Invalid video type. Allowed: MP4, WebM, MOV" }
    }
    if (size > VIDEO_MAX_SIZE_BYTES) {
      return { ok: false, error: "Video too large. Max 50MB" }
    }
  }
  return { ok: true }
}

export function mediaFolder(mediaType: MediaType): string {
  return mediaType === "video" ? "products/videos" : "products"
}

export function getStoragePathFromUrl(url: string, bucket: string): string | null {
  try {
    const publicMarker = `/object/public/${bucket}/`
    const publicIdx = url.indexOf(publicMarker)
    if (publicIdx >= 0) {
      return decodeURIComponent(url.slice(publicIdx + publicMarker.length))
    }

    const urlObj = new URL(url)
    const parts = urlObj.pathname.split("/")
    const bucketIdx = parts.indexOf(bucket)
    if (bucketIdx >= 0 && bucketIdx < parts.length - 1) {
      return decodeURIComponent(parts.slice(bucketIdx + 1).join("/"))
    }
    return null
  } catch {
    return null
  }
}

export async function deleteStorageObject(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<void> {
  if (!path) return
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error(`[media] Failed to delete storage object ${bucket}/${path}:`, error)
  }
}

export async function deleteStorageObjectByUrl(
  supabase: SupabaseClient,
  bucket: string,
  url: string
): Promise<void> {
  const path = getStoragePathFromUrl(url, bucket)
  if (path) await deleteStorageObject(supabase, bucket, path)
}

export function isImage(media: Pick<ProductMedia, "media_type">): boolean {
  return media.media_type === "image"
}

export function isVideo(media: Pick<ProductMedia, "media_type">): boolean {
  return media.media_type === "video"
}

export function getProductImages(media: ProductMedia[] | null | undefined): ProductMedia[] {
  return (media ?? []).filter(isImage)
}

export function getProductVideos(media: ProductMedia[] | null | undefined): ProductMedia[] {
  return (media ?? []).filter(isVideo)
}

export function getPrimaryImage(media: ProductMedia[] | null | undefined): ProductMedia | null {
  const images = getProductImages(media)
  return images.find((img) => img.is_primary) ?? images[0] ?? null
}

export function hasProductVideo(media: ProductMedia[] | null | undefined): boolean {
  return getProductVideos(media).length > 0
}
