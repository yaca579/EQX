import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEMO_TRACK_SPECS, demoDurationSeconds } from './demoTracks.js'

/**
 * Generador del catálogo demo.
 *
 * Sintetiza cuatro pistas originales para que la app sea completamente
 * funcional sin claves de Jamendo. Los WAV se generan la primera vez que
 * arranca el servidor (o con `npm run demo:audio`).
 */

const SR = 32000
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DEMO_DIR = path.resolve(__dirname, '../public/demo')

const midi = (note) => 440 * Math.pow(2, (note - 69) / 12)

function createBuffer(seconds) {
  return new Float32Array(Math.ceil(seconds * SR))
}

function addTone(out, options) {
  const {
    start = 0,
    dur = 0.4,
    freq = 440,
    amp = 0.15,
    harmonics = [1, 2, 3],
    weights = null,
    attack = 0.01,
    decay = 0.1,
    sustain = 0.6,
    release = 0.2,
    detune = 0,
    vibratoRate = 0,
    vibratoDepth = 0,
    unison = 0,
  } = options

  const gate = Math.max(0.01, dur)
  const total = gate + release + 0.02
  const startIndex = Math.max(0, Math.floor(start * SR))
  const totalSamples = Math.floor(total * SR)
  const baseFreq = freq * (1 + detune)

  const layers = unison > 0 ? [0, unison, -unison] : [0]

  for (const offset of layers) {
    let phase = 0
    const layerAmp = amp / layers.length
    for (let i = 0; i < totalSamples; i += 1) {
      const index = startIndex + i
      if (index >= out.length) break
      const t = i / SR

      let envelope
      if (t < attack) envelope = t / attack
      else if (t < attack + decay) envelope = 1 - (1 - sustain) * ((t - attack) / Math.max(0.0001, decay))
      else if (t < gate) envelope = sustain
      else envelope = sustain * Math.max(0, 1 - (t - gate) / release)

      if (envelope <= 0) continue

      const modulation = vibratoDepth ? 1 + vibratoDepth * Math.sin(2 * Math.PI * vibratoRate * t) : 1
      phase += (2 * Math.PI * baseFreq * offset * 0 + 2 * Math.PI * baseFreq * modulation) / SR

      let sample = 0
      for (let h = 0; h < harmonics.length; h += 1) {
        const harmonic = harmonics[h]
        const weight = weights?.[h] ?? 1 / harmonic
        sample += Math.sin(phase * harmonic) * weight
      }

      out[index] += sample * envelope * layerAmp
    }
  }
}

function addKick(out, start, amp = 0.8) {
  const duration = 0.42
  const samples = Math.floor(duration * SR)
  const startIndex = Math.floor(start * SR)
  let phase = 0
  for (let i = 0; i < samples; i += 1) {
    const index = startIndex + i
    if (index >= out.length) break
    const t = i / SR
    const frequency = 48 + 92 * Math.exp(-t / 0.032)
    phase += (2 * Math.PI * frequency) / SR
    const envelope = Math.exp(-t * 7.2) * (1 - Math.exp(-t * 900))
    out[index] += Math.sin(phase) * envelope * amp
  }
}

function addSnare(out, start, amp = 0.3, tone = 190) {
  const duration = 0.26
  const samples = Math.floor(duration * SR)
  const startIndex = Math.floor(start * SR)
  let noiseLow = 0
  let phase = 0
  for (let i = 0; i < samples; i += 1) {
    const index = startIndex + i
    if (index >= out.length) break
    const t = i / SR
    const noise = Math.random() * 2 - 1
    noiseLow += 0.55 * (noise - noiseLow)
    const body = Math.sin(phase) * 0.45
    phase += (2 * Math.PI * tone) / SR
    const envelope = Math.exp(-t * 18)
    out[index] += (noiseLow * 0.9 + body) * envelope * amp
  }
}

function addHat(out, start, amp = 0.09, open = false) {
  const duration = open ? 0.22 : 0.055
  const samples = Math.floor(duration * SR)
  const startIndex = Math.floor(start * SR)
  let low = 0
  for (let i = 0; i < samples; i += 1) {
    const index = startIndex + i
    if (index >= out.length) break
    const t = i / SR
    const noise = Math.random() * 2 - 1
    low += 0.15 * (noise - low)
    const high = noise - low
    const envelope = Math.exp(-t * (open ? 16 : 62))
    out[index] += high * envelope * amp
  }
}

