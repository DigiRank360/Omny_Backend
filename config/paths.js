import path from 'path';
import { fileURLToPath } from 'url';

export const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
export const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');
export const BANNER_UPLOAD_DIR = path.join(UPLOAD_DIR, 'banners');
