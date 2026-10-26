import { notifySessionEnded } from '../auth/session';

const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const isLogin = path === '/auth/login';

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const expired = response.headers.get('X-Auth-Expired') === '1';
  if (!isLogin && (expired || response.status === 401)) {
    notifySessionEnded();
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body: unknown = await response.json();
      if (
        body &&
        typeof body === 'object' &&
        'message' in body &&
        typeof body.message === 'string'
      ) {
        message = body.message;
      }
    } catch {
      // The error body is not JSON.
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}
