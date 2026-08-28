/**
 * Pre-computed analysis snapshot reader.
 *
 * Instead of computing sideways windows and fund analysis on every request
 * (which requires 50+ S3 GETs and 45+ upstream API calls), this module reads
 * pre-computed JSON snapshots from S3. A cron job refreshes these every 6 hours.
 *
 * Fallback: if a snapshot is missing or stale (> 12 hours), the caller should
 * fall back to live computation.
 */

import { S3_PATHS } from "./s3-layout";
import { isS3Configured, s3GetJSON } from "./s3.server";

/** Maximum age before a snapshot is considered stale and live recomputation kicks in. */
const MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12 hours

export type SnapshotMeta = {
  refreshedAt: string;
  version: string;
  durationMs: number;
};

type SnapshotEnvelope<T> = {
  _meta: SnapshotMeta;
  data: T;
};

/**
 * Read a pre-computed sideways snapshot for an index.
 * Returns null if S3 is not configured, the snapshot doesn't exist, or is stale.
 */
export async function readSidewaysSnapshot(indexKey: string): Promise<unknown | null> {
  if (!isS3Configured()) return null;
  try {
    const envelope = await s3GetJSON<SnapshotEnvelope<unknown>>(S3_PATHS.sidewaysSnapshot(indexKey));
    if (!envelope?._meta?.refreshedAt) return null;
    const age = Date.now() - new Date(envelope._meta.refreshedAt).getTime();
    if (age > MAX_AGE_MS) return null;
    return envelope.data;
  } catch {
    return null;
  }
}

/**
 * Read a pre-computed full analysis snapshot for a category+index pair.
 * Returns null if S3 is not configured, the snapshot doesn't exist, or is stale.
 */
export async function readAnalysisSnapshot(category: string, indexKey: string): Promise<unknown | null> {
  if (!isS3Configured()) return null;
  try {
    const envelope = await s3GetJSON<SnapshotEnvelope<unknown>>(S3_PATHS.analysisSnapshot(category, indexKey));
    if (!envelope?._meta?.refreshedAt) return null;
    const age = Date.now() - new Date(envelope._meta.refreshedAt).getTime();
    if (age > MAX_AGE_MS) return null;
    return envelope.data;
  } catch {
    return null;
  }
}