function addCrackle(out, amp = 0.02) {
  let low = 0
  for (let i = 0; i < out.length; i += 1) {
    const noise = Math.random() * 2 - 1
    low += 0.02 * (noise - low)
    const crackle = Math.random() < 0.00035 ? (Math.random() * 2 - 1) * 0.7 : 0
    out[i] += low * amp * 8 + crackle * amp
  }
}

function addNoiseSweep(out, start, duration = 2.4, amp = 0.11) {
  const samples = Math.floor(duration * SR)
  const startIndex = Math.floor(start * SR)
  let low = 0
  for (let i = 0; i < samples; i += 1) {
    const index = startIndex + i
    if (index >= out.length) break
    const t = i / SR
    const noise = Math.random() * 2 - 1
    low += (0.02 + (t / duration) * 0.5) * (noise - low)
    const envelope = Math.sin((t / duration) * Math.PI) ** 2
    out[index] += (noise - low) * envelope * amp
  }
}

function applyDelay(out, delaySeconds, feedback = 0.3, mix = 0.25) {
  const delay = Math.floor(delaySeconds * SR)
  if (delay <= 0) return
  const echo = new Float32Array(out.length)
  for (let i = delay; i < out.length; i += 1) {
    echo[i] = out[i - delay] + echo[i - delay] * feedback
    out[i] += echo[i] * mix
  }
}

function applyLowpass(out, cutoff = 9000) {
  const alpha = 1 - Math.exp((-2 * Math.PI * cutoff) / SR)
  let last = 0
  for (let i = 0; i < out.length; i += 1) {
    last += alpha * (out[i] - last)
    out[i] = last
  }
}

function applyDelayPump(out, bpm) {
  const beat = 60 / bpm
  const samples = Math.floor(beat * SR)
  for (let start = 0; start < out.length; start += samples) {
    for (let i = 0; i < samples; i += 1) {
      const index = start + i
      if (index >= out.length) break
      const t = i / SR
      const duck = 0.45 + 0.55 * Math.min(1, t / 0.16)
      out[index] *= duck
    }
  }
}

function master(out, { peak = 0.9, fade = 0.04 } = {}) {
  let max = 0
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Math.tanh(out[i] * 1.05)
    max = Math.max(max, Math.abs(out[i]))
  }
  const gain = max > 0 ? peak / max : 1

  const fadeSamples = Math.floor(fade * SR)
  for (let i = 0; i < out.length; i += 1) {
    let value = out[i] * gain
    if (i < fadeSamples) value *= i / fadeSamples
    if (i > out.length - fadeSamples) value *= (out.length - i) / fadeSamples
    out[i] = Math.max(-1, Math.min(1, value))
  }
  return out
}

function renderNeonDrift(seconds) {
  const spec = DEMO_TRACK_SPECS.find((item) => item.id === 'demo-neon-drift')
  const bar = (4 * 60) / spec.bpm
  const out = createBuffer(seconds + 1.5)
  const arp = createBuffer(seconds + 1.5)

  const chords = [
    [57, 60, 64],
    [53, 57, 60],
    [48, 52, 55],
    [55, 59, 62],
  ]
  const roots = [45, 41, 36, 43]

  for (let b = 0; b < spec.bars; b += 1) {
    const chord = chords[b % 4]
    const root = roots[b % 4]
    const barStart = b * bar

    chord.forEach((note) => {
      addTone(out, {
        start: barStart,
        dur: bar * 0.98,
        freq: midi(note),
        amp: 0.052,
        harmonics: [1, 2, 3],
        attack: 0.22,
        decay: 0.5,
        sustain: 0.6,
        release: 0.4,
        unison: 0.0025,
        vibratoRate: 0.22,
        vibratoDepth: 0.0015,
      })
    })

    for (let eighth = 0; eighth < 8; eighth += 1) {
      addTone(out, {
        start: barStart + eighth * (bar / 8),
        dur: (bar / 8) * 0.72,
        freq: midi(root - 12),
        amp: 0.19,
        harmonics: [1, 2, 3],
        attack: 0.004,
        decay: 0.08,
        sustain: 0.45,
        release: 0.07,
      })
    }

    for (let step = 0; step < 16; step += 1) {
      const index = step % 4
      const lift = step >= 8 ? 12 : 0
      addTone(arp, {
        start: barStart + step * (bar / 16),
        dur: (bar / 16) * 0.85,
        freq: midi(chord[index] + 24 + lift),
        amp: 0.055,
        harmonics: [1, 2, 3, 4],
        attack: 0.002,
        decay: 0.05,
        sustain: 0.12,
        release: 0.07,
      })
    }

    addKick(out, barStart, 0.82)
    addKick(out, barStart + bar * 0.52, 0.52)
    addSnare(out, barStart + bar * 0.25, 0.26)
    addSnare(out, barStart + bar * 0.75, 0.3)

    for (let eighth = 0; eighth < 8; eighth += 1) {
      addHat(out, barStart + eighth * (bar / 8) + bar / 16, eighth % 2 === 0 ? 0.05 : 0.035)
    }

    if (b % 8 === 0) {
      addHat(out, barStart, 0.14, true)
      addNoiseSweep(out, barStart + bar * 0.5, bar * 1.4, 0.035)
    }
  }

  applyDelay(arp, (bar / 8) * 1.5, 0.34, 0.32)
  for (let i = 0; i < out.length; i += 1) out[i] += arp[i]

  return master(out)
}

