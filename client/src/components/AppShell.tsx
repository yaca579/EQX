import {
  Compass,
  Heart,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../lib/format'
import { PlayerDock } from './PlayerDock'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/studio', label: 'Studio', icon: SlidersHorizontal },
  { to: '/favorites', label: 'Favoritos', icon: Heart },
  { to: '/presets', label: 'Presets', icon: Layers },
]

function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <span
      className="relative flex items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#FF8A3D] to-[#E85700] shadow-[0_8px_22px_-12px_rgba(255,106,0,0.95)]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" aria-hidden>
        <g fill="#160C05">
          <rect x="2" y="9" width="2.8" height="6" rx="1.4" />
          <rect x="7" y="5" width="2.8" height="14" rx="1.4" />
          <rect x="12" y="2.5" width="2.8" height="19" rx="1.4" />
          <rect x="17.2" y="8" width="2.8" height="8" rx="1.4" />
        </g>
      </svg>
    </span>
  )
}

function UserMenu() {
  const { user, mode, signOutUser } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-2.5 transition hover:border-white/20 hover:bg-white/[0.07]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="num flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#FF8A3D] to-[#B94800] text-[10px] font-bold text-[#160C05]">
          {initials(user.displayName || user.email)}
        </span>
        <span className="hidden max-w-[110px] truncate text-[12px] text-neutral-300 sm:block">
          {user.displayName}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-60 animate-[rise_0.18s_ease-out] overflow-hidden rounded-xl border border-white/10 bg-[#171717] shadow-[0_28px_60px_-24px_rgba(0,0,0,0.95)]"
        >
          <div className="border-b border-white/8 px-3.5 py-3">
            <p className="truncate text-[12.5px] font-semibold text-white">{user.displayName}</p>
            <p className="truncate text-[11px] text-neutral-500">{user.email}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${
                mode === 'firebase'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-brand/30 bg-brand/10 text-brand-soft'
              }`}
            >
              {mode === 'firebase' ? 'Firebase' : 'Modo local'}
            </span>
          </div>
          <div className="p-1">
            <NavLink
              to="/presets"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-neutral-300 transition hover:bg-white/5"
            >
              <Layers size={13} /> Mis presets
            </NavLink>
            <button
              onClick={async () => {
                setOpen(false)
                await signOutUser()
                navigate('/login')
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-neutral-400 transition hover:bg-white/5 hover:text-red-300"
            >
              <LogOut size={13} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const navigate = useNavigate()
  const { user, mode } = useAuth()
  const [search, setSearch] = useState('')

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0d0d0d]/86 backdrop-blur-xl">
      <div className="mx-auto flex h-[58px] max-w-[1900px] items-center gap-3 px-3 sm:px-5">
        <button onClick={onOpenMenu} className="icon-btn lg:hidden" aria-label="Abrir menú">
          <Menu size={18} />
        </button>

        <NavLink to="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-[15px] font-bold tracking-[0.24em] text-white">
              EQ<span className="text-brand">X</span>
            </span>
            <span className="mt-0.5 text-[8px] font-semibold tracking-[0.34em] text-neutral-500">
              STUDIO
            </span>
          </span>
        </NavLink>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                  isActive ? 'bg-white/[0.06] text-white' : 'text-neutral-500 hover:text-neutral-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2.5">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              navigate(`/explore${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`)
            }}
            className="relative hidden w-full max-w-[290px] md:block"
          >
            <Sparkles size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar en Jamendo…"
              className="input h-8 py-1 pl-8 pr-3 text-[12px]"
              aria-label="Buscar canciones"
            />
          </form>

          <span className="hidden rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[9.5px] uppercase tracking-[0.12em] text-neutral-500 xl:block">
            {mode === 'firebase' ? 'Cuenta Firebase' : 'Sesión local'}
          </span>

          {user ? (
            <UserMenu />
          ) : (
            <NavLink to="/login" className="btn btn-primary h-8 px-3 text-[11.5px]">
              Entrar
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}

function NavRail() {
  return (
    <aside className="fixed bottom-[92px] left-0 top-[58px] z-30 hidden w-[74px] flex-col items-center gap-1 border-r border-white/[0.06] bg-[#0c0c0c]/70 py-4 backdrop-blur lg:flex">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group relative flex w-[58px] flex-col items-center gap-1 rounded-xl py-2.5 text-[9px] font-medium transition ${
                isActive ? 'text-brand' : 'text-neutral-600 hover:text-neutral-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-r bg-brand shadow-[0_0_12px_rgba(255,106,0,0.9)]" />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
      <div className="mt-auto rounded-lg border border-white/8 bg-white/[0.02] px-1.5 py-1 text-center">
        <span className="num text-[8px] uppercase tracking-[0.14em] text-neutral-600">v1.0</span>
      </div>
    </aside>
  )
}

function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/[0.08] bg-[#0c0c0c]/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center justify-center gap-1 text-[9px] font-medium transition ${
                  isActive ? 'text-brand' : 'text-neutral-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                  {isActive && <span className="absolute top-0 h-[2px] w-6 rounded-b bg-brand shadow-[0_0_10px_rgba(255,106,0,0.9)]" />}
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 left-0 w-[260px] animate-[rise_0.25s_ease-out] border-r border-white/10 bg-[#111] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandMark size={26} />
            <div className="leading-none">
              <p className="text-[13px] font-bold tracking-[0.22em] text-white">
                EQ<span className="text-brand">X</span>
              </p>
              <p className="mt-1 text-[7.5px] font-semibold tracking-[0.32em] text-neutral-500">
                STUDIO
              </p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Cerrar menú">
            <X size={17} />
          </button>
        </div>

        <p className="mt-5 truncate text-[11px] text-neutral-500">{user?.email}</p>

        <div className="mt-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition ${
                    isActive ? 'bg-brand/12 text-brand-soft' : 'text-neutral-400 hover:bg-white/5'
                  }`
                }
              >
                <Icon size={15} /> {item.label}
              </NavLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="relative z-[2] min-h-dvh">
      <TopBar onOpenMenu={() => setDrawerOpen(true)} />
      <NavRail />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="mx-auto max-w-[1900px] px-3 pb-[190px] pt-4 sm:px-5 lg:pl-[86px] lg:pb-[110px]">
        <Outlet />
      </main>
      <PlayerDock />
      <MobileNav />
    </div>
  )
}
