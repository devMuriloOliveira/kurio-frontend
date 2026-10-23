import type { NFT } from '@/types/nft'

export type CheckoutNetwork = NonNullable<NFT['network']>
export type WalletType = 'metamask' | 'walletconnect' | 'coinbase'

export type CollectorProfile = {
  displayName: string
  username: string
  network: CheckoutNetwork | ''
  profileName: string
  walletAddress: string
  secondaryWallet: string
  walletType: WalletType | ''
  referralCode: string
  email: string
  ensName: string
  useOtherWallet: boolean
  alternateWalletAddress: string
  note: string
}

export type ProfileErrors = Partial<Record<keyof CollectorProfile, string>>

const evmAddress = /^0x[a-fA-F0-9]{40}$/
const solanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const ensLabel = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/

export function isWalletAddress(value: string, network: CheckoutNetwork): boolean {
  return network === 'solana' ? solanaAddress.test(value) : evmAddress.test(value)
}

export function validateProfile(profile: CollectorProfile, itemNetworks: CheckoutNetwork[]): ProfileErrors {
  const errors: ProfileErrors = {}
  const requiredName = (value: string, label: string) => {
    const length = value.trim().length
    return length < 2 || length > 80 ? `${label} deve ter entre 2 e 80 caracteres.` : undefined
  }

  errors.displayName = requiredName(profile.displayName, 'Nome de exibição')
  errors.profileName = requiredName(profile.profileName, 'Nome do perfil')
  if (!/^[A-Za-z0-9_]{3,30}$/.test(profile.username)) errors.username = 'Use de 3 a 30 letras, números ou _; sem espaços.'

  if (!profile.network) errors.network = 'Selecione a rede dos NFTs do carrinho.'
  else if (itemNetworks.length !== 1 || itemNetworks[0] !== profile.network) errors.network = 'A rede deve corresponder a todos os NFTs do carrinho. Revise o carrinho se houver redes diferentes.'

  if (!profile.walletType) errors.walletType = 'Selecione um tipo de carteira.'
  if (!profile.walletAddress.trim()) errors.walletAddress = 'Informe o endereço da carteira.'
  else if (profile.network && !isWalletAddress(profile.walletAddress.trim(), profile.network)) errors.walletAddress = `Informe um endereço válido para ${profile.network === 'solana' ? 'Solana' : 'uma rede EVM'}.`

  if (profile.secondaryWallet.trim() && profile.network && !(
    isWalletAddress(profile.secondaryWallet.trim(), profile.network) ||
    (profile.network === 'ethereum' && ensLabel.test(profile.secondaryWallet.trim().replace(/\.eth$/, '')) && profile.secondaryWallet.trim().endsWith('.eth'))
  )) errors.secondaryWallet = 'Use um endereço da rede selecionada ou um nome .eth na Ethereum.'

  if (profile.useOtherWallet) {
    if (!profile.alternateWalletAddress.trim()) errors.alternateWalletAddress = 'Informe o outro endereço da carteira.'
    else if (profile.network && !isWalletAddress(profile.alternateWalletAddress.trim(), profile.network)) errors.alternateWalletAddress = 'O outro endereço não corresponde à rede selecionada.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()) || profile.email.trim().length > 254) errors.email = 'Informe um e-mail válido de até 254 caracteres.'
  if (profile.network === 'ethereum' && profile.ensName.trim() && !ensLabel.test(profile.ensName.trim())) errors.ensName = 'Nome ENS opcional: use 3 a 63 letras minúsculas, números ou hífens na Ethereum.'
  if (profile.referralCode.length > 50) errors.referralCode = 'Use até 50 caracteres.'
  if (profile.note.length > 500) errors.note = 'Use até 500 caracteres.'
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as ProfileErrors
}
