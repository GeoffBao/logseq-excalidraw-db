/**
 * Centralized logging utility for Excalidraw plugin
 * Automatically disables debug logs in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
    private enabled: Record<LogLevel, boolean>
    private prefix = '[Excalidraw]'

    constructor() {
        // Only enable debug logs in development
        const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'

        this.enabled = {
            debug: isDev,
            info: true,
            warn: true,
            error: true,
        }
    }

    /**
     * Debug level - only shown in development
     * Use for detailed debugging information
     */
    debug(...args: any[]) {
        if (this.enabled.debug) {
            console.log(this.prefix, ...args)
        }
    }

    /**
     * Info level - shown in all environments
     * Use for important operational information
     */
    info(...args: any[]) {
        if (this.enabled.info) {
            console.info(this.prefix, ...args)
        }
    }

    /**
     * Warning level - shown in all environments
     * Use for recoverable errors or deprecated features
     */
    warn(...args: any[]) {
        if (this.enabled.warn) {
            console.warn(this.prefix, ...args)
        }
    }

    /**
     * Error level - shown in all environments
     * Use for unrecoverable errors
     */
    error(...args: any[]) {
        if (this.enabled.error) {
            console.error(this.prefix, ...args)
        }
    }

    /**
     * Group logs together (collapsed by default)
     */
    group(label: string, collapsed = true) {
        if (this.enabled.debug) {
            if (collapsed) {
                console.groupCollapsed(this.prefix, label)
            } else {
                console.group(this.prefix, label)
            }
        }
    }

    /**
     * End a log group
     */
    groupEnd() {
        if (this.enabled.debug) {
            console.groupEnd()
        }
    }
}

export const logger = new Logger()
