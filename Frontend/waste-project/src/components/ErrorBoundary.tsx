import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle size={32} />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Something went wrong</h2>
          <p className="mb-6 max-w-md text-muted-foreground">
            The application encountered an unexpected error. This might be due to a rendering issue or data inconsistency.
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RotateCcw size={16} />
              Reload Page
            </Button>
            <Button
              onClick={() => this.setState({ hasError: false, error: null })}
              variant="default"
            >
              Try Again
            </Button>
          </div>
          {import.meta.env.DEV && (
            <div className="mt-8 w-full max-w-2xl overflow-auto rounded-lg bg-black p-4 text-left text-xs text-red-400">
              <p className="font-bold mb-2">Error Detail:</p>
              <pre>{this.state.error?.stack}</pre>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
