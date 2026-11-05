'use client';

/* Compression côté navigateur pour les pièces KYC.
 * Objectif : rester sous la limite Vercel de 4,5 Mo par requête
 * (3 fichiers envoyés ensemble => 4 Mo au total).
 * - images : redimensionnées à 2000 px max, JPEG q=0.8
 * - HEIC/HEIF : convertis en JPEG via heic2any (import dynamique)
 * - PDF : envoyés tels quels
 */

const MAX_DIM = 2000;
const JPEG_QUALITY = 0.8;

const HEIC_RE = /\.(heic|heif)$/i;
const IMAGE_RE = /\.(jpe?g|png|webp|heic|heif)$/i;

export function isImage(file: File): boolean {
  return file.type.startsWith('image/') || IMAGE_RE.test(file.name);
}

export function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || HEIC_RE.test(file.name);
}

function toJpegName(name: string): string {
  return name.replace(/\.[^.]+$/, '') + '.jpg';
}

async function heicToJpegBlob(file: File): Promise<Blob> {
  const { default: heic2any } = await import('heic2any');
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY });
  return Array.isArray(out) ? out[0] : out;
}

async function rasterize(source: Blob): Promise<ImageBitmap> {
  return createImageBitmap(source, { imageOrientation: 'from-image' });
}

async function downscaleToJpeg(source: Blob, type: string): Promise<Blob> {
  const bmp = await rasterize(source);
  try {
    const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d indisponible');
    // fond blanc : évite le noir sur les PNG transparents convertis en JPEG
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, JPEG_QUALITY),
    );
    if (!blob) throw new Error('encodage JPEG impossible');
    return blob;
  } finally {
    bmp.close();
  }
}

/** Compresse une image pour l'upload. Renvoie le fichier d'origine si la
 *  compression est impossible ou inutile (PDF, déjà plus léger). */
export async function compressForUpload(file: File): Promise<File> {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return file;
  if (!isImage(file)) return file;

  try {
    const source = isHeic(file) ? await heicToJpegBlob(file) : file;
    const blob = await downscaleToJpeg(source, 'image/jpeg');
    if (blob.size >= file.size && !isHeic(file)) return file;
    return new File([blob], toJpegName(file.name), { type: 'image/jpeg' });
  } catch {
    // image illisible ou non décodable : on garde le fichier d'origine,
    // le contrôle de taille totale décidera.
    return file;
  }
}
