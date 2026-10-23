import { useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'

type AuthMode = 'login' | 'register'

type AuthModalProps = {
  open: boolean
  onClose: () => void
  initialMode?: AuthMode
  onLogin?: (values: { email: string; password: string }) => Promise<void> | void
  onRegister?: (values: { username: string; email: string; password: string }) => Promise<void> | void
}

const inputStyle =
  'h-10 w-full rounded-[4px] border border-[#D28A4C]/20 bg-transparent px-3 text-xs text-[#F5F1EB] placeholder:text-[#CFB28C]/70 outline-none focus:border-[#D28A4C] focus:ring-1 focus:ring-[#D28A4C]'

export function AuthModal({ open, onClose, initialMode = 'login', onLogin, onRegister }: AuthModalProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return <AuthModalContent key={initialMode} onClose={onClose} initialMode={initialMode} onLogin={onLogin} onRegister={onRegister} />
}

function AuthModalContent({ onClose, initialMode = 'login', onLogin, onRegister }: Omit<AuthModalProps, 'open'>) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Informe um e-mail válido.'); return }
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return }
    if (mode === 'register') {
      if (username.trim().length < 3) { setError('O nome de usuário deve ter pelo menos 3 caracteres.'); return }
      if (password !== confirmPassword) { setError('As senhas não coincidem.'); return }
      if (!onRegister) { setError('Cadastro ainda não disponível.'); return }
    } else if (!onLogin) { setError('Login ainda não disponível.'); return }
    setSubmitting(true)
    try {
      if (mode === 'login') await onLogin?.({ email: email.trim(), password })
      else await onRegister?.({ username: username.trim(), email: email.trim(), password })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir. Tente novamente.')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative w-full max-w-[430px] overflow-y-auto border-b-8 border-[#D28A4C] bg-[#241612] px-8 pb-16 pt-10 text-[#F5F1EB] shadow-2xl max-h-[90dvh] sm:px-14">
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 rounded p-1 text-[#D28A4C] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D28A4C]"><X size={17}/></button>
        <h2 id="auth-title" className="text-center text-base font-bold">
          <button type="button" onClick={() => { setMode('login'); setError('') }} className={mode === 'login' ? 'text-[#D28A4C]' : 'text-[#F5F1EB]'}>Entrar</button>
          <span className="mx-1 text-[#D28A4C]">|</span>
          <button type="button" onClick={() => { setMode('register'); setError('') }} className={mode === 'register' ? 'text-[#D28A4C]' : 'text-[#F5F1EB]'}>Criar conta</button>
        </h2>
        <p className="mb-5 mt-7 text-center text-[11px] leading-relaxed text-[#F5F1EB]">
          {mode === 'login' ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.' : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
        </p>
        <form className="space-y-3" onSubmit={(event) => void submit(event)} noValidate>
          {mode === 'register' && <input className={inputStyle} aria-label="Nome de usuário" placeholder="Nome de usuário" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} maxLength={30} required />}
          <input className={inputStyle} type="email" aria-label="E-mail" placeholder={mode === 'login' ? 'contato@email.com' : 'Digite seu e-mail'} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="relative">
            <input className={`${inputStyle} pr-11`} aria-label="Senha" placeholder="Senha" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CFB28C]">{showPassword ? <Eye size={17}/> : <EyeOff size={17}/>}</button>
          </div>
          {mode === 'register' && <input className={inputStyle} aria-label="Confirmar senha" placeholder="Confirmar senha" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />}
          {mode === 'login' && <p className="text-right text-[11px] text-[#D28A4C]">Recuperação de senha em breve</p>}
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          <button disabled={submitting} type="submit" className="mt-2 h-10 w-full rounded-[4px] bg-[#D28A4C] text-xs font-bold text-[#140D0A] transition hover:brightness-110 disabled:opacity-60">{submitting ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
        </form>
        <div className="my-5 flex items-center gap-3 text-[10px]"><span className="h-px flex-1 bg-[#D28A4C]/30"/>Ou continue com<span className="h-px flex-1 bg-[#D28A4C]/30"/></div>
        
        <div className="space-y-2">
          {/* Google */}
          <button
            type="button"
            disabled
            title="Login com Google indisponível na demonstração"
            className="flex w-full items-center justify-center gap-3 rounded border border-[#D28A4C]/20 px-3 py-2 text-xs opacity-55"
          >
            <img
              src="/images/Google.png"
              alt=""
              aria-hidden="true"
              className="h-5 w-5 object-contain"
            />
            Continuar com Google
          </button>

          {/* Facebook */}
          <button
            type="button"
            disabled
            title="Login com Facebook indisponível na demonstração"
            className="flex w-full items-center justify-center gap-3 rounded border border-[#D28A4C]/20 px-3 py-2 text-xs opacity-55"
          >
            <img
              src="/images/face.png"
              alt=""
              aria-hidden="true"
              className="h-5 w-5 object-contain"
            />
            Continuar com Facebook
          </button>
        </div>

      </section>
    </div>
  )
}
