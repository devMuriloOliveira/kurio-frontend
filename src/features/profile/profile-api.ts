import { api } from '@/lib/api'
import { getAuthToken } from '@/features/auth/auth-api'

export type CollectorProfile = {
  id: string
  username: string
  email: string
  displayName: string
  ens: string
  walletNickname: string
  avatar: string
}

export type CollectorWallet = {
  id: string
  userId: string
  kind: 'primary' | 'secondary'
  displayName: string
  nickname: string
  network: 'ethereum' | 'polygon' | 'solana'
  profileName: string
  address: string
  ensSecondary: string
  type: 'metamask' | 'walletconnect' | 'coinbase'
  referral: string
  email: string
  ens: string
}

export type WalletInput = Omit<CollectorWallet, 'id' | 'userId'>

function authHeaders() {
  const token = getAuthToken()
  if (!token) throw new Error('Faça login para continuar.')
  return { Authorization: `Bearer ${token}` }
}

export async function fetchProfile() {
  const response = await api.get<{ data: CollectorProfile }>('/profile', {
    headers: authHeaders(),
  })
  return response.data.data
}

export async function updateProfile(
  data: Pick<CollectorProfile, 'username' | 'email' | 'displayName' | 'ens' | 'walletNickname' | 'avatar'>,
) {
  const response = await api.patch<{ data: CollectorProfile }>('/profile', data, {
    headers: authHeaders(),
  })
  return response.data.data
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  await api.patch('/profile/password', data, { headers: authHeaders() })
}

export async function fetchWallets() {
  const response = await api.get<{ data: CollectorWallet[] }>('/wallets', {
    headers: authHeaders(),
  })
  return response.data.data
}

export async function saveWallet(data: WalletInput, existingId?: string) {
  const response = existingId
    ? await api.patch<{ data: CollectorWallet }>(`/wallets/${existingId}`, data, { headers: authHeaders() })
    : await api.post<{ data: CollectorWallet }>('/wallets', data, { headers: authHeaders() })
  return response.data.data
}
