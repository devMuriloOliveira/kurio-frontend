
import { http, HttpResponse } from 'msw'

type Wallet = {
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

type User = {
  id: string
  username: string
  email: string
  passwordHash: string
  salt: string
  displayName?: string
  ens?: string
  walletNickname?: string
  avatar?: string
}

type Session = {
  token: string
  userId: string
}

const USERS_KEY = 'kurio-demo-users-v1'
const SESSIONS_KEY = 'kurio-demo-sessions-v1'
const WALLETS_KEY = 'kurio-demo-wallets-v1'

function load<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(key) ?? '[]'
    )

    return Array.isArray(value) ? (value as T[]) : []
  } catch {
    return []
  }
}

function save<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value))
}

async function hashPassword(
  password: string,
  salt: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function publicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName ?? user.username,
    ens: user.ens ?? '',
    walletNickname: user.walletNickname ?? '',
    avatar: user.avatar ?? '',
  }
}

function tokenFrom(request: Request): string | null {
  const authorization = request.headers.get('Authorization')

  return authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null
}

function authenticatedUser(request: Request): User | null {
  const token = tokenFrom(request)

  const session = load<Session>(SESSIONS_KEY).find(
    (item) => item.token === token
  )

  if (!session) return null

  return (
    load<User>(USERS_KEY).find(
      (item) => item.id === session.userId
    ) ?? null
  )
}

export function userIdFromRequest(request: Request): string | null {
  return authenticatedUser(request)?.id ?? null
}

function unauthorized() {
  return HttpResponse.json(
    { message: 'Sessão inválida ou expirada.' },
    { status: 401 },
  )
}

function invalid(message: string) {
  return HttpResponse.json(
    { message },
    { status: 422 },
  )
}

