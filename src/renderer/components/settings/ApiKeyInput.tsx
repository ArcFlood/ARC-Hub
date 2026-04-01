import { useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  label: string
  placeholder?: string
}

export default function ApiKeyInput({ value, onChange, label, placeholder }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'sk-ant-...'}
          className="input-base w-full pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-xs"
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  )
}
