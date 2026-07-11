const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/v1').replace(/\/v1$/, '');

export function mediaUrl(path: string): string {
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}