function createSession(userId: string): string {
  const token = crypto.randomUUID()

  save(SESSIONS_KEY, [
    ...load<Session>(SESSIONS_KEY),
    { token, userId },
  ])

  return token
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function stringValue(
  record: Record<string, unknown>,
  key: string,
): string {
  return typeof record[key] === 'string'
    ? (record[key] as string)
    : ''
}

export const authHandlers = [
  // Cadastro de usuário
  http.post('/api/auth/register', async ({ request }) => {
    const body: unknown = await request.json()

    if (!isRecord(body)) {
      return invalid('Dados de cadastro inválidos.')
    }

    const username = stringValue(body, 'username').trim()
    const email = stringValue(body, 'email').trim().toLowerCase()
    const password = stringValue(body, 'password')

    if (
      username.length < 3 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      password.length < 8
    ) {
      return invalid('Dados de cadastro inválidos.')
    }

    const users = load<User>(USERS_KEY)

    if (users.some((user) => user.email === email)) {
      return HttpResponse.json(
        { message: 'Este e-mail já está cadastrado.' },
        { status: 409 },
      )
    }

    if (
      users.some(
        (user) =>
          user.username.toLowerCase() === username.toLowerCase()
      )
    ) {
      return HttpResponse.json(
        { message: 'Nome de usuário indisponível.' },
        { status: 409 },
      )
    }

    const salt = crypto.randomUUID()

    const user: User = {
      id: crypto.randomUUID(),
      username,
      email,
      salt,
      passwordHash: await hashPassword(password, salt),
      displayName: username,
    }

    save(USERS_KEY, [...users, user])

    return HttpResponse.json(
      {
        user: publicUser(user),
        token: createSession(user.id),
      },
      { status: 201 },
    )
  }),

  // Login
  http.post('/api/auth/login', async ({ request }) => {
    const body: unknown = await request.json()

    if (!isRecord(body)) {
      return invalid('Informe e-mail e senha.')
    }

    const email = stringValue(body, 'email').trim().toLowerCase()
    const password = stringValue(body, 'password')

    const user = load<User>(USERS_KEY).find(
      (item) => item.email === email
    )

    if (
      !user ||
      (await hashPassword(password, user.salt)) !== user.passwordHash
    ) {
      return HttpResponse.json(
        { message: 'E-mail ou senha incorretos.' },
        { status: 401 },
      )
    }

    return HttpResponse.json({
      user: publicUser(user),
      token: createSession(user.id),
    })
  }),

  // Sessão atual
  http.get('/api/auth/me', ({ request }) => {
    const user = authenticatedUser(request)

    return user
      ? HttpResponse.json({ user: publicUser(user) })
      : unauthorized()
  }),

  // Logout
  http.post('/api/auth/logout', ({ request }) => {
    const token = tokenFrom(request)

    save(
      SESSIONS_KEY,
      load<Session>(SESSIONS_KEY).filter(
        (item) => item.token !== token
      ),
    )

    return new HttpResponse(null, { status: 204 })
  }),

  // Consultar perfil
  http.get('/api/profile', ({ request }) => {
    const user = authenticatedUser(request)

    return user
      ? HttpResponse.json({ data: publicUser(user) })
      : unauthorized()
  }),

  // Atualizar perfil
  http.patch('/api/profile', async ({ request }) => {
    const user = authenticatedUser(request)

    if (!user) return unauthorized()

    const body: unknown = await request.json()

    if (!isRecord(body)) {
      return invalid('Dados inválidos.')
    }

    const username = stringValue(body, 'username').trim()
    const email = stringValue(body, 'email').trim().toLowerCase()
    const displayName = stringValue(body, 'displayName').trim()
    const ens = stringValue(body, 'ens').trim()
    const walletNickname = stringValue(body, 'walletNickname').trim()
    const avatar = stringValue(body, 'avatar')

    if (
      username.length < 3 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      !displayName ||
      username.length > 30 ||
      displayName.length > 80
    ) {
      return invalid('Verifique nome, usuário e e-mail.')
    }

    if (ens && !/^[a-z0-9-]+\.eth$/i.test(ens)) {
      return invalid('O nome ENS deve terminar com .eth.')
    }

    if (
      avatar &&
      (
        !/^data:image\/(png|jpeg|webp);base64,/.test(avatar) ||
        avatar.length > 1_500_000
      )
    ) {
      return invalid(
        'Avatar inválido ou muito grande. Use PNG, JPEG ou WebP.',
      )
    }

    const users = load<User>(USERS_KEY)

    if (
      users.some(
        (item) => item.id !== user.id && item.email === email
      )
    ) {
      return HttpResponse.json(
        { message: 'Este e-mail já está cadastrado.' },
        { status: 409 },
      )
    }

    if (
      users.some(
        (item) =>
          item.id !== user.id &&
          item.username.toLowerCase() === username.toLowerCase()
      )
    ) {
      return HttpResponse.json(
        { message: 'Nome de usuário indisponível.' },
        { status: 409 },
      )
    }

    const updated: User = {
      ...user,
      username,
      email,
      displayName,
      ens,
      walletNickname,
      avatar,
    }

    save(
      USERS_KEY,
      users.map((item) =>
        item.id === user.id ? updated : item
      ),
    )

    return HttpResponse.json({
      data: publicUser(updated),
    })
  }),

  // Alterar senha
  http.patch('/api/profile/password', async ({ request }) => {
    const user = authenticatedUser(request)

    if (!user) return unauthorized()

    const body: unknown = await request.json()

    if (!isRecord(body)) {
      return invalid('Dados inválidos.')
    }

    const currentPassword = stringValue(body, 'currentPassword')
    const newPassword = stringValue(body, 'newPassword')

    if (
      (await hashPassword(currentPassword, user.salt)) !==
      user.passwordHash
    ) {
      return HttpResponse.json(
        { message: 'Senha atual incorreta.' },
        { status: 403 },
      )
    }

    if (newPassword.length < 8) {
      return invalid(
        'A nova senha deve ter pelo menos 8 caracteres.',
      )
    }

    const salt = crypto.randomUUID()
    const passwordHash = await hashPassword(newPassword, salt)

    save(
      USERS_KEY,
      load<User>(USERS_KEY).map((item) =>
        item.id === user.id
          ? { ...item, salt, passwordHash }
          : item
      ),
    )

    return new HttpResponse(null, { status: 204 })
  }),

  // Listar carteiras do usuário
  http.get('/api/wallets', ({ request }) => {
    const user = authenticatedUser(request)

    if (!user) return unauthorized()

    const wallets = load<Wallet>(WALLETS_KEY).filter(
      (item) => item.userId === user.id
    )

    return HttpResponse.json({ data: wallets })
  }),

  // Cadastrar carteira
  http.post('/api/wallets', async ({ request }) => {
    const user = authenticatedUser(request)

    if (!user) return unauthorized()

    const body: unknown = await request.json()

    if (!isRecord(body)) {
      return invalid('Dados inválidos.')
    }

    const kind = stringValue(body, 'kind')
    const network = stringValue(body, 'network')
    const type = stringValue(body, 'type')
    const address = stringValue(body, 'address').trim()
    const nickname = stringValue(body, 'nickname').trim()

    if (
      !['primary', 'secondary'].includes(kind) ||
      !['ethereum', 'polygon', 'solana'].includes(network) ||
      !['metamask', 'walletconnect', 'coinbase'].includes(type) ||
      !nickname ||
      !address
    ) {
      return invalid(
        'Preencha a rede, tipo, apelido e endereço da carteira.',
      )
    }

    const validAddress =
      network === 'solana'
        ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
        : /^0x[a-fA-F0-9]{40}$/.test(address)

    if (!validAddress) {
      return invalid(
        'Endereço incompatível com a rede selecionada.',
      )
    }

    const wallets = load<Wallet>(WALLETS_KEY)

    if (
      wallets.some(
        (item) =>
          item.userId === user.id &&
          item.kind === kind
      )
    ) {
      return HttpResponse.json(
        {
          message:
            'Já existe uma carteira dessa categoria. Edite a existente.',
        },
        { status: 409 },
      )
    }

    const wallet: Wallet = {
      id: crypto.randomUUID(),
      userId: user.id,
      kind: kind as Wallet['kind'],
      network: network as Wallet['network'],
      type: type as Wallet['type'],
      address,
      nickname,
      displayName: stringValue(body, 'displayName').trim(),
      profileName: stringValue(body, 'profileName').trim(),
      ensSecondary: stringValue(body, 'ensSecondary').trim(),
      referral: stringValue(body, 'referral').trim(),
      email: stringValue(body, 'email').trim(),
      ens: stringValue(body, 'ens').trim(),
    }

    save(WALLETS_KEY, [...wallets, wallet])

    return HttpResponse.json(
      { data: wallet },
      { status: 201 },
    )
  }),

  // Editar carteira existente
  http.patch('/api/wallets/:id', async ({ params, request }) => {
    const user = authenticatedUser(request)

    if (!user) return unauthorized()

    const wallets = load<Wallet>(WALLETS_KEY)

    const original = wallets.find(
      (item) =>
        item.id === params.id &&
        item.userId === user.id
    )

    if (!original) {
      return HttpResponse.json(
        { message: 'Carteira não encontrada.' },
        { status: 404 },
      )
    }

    const body: unknown = await request.json()

    if (!isRecord(body)) {
      return invalid('Dados inválidos.')
    }

    const nickname = stringValue(body, 'nickname').trim()
    const address = stringValue(body, 'address').trim()
    const network = stringValue(body, 'network')
    const type = stringValue(body, 'type')

    if (
      !nickname ||
      !['ethereum', 'polygon', 'solana'].includes(network) ||
      !['metamask', 'walletconnect', 'coinbase'].includes(type)
    ) {
      return invalid(
        'Informe apelido, rede e tipo de carteira válidos.',
      )
    }

    const validAddress =
      network === 'solana'
        ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
        : /^0x[a-fA-F0-9]{40}$/.test(address)

    if (!validAddress) {
      return invalid(
        'Endereço incompatível com a rede selecionada.',
      )
    }

    const updated: Wallet = {
      ...original,
      nickname,
      address,
      network: network as Wallet['network'],
      type: type as Wallet['type'],
      displayName: stringValue(body, 'displayName').trim(),
      profileName: stringValue(body, 'profileName').trim(),
      ensSecondary: stringValue(body, 'ensSecondary').trim(),
      referral: stringValue(body, 'referral').trim(),
      email: stringValue(body, 'email').trim(),
      ens: stringValue(body, 'ens').trim(),
    }

    save(
      WALLETS_KEY,
      wallets.map((item) =>
        item.id === updated.id ? updated : item
      ),
    )

    return HttpResponse.json({
      data: updated,
    })
  }),
]
