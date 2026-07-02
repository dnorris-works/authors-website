// One-time script: generates the resized thumb_data/thumb_mime_type for any
// existing book cover that doesn't have one yet (covers uploaded before the
// thumbnail column existed). Safe to re-run — only touches rows where
// thumb_data IS NULL.
//
// Backs up every original cover to ./backups/covers/ BEFORE resizing
// anything, so you have a plain-file copy independent of the database.
//
// Run against production:
//   DATABASE_URL="postgres://..." node scripts/backfill-cover-thumbnails.mjs
//
// Keep the resize settings below in sync with lib/images.ts.

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupDir = path.join(__dirname, '..', 'backups', 'covers');

const COVER_MAX_WIDTH = 360;
const JPEG_QUALITY = 85;
const PNG_QUALITY = 85;

const EXTENSIONS = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/svg+xml': '.svg',
};

async function resizeCover(buffer, mimeType) {
    if (mimeType === 'image/svg+xml') return null;

    const image = sharp(buffer).resize({ width: COVER_MAX_WIDTH, withoutEnlargement: true });

    if (mimeType === 'image/png') {
        return { buffer: await image.png({ quality: PNG_QUALITY }).toBuffer(), mimeType: 'image/png' };
    }

    return { buffer: await image.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer(), mimeType: 'image/jpeg' };
}

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('Set DATABASE_URL before running this script.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    const { rows } = await pool.query(
        `SELECT id, author_key, book_id, filename, mime_type, data
         FROM authors.images
         WHERE role = 'cover' AND thumb_data IS NULL`
    );

    console.log(`Found ${rows.length} cover(s) without a thumbnail.`);
    await mkdir(backupDir, { recursive: true });

    let done = 0;
    let skipped = 0;

    for (const row of rows) {
        const buffer = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
        const ext = EXTENSIONS[row.mime_type] ?? path.extname(row.filename) ?? '';
        const backupPath = path.join(backupDir, `${row.author_key}-book${row.book_id}-${row.id}${ext}`);

        // Backup first, before touching the database.
        await writeFile(backupPath, buffer);

        const thumb = await resizeCover(buffer, row.mime_type);
        if (!thumb) {
            console.log(`Skipped (vector, no resize needed): ${row.author_key} book ${row.book_id}`);
            skipped++;
            continue;
        }

        await pool.query(
            `UPDATE authors.images SET thumb_data = $1, thumb_mime_type = $2 WHERE id = $3`,
            [thumb.buffer, thumb.mimeType, row.id]
        );

        console.log(`Resized: ${row.author_key} book ${row.book_id} (${buffer.length} -> ${thumb.buffer.length} bytes), backup at ${backupPath}`);
        done++;
    }

    console.log(`\nDone. ${done} thumbnail(s) generated, ${skipped} skipped. Backups saved to ${backupDir}`);
    await pool.end();
}

main();
