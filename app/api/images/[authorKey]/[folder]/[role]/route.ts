import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

type Params = {
    params: Promise<{
        authorKey: string;
        folder: string;
        role: string;
    }>;
};

export async function GET(req: NextRequest, { params }: Params) {
    const { authorKey, folder, role } = await params;

    if (!process.env.DATABASE_URL) {
        return new NextResponse('No database configured.', { status: 503 });
    }

    try {
        const pool = getPool();
        const result = await pool.query(
            `SELECT data, mime_type, thumb_data, thumb_mime_type, extract(epoch from updated_at) AS updated_at
             FROM authors.images
             WHERE author_key = $1 AND book_id = $2 AND role = $3
             LIMIT 1`,
            [authorKey, parseInt(folder, 10), role]
        );

        if (result.rows.length === 0) {
            return new NextResponse('Image not found.', { status: 404 });
        }

        const { data, mime_type, thumb_data, thumb_mime_type, updated_at } = result.rows[0];
        // The URL is keyed by book/role, not by file content, so it's not
        // safe to cache "immutable" — the underlying image can be replaced
        // at the same URL. ETag lets caches revalidate cheaply instead.
        const etag = `"${updated_at}"`;
        if (req.headers.get('if-none-match') === etag) {
            return new NextResponse(null, { status: 304, headers: { ETag: etag } });
        }

        // Nothing in the UI displays the full-size original — serve the
        // resized thumbnail when we have one, falling back to the original
        // for images uploaded before thumbnails existed.
        const rawData = thumb_data ?? data;
        const mimeType = thumb_data ? thumb_mime_type : mime_type;
        const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=0, must-revalidate',
                ETag: etag,
            },
        });
    } catch (err) {
        console.error('Image fetch error:', err);
        return new NextResponse('Server error.', { status: 500 });
    }
}
