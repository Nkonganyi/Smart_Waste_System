import { useToastStore } from '@/stores/toastStore'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle
}

const styles = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-destructive text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-amber-500 text-white'
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              "flex min-w-[300px] items-center gap-3 rounded-lg p-4 shadow-lg animate-in slide-in-from-right-full duration-300",
              styles[toast.type]
            )}
          >
            <Icon size={20} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="rounded-full p-1 hover:bg-black/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
