import React from 'react'
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      const isNetwork =
        typeof navigator !== 'undefined' &&
        (!navigator.onLine ||
          this.state.error?.message?.toLowerCase().includes('fetch') ||
          this.state.error?.message?.toLowerCase().includes('network') ||
          this.state.error?.message?.toLowerCase().includes('loading chunk') ||
          this.state.error?.name === 'ChunkLoadError')

      return (
        <div className="p-6 m-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
          {isNetwork ? (
            <WifiOff className="h-10 w-10 text-amber-600 mb-3" />
          ) : (
            <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
          )}
          <h2 className="text-base font-bold text-slate-900 mb-1">
            {isNetwork ? 'Slow or Offline Connection' : 'Something went wrong'}
          </h2>
          <p className="text-xs font-medium text-slate-600 mb-4 max-w-xs">
            {isNetwork
              ? 'Could not load data due to slow or disconnected internet. Please check your network and tap Retry to continue on this page.'
              : this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 active:scale-95"
              onClick={this.handleRetry}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 active:scale-95"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
