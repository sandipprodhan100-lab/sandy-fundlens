/**
 * Runtime configuration stored in S3 under app/config/. Keeps the app's
 * operational settings alongside its data instead of hard-coding them.
 */

import { S3_PATHS } from "./s3-layout";
import { isS3Configured, s3GetJSON, s3List, s3PutJSON } from "./s3.server";

export type AppConfig = {
  /** categories included in the nightly NAV ingest */
  categories: string[];
  /** max schemes seeded per category during a backfill run */
  backfillLimit: number;
  /** hour (IST) the daily download is expected to have completed */
  dailyIngestHourIST: number;
  navSource: string;
  updatedAt?: string;
};

export const DEFAULT_CONFIG: AppConfig = {
  categories: ["large", "mid", "small", "multi", "flexi", "hybrid"],
  backfillLimit: 40,
  dailyIngestHourIST: 23,
  navSource: "AMFI India — NAVAll.txt",
};

let cached: { at: number; value: AppConfig } | null = null;

export async function readAppConfig(): Promise<AppConfig> {
  if (cached && Date.now() - cached.at < 300000) return cached.value;
  if (!isS3Configured()) return DEFAULT_CONFIG;
  const stored = await s3GetJSON<AppConfig>(S3_PATHS.config("app")).catch(() => null);
  const value = { ...DEFAULT_CONFIG, ...(stored ?? {}) };
  cached = { at: Date.now(), value };
  return value;
}

export async function writeAppConfig(patch: Partial<AppConfig>): Promise<AppConfig> {
  const current = await readAppConfig();
  const next: AppConfig = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await s3PutJSON(S3_PATHS.config("app"), next);
  cached = { at: Date.now(), value: next };
  return next;
}

export async function listConfigFiles() {
  return s3List(S3_PATHS.configPrefix).catch(() => []);
}
