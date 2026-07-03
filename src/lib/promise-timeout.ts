export function withTimeout<T>(promise: PromiseLike<T>, ms: number, fallback: Partial<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback as T), ms)),
  ])
}
