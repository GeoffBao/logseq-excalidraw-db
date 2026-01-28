import React, { Component, ReactNode } from 'react'
import { logger } from '../lib/logger'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
    hasError: boolean
    error?: Error
    errorInfo?: React.ErrorInfo
}

/**
 * Error Boundary component to catch React errors and prevent app crashes
 * Displays a user-friendly error message with retry option
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        logger.error('Error caught by boundary:', error)
        logger.error('Component stack:', errorInfo.componentStack)

        this.setState({ errorInfo })

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback
            }

            // Default error UI
            const isDark = document.documentElement.classList.contains('dark')

            return (
                <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <div className="text-center max-w-md mx-4">
                        {/* Error Icon */}
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-red-500/20' : 'bg-red-100'
                            }`}>
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-red-500"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>

                        {/* Error Message */}
                        <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            出错了
                        </h2>
                        <p className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Excalidraw 遇到了一个错误
                        </p>

                        {/* Error Details (only in dev) */}
                        {import.meta.env.DEV && this.state.error && (
                            <details className={`mt-4 text-left p-4 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                                }`}>
                                <summary className="cursor-pointer font-medium mb-2">错误详情</summary>
                                <pre className="text-xs overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-center mt-6">
                            <button
                                onClick={this.handleReset}
                                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${isDark
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                    }`}
                            >
                                重试
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-2.5 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
                            >
                                刷新页面
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
