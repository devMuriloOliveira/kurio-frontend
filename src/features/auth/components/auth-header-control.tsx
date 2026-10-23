
import { useEffect, useState, useSyncExternalStore } from 'react'
import axios from 'axios'
import { Link } from '@tanstack/react-router'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { LogIn, LogOut, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { replaceCartItems } from '@/features/cart/cart-storage'
import { AuthModal } from './auth-modal'

import {
  clearAuthToken,
  getAuthErrorMessage,
  getAuthToken,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  saveAuthToken,
  subscribeToAuth,
  type AuthResponse,
} from '../auth-api'

function clearPrivateQueries(queryClient: QueryClient) {
  for (const key of ['auth', 'profile', 'wallets', 'orders']) {
    queryClient.removeQueries({ queryKey: [key] })
  }
}

export function AuthHeaderControl() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const token = useSyncExternalStore(subscribeToAuth, getAuthToken, () => null)

  const session = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: () => getCurrentUser(token!),
    enabled: Boolean(token),
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: loginUser,
  })

  const registerMutation = useMutation({
    mutationFn: registerUser,
  })

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
  })

  useEffect(() => {
    if (token && axios.isAxiosError(session.error) && session.error.response?.status === 401) {
      replaceCartItems([])
      clearAuthToken()
      clearPrivateQueries(queryClient)
    }
  }, [session.error, token, queryClient])

  async function finishAuthentication(
    response: AuthResponse,
  ) {
    if (token) replaceCartItems([])
    await queryClient.cancelQueries()
    clearPrivateQueries(queryClient)

    saveAuthToken(response.token)

    queryClient.setQueryData(
      ['auth', 'me', response.token],
      response.user,
    )

    setOpen(false)
  }

  async function handleLogin(values: {
    email: string
    password: string
  }) {
    try {
      const response = await loginMutation.mutateAsync(values)
      await finishAuthentication(response)
    } catch (error) {
      throw new Error(getAuthErrorMessage(error), { cause: error })
    }
  }

  async function handleRegister(values: {
    username: string
    email: string
    password: string
  }) {
    try {
      const response = await registerMutation.mutateAsync(values)
      await finishAuthentication(response)
    } catch (error) {
      throw new Error(getAuthErrorMessage(error), { cause: error })
    }
  }

  async function handleLogout() {
    const currentToken = token

    replaceCartItems([])
    await queryClient.cancelQueries()
    clearPrivateQueries(queryClient)

    clearAuthToken()

    if (currentToken) {
      try {
        await logoutMutation.mutateAsync(currentToken)
      } catch {
        // Sessão local encerrada, mesmo com falha de rede.
      }
    }
  }

  const user = token ? session.data : null

  return (
    <>
      {user ? (
        <div className="flex items-center gap-2">
          <Link
            to="/perfil"
            title="Meu perfil"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-foreground transition-colors hover:bg-white/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <UserRound size={16} aria-hidden="true" />
            {user.username}
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleLogout()}
            title="Sair da conta"
            aria-label="Sair da conta"
          >
            <LogOut size={16} />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={() => setOpen(true)}
          className="ml-2 gap-1"
          disabled={Boolean(token) && session.isPending}
        >
          <LogIn aria-hidden="true" />
          {token && session.isPending
            ? 'Carregando...'
            : 'Entrar'}
        </Button>
      )}

      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </>
  )
}
