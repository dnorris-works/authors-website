import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

type Params = {
    params: Promise<{
        authorKey: string;
        role: string;
    }>;
};

export async function GET(req: NextRequest, { params }: Params) {
    const { authorKey, role } = await params;

    if (!process.env.DATABASE_URL) {
        return new NextResponse('No database configured.', { status: 503 });
    }

    try {
        const pool = getPool();
        const result = await pool.query(
            `SELECT data, mime_type, extract(epoch from updated_at) AS updated_at
             FROM authors.images
             WHERE author_key = $1 AND role = $2 AND book_id IS NULL
             LIMIT 1`,
            [authorKey, role]
        );

        if (result.rows.length === 0) {
            return new NextResponse('Image not found.', { status: 404 });
        }

        const { data, mime_type, updated_at } = result.rows[0];
        // The URL is keyed by author/role, not by file content, so it's not
        // safe to cache "immutable" — the underlying image can be replaced
        // at the same URL. ETag lets caches revalidate cheaply instead.
        const etag = `"${updated_at}"`;
        if (req.headers.get('if-none-match') === etag) {
            return new NextResponse(null, { status: 304, headers: { ETag: etag } });
        }

        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': mime_type,
                'Cache-Control': 'public, max-age=0, must-revalidate',
                ETag: etag,
            },
        });
    } catch (err) {
        console.error('Author image fetch error:', err);
        return new NextResponse('Server error.', { status: 500 });
    }
}
