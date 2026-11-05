import { sanitizeState, type StudioState } from './studio'

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Serializa un estado del estudio a un fragmento de URL autocontenido. */
export function encodePreset(state: StudioState): string {
  const payload = JSON.stringify({ v: 1, s: state })
  return toBase64Url(new TextEncoder().encode(payload))
}

export function decodePreset(raw: string): StudioState | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(raw))
    const parsed = JSON.parse(json) as { v?: number; s?: unknown }
    if (!parsed || typeof parsed !== 'object') return null
    return sanitizeState(parsed.s)
  } catch {
    return null
  }
}

export function buildShareUrl(state: StudioState): string {
  return `${window.location.origin}/studio?preset=${encodePreset(state)}`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}
