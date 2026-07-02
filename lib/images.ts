import sharp from 'sharp';

// The largest a cover ever renders at is the public author page
// (max-width 180px, 2:3 aspect ratio). 360px is 2x that for retina
// screens, and still plenty for the 40-80px admin thumbnails.
const COVER_MAX_WIDTH = 360;
const JPEG_QUALITY = 85;
const PNG_QUALITY = 85;

export async function resizeCover(
    buffer: Buffer,
    mimeType: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
    // Vector images already scale losslessly — no raster resize needed.
    if (mimeType === 'image/svg+xml') return null;

    const image = sharp(buffer).resize({
        width: COVER_MAX_WIDTH,
        withoutEnlargement: true,
    });

    if (mimeType === 'image/png') {
        const resized = await image.png({ quality: PNG_QUALITY }).toBuffer();
        return { buffer: resized, mimeType: 'image/png' };
    }

    // Default to JPEG output (covers everything, including image/jpeg)
    const resized = await image.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    return { buffer: resized, mimeType: 'image/jpeg' };
}
