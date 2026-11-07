/**
 * Returns an aesthetic Unsplash placeholder image for a property.
 * Picks deterministically from the pool using the property id so
 * the same property always gets the same placeholder.
 */

const PLACEHOLDER_POOL = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80", // bright modern living room
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=80", // minimal kitchen
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80", // luxury bedroom
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80", // exterior pool villa
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=80", // modern dining area
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=80", // clean bathroom
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&auto=format&fit=crop&q=80", // scandinavian living room
  "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&auto=format&fit=crop&q=80", // cozy bedroom warm light
];

export function getPlaceholderImage(seed: string): string {
  // Simple hash of the seed string → stable index
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PLACEHOLDER_POOL[hash % PLACEHOLDER_POOL.length];
}
