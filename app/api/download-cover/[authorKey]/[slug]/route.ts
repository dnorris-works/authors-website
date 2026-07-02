import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

type Params = {
    params: Promise<{
        authorKey: string;
        slug: string;
    }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
    const { authorKey, slug } = await params;

    if (!process.env.DATABASE_URL) {
        return new NextResponse('No database configured.', { status: 503 });
    }

    try {
        const pool = getPool();
        const result = await pool.query(
            `SELECT cover_data, cover_mime_type FROM authors.downloads
             WHERE author_key = $1 AND slug = $2 AND cover_data IS NOT NULL
             LIMIT 1`,
            [authorKey, slug]
        );

        if (result.rows.length === 0) {
            return new NextResponse('Cover not found.', { status: 404 });
        }

        const { cover_data, cover_mime_type } = result.rows[0];
        const buffer = Buffer.isBuffer(cover_data) ? cover_data : Buffer.from(cover_data);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': cover_mime_type,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (err) {
        console.error('Download cover fetch error:', err);
        return new NextResponse('Server error.', { status: 500 });
    }
}
