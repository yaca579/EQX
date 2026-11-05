import { ArrowRight, AudioLines, Headphones, Loader2, Lock, Mail, Sparkles, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usingFirebase } from '../lib/firebase'

const FEATURES = [
  'Sube tus propios MP3 o WAV y edítalos al instante',
  'Ecualizador gráfico de 10 bandas editable',
  'Bass Boost, Slow + Reverb, 8D y más en tiempo real',
  'Presets propios y enlaces compartibles',
]

const BAR_COUNT = 34

export function LoginPage() {
  const { user, loading, signIn, signUp, signInWithGoogle, error, clearError, mode } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      if (tab === 'signin') await signIn(email, password)
      else await signUp(name, email, password)
      navigate('/')
    } catch {
      // El mensaje se muestra desde el contexto de autenticación.
    } finally {
      setBusy(false)
    }
  }

  const switchTab = (next: 'signin' | 'signup') => {
    setTab(next)
    clearError()
  }

  const guestAccess = async () => {
    if (busy) return
    setBusy(true)
    try {
      await signIn('demo@audiomods.app', 'demo1234')
    } catch {
      try {
        await signUp('Invitado', 'demo@audiomods.app', 'demo1234')
        navigate('/')
      } catch {
        /* el error ya se muestra */
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative z-[2] grid min-h-dvh lg:grid-cols-[1.02fr_0.98fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] px-10 py-9 lg:flex xl:px-14">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-[0.55]" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full bg-brand/[0.14] blur-[120px]" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8A3D] to-[#E85700] shadow-[0_10px_30px_-14px_rgba(255,106,0,1)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <g fill="#160C05">
                <rect x="2" y="9" width="2.8" height="6" rx="1.4" />
                <rect x="7" y="5" width="2.8" height="14" rx="1.4" />
                <rect x="12" y="2.5" width="2.8" height="19" rx="1.4" />
                <rect x="17.2" y="8" width="2.8" height="8" rx="1.4" />
              </g>
            </svg>
          </span>
          <div className="leading-none">
            <p className="text-[17px] font-bold tracking-[0.26em] text-white">
              EQ<span className="text-brand">X</span>
            </p>
            <p className="mt-1 text-[8.5px] font-semibold tracking-[0.4em] text-neutral-500">
              ESTUDIO DE AUDIO
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="label-xs text-brand">Estudio de audio en tiempo real</p>
          <h1 className="mt-4 text-balance text-[42px] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
            Cada canción,
            <br />
            <span className="bg-gradient-to-r from-[#FF8A3D] to-[#FF6A00] bg-clip-text text-transparent">
              tu versión.
            </span>
          </h1>
          <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-neutral-400">
            Ecualiza como en un plugin de estudio, activa Bass Boost, Slow + Reverb u 8D Audio y
            escucha el resultado al instante. Sin exportar, sin esperar.
          </p>

          <ul className="mt-6 space-y-2.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[12.5px] text-neutral-300">
                <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-brand">
                  <Sparkles size={9} />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex h-24 items-end gap-[3px] rounded-xl border border-white/[0.06] bg-black/30 p-3">
            {Array.from({ length: BAR_COUNT }).map((_, index) => {
              const height = 20 + Math.abs(Math.sin(index * 0.72)) * 62 + (index % 4) * 4
              return (
                <span
                  key={index}
                  className="flex-1 origin-bottom rounded-sm bg-gradient-to-t from-brand/25 via-brand/80 to-[#FFC08A]"
                  style={{
                    height: `${Math.min(96, height)}%`,
                    animation: `eq-idle ${1.1 + (index % 6) * 0.12}s ease-in-out ${index * 0.03}s infinite`,
                    opacity: 0.35 + (index % 5) * 0.12,
                  }}
                />
              )
            })}
          </div>
        </div>

        <div className="relative flex items-center justify-between text-[10.5px] text-neutral-600">
          <span className="flex items-center gap-1.5">
            <AudioLines size={12} /> Web Audio API · FFT 4096
          </span>
          <span>© {new Date().getFullYear()} EQX</span>
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[390px] animate-[rise_0.5s_ease-out]">
          <div className="mb-7 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF8A3D] to-[#E85700]">
              <AudioLines size={17} className="text-[#160C05]" />
            </span>
            <div className="leading-none">
              <p className="text-[14px] font-bold tracking-[0.24em] text-white">
                EQ<span className="text-brand">X</span>
              </p>
              <p className="mt-1 text-[7.5px] font-semibold tracking-[0.36em] text-neutral-500">
                STUDIO
              </p>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex rounded-xl border border-white/8 bg-black/30 p-1">
              {(['signin', 'signup'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => switchTab(key)}
                  className={`flex-1 rounded-lg py-1.5 text-[12px] font-medium transition ${
                    tab === key ? 'bg-white/[0.08] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {key === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              ))}
            </div>

            <h2 className="mt-5 text-[19px] font-semibold tracking-tight text-white">
              {tab === 'signin' ? 'Bienvenido de vuelta' : 'Abre tu estudio'}
            </h2>
            <p className="mt-1 text-[12px] text-neutral-500">
              {tab === 'signin'
                ? 'Tus presets y favoritos te esperan.'
                : 'Crea una cuenta para guardar tus cadenas de audio.'}
            </p>

            <form onSubmit={submit} className="mt-5 space-y-3">
              {tab === 'signup' && (
                <div>
                  <label className="label-xs mb-1.5 block" htmlFor="name">
                    Nombre de artista
                  </label>
                  <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                    <input
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Tu nombre"
                      autoComplete="name"
                      className="input pl-9"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label-xs mb-1.5 block" htmlFor="email">
                  Correo
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-xs mb-1.5 block" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                    className="input pl-9"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11.5px] leading-relaxed text-red-300">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn btn-primary w-full">
                {busy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Conectando…
                  </>
                ) : (
                  <>
                    {tab === 'signin' ? 'Entrar al estudio' : 'Crear mi cuenta'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {usingFirebase && (
              <>
                <div className="my-4 flex items-center gap-3">
                  <div className="hairline flex-1" />
                  <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-600">o</span>
                  <div className="hairline flex-1" />
                </div>
                <button
                  type="button"
                  onClick={() => void signInWithGoogle().catch(() => undefined)}
                  className="btn btn-ghost w-full"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.2-5.5 4.2-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.8 14.6 3 12 3 6.9 3 2.8 7.1 2.8 12S6.9 21 12 21c5.2 0 8.7-3.7 8.7-8.9 0-.6-.06-1-.15-1.9H12z" />
                  </svg>
                  Continuar con Google
                </button>
              </>
            )}

            {mode === 'local' && (
              <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <p className="text-[10.5px] leading-relaxed text-neutral-500">
                  <span className="font-semibold text-neutral-300">Modo local activo.</span> Sin
                  Firebase configurado, las cuentas y los datos viven en este navegador.
                </p>
                <button onClick={() => void guestAccess()} className="mt-2 text-[11px] font-semibold text-brand hover:text-brand-soft">
                  Entrar con cuenta de invitado →
                </button>
              </div>
            )}
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[10.5px] text-neutral-600">
            <Headphones size={12} /> Usa auriculares para apreciar 8D Audio y el reverb.
          </p>
        </div>
      </main>
    </div>
  )
}
