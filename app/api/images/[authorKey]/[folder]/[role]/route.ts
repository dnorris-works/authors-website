import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

type Params = {
    params: Promise<{
        authorKey: string;
        folder: string;
        role: string;
    }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
    const { authorKey, folder, role } = await params;

    if (!process.env.DATABASE_URL) {
        return new NextResponse('No database configured.', { status: 503 });
    }

    try {
        const pool = getPool();
        const result = await pool.query(
            `SELECT data, mime_type FROM authors.images
             WHERE author_key = $1 AND book_id = $2 AND role = $3
             LIMIT 1`,
            [authorKey, parseInt(folder, 10), role]
        );

        if (result.rows.length === 0) {
            return new NextResponse('Image not found.', { status: 404 });
        }

        const { data, mime_type } = result.rows[0];

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': mime_type,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (err) {
        console.error('Image fetch error:', err);
        return new NextResponse('Server error.', { status: 500 });
    }
}
