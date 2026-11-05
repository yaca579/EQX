interface ToggleProps {
  checked: boolean
  onChange: () => void
  label: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full border transition-all duration-200 ${
        checked
          ? 'border-brand/60 bg-brand/25 shadow-[0_0_16px_-4px_rgba(255,106,0,0.85)]'
          : 'border-white/12 bg-white/[0.06]'
      }`}
    >
      <span
        className={`inline-block h-[15px] w-[15px] rounded-full transition-all duration-200 ${
          checked ? 'translate-x-[19px] bg-brand' : 'translate-x-[3px] bg-neutral-500'
        }`}
      />
    </button>
  )
}
