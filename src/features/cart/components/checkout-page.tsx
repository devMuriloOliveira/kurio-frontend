import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { FormEvent, InputHTMLAttributes } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import axios from 'axios'

import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { applyConfirmedOrderToCart, getCartCoupon, getCartItems, getCartSnapshot, subscribeToCart } from '@/features/cart/cart-storage'
import { validateProfile } from '@/features/cart/checkout-validation'
import type { CheckoutNetwork, CollectorProfile, ProfileErrors, WalletType } from '@/features/cart/checkout-validation'
import { createOrder, requestQuote, type Order, type Quote } from '@/features/cart/order-api'
import { estimatedNetworkFeeEth, formatWeiAsEth, launchDiscountEth, parseEthToWei, sumWei } from '@/features/cart/eth'
import { getAuthToken, subscribeToAuth } from '@/features/auth/auth-api'
import { fetchWallets } from '@/features/profile/profile-api'
import { getNfts } from '@/features/catalog/catalog-api'
import { MobileBottomNav } from '@/features/catalog/components/mobile-bottom-nav'
import type { NFT } from '@/types/nft'

const initialProfile: CollectorProfile = {
  displayName: '', username: '', network: '', profileName: '', walletAddress: '', secondaryWallet: '',
  walletType: '', referralCode: '', email: '', ensName: '', useOtherWallet: false, alternateWalletAddress: '', note: '',
}
const networkNames: Record<CheckoutNetwork, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }
const walletNames: Record<WalletType, string> = { metamask: 'MetaMask', walletconnect: 'WalletConnect', coinbase: 'Coinbase Wallet' }
const inputClass = 'h-9 w-full min-w-0 rounded-sm border border-primary/20 bg-transparent px-3 text-xs text-foreground placeholder:text-text-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
const feeWei = parseEthToWei(estimatedNetworkFeeEth)
const discountWei = parseEthToWei(launchDiscountEth)
const ATTEMPT_KEY = 'kurio-demo-checkout-attempt-v1'
type CheckoutAttempt = { token: string; quoteId: string; key: string }

function storedAttempt(token: string | null): CheckoutAttempt | null {
  if (!token) return null
  try {
    const attempt = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) ?? 'null') as CheckoutAttempt | null
    return attempt?.token === token && typeof attempt.quoteId === 'string' && typeof attempt.key === 'string' ? attempt : null
  } catch { return null }
}

function priceInWei(nft: NFT): bigint | null {
  try { return nft.priceEth ? parseEthToWei(nft.priceEth) : null } catch { return null }
}

type TextFieldProps = {
  id: keyof CollectorProfile
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
} & Pick<InputHTMLAttributes<HTMLInputElement>, 'type' | 'placeholder' | 'maxLength' | 'autoComplete'>

function TextField({ id, label, value, onChange, error, required, ...inputProps }: TextFieldProps) {
  return <div className="min-w-0">
    <label htmlFor={id} className="mb-2 block text-xs">{label}{required && <span className="ml-0.5 text-primary" aria-label="obrigatório">*</span>}</label>
    <input id={id} name={id} value={value} onChange={(event) => onChange(event.target.value)} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass} {...inputProps} />
    {error && <p id={`${id}-error`} role="alert" className="mt-1 text-[11px] text-destructive">{error}</p>}
  </div>
}

export function CheckoutPage() {
  const token = useSyncExternalStore(subscribeToAuth, getAuthToken, () => null)
  return <CheckoutContent key={token} token={token} />
}

