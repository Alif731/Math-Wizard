const DEFAULT_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_REGISTER_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_LOGIN_MAX = 10;
const DEFAULT_REGISTER_MAX = 5;

const buckets = new Map();

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const pruneExpiredBuckets = (now) => {
  for (const [key, value] of buckets.entries()) {
    if (value.resetTime <= now) {
      buckets.delete(key);
    }
  }
};

const getIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const createRateLimiter = ({ windowMs, max, message, keyPrefix, keyGenerator }) => {
  return (req, res, next) => {
    const now = Date.now();

    if (buckets.size > 5000) {
      pruneExpiredBuckets(now);
    }

    const keyPart = keyGenerator(req);
    const key = `${keyPrefix}:${keyPart}`;
    const existing = buckets.get(key);

    if (!existing || existing.resetTime <= now) {
      buckets.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    existing.count += 1;

    if (existing.count > max) {
      const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        message,
        retryAfter,
      });
    }

    next();
  };
};

const loginLimiter = createRateLimiter({
  windowMs: toPositiveInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, DEFAULT_LOGIN_WINDOW_MS),
  max: toPositiveInt(process.env.LOGIN_RATE_LIMIT_MAX, DEFAULT_LOGIN_MAX),
  message: 'Too many login attempts. Please try again later.',
  keyPrefix: 'login',
  keyGenerator: (req) => {
    const username = String(req.body?.username || '').trim().toLowerCase();
    return `${getIp(req)}:${username}`;
  },
});

const registerLimiter = createRateLimiter({
  windowMs: toPositiveInt(process.env.REGISTER_RATE_LIMIT_WINDOW_MS, DEFAULT_REGISTER_WINDOW_MS),
  max: toPositiveInt(process.env.REGISTER_RATE_LIMIT_MAX, DEFAULT_REGISTER_MAX),
  message: 'Too many registration attempts. Please try again later.',
  keyPrefix: 'register',
  keyGenerator: (req) => getIp(req),
});

module.exports = {
  loginLimiter,
  registerLimiter,
};
