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
            `SELECT filename, mime_type, data
             FROM authors.downloads
             WHERE author_key = $1 AND slug = $2
             LIMIT 1`,
            [authorKey, slug]
        );

        if (result.rows.length === 0) {
            return new NextResponse('File not found.', { status: 404 });
        }

        const { filename, mime_type, data } = result.rows[0];
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': mime_type,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (err) {
        console.error('Download error:', err);
        return new NextResponse('Server error.', { status: 500 });
    }
}
