import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

type Params = {
    params: Promise<{
        authorKey: string;
        slug: string;
    }>;
};

export async function GET(req: NextRequest, { params }: Params) {
    const { authorKey, slug } = await params;

    if (!process.env.DATABASE_URL) {
        return new NextResponse('No database configured.', { status: 503 });
    }

    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
        return new NextResponse('Missing token.', { status: 401 });
    }

    const pool = getPool();

    // Validate token
    const tokenResult = await pool.query(
        `SELECT id, used, expires_at, email
         FROM authors.download_tokens
         WHERE token = $1 AND author_key = $2 AND slug = $3
         LIMIT 1`,
        [token, authorKey, slug]
    );

    if (tokenResult.rows.length === 0) {
        return new NextResponse('Invalid token.', { status: 401 });
    }

    const { id, used, expires_at } = tokenResult.rows[0];

    if (used) {
        return new NextResponse('This download link has already been used.', { status: 410 });
    }

    if (new Date() > new Date(expires_at)) {
        return new NextResponse('This download link has expired.', { status: 410 });
    }

    // Mark token as used
    await pool.query(
        `UPDATE authors.download_tokens SET used = TRUE WHERE id = $1`,
        [id]
    );

    // Fetch the file
    try {
        const fileResult = await pool.query(
            `SELECT filename, mime_type, data
             FROM authors.downloads
             WHERE author_key = $1 AND slug = $2
             LIMIT 1`,
            [authorKey, slug]
        );

        if (fileResult.rows.length === 0) {
            return new NextResponse('File not found.', { status: 404 });
        }

        const { filename, mime_type, data } = fileResult.rows[0];
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
