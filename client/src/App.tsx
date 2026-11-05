import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LibraryProvider } from './context/LibraryContext'
import { LocalTracksProvider } from './context/LocalTracksContext'
import { PlayerProvider } from './context/PlayerContext'
import { PresetsProvider } from './context/PresetsContext'
import { StudioProvider } from './context/StudioContext'
import { ToastProvider } from './context/ToastContext'
import { DashboardPage } from './pages/DashboardPage'
import { ExplorePage } from './pages/ExplorePage'
import { FavoritesPage } from './pages/FavoritesPage'
import { LoginPage } from './pages/LoginPage'
import { PresetsPage } from './pages/PresetsPage'
import { StudioPage } from './pages/StudioPage'

function Splash() {
  return (
    <div className="relative z-[2] flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-brand/20" />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8A3D] to-[#E85700] shadow-[0_10px_30px_-12px_rgba(255,106,0,1)]">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden>
            <g fill="#160C05">
              <rect x="2" y="9" width="2.8" height="6" rx="1.4" />
              <rect x="7" y="5" width="2.8" height="14" rx="1.4" />
              <rect x="12" y="2.5" width="2.8" height="19" rx="1.4" />
              <rect x="17.2" y="8" width="2.8" height="8" rx="1.4" />
            </g>
          </svg>
        </span>
      </div>
      <p className="num text-[9.5px] uppercase tracking-[0.4em] text-neutral-500">Cargando estudio</p>
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PlayerProvider>
          <LocalTracksProvider>
            <StudioProvider>
            <LibraryProvider>
              <PresetsProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      element={
                        <RequireAuth>
                          <AppShell />
                        </RequireAuth>
                      }
                    >
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/explore" element={<ExplorePage />} />
                      <Route path="/studio" element={<StudioPage />} />
                      <Route path="/favorites" element={<FavoritesPage />} />
                      <Route path="/presets" element={<PresetsPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </PresetsProvider>
            </LibraryProvider>            </StudioProvider>
          </LocalTracksProvider>
        </PlayerProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
