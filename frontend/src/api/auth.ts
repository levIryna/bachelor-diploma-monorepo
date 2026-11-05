import type { AuthUser } from '../types/auth';
import { apiClient } from './client';

export async function loginRequest(email: string, password: string): Promise<void> {
  await apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logoutRequest(): Promise<void> {
  return apiClient('/auth/logout', { method: 'POST' });
}

export function fetchCurrentUser(options?: { quiet?: boolean }): Promise<AuthUser> {
  return apiClient<AuthUser>('/auth/me', { skipSessionEnded: options?.quiet });
}

export function changeOwnPassword(input: {
  currentPassword: string;
  password: string;
  passwordConfirm: string;
}): Promise<{ ok: true }> {
  return apiClient<{ ok: true }>('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
