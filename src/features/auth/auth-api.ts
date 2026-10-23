
import axios from 'axios'
import { api } from '@/lib/api'

export type AuthUser = {
  id: string
  username: string
  email: string
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

const TOKEN_KEY = 'kurio-demo-auth-token-v1'
const AUTH_CHANGED_EVENT = 'kurio-auth-changed'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function subscribeToAuth(onChange: () => void): () => void {
  window.addEventListener(AUTH_CHANGED_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function registerUser(values: {
  username: string
  email: string
  password: string
}): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    '/auth/register',
    values,
  )

  return response.data
}

export async function loginUser(values: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    '/auth/login',
    values,
  )

  return response.data
}

export async function getCurrentUser(
  token: string,
): Promise<AuthUser> {
  const response = await api.get<{ user: AuthUser }>(
    '/auth/me',
    {
      headers: authHeaders(token),
    },
  )

  return response.data.user
}

export async function logoutUser(
  token: string,
): Promise<void> {
  await api.post(
    '/auth/logout',
    undefined,
    {
      headers: authHeaders(token),
    },
  )
}

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (
      error.response?.data as { message?: unknown } | undefined
    )?.message

    if (typeof message === 'string') {
      return message
    }

    if (!error.response) {
      return 'Não foi possível conectar à API simulada.'
    }
  }

  return 'Ocorreu um erro. Tente novamente.'
}
