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
            `SELECT download_filename, download_mime_type, download_data
             FROM authors.books
             WHERE author_key = $1 AND download_slug = $2 AND downloadable = TRUE
             LIMIT 1`,
            [author.key, slug]
        );

        if (result.rows.length === 0) {
            return new NextResponse('File not found.', { status: 404 });
        }

        const { download_filename, download_mime_type, download_data } = result.rows[0];
        const buffer = Buffer.isBuffer(download_data) ? download_data : Buffer.from(download_data);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': download_mime_type,
                'Content-Disposition': `attachment; filename="${download_filename}"`,
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (err) {
        console.error('Download error:', err);
        return new NextResponse('Server error.', { status: 500 });
    }
}
