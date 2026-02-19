import { ImageSource } from 'expo-image';

/**
 * optimises image loading by:
 * 1. Appending Supabase Image Transformation parameters (if the URL is from Supabase).
 * 2. Returning an ImageSource object with 'width' to enable client-side downsampling in expo-image.
 *
 * @param url The original image URL
 * @param width The desired width for display (and downsampling)
 * @returns An ImageSource object compatible with expo-image
 */
export function getOptimizedImageSource(url: string | null | undefined, width: number): ImageSource | undefined {
  if (!url) return undefined;

  let optimizedUrl = url;

  // Check if it's a Supabase URL
  // Matches: https://<project>.supabase.co/storage/v1/object/public/...
  if (url.includes('supabase.co')) {
      // If it already has query params, append with &
      const separator = url.includes('?') ? '&' : '?';

      // We explicitly request resizing and webp format
      // If the Supabase project has Image Transformations enabled, this will return a resized image.
      // If not, it will return the original image (ignoring params), and we rely on client-side downsampling.
      optimizedUrl = `${url}${separator}width=${width}&quality=80&format=webp`;
  }

  return {
    uri: optimizedUrl,
    width: width, // Crucial for client-side memory optimization (decoding to smaller size)
  };
}
