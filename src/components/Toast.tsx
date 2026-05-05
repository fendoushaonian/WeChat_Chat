import { useStore } from '../store'
import Icon from './Icon'

export default function Toast() {
  const toast = useStore((s) => s.toast)
  if (!toast) return null
  return (
    <div className="m3-snackbar flex items-center gap-2">
      <Icon name="check-circle" size={18} className="text-success-80" />
      <span>{toast}</span>
    </div>
  )
}
