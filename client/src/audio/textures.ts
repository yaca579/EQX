/** Utilidades de síntesis para reverb, vinilo y saturación. */

export function createImpulseResponse(
  ctx: BaseAudioContext,
  duration = 3.2,
  decay = 2.6,
): AudioBuffer {
  const rate = ctx.sampleRate
  const length = Math.max(1, Math.floor(rate * duration))
  const impulse = ctx.createBuffer(2, length, rate)
  const preDelay = Math.floor(rate * 0.014)

  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel)
    for (let i = preDelay; i < length; i += 1) {
      const t = (i - preDelay) / (length - preDelay)
      const envelope = Math.pow(1 - t, decay)
      // las primeras reflexiones suenan más abiertas, luego se oscurecen
      const bright = i < preDelay + rate * 0.25 ? 1 : 0.82
      data[i] = (Math.random() * 2 - 1) * envelope * bright
    }
    let last = 0
    for (let i = 0; i < length; i += 1) {
      last += 0.36 * (data[i] - last)
      data[i] = last * 0.92
    }
  }

  return impulse
}

export function createNoiseBuffer(ctx: BaseAudioContext, seconds = 2): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let low = 0
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1
    low = 0.93 * low + 0.07 * white
    const crackle = Math.random() < 0.0011 ? (Math.random() * 2 - 1) * 1.8 : 0
    data[i] = low * 1.35 + crackle
  }
  return buffer
}

export function makeDistortionCurve(amount: number): Float32Array {
  const samples = 2048
  const curve = new Float32Array(samples)
  const drive = 1 + clamp01(amount) * 24
  const normalizer = Math.tanh(drive)
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1
    curve[i] = Math.tanh(x * drive) / normalizer
  }
  return curve
}

export function makeSoftenCurve(amount: number): Float32Array {
  const samples = 2048
  const curve = new Float32Array(samples)
  const drive = 1 + clamp01(amount) * 1.6
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1
    curve[i] = Math.tanh(x * drive) * 0.92
  }
  return curve
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}