function CheckoutContent({ token }: { token: string | null }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const snapshot = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => '[]')
  const storedItems = useMemo(() => getCartItems(snapshot), [snapshot])
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['nfts'], queryFn: ({ signal }) => getNfts(signal) })
  const walletQuery = useQuery({ queryKey: ['wallets', token], queryFn: fetchWallets, enabled: Boolean(token), retry: false })
  const [profile, setProfile] = useState<CollectorProfile>(initialProfile)
  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [reviewed, setReviewed] = useState<{ quote: Quote; cartSnapshot: string } | null>(null)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState(false)
  const processingRef = useRef(false)
  const attemptKey = useRef<string | null>(null)
  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(() => storedAttempt(token))

  async function finishOrder(order: Order) {
    sessionStorage.removeItem(ATTEMPT_KEY)
    setAttempt(null)
    if (order.status === 'confirmed') {
      applyConfirmedOrderToCart(order.id, order.items.map(({ nftId, quantity }) => ({ nftId, quantity })))
      await queryClient.invalidateQueries({ queryKey: ['nfts'] })
    }
    await navigate({ to: '/pedido/$orderId', params: { orderId: order.id } })
  }

  async function recoverOrder() {
    if (!attempt || processingRef.current) return
    processingRef.current = true
    setProcessing(true)
    setMessage('')
    try { await finishOrder(await createOrder(attempt.quoteId, attempt.key)) }
    catch (error) {
      const apiMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined
      setMessage(apiMessage ?? 'Não foi possível recuperar o pedido. Tente novamente com a mesma chave.')
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        sessionStorage.removeItem(ATTEMPT_KEY)
        setAttempt(null)
        setReviewed(null)
        void refetch()
      }
    } finally { processingRef.current = false; setProcessing(false) }
  }

  function update<K extends keyof CollectorProfile>(key: K, value: CollectorProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setReviewed(null)
    attemptKey.current = null
  }

  function selectWallet(id: string) {
    setSelectedWalletId(id)
    setReviewed(null)
    attemptKey.current = null
    const wallet = walletQuery.data?.find((item) => item.id === id)
    if (wallet) setProfile((current) => ({
      ...current, displayName: wallet.displayName, username: wallet.profileName,
      profileName: wallet.profileName, email: wallet.email, network: wallet.network,
      walletAddress: wallet.address, walletType: wallet.type, secondaryWallet: wallet.ensSecondary,
    }))
  }

  const catalog = data?.data ?? []
  const catalogById = new Map(catalog.map((nft) => [nft.id, nft]))
  const lines = storedItems.flatMap((item) => {
    const nft = catalogById.get(item.nftId)
    return nft ? [{ ...item, nft, unitWei: priceInWei(nft) }] : []
  })
  const itemNetworks = Array.from(new Set(lines.flatMap((line) => line.nft.network ? [line.nft.network] : [])))
  const validItems = storedItems.length > 0 && lines.length === storedItems.length && itemNetworks.length === 1 &&
    lines.every((line) => line.unitWei !== null && line.nft.network === itemNetworks[0] && Number.isSafeInteger(line.nft.availableQuantity) && line.quantity >= 1 && line.quantity <= line.nft.availableQuantity!)
  const subtotalWei = sumWei(lines.map((line) => line.unitWei === null ? 0n : line.unitWei * BigInt(line.quantity)))
  const appliedFeeWei = lines.length > 0 ? feeWei : 0n
  const totalWei = subtotalWei + appliedFeeWei - discountWei
  const activeQuote = reviewed?.cartSnapshot === snapshot && reviewed.quote.walletId === selectedWalletId && reviewed.quote.couponCode === (getCartCoupon() || null) ? reviewed.quote : null

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (processingRef.current || attempt) return
    const nextErrors = validateProfile(profile, itemNetworks)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setMessage('Revise os campos indicados antes de continuar.')
      return
    }
    const selectedWallet = walletQuery.data?.find((item) => item.id === selectedWalletId)
    if (!validItems || !selectedWallet || selectedWallet.network !== profile.network || selectedWallet.address !== profile.walletAddress || selectedWallet.type !== profile.walletType || profile.useOtherWallet) {
      setMessage('O carrinho está vazio ou contém itens sem preço, estoque ou rede compatível. Revise o carrinho.')
      return
    }

    processingRef.current = true
    setProcessing(true)
    setMessage('')
    try {
      const freshItems = getCartItems()
      if (JSON.stringify(freshItems) !== JSON.stringify(storedItems)) throw new Error('O carrinho mudou. Revise os itens antes de confirmar.')
      if (!activeQuote) {
        const quote = await requestQuote(freshItems, selectedWalletId, getCartCoupon() || null)
        setReviewed({ quote, cartSnapshot: snapshot })
        setMessage('Revise a cotação da API simulada e confirme a compra.')
        return
      }
      const key = attemptKey.current ?? crypto.randomUUID()
      attemptKey.current = key
      const nextAttempt = { token: token!, quoteId: activeQuote.id, key }
      sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(nextAttempt))
      setAttempt(nextAttempt)
      const order = await createOrder(activeQuote.id, key)
      await finishOrder(order)
    } catch (error) {
      const apiMessage = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined
      setMessage(apiMessage ?? (error instanceof Error ? error.message : 'Não foi possível concluir a simulação. Tente novamente.'))
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        sessionStorage.removeItem(ATTEMPT_KEY)
        setAttempt(null)
        setReviewed(null)
        attemptKey.current = null
        void refetch()
      }
    } finally {
      processingRef.current = false
      setProcessing(false)
    }
  }

  return <main className="min-h-screen bg-background px-6 pt-6 pb-28 text-foreground lg:px-8 lg:pt-8 lg:pb-12">
    <div className="mx-auto max-w-[1200px]">
      <nav aria-label="Caminho da página" className="mb-8 flex flex-wrap gap-2 text-xs text-text-secondary">
        <Link to="/" className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Início</Link><span aria-hidden="true">/</span>
        <Link to="/" hash="catalogo" className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Mercado</Link><span aria-hidden="true">/</span>
        <span aria-current="page" className="font-bold text-foreground">Pagamento</span>
      </nav>
      {!token && <p role="alert" className="min-h-64 text-sm">Entre na sua conta para finalizar a compra.</p>}
      {token && isPending && <p role="status" className="min-h-64 text-text-secondary">Carregando checkout...</p>}
      {token && isError && <div role="alert" className="min-h-64 space-y-4"><p>Não foi possível carregar os NFTs do checkout.</p><Button type="button" onClick={() => void refetch()}>Tentar novamente</Button></div>}
      {token && walletQuery.isPending && <p role="status" className="text-sm text-text-secondary">Carregando carteiras...</p>}
      {token && walletQuery.isError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar as carteiras. Recarregue a página.</p>}
      {token && walletQuery.data?.length === 0 && <p className="text-sm">Cadastre uma carteira no <Link to="/perfil" className="text-primary underline">perfil</Link> antes de finalizar.</p>}
      {data && token && walletQuery.data && walletQuery.data.length > 0 && <form noValidate onSubmit={(event) => void confirm(event)} className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)] lg:gap-8">
        <section aria-labelledby="collector-title" className="min-w-0">
          <h1 id="collector-title" className="mb-5 text-sm font-bold">Perfil do colecionador</h1>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <div className="min-w-0 sm:col-span-2"><label htmlFor="saved-wallet" className="mb-2 block text-xs">Carteira cadastrada<span className="ml-0.5 text-primary">*</span></label><select id="saved-wallet" value={selectedWalletId} onChange={(event) => selectWallet(event.target.value)} className={inputClass} required><option value="">Selecione uma carteira</option>{walletQuery.data.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.nickname} · {wallet.network}</option>)}</select></div>
            <TextField id="displayName" label="Nome de exibição" required value={profile.displayName} onChange={(value) => update('displayName', value)} error={errors.displayName} maxLength={80} autoComplete="nickname" />
            <TextField id="username" label="Nome de usuário" required value={profile.username} onChange={(value) => update('username', value)} error={errors.username} maxLength={30} autoComplete="username" />
            <div className="min-w-0"><label htmlFor="network" className="mb-2 block text-xs">Rede<span className="ml-0.5 text-primary" aria-label="obrigatório">*</span></label>
              <select id="network" value={profile.network} onChange={(event) => update('network', event.target.value as CheckoutNetwork | '')} required aria-invalid={Boolean(errors.network)} aria-describedby={errors.network ? 'network-error' : 'network-help'} className={inputClass}>
                <option value="">Selecione uma rede</option>{(Object.keys(networkNames) as CheckoutNetwork[]).map((network) => <option key={network} value={network} disabled={itemNetworks.length > 0 && !itemNetworks.includes(network)}>{networkNames[network]}{itemNetworks.length > 0 && !itemNetworks.includes(network) ? ' — sem NFTs compatíveis' : ''}</option>)}
              </select>{errors.network ? <p id="network-error" role="alert" className="mt-1 text-[11px] text-destructive">{errors.network}</p> : <p id="network-help" className="mt-1 text-[10px] text-text-secondary">Selecione a rede dos NFTs do carrinho.</p>}
            </div>
            <TextField id="profileName" label="Nome do perfil" required value={profile.profileName} onChange={(value) => update('profileName', value)} error={errors.profileName} maxLength={80} />
            <TextField id="walletAddress" label="Endereço da carteira" required value={profile.walletAddress} onChange={(value) => update('walletAddress', value)} error={errors.walletAddress} maxLength={64} placeholder={profile.network === 'solana' ? 'Endereço Solana' : 'Endereço 0x da carteira'} autoComplete="off" />
            <TextField id="secondaryWallet" label="" value={profile.secondaryWallet} onChange={(value) => update('secondaryWallet', value)} error={errors.secondaryWallet} maxLength={64} placeholder="Nome .eth ou outro endereço" autoComplete="off" />
            <div className="min-w-0"><label htmlFor="walletType" className="mb-2 block text-xs">Tipo de carteira<span className="ml-0.5 text-primary" aria-label="obrigatório">*</span></label>
              <select id="walletType" value={profile.walletType} onChange={(event) => update('walletType', event.target.value as WalletType | '')} required aria-invalid={Boolean(errors.walletType)} aria-describedby={errors.walletType ? 'walletType-error' : undefined} className={inputClass}>
                <option value="">Selecione uma carteira</option>{(Object.keys(walletNames) as WalletType[]).map((wallet) => <option key={wallet} value={wallet}>{walletNames[wallet]}</option>)}
              </select>{errors.walletType && <p id="walletType-error" role="alert" className="mt-1 text-[11px] text-destructive">{errors.walletType}</p>}
            </div>
            <div><TextField id="referralCode" label="Código de indicação (opcional nesta simulação)" value={profile.referralCode} onChange={(value) => update('referralCode', value)} error={errors.referralCode} maxLength={50} /><p className="mt-1 text-[10px] text-text-secondary">Sem validação de códigos externos.</p></div>
            <TextField id="email" label="E-mail" type="email" required value={profile.email} onChange={(value) => update('email', value)} error={errors.email} maxLength={254} autoComplete="email" />
            <div className="min-w-0">
              <label htmlFor="ensSuffix" className="mb-2 block text-xs">Nome ENS <span aria-hidden="true" className="text-primary">*</span></label>
              <select id="ensSuffix" defaultValue=".eth" className={`${inputClass} max-w-[72px]`}>
                <option value=".eth">.eth</option>
              </select>
              {profile.network === 'ethereum' && <div className="mt-2 max-w-[350px]">
                <label htmlFor="ensName" className="mb-1 block text-[11px] text-text-secondary">Nome antes de .eth (opcional)</label>
                <input id="ensName" value={profile.ensName} onChange={(event) => update('ensName', event.target.value)} maxLength={63} aria-invalid={Boolean(errors.ensName)} aria-describedby={errors.ensName ? 'ensName-error' : undefined} className={inputClass} />
                {errors.ensName && <p id="ensName-error" role="alert" className="mt-1 text-[11px] text-destructive">{errors.ensName}</p>}
              </div>}
            </div>
            <div className="sm:col-span-2"><label className="inline-flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={profile.useOtherWallet} onChange={(event) => update('useOtherWallet', event.target.checked)} className="accent-primary" />Usar outra carteira?</label></div>
            {profile.useOtherWallet && <div className="sm:col-span-2"><TextField id="alternateWalletAddress" label="Endereço da outra carteira" required value={profile.alternateWalletAddress} onChange={(value) => update('alternateWalletAddress', value)} error={errors.alternateWalletAddress} maxLength={64} placeholder="Endereço na rede selecionada" autoComplete="off" /></div>}
            <div className="min-w-0 w-full max-w-[350px]"><label htmlFor="note" className="mb-2 block text-xs">Observação do colecionador (opcional)</label><textarea id="note" value={profile.note} onChange={(event) => update('note', event.target.value)} maxLength={500} rows={5} aria-invalid={Boolean(errors.note)} aria-describedby={errors.note ? 'note-error' : undefined} className={`${inputClass} h-auto min-h-28 py-2`} />{errors.note && <p id="note-error" role="alert" className="mt-1 text-[11px] text-destructive">{errors.note}</p>}</div>
          </div>
        </section>
        <aside aria-labelledby="nfts-title" className="min-w-0">
          <h2 id="nfts-title" className="text-sm font-bold">Seus NFTs</h2>
          <div className="mt-3 flex justify-between border-b border-primary/30 pb-2 text-xs font-bold"><span>NFTs</span><span>Subtotal</span></div>
          {storedItems.length === 0 ? <div className="space-y-3 py-5 text-xs text-text-secondary"><p>Seu carrinho está vazio.</p><Link to="/" hash="catalogo" className="inline-block text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Explorar NFTs</Link></div> : !validItems && <p role="alert" className="mt-3 text-xs text-destructive">Há itens sem estoque, preço ou rede única compatível. <Link to="/carrinho" className="underline">Revise o carrinho.</Link></p>}
          <ul className="space-y-2 pt-2">{lines.map((line) => <li key={line.nftId} className="flex min-w-0 items-center gap-2 bg-sidebar p-2 text-xs"><Link to="/nfts/$nftId" params={{ nftId: line.nft.id }} className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{line.nft.imageUrl ? <img src={line.nft.imageUrl} alt="" className="size-14 rounded-sm object-cover" /> : <span className="flex size-14 items-center justify-center bg-background text-[9px]">Sem imagem</span>}</Link><div className="min-w-0 flex-1"><Link to="/nfts/$nftId" params={{ nftId: line.nft.id }} className="block truncate font-bold hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{line.nft.name}</Link><span className="block break-all text-[10px] text-text-secondary">ID do item: {line.nft.id}</span></div><span className="shrink-0 text-[10px] text-text-secondary">× {line.quantity}</span><span className="shrink-0 font-bold text-primary">{line.unitWei === null ? '—' : formatWeiAsEth(line.unitWei * BigInt(line.quantity))} ETH</span></li>)}</ul>
          <Link to="/carrinho" className="mt-3 block text-center text-[11px] text-text-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Tem um código promocional? Aplique no carrinho</Link>
          <dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{activeQuote?.subtotalEth ?? formatWeiAsEth(subtotalWei)} ETH</dd></div><div className="flex justify-between gap-3"><dt>Desconto do lançamento</dt><dd>(-) {activeQuote?.discountEth ?? formatWeiAsEth(discountWei)} ETH</dd></div><div className="flex justify-between gap-3"><dt>Taxa de rede</dt><dd>{activeQuote?.networkFeeEth ?? formatWeiAsEth(appliedFeeWei)} ETH</dd></div></dl>
          <p className="mt-2 text-right text-[10px] text-text-secondary">Taxa estimada</p>
          <div className="mt-3 flex justify-between border-t border-primary/30 pt-3 text-sm font-bold"><span>Total</span><span className="text-primary">{activeQuote?.totalEth ?? formatWeiAsEth(totalWei)} ETH</span></div>
          {activeQuote && <p role="status" className="mt-2 text-[11px] text-text-secondary">Cotação da API válida até {new Date(activeQuote.expiresAt).toLocaleTimeString('pt-BR')}.</p>}
          <fieldset className="mt-5 min-w-0 space-y-2"><legend className="mb-3 w-full text-center text-sm font-bold">Carteira e rede</legend><div className="max-w-full overflow-x-auto whitespace-nowrap rounded-sm border border-primary/20 bg-primary/5 px-3 py-2 text-[10px] text-primary">METAMASK · WALLETCONNECT · COINBASE</div>
            <p className="text-[10px] text-text-secondary">{profile.network ? `Rede selecionada: ${networkNames[profile.network]}` : 'Selecione a rede no formulário.'} A compatibilidade da carteira não é verificada externamente; nenhuma carteira será conectada.</p>
            {(Object.keys(walletNames) as WalletType[]).map((wallet) => <label key={wallet} className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 text-xs focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${profile.walletType === wallet ? 'border-primary' : 'border-primary/20'}`}><input type="radio" name="wallet-choice" value={wallet} checked={profile.walletType === wallet} onChange={() => update('walletType', wallet)} className="accent-primary" />{walletNames[wallet]}</label>)}
          </fieldset>
          {message && <p role="alert" className="mt-4 text-xs text-destructive">{message}</p>}
          {attempt ? <Button type="button" disabled={processing} onClick={() => void recoverOrder()} className="mt-5 h-10 w-full font-bold">{processing ? 'Recuperando pedido...' : 'Recuperar pedido'}</Button> : <Button type="submit" disabled={!validItems || !selectedWalletId || processing} className="mt-5 h-10 w-full font-bold">{processing ? 'Processando simulação...' : activeQuote ? 'Confirmar compra' : 'Revisar compra'}</Button>}
        </aside>
      </form>}
    </div>
    <Footer />
    <MobileBottomNav />
  </main>
}
