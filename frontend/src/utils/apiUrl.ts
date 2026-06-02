const API_PORT = '8000';

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.protocol}//${window.location.hostname}:${API_PORT}${normalizedPath}`;
}