function renderMidnightTape(seconds) {
  const spec = DEMO_TRACK_SPECS.find((item) => item.id === 'demo-midnight-tape')
  const bar = (4 * 60) / spec.bpm
  const out = createBuffer(seconds + 1.2)
  const lead = createBuffer(seconds + 1.2)

  const chords = [
    [53, 57, 60, 64],
    [52, 55, 59, 62],
    [50, 53, 57, 60],
    [48, 52, 55, 59],
  ]
  const roots = [41, 40, 38, 36]
  const melody = [69, 72, 76, 74, 72, 67, 69, 64]

  for (let b = 0; b < spec.bars; b += 1) {
    const chord = chords[b % 4]
    const root = roots[b % 4]
    const barStart = b * bar

    chord.forEach((note) => {
      addTone(out, {
        start: barStart,
        dur: bar * 0.95,
        freq: midi(note),
        amp: 0.05,
        harmonics: [1, 2, 3, 5],
        attack: 0.12,
        decay: 0.6,
        sustain: 0.5,
        release: 0.5,
        detune: 0.001,
        vibratoRate: 3.1,
        vibratoDepth: 0.0012,
      })
    })

    addTone(out, {
      start: barStart,
      dur: bar * 0.9,
      freq: midi(root - 12),
      amp: 0.16,
      harmonics: [1, 2],
      attack: 0.02,
      decay: 0.25,
      sustain: 0.55,
      release: 0.2,
    })

    addKick(out, barStart, 0.6)
    addKick(out, barStart + bar * 0.62, 0.4)
    addSnare(out, barStart + bar * 0.25, 0.14, 420)
    addSnare(out, barStart + bar * 0.75, 0.16, 380)

    for (let eighth = 0; eighth < 4; eighth += 1) {
      addHat(out, barStart + eighth * (bar / 4) + bar / 8, 0.022)
    }

    if (b % 2 === 1) {
      const note = melody[b % melody.length]
      addTone(lead, {
        start: barStart + bar * 0.5,
        dur: bar * 0.35,
        freq: midi(note),
        amp: 0.075,
        harmonics: [1, 2, 3],
        attack: 0.03,
        decay: 0.2,
        sustain: 0.35,
        release: 0.35,
        vibratoRate: 4.4,
        vibratoDepth: 0.003,
      })
    }
  }

  applyDelay(lead, (bar / 4) * 0.75, 0.32, 0.3)
  for (let i = 0; i < out.length; i += 1) out[i] += lead[i]

  addCrackle(out, 0.012)
  applyLowpass(out, 8200)
  return master(out, { peak: 0.82 })
}

function renderSubPressure(seconds) {
  const spec = DEMO_TRACK_SPECS.find((item) => item.id === 'demo-sub-pressure')
  const bar = (4 * 60) / spec.bpm
  const out = createBuffer(seconds + 1)

  const bassline = [28, 28, 31, 26]
  const lead = createBuffer(seconds + 1)

  for (let b = 0; b < spec.bars; b += 1) {
    const barStart = b * bar
    const root = bassline[b % 4]

    for (let beat = 0; beat < 4; beat += 1) {
      addKick(out, barStart + beat * (bar / 4), 0.92)
    }

    for (let step = 0; step < 16; step += 1) {
      const accent = step % 4 === 0 ? 1 : 0.72
      addTone(out, {
        start: barStart + step * (bar / 16),
        dur: (bar / 16) * 0.7,
        freq: midi(root + (step === 14 ? 3 : 0)),
        amp: 0.24 * accent,
        harmonics: [1, 2],
        attack: 0.004,
        decay: 0.09,
        sustain: 0.5,
        release: 0.05,
      })
    }

    for (let eighth = 0; eighth < 8; eighth += 1) {
      addHat(out, barStart + eighth * (bar / 8) + bar / 16, eighth % 2 ? 0.045 : 0.06)
    }

    addSnare(out, barStart + bar * 0.25, 0.2)
    addSnare(out, barStart + bar * 0.75, 0.22)

    if (b % 4 === 3) {
      addTone(lead, {
        start: barStart,
        dur: bar * 0.9,
        freq: midi(root + 24),
        amp: 0.05,
        harmonics: [1, 2, 3, 4],
        attack: 0.4,
        decay: 0.5,
        sustain: 0.4,
        release: 0.5,
      })
      addNoiseSweep(out, barStart, bar, 0.05)
    }
  }

  applyDelay(lead, bar / 8, 0.4, 0.28)
  for (let i = 0; i < out.length; i += 1) out[i] += lead[i]
  applyDelayPump(out, spec.bpm)
  return master(out, { peak: 0.92 })
}

