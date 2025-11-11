import { loadToken } from '../lib/storage.js';

/**
 * Fetch image with authentication token and convert to base64
 * @param {string} imageUrl - The URL of the image to fetch
 * @returns {Promise<string|null>} Base64 data URI or null if failed
 */
export async function fetchAuthenticatedImage(imageUrl) {
  if (!imageUrl) return null;
  
  // If it's already a local file or base64, return as is
  if (imageUrl.startsWith('file://') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  try {
    const token = await loadToken();
    if (!token) {
      console.warn('[ImageLoader] No token found, cannot fetch authenticated image');
      return null;
    }
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      console.error(`[ImageLoader] Failed to fetch image: ${response.status}`);
      return null;
    }
    
    // Convert to blob then to base64
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[ImageLoader] Error fetching authenticated image:', error);
    return null;
  }
}
