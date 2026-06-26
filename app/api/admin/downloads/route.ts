import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
    const authed = await isAuthenticated();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const authorKey = searchParams.get('authorKey');

    const pool = getPool();
    const result = await pool.query(
        `SELECT id, author_key, slug, filename, mime_type, created_at
         FROM authors.downloads
         WHERE author_key = $1
         ORDER BY created_at ASC`,
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
    const slug = formData.get('slug') as string;
    const filename = formData.get('filename') as string;
    const file = formData.get('file') as File | null;

    if (!authorKey || !slug || !filename || !file) {
        return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'application/octet-stream';

    const pool = getPool();
    await pool.query(
        `INSERT INTO authors.downloads (author_key, slug, filename, mime_type, data)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (author_key, slug)
         DO UPDATE SET
             filename = EXCLUDED.filename,
             mime_type = EXCLUDED.mime_type,
             data = EXCLUDED.data`,
        [authorKey, slug, filename, mimeType, buffer]
    );

    return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
    const authed = await isAuthenticated();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { authorKey, slug } = await req.json();

    if (!authorKey || !slug) {
        return NextResponse.json({ error: 'authorKey and slug are required.' }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
        `DELETE FROM authors.downloads WHERE author_key = $1 AND slug = $2`,
        [authorKey, slug]
    );

    return NextResponse.json({ ok: true });
}
