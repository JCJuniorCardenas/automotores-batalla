import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
}

/** Disco local (desarrollo y demo). En Railway el disco es efímero: usar R2/S3 en producción. */
export class LocalStorage implements StorageDriver {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  private path(key: string) {
    const full = resolve(join(this.root, key));
    if (!full.startsWith(this.root + sep)) throw new Error("Clave de storage inválida");
    return full;
  }

  async put(key: string, body: Buffer) {
    const full = this.path(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  async deleteMany(keys: string[]) {
    await Promise.all(keys.map((k) => rm(this.path(k), { force: true })));
  }
}

/** Cualquier storage compatible con S3 (Cloudflare R2, bucket de Railway, etc.). */
export class S3Storage implements StorageDriver {
  private readonly client: S3Client;

  constructor(
    private readonly bucket: string,
    opts: { endpoint: string; accessKeyId: string; secretAccessKey: string },
  ) {
    this.client = new S3Client({
      region: "auto",
      endpoint: opts.endpoint,
      credentials: { accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey },
    });
  }

  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  async deleteMany(keys: string[]) {
    for (let i = 0; i < keys.length; i += 1000) {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })) },
        }),
      );
    }
  }
}

export function createStorage(env: NodeJS.ProcessEnv = process.env): StorageDriver {
  if (env.STORAGE_DRIVER === "r2") {
    const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = env;
    if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
      throw new Error("Faltan variables S3_* para STORAGE_DRIVER=r2");
    }
    return new S3Storage(S3_BUCKET, {
      endpoint: S3_ENDPOINT,
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    });
  }
  return new LocalStorage(env.UPLOAD_DIR ?? "uploads");
}
