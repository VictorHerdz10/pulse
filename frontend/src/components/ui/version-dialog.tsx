type Props = {
  open: boolean
  onClose: () => void
  version?: string
}

export default function VersionDialog({ open, onClose, version }: Props) {
  if (!open) return null

  const appVersion = version ?? (import.meta.env.VITE_APP_VERSION as string) ?? '0.0.0'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog">
      <div className="w-[360px] bg-slate-800 rounded-xl shadow-xl p-6 flex flex-col items-center relative">
        <button onClick={onClose} aria-label="Cerrar" className="absolute top-3 right-3 text-white/60 hover:text-white">✕</button>

        <img src="/logo.png" alt="Pulse logo" className="w-20 h-20 object-contain mt-2" />

        <div className="mt-6 text-center">
          <div className="text-3xl font-semibold text-accent">{appVersion}</div>
        </div>
      </div>
    </div>
  )
}
