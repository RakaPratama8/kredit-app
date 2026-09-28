import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "./constants";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export interface UploadResult {
  success: boolean;
  fileName?: string;
  storageName?: string;
  filePath?: string;
  mimeType?: string;
  fileSize?: number;
  error?: string;
}

export async function uploadFile(file: File, subDir: string = ""): Promise<UploadResult> {
  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: `Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { success: false, error: "Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF" };
  }

  // Sanitize filename
  const ext = path.extname(file.name).toLowerCase();
  const storageName = `${uuidv4()}${ext}`;
  const uploadPath = path.join(UPLOAD_DIR, subDir);

  await mkdir(uploadPath, { recursive: true });

  const filePath = path.join(uploadPath, storageName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    success: true,
    fileName: file.name,
    storageName,
    filePath: path.join(subDir, storageName),
    mimeType: file.type,
    fileSize: file.size,
  };
}
