import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Media storage behind one small interface. STORAGE_DRIVER picks the backend:
//   local  (default) files under UPLOAD_DIR, fine for local dev
//   replit Replit Object Storage, needed on Replit deploys (disk is ephemeral)
// Files are always served through /api/media/<key>, which checks access.

export type StoredObject = { body: Buffer; contentType: string };

interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
};
const contentTypeFor = (key: string) =>
  CONTENT_TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream";

function localStorage(): Storage {
  const root = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "uploads");
  const resolve = (key: string) => {
    const full = path.resolve(root, key);
    if (!full.startsWith(root + path.sep)) throw new Error("Bad storage key");
    return full;
  };
  return {
    async put(key, body) {
      const full = resolve(key);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, body);
    },
    async get(key) {
      try {
        return { body: await readFile(resolve(key)), contentType: contentTypeFor(key) };
      } catch {
        return null;
      }
    },
    async delete(key) {
      await rm(resolve(key), { force: true });
    },
  };
}

function replitStorage(): Storage {
  // Loaded lazily so local dev never touches the Replit client.
  const client = import("@replit/object-storage").then(({ Client }) => new Client());
  return {
    async put(key, body) {
      const res = await (await client).uploadFromBytes(key, body);
      if (!res.ok) throw new Error(`Upload failed: ${res.error.message}`);
    },
    async get(key) {
      const res = await (await client).downloadAsBytes(key);
      return res.ok ? { body: res.value[0], contentType: contentTypeFor(key) } : null;
    },
    async delete(key) {
      await (await client).delete(key, { ignoreNotFound: true });
    },
  };
}

const globalForStorage = globalThis as unknown as { storage?: Storage };
export const storage: Storage = (globalForStorage.storage ??=
  process.env.STORAGE_DRIVER === "replit" ? replitStorage() : localStorage());

export const MEDIA_PREFIX = "/api/media/";
export const mediaUrl = (key: string) => MEDIA_PREFIX + key;
export const keyFromUrl = (url: string) =>
  url.startsWith(MEDIA_PREFIX) ? url.slice(MEDIA_PREFIX.length) : null;
