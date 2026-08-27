/**
 * Shared server-side result memoisation.
 *
 * Category analytics (sideways detection, sector drift, overlap, model
 * portfolio) all hit S3 / upstream APIs and take seconds. Results are cached
 * in three layers:
 *   1. in-process map      — instant, per worker instance
 *   2. in-flight promise   — de-duplicates concurrent callers
 *   3. durable backend row — shared across users, requests and restarts
 */
import { readDurable, writeDurable } from "./cache.server";

export const DEFAULT_TTL = 1000 * 60 * 30;

export function memoise<A, R>(
  fn: (arg: A) => Promise<R>,
  keyOf: (arg: A) => string,
  ttl: number = DEFAULT_TTL,
) {
  const done = new Map<string, { at: number; value: R }>();
  const running = new Map<string, Promise<R>>();

  return (arg: A): Promise<R> => {
    const key = keyOf(arg);
    const hit = done.get(key);
    if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.value);
    const inflight = running.get(key);
    if (inflight) return inflight;

    const task = (async () => {
      const durable = await readDurable<R>(key);
      if (durable) {
        done.set(key, { at: Date.now(), value: durable.value });
        return durable.value;
      }
      const value = await fn(arg);
      done.set(key, { at: Date.now(), value });
      void writeDurable(key, value, ttl);
      return value;
    })()
      .catch((err: unknown) => {
        // fall back to a stale result rather than failing a warm section
        if (hit) return hit.value;
        throw err;
      })
      .finally(() => running.delete(key));

    running.set(key, task);
    return task;
  };
}
