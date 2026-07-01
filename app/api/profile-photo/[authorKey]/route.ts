import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

type Params = {
    params: Promise<{
        authorKey: string;
    }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
    const { authorKey } = await params;

    if (!process.env.DATABASE_URL) {
        return new NextResponse('No database configured.', { status: 503 });
    }

    try {
        const pool = getPool();
        const result = await pool.query(
            `SELECT photo_data, photo_mime_type FROM authors.profiles
             WHERE author_key = $1 AND photo_data IS NOT NULL
             LIMIT 1`,
            [authorKey]
        );

        if (result.rows.length === 0) {
            return new NextResponse('Photo not found.', { status: 404 });
        }

        const { photo_data, photo_mime_type } = result.rows[0];
        const buffer = Buffer.isBuffer(photo_data) ? photo_data : Buffer.from(photo_data);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': photo_mime_type,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (err) {
        console.error('Profile photo fetch error:', err);
        return new NextResponse('Server error.', { status: 500 });
    }
}
