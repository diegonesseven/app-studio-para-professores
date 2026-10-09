/**
 * Utilitário de fila de requisições com limitação de concorrência e
 * retry resiliente para tratamento de HTTP 429 (Too Many Requests).
 */

export interface RequestQueueOptions {
  maxConcurrency?: number
  maxRetries?: number
  initialDelayMs?: number
  backoffFactor?: number
  maxDelayMs?: number
}

export function isTooManyRequestsError(err: unknown): boolean {
  if (!err) return false
  if (typeof err === 'object') {
    const errorObj = err as Record<string, unknown>
    if (errorObj.status === 429) return true
    if (errorObj.statusCode === 429) return true
    if (errorObj.code === 429) return true
  }
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('429') || msg.toLowerCase().includes('too many requests')
}

export class RequestQueue {
  private maxConcurrency: number
  private activeCount: number = 0
  private queue: Array<() => void> = []

  constructor(maxConcurrency = 3) {
    this.maxConcurrency = Math.max(1, maxConcurrency)
  }

  getPendingCount(): number {
    return this.queue.length
  }

  getActiveCount(): number {
    return this.activeCount
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.maxConcurrency) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve)
      })
    }

    this.activeCount++
    try {
      return await fn()
    } finally {
      this.activeCount--
      if (this.queue.length > 0) {
        const next = this.queue.shift()
        if (next) next()
      }
    }
  }
}

/**
 * Instância padrão de fila global para requisições ao PocketBase.
 * Concorrência limitada a 3 requisições simultâneas para evitar rajadas e HTTP 429.
 */
export const requestQueue = new RequestQueue(3)

/**
 * Executa uma função com política de retry exponencial + jitter em caso de HTTP 429.
 */
export async function withRetry429<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number
    initialDelayMs?: number
    backoffFactor?: number
    maxDelayMs?: number
    onRetry?: (attempt: number, delay: number, error: unknown) => void
  },
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3
  const initialDelay = options?.initialDelayMs ?? 300
  const backoffFactor = options?.backoffFactor ?? 2.5
  const maxDelay = options?.maxDelayMs ?? 3000

  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (err: unknown) {
      if (!isTooManyRequestsError(err) || attempt >= maxRetries) {
        throw err
      }

      attempt++
      // Backoff progressivo: ex. 300ms -> 750ms -> 1875ms (limitado por maxDelay) + jitter de +/- 25%
      const baseDelay = Math.min(initialDelay * Math.pow(backoffFactor, attempt - 1), maxDelay)
      const jitter = baseDelay * (0.2 * (Math.random() * 2 - 1)) // +/- 20%
      const delay = Math.round(Math.max(50, baseDelay + jitter))

      if (options?.onRetry) {
        options.onRetry(attempt, delay, err)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Enfileira e executa uma função com controle de concorrência e retry em HTTP 429.
 */
export async function queuedRequest<T>(
  fn: () => Promise<T>,
  options?: {
    queue?: RequestQueue
    maxRetries?: number
    initialDelayMs?: number
  },
): Promise<T> {
  const q = options?.queue ?? requestQueue
  return q.run(() =>
    withRetry429(fn, {
      maxRetries: options?.maxRetries,
      initialDelayMs: options?.initialDelayMs,
    }),
  )
}
