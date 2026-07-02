import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { resizeCover } from '@/lib/images';

export async function GET(req: NextRequest) {
    const authed = await isAuthenticated();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const authorKey = searchParams.get('authorKey');

    const pool = getPool();
    const result = await pool.query(
        `SELECT id, author_key, title, description, purchase_link, coming_soon, sort_order, show, downloadable, download_slug, download_filename
         FROM authors.books
         WHERE author_key = $1
         ORDER BY sort_order ASC, created_at ASC`,
        [authorKey]
    );

    return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
    const authed = await isAuthenticated();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await req.formData();
    const authorKey = formData.get('authorKey') as string;
    const bookId = formData.get('bookId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const purchaseLink = formData.get('purchaseLink') as string;
    const comingSoon = formData.get('comingSoon') === 'true';
    const sortOrder = parseInt(formData.get('sortOrder') as string ?? '0', 10);
    const coverFile = formData.get('cover') as File | null;

    const show = formData.get('show') === 'true';
    const downloadable = formData.get('downloadable') === 'true';
    const downloadSlug = downloadable ? (formData.get('downloadSlug') as string) : null;
    const downloadFilename = downloadable ? (formData.get('downloadFilename') as string) : null;
    const downloadFile = formData.get('downloadFile') as File | null;

    if (!authorKey) {
        return NextResponse.json({ error: 'authorKey is required.' }, { status: 400 });
    }

    if (downloadable && !downloadSlug) {
        return NextResponse.json({ error: 'A download slug is required when downloads are enabled.' }, { status: 400 });
    }

    const pool = getPool();
    const downloadBuffer = downloadFile && downloadFile.size > 0 ? Buffer.from(await downloadFile.arrayBuffer()) : null;
    const downloadMimeType = downloadFile && downloadFile.size > 0 ? (downloadFile.type || 'application/octet-stream') : null;

    try {
        let id: number;

        if (bookId) {
            if (downloadable && !downloadBuffer) {
                const existing = await pool.query(
                    `SELECT download_data FROM authors.books WHERE id = $1 AND author_key = $2`,
                    [bookId, authorKey]
                );
                if (!existing.rows[0]?.download_data) {
                    return NextResponse.json({ error: 'A file is required to enable downloads.' }, { status: 400 });
                }
            }

            // Update existing book
            await pool.query(
                `UPDATE authors.books
                 SET title = $1, description = $2, purchase_link = $3, coming_soon = $4, sort_order = $5,
                     show = $6, downloadable = $7, download_slug = $8, download_filename = $9,
                     download_mime_type = COALESCE($10, download_mime_type),
                     download_data = COALESCE($11, download_data)
                 WHERE id = $12 AND author_key = $13`,
                [title, description, purchaseLink, comingSoon, sortOrder, show, downloadable, downloadSlug, downloadFilename, downloadMimeType, downloadBuffer, bookId, authorKey]
            );
            id = parseInt(bookId, 10);
        } else {
            if (downloadable && !downloadBuffer) {
                return NextResponse.json({ error: 'A file is required to enable downloads.' }, { status: 400 });
            }

            // Insert new book
            const result = await pool.query(
                `INSERT INTO authors.books
                    (author_key, title, description, purchase_link, coming_soon, sort_order, show, downloadable, download_slug, download_filename, download_mime_type, download_data)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING id`,
                [authorKey, title, description, purchaseLink, comingSoon, sortOrder, show, downloadable, downloadSlug, downloadFilename, downloadMimeType, downloadBuffer]
            );
            id = result.rows[0].id;
        }

        // Save cover image if provided
        if (coverFile && coverFile.size > 0) {
            const arrayBuffer = await coverFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const mimeType = coverFile.type || 'image/jpeg';
            const thumb = await resizeCover(buffer, mimeType);

            await pool.query(
                `INSERT INTO authors.images (author_key, book_id, role, filename, mime_type, data, thumb_mime_type, thumb_data)
                 VALUES ($1, $2, 'cover', $3, $4, $5::bytea, $6, $7::bytea)
                 ON CONFLICT (author_key, book_id, role)
                 DO UPDATE SET
                     filename = EXCLUDED.filename,
                     mime_type = EXCLUDED.mime_type,
                     data = EXCLUDED.data,
                     thumb_mime_type = EXCLUDED.thumb_mime_type,
                     thumb_data = EXCLUDED.thumb_data`,
                [authorKey, id, coverFile.name, mimeType, buffer, thumb?.mimeType ?? null, thumb?.buffer ?? null]
            );
        }

        return NextResponse.json({ ok: true, id });
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
            return NextResponse.json({ error: 'That download slug is already in use.' }, { status: 409 });
        }
        console.error('Book save error:', err);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const authed = await isAuthenticated();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { authorKey, bookId } = await req.json();

    if (!authorKey || !bookId) {
        return NextResponse.json({ error: 'authorKey and bookId are required.' }, { status: 400 });
    }

    const pool = getPool();

    // Images deleted automatically via ON DELETE CASCADE
    await pool.query(
        `DELETE FROM authors.books WHERE id = $1 AND author_key = $2`,
        [bookId, authorKey]
    );

    return NextResponse.json({ ok: true });
}
