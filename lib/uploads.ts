import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function saveUpload(
  file: File,
  folder: string = "general"
): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".bin";
  const safeExt = ext.slice(0, 10);
  const filename = `${nanoid(12)}${safeExt}`;
  const dir = path.join(UPLOAD_DIR, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${folder}/${filename}`;
}
