import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';

const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');
export const IMAGES_DIR = path.join(UPLOADS_ROOT, 'images');
export const VIDEOS_DIR = path.join(UPLOADS_ROOT, 'videos');

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300MB

function safeExt(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : '';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === 'video' ? VIDEOS_DIR : IMAGES_DIR;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = crypto.randomUUID();
    cb(null, `${unique}${safeExt(file.originalname)}`);
  },
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_BYTES, files: 11 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'images' && ALLOWED_IMAGE_TYPES.has(file.mimetype)) return cb(null, true);
    if (file.fieldname === 'video' && ALLOWED_VIDEO_TYPES.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type "${file.mimetype}" for field "${file.fieldname}".`));
  },
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 },
]);

// Applied per-file after multer's fileFilter, since multer doesn't enforce
// different size limits per field out of the box.
export function enforcePerFieldSizeLimits(files: {
  images?: Express.Multer.File[];
  video?: Express.Multer.File[];
}): string | null {
  for (const f of files.images ?? []) {
    if (f.size > MAX_IMAGE_BYTES) return `Image "${f.originalname}" exceeds the 15MB limit.`;
  }
  for (const f of files.video ?? []) {
    if (f.size > MAX_VIDEO_BYTES) return `Video "${f.originalname}" exceeds the 300MB limit.`;
  }
  return null;
}

export function cleanupFiles(files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] }) {
  for (const f of [...(files.images ?? []), ...(files.video ?? [])]) {
    fs.unlink(f.path, () => {});
  }
}

export function publicUrlFor(file: Express.Multer.File): string {
  const kind = file.fieldname === 'video' ? 'videos' : 'images';
  return `/uploads/${kind}/${path.basename(file.path)}`;
}
