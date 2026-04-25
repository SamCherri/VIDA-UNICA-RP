const buckets = new Map<string, number>();

export function assertCooldown(key: string, cooldownMs: number) {
  const now = Date.now();
  const last = buckets.get(key) ?? 0;

  if (now - last < cooldownMs) {
    const remainingMs = cooldownMs - (now - last);
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(remainingMs / 1000)
    };
  }

  buckets.set(key, now);

  return {
    blocked: false,
    retryAfterSeconds: 0
  };
}
