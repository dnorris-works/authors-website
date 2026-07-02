import { NextRequest, NextResponse } from 'next/server';
import { getAuthorByDomain, getAuthorByKey } from '@/lib/authors';
import { getPool } from '@/lib/db';

type Params = {
    params: Promise<{
        slug: string;
    }>;
};

export async function GET(req: NextRequest, { params }: Params) {
    const { slug } = await params;

    const hostname = req.headers.get('host')?.split(':')[0] ?? '';
    let author = await getAuthorByDomain(hostname);
    if (!author && process.env.AUTHOR) {
        author = await getAuthorByKey(process.env.AUTHOR);
    }

    if (!author) {
        return new NextResponse('File not found.', { status: 404 });
    }

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
            [author.key, slug]
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
