import { useState, useSyncExternalStore, type ChangeEvent, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Activity, Download, Eye, EyeOff, Heart, ImagePlus, LifeBuoy, LogOut, Tag, UserRound, Wallet } from 'lucide-react'
import { getAuthToken, getCurrentUser, subscribeToAuth } from '@/features/auth/auth-api'
import { changePassword, fetchProfile, fetchWallets, saveWallet, updateProfile, type CollectorProfile, type CollectorWallet, type WalletInput } from '@/features/profile/profile-api'
import { MobileBottomNav } from '@/features/catalog/components/mobile-bottom-nav'

export const Route = createFileRoute('/perfil')({ component: ProfilePage })
type Tab = 'profile' | 'wallets'
type WalletForm = Omit<WalletInput, 'kind'>
const emptyWallet = (): WalletForm => ({ displayName: '', nickname: '', network: 'ethereum', profileName: '', address: '', ensSecondary: '', type: 'metamask', referral: '', email: '', ens: '' })
const fieldClass = 'h-9 w-full min-w-0 rounded-[3px] border border-[#513024] bg-transparent px-3 text-xs text-[#F5F1EB] outline-none transition focus:border-[#D28A4C] focus:ring-1 focus:ring-[#D28A4C] placeholder:text-[#A98B6D]'
const labelClass = 'mb-2 block text-xs text-[#F5F1EB]'
const primaryButton = 'rounded-[3px] bg-[#D28A4C] px-6 py-3 text-xs font-bold text-[#140D0A] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message: unknown = (error.response?.data as { message?: unknown } | undefined)?.message
    if (typeof message === 'string') return message
    if (error.response?.status === 401) return 'Sua sessão expirou. Saia e entre novamente.'
    if (!error.response) return 'Não foi possível conectar à API simulada. Verifique o servidor local e atualize a página.'
    return 'Erro de comunicação com a API simulada.'
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
}
function Field({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return <label className="block min-w-0"><span className={labelClass}>{label}{required && <span className="text-[#D28A4C]">*</span>}</span><input className={fieldClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} /></label>
}
function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false)
  return <label className="block"><span className={labelClass}>{label}</span><span className="relative block"><input className={`${fieldClass} pr-11`} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={label === 'Senha atual' ? 'current-password' : 'new-password'} /><button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(!visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CFB28C]">{visible ? <Eye size={15} /> : <EyeOff size={15} />}</button></span></label>
}
function walletToForm(wallet: CollectorWallet): WalletForm {
  return { displayName: wallet.displayName, nickname: wallet.nickname, network: wallet.network, profileName: wallet.profileName, address: wallet.address, ensSecondary: wallet.ensSecondary, type: wallet.type, referral: wallet.referral, email: wallet.email, ens: wallet.ens }
}
function ProfilePage() {
  const queryClient = useQueryClient()
  const token = useSyncExternalStore(subscribeToAuth, getAuthToken, () => null)
  const [tab, setTab] = useState<Tab>('profile')
  const [notice, setNotice] = useState('')
  const [profile, setProfile] = useState<CollectorProfile | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [primary, setPrimary] = useState<WalletForm>(emptyWallet)
  const [secondary, setSecondary] = useState<WalletForm>(emptyWallet)
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const [profileSource, setProfileSource] = useState<CollectorProfile>()
  const [walletSource, setWalletSource] = useState<CollectorWallet[]>()
  const [walletDefaultsToken, setWalletDefaultsToken] = useState<string | null>(null)

  const profileQuery = useQuery({ queryKey: ['profile', token], queryFn: fetchProfile, enabled: !!token, retry: false })
  const walletQuery = useQuery({ queryKey: ['wallets', token], queryFn: fetchWallets, enabled: !!token, retry: false })
  const sessionQuery = useQuery({ queryKey: ['auth', 'me', token], queryFn: () => getCurrentUser(token!), enabled: !!token, retry: false })
  if (profileQuery.data && profileQuery.data !== profileSource) {
    setProfileSource(profileQuery.data)
    setProfile(profileQuery.data)
  }
  if (walletQuery.data && walletQuery.data !== walletSource) {
    setWalletSource(walletQuery.data)
    const foundPrimary = walletQuery.data.find((w) => w.kind === 'primary')
    const foundSecondary = walletQuery.data.find((w) => w.kind === 'secondary')
    setPrimary(foundPrimary ? walletToForm(foundPrimary) : emptyWallet())
    setSecondary(foundSecondary ? walletToForm(foundSecondary) : emptyWallet())
    setSecondaryOpen(!!foundSecondary)
  }
  if (token && profileQuery.data && walletQuery.data && walletDefaultsToken !== token) {
    setWalletDefaultsToken(token)
    if (!walletQuery.data.some((w) => w.kind === 'primary')) {
      setPrimary((prev) => ({ ...prev, email: prev.email || profileQuery.data!.email, profileName: prev.profileName || profileQuery.data!.username }))
    }
  }

  const updateMutation = useMutation({ mutationFn: updateProfile, onSuccess: async (data) => {
    setProfile(data)
    queryClient.setQueryData(['profile', token], data)
    if (token) queryClient.setQueryData(['auth', 'me', token], (old: unknown) => old && typeof old === 'object' ? { ...old, username: data.username, email: data.email } : old)
    setNotice('Perfil atualizado com sucesso.')
  } })
  const passwordMutation = useMutation({ mutationFn: changePassword, onSuccess: () => {
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setNotice('Senha alterada com sucesso.')
  } })
  const walletMutation = useMutation({ mutationFn: ({ data, id }: { data: WalletInput; id?: string }) => saveWallet(data, id), onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['wallets', token] })
    setNotice('Carteira salva com sucesso.')
  } })

  function changeTab(next: Tab) { setTab(next); setNotice('') }
  function setProfileField<K extends keyof CollectorProfile>(key: K, value: CollectorProfile[K]) { setProfile((old) => old ? { ...old, [key]: value } : old) }
  function setWalletField(which: 'primary' | 'secondary', key: keyof WalletForm, value: string) {
    const setter = which === 'primary' ? setPrimary : setSecondary
    setter((old) => ({ ...old, [key]: value }))
  }
  function changeAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setNotice('Use uma imagem PNG, JPEG ou WebP.'); return }
    if (file.size > 900_000) { setNotice('O avatar deve ter até 900 KB.'); return }
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') { setProfileField('avatar', reader.result); setNotice('Avatar selecionado. Clique em Salvar para confirmar.') } }
    reader.readAsDataURL(file)
  }
  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice('')
    if (!profile) return
    try {
      await updateMutation.mutateAsync({ username: profile.username.trim(), email: profile.email.trim(), displayName: profile.displayName.trim(), ens: profile.ens.trim(), walletNickname: profile.walletNickname.trim(), avatar: profile.avatar })
      if (currentPassword || newPassword || confirmPassword) await submitPassword()
    } catch (error) { setNotice(errorMessage(error)) }
  }
  async function submitPassword() {
    if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
      setNotice('Confira a senha atual, a nova senha (mínimo 8 caracteres) e sua confirmação.')
      return
    }
    try { await passwordMutation.mutateAsync({ currentPassword, newPassword }) }
    catch (error) { setNotice(errorMessage(error)) }
  }
  async function submitWallet(event: FormEvent<HTMLFormElement>, kind: 'primary' | 'secondary', data: WalletForm) {
    event.preventDefault(); setNotice('')
    if (!data.displayName.trim() || !data.nickname.trim() || !data.profileName.trim() || !data.email.trim() || !data.address.trim()) { setNotice('Preencha os campos obrigatórios da carteira.'); return }
    const existing = walletQuery.data?.find((w) => w.kind === kind)
    try { await walletMutation.mutateAsync({ data: { ...data, kind }, id: existing?.id }) }
    catch (error) { setNotice(errorMessage(error)) }
  }
  async function addSecondarySameAsPrimary() {
    const existingPrimary = walletQuery.data?.find((w) => w.kind === 'primary')
    if (!existingPrimary) { setNotice('Salve primeiro a carteira principal.'); return }
    const data = walletToForm(existingPrimary)
    const existingSecondary = walletQuery.data?.find((w) => w.kind === 'secondary')
    try { await walletMutation.mutateAsync({ data: { ...data, kind: 'secondary' }, id: existingSecondary?.id }); setSecondaryOpen(true) }
    catch (error) { setNotice(errorMessage(error)) }
  }

  const otherMenu = [
    { label: 'Atividade', icon: Activity }, { label: 'Lista de interesse', icon: Heart },
    { label: 'Ofertas', icon: Tag }, { label: 'Arquivos baixados', icon: Download },
    { label: 'Suporte', icon: LifeBuoy },
  ]
  return <main className="min-h-screen bg-[#140D0A] pb-20 text-[#F5F1EB]">
    <div className="mx-auto grid max-w-[1200px] gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[246px_minmax(0,1fr)]">
      <aside className="self-start bg-[#241612] py-4 lg:sticky lg:top-4">
        <h2 className="px-4 pb-2 text-sm font-bold">Meu perfil</h2>
        <nav aria-label="Menu do perfil">
          {([{ label: 'Dados do perfil', icon: UserRound, tab: 'profile' }, { label: 'Carteiras', icon: Wallet, tab: 'wallets' }] as const).map(({ label, icon: Icon, tab: menuTab }) => <button key={menuTab} type="button" onClick={() => changeTab(menuTab)} aria-current={tab === menuTab ? 'page' : undefined} className={`flex w-full items-center gap-3 border-l-4 px-3 py-3 text-left text-xs ${tab === menuTab ? 'border-[#D28A4C] bg-[#D28A4C]/10 text-[#D28A4C]' : 'border-transparent text-[#D28A4C] hover:bg-white/5'}`}><Icon size={15} />{label}</button>)}
          {otherMenu.map(({ label, icon: Icon }) => <div key={label} aria-disabled="true" title="Fora do escopo do desafio" className="flex items-center gap-3 border-l-4 border-transparent px-4 py-3 text-xs text-[#D28A4C]/50"><Icon size={15} />{label}</div>)}
        </nav>
        <div className="mt-1 border-t border-[#513024] px-4 py-3 text-xs text-[#D28A4C]" title="Use o botão de sair no Header"><LogOut size={15} className="mr-3 inline" />Sair pelo Header</div>
      </aside>
      <div className="min-w-0">
        {!token ? <section className="py-8"><h1 className="text-xl font-bold">Acesso restrito</h1><p className="mt-3 text-sm text-[#CFB28C]">Entre na sua conta pelo Header para acessar seu perfil.</p></section>
          : sessionQuery.isPending || profileQuery.isPending ? <p role="status" className="py-8 text-sm">Carregando seus dados...</p>
          : sessionQuery.isError || profileQuery.isError || !profile ? <div role="alert" className="py-8 text-sm text-red-400">Não foi possível carregar o perfil. Confirme sua sessão e tente novamente.</div>
          : tab === 'profile' ? <section>
            <h1 className="mb-7 text-sm font-bold">Perfil do colecionador</h1>
            <form onSubmit={(event) => void submitProfile(event)}>
              <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
                <Field label="Nome de exibição" required value={profile.displayName} onChange={(v) => setProfileField('displayName', v)} />
                <Field label="Nome de usuário" required value={profile.username} onChange={(v) => setProfileField('username', v)} />
                <Field label="E-mail" type="email" required value={profile.email} onChange={(v) => setProfileField('email', v)} />
                <Field label="Nome ENS" value={profile.ens} placeholder="seunome.eth" onChange={(v) => setProfileField('ens', v)} />
                <Field label="Apelido da carteira" value={profile.walletNickname} onChange={(v) => setProfileField('walletNickname', v)} />
                <div><span className={labelClass}>Avatar</span><div className="flex flex-wrap items-center gap-3"><div className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-[#3B241B] text-[#D28A4C]">{profile.avatar ? <img src={profile.avatar} alt="Prévia do avatar" className="size-full object-cover" /> : <ImagePlus size={19} />}</div><label className="cursor-pointer rounded-[3px] bg-[#D28A4C] px-4 py-2 text-xs font-bold text-[#140D0A]">Alterar<input type="file" accept="image/png,image/jpeg,image/webp" onChange={changeAvatar} className="sr-only" /></label><button type="button" className="text-xs hover:text-[#D28A4C]" onClick={() => setProfileField('avatar', '')}>Remover</button></div></div>
              </div>
              <div className="mt-8 w-full md:w-[calc(50%-12px)]"><h2 className="mb-4 text-sm font-bold">Alterar senha</h2><div className="space-y-5"><PasswordField label="Senha atual" value={currentPassword} onChange={setCurrentPassword} /><PasswordField label="Nova senha" value={newPassword} onChange={setNewPassword} /><PasswordField label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} /></div></div>
              {notice && <p role="status" aria-live="polite" className="mt-5 text-xs text-[#CFB28C]">{notice}</p>}
              <button type="submit" disabled={updateMutation.isPending || passwordMutation.isPending} className={`mt-6 ${primaryButton}`}>{updateMutation.isPending || passwordMutation.isPending ? 'Salvando...' : 'Salvar'}</button>
            </form>
          </section> : <section>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-sm font-bold">Carteira principal</h1><p className="mt-1 text-[11px] text-[#CFB28C]">Estas carteiras podem ser selecionadas no pagamento simulado. Nenhum NFT é transferido.</p></div><span className="text-xs text-[#D28A4C]">{walletQuery.data?.some((w) => w.kind === 'primary') ? 'Cadastrada' : 'Adicionar'}</span></div>
            {walletQuery.isPending ? <p role="status" className="text-xs">Carregando carteiras...</p> : walletQuery.isError ? <p role="alert" className="text-xs text-red-400">Erro ao carregar carteiras.</p> : <>
              <form onSubmit={(event) => void submitWallet(event, 'primary', primary)}><WalletFields value={primary} onChange={(key, value) => setWalletField('primary', key, value)} /><button disabled={walletMutation.isPending} className={`mt-6 ${primaryButton}`} type="submit">{walletMutation.isPending ? 'Salvando...' : 'Salvar carteira'}</button></form>
              <div className="mt-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-sm font-bold">Carteira secundária</h2><p className="mt-1 text-[11px] text-[#CFB28C]">{walletQuery.data?.some((w) => w.kind === 'secondary') ? 'Carteira secundária cadastrada.' : 'Você ainda não adicionou uma carteira secundária.'}</p></div><div className="flex flex-wrap items-center gap-3"><label className="flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" className="size-3.5 accent-[#D28A4C]" checked={sameAsPrimary} onChange={(event) => { setSameAsPrimary(event.target.checked); if (event.target.checked) setSecondaryOpen(false) }} />Igual à carteira principal</label><button className="text-xs font-medium text-[#D28A4C] hover:brightness-125" type="button" onClick={() => { setNotice(''); if (sameAsPrimary) void addSecondarySameAsPrimary(); else setSecondaryOpen((value) => !value) }}>{secondaryOpen && !sameAsPrimary ? 'Cancelar' : 'Adicionar'}</button></div></div>
                {secondaryOpen && !sameAsPrimary && <form className="mt-6 rounded-[3px] border border-[#513024] p-5" onSubmit={(event) => void submitWallet(event, 'secondary', secondary)}><WalletFields value={secondary} onChange={(key, value) => setWalletField('secondary', key, value)} /><button disabled={walletMutation.isPending} className={`mt-6 ${primaryButton}`} type="submit">{walletMutation.isPending ? 'Salvando...' : 'Salvar carteira secundária'}</button></form>}
              </div>
              {notice && <p role="status" aria-live="polite" className="mt-5 text-xs text-[#CFB28C]">{notice}</p>}
            </>}
          </section>}
      </div>
    </div>
    <MobileBottomNav />
  </main>
}
function WalletFields({ value, onChange }: { value: WalletForm; onChange: (key: keyof WalletForm, value: string) => void }) {
  return <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
    <Field label="Nome de exibição" required value={value.displayName} onChange={(v) => onChange('displayName', v)} />
    <Field label="Apelido da carteira" required value={value.nickname} onChange={(v) => onChange('nickname', v)} />
    <label><span className={labelClass}>Rede<span className="text-[#D28A4C]">*</span></span><select className={fieldClass} value={value.network} onChange={(e) => onChange('network', e.target.value)}><option className="bg-[#241612]" value="ethereum">Ethereum</option><option className="bg-[#241612]" value="polygon">Polygon</option><option className="bg-[#241612]" value="solana">Solana</option></select></label>
    <Field label="Nome do perfil" required value={value.profileName} onChange={(v) => onChange('profileName', v)} />
    <Field label="Endereço da carteira" required value={value.address} placeholder={value.network === 'solana' ? 'Endereço da carteira Solana' : 'Endereço 0x da carteira'} onChange={(v) => onChange('address', v)} />
    <Field label="ENS ou carteira secundária" value={value.ensSecondary} placeholder="Opcional" onChange={(v) => onChange('ensSecondary', v)} />
    <label><span className={labelClass}>Tipo de carteira<span className="text-[#D28A4C]">*</span></span><select className={fieldClass} value={value.type} onChange={(e) => onChange('type', e.target.value)}><option className="bg-[#241612]" value="metamask">MetaMask</option><option className="bg-[#241612]" value="walletconnect">WalletConnect</option><option className="bg-[#241612]" value="coinbase">Coinbase Wallet</option></select></label>
    <Field label="Código de indicação" value={value.referral} onChange={(v) => onChange('referral', v)} />
    <Field label="E-mail" type="email" required value={value.email} onChange={(v) => onChange('email', v)} />
    <Field label="Nome ENS" value={value.ens} placeholder="seunome.eth" onChange={(v) => onChange('ens', v)} />
  </div>
}
