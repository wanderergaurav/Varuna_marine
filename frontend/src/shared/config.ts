const normalizeBaseUrl = (value?: string): string => {
  if (!value || value.trim().length === 0) {
    return 'http://localhost:3000';
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export const apiConfig = {
  baseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
};

