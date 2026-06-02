const rawApiBaseUrl =
  process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:8000/api';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

export const apiUrl = (path: string) =>
  `${API_BASE_URL}/${path.replace(/^\//, '')}`;
