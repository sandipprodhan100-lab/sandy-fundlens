/**
 * Fund-house document storage in S3 (factsheets, portfolio disclosures, SIDs).
 * Documents live under documents/<fund-house>/<doc-type>/ and are catalogued in
 * documents/_index.json so the app can list them without scanning the bucket.
 */

import { DOC_TYPES, S3_PATHS, type DocType, type DocumentEntry } from "./s3-layout";
import { s3GetJSON, s3List, s3PutBytes, s3PutJSON, s3SignedUrl } from "./s3.server";

export function isDocType(value: string): value is DocType {
  return (DOC_TYPES as readonly string[]).includes(value);
}

export async function readDocumentIndex(): Promise<DocumentEntry[]> {
  return (await s3GetJSON<DocumentEntry[]>(S3_PATHS.documentIndex)) ?? [];
}

async function indexDocument(entry: DocumentEntry) {
  const current = await readDocumentIndex();
  const next = [...current.filter((d) => d.key !== entry.key), entry].sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt),
  );
  await s3PutJSON(S3_PATHS.documentIndex, next);
}

/** Fetch a document from a fund-house URL and archive it in the bucket. */
export async function ingestDocumentFromUrl(input: {
  fundHouse: string;
  docType: DocType;
  sourceUrl: string;
  fileName?: string;
}): Promise<DocumentEntry> {
  const res = await fetch(input.sourceUrl, {
    headers: { "user-agent": "MFLens/1.0 (+https://fundlens.sandipprodhan.in)" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Document download failed [${res.status}] for ${input.sourceUrl}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "application/pdf";
  const fileName =
    input.fileName ?? decodeURIComponent(new URL(input.sourceUrl).pathname.split("/").pop() || "document.pdf");

  const key = S3_PATHS.documents(input.fundHouse, input.docType, fileName);
  await s3PutBytes(key, bytes, contentType);

  const entry: DocumentEntry = {
    key,
    fundHouse: input.fundHouse,
    docType: input.docType,
    fileName,
    size: bytes.byteLength,
    uploadedAt: new Date().toISOString(),
    sourceUrl: input.sourceUrl,
  };
  await indexDocument(entry);
  return entry;
}

/** Pre-signed PUT target for browser uploads of a fund document. */
export async function documentUploadTarget(input: { fundHouse: string; docType: DocType; fileName: string }) {
  const key = S3_PATHS.documents(input.fundHouse, input.docType, input.fileName);
  const url = await s3SignedUrl(key, "write");
  return { key, url };
}

export async function registerUploadedDocument(input: {
  key: string;
  fundHouse: string;
  docType: DocType;
  fileName: string;
  size: number;
}): Promise<DocumentEntry> {
  const entry: DocumentEntry = { ...input, uploadedAt: new Date().toISOString() };
  await indexDocument(entry);
  return entry;
}

export async function documentDownloadUrl(key: string) {
  if (!key.startsWith("documents/")) throw new Error("Only fund documents can be downloaded.");
  return s3SignedUrl(key, "read");
}

export async function documentsStatus() {
  const objects = await s3List(S3_PATHS.documentsPrefix()).catch(() => []);
  const files = objects.filter((o) => !o.key.endsWith("_index.json") && !o.key.startsWith("documents/_facts/"));
  return {
    files: files.length,
    bytes: files.reduce((sum, o) => sum + o.size, 0),
    houses: new Set(files.map((o) => o.key.split("/")[1])).size,
  };
}