function renderVocalAura(seconds) {
  const spec = DEMO_TRACK_SPECS.find((item) => item.id === 'demo-vocal-aura')
  const bar = (4 * 60) / spec.bpm
  const out = createBuffer(seconds + 2)
  const voice = createBuffer(seconds + 2)

  const chords = [
    [57, 60, 64, 67],
    [53, 57, 60, 64],
    [55, 59, 62, 67],
    [57, 60, 64, 69],
  ]
  const melody = [76, 74, 72, 69, 72, 74, 76, 79, 76, 72, 69, 67]

  for (let b = 0; b < spec.bars; b += 1) {
    const chord = chords[b % 4]
    const barStart = b * bar

    chord.forEach((note, index) => {
      addTone(out, {
        start: barStart,
        dur: bar * 0.98,
        freq: midi(note),
        amp: 0.045,
        harmonics: [1, 2, 3],
        attack: 0.4 + index * 0.06,
        decay: 0.7,
        sustain: 0.55,
        release: 0.8,
        detune: 0.002,
        vibratoRate: 0.18,
        vibratoDepth: 0.002,
        unison: 0.003,
      })
    })

    const note = melody[b % melody.length]
    addTone(voice, {
      start: barStart + bar * 0.15,
      dur: bar * 0.55,
      freq: midi(note),
      amp: 0.115,
      harmonics: [1, 2, 3, 4, 5, 6],
      weights: [0.65, 0.32, 0.5, 0.16, 0.11, 0.06],
      attack: 0.14,
      decay: 0.3,
      sustain: 0.55,
      release: 0.5,
      vibratoRate: 5.1,
      vibratoDepth: 0.0045,
    })
  }

  applyDelay(voice, bar / 2, 0.36, 0.4)
  for (let i = 0; i < out.length; i += 1) out[i] += voice[i]

  // pulso suave de sub para dar cuerpo
  for (let b = 0; b < spec.bars; b += 1) {
    addTone(out, {
      start: b * bar,
      dur: bar * 0.5,
      freq: midi(45),
      amp: 0.07,
      harmonics: [1, 2],
      attack: 0.3,
      decay: 0.4,
      sustain: 0.4,
      release: 0.6,
    })
  }

  applyLowpass(out, 10500)
  return master(out, { peak: 0.85, fade: 0.12 })
}

function writeWav(filePath, samples) {
  const dataLength = samples.length * 2
  const buffer = Buffer.alloc(44 + dataLength)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataLength, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(SR, 24)
  buffer.writeUInt32LE(SR * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataLength, 40)

  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(value * 32767), 44 + i * 2)
  }

  writeFileSync(filePath, buffer)
}

const RENDERERS = {
  'demo-neon-drift': renderNeonDrift,
  'demo-midnight-tape': renderMidnightTape,
  'demo-sub-pressure': renderSubPressure,
  'demo-vocal-aura': renderVocalAura,
}

export function ensureDemoAudio({ force = false } = {}) {
  mkdirSync(DEMO_DIR, { recursive: true })
  const generated = []

  for (const spec of DEMO_TRACK_SPECS) {
    const target = path.join(DEMO_DIR, spec.file)
    if (!force && existsSync(target)) continue
    const render = RENDERERS[spec.id]
    if (!render) continue
    const seconds = demoDurationSeconds(spec)
    const started = Date.now()
    const samples = render(seconds)
    writeWav(target, samples)
    generated.push({ file: spec.file, seconds, ms: Date.now() - started })
  }

  return generated
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const generated = ensureDemoAudio({ force: true })
  for (const item of generated) {
    console.log(`✓ ${item.file} — ${item.seconds}s generados en ${item.ms}ms`)
  }
  console.log(`Catálogo demo listo en ${DEMO_DIR}`)
}
