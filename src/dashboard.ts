import type {Request, Response, NextFunction} from 'express'

const ACTIVE_USER_TTL_MS = 60_000

const activeUsers = new Map<string, number>()

export function statsMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.path === '/frames.json') {
    activeUsers.set(req.ip ?? 'unknown', Date.now())
  }
  next()
}

setInterval(() => {
  const cutoff = Date.now() - ACTIVE_USER_TTL_MS
  for (const [ip, lastSeen] of activeUsers) {
    if (lastSeen < cutoff) {
      activeUsers.delete(ip)
    }
  }
}, 10_000)

export function getStats() {
  return {
    activeUsers: activeUsers.size
  }
}
