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
    const coverFile = formData.get('cover') as File | null;

    if (!authorKey || !slug || !filename) {
        return NextResponse.json({ error: 'authorKey, slug, and filename are required.' }, { status: 400 });
    }

    const pool = getPool();

    const existing = await pool.query(
        `SELECT id FROM authors.downloads WHERE author_key = $1 AND slug = $2`,
        [authorKey, slug]
    );

    if (existing.rows.length === 0 && (!file || file.size === 0)) {
        return NextResponse.json({ error: 'A file is required for new downloads.' }, { status: 400 });
    }

    const buffer = file && file.size > 0 ? Buffer.from(await file.arrayBuffer()) : null;
    const mimeType = file && file.size > 0 ? (file.type || 'application/octet-stream') : null;

    const coverBuffer = coverFile && coverFile.size > 0 ? Buffer.from(await coverFile.arrayBuffer()) : null;
    const coverMimeType = coverFile && coverFile.size > 0 ? (coverFile.type || 'image/jpeg') : null;
    const coverFilename = coverFile && coverFile.size > 0 ? coverFile.name : null;

    await pool.query(
        `INSERT INTO authors.downloads (author_key, slug, filename, mime_type, data, cover_filename, cover_mime_type, cover_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (author_key, slug)
         DO UPDATE SET
             filename = EXCLUDED.filename,
             mime_type = COALESCE(EXCLUDED.mime_type, authors.downloads.mime_type),
             data = COALESCE(EXCLUDED.data, authors.downloads.data),
             cover_filename = COALESCE(EXCLUDED.cover_filename, authors.downloads.cover_filename),
             cover_mime_type = COALESCE(EXCLUDED.cover_mime_type, authors.downloads.cover_mime_type),
             cover_data = COALESCE(EXCLUDED.cover_data, authors.downloads.cover_data)`,
        [authorKey, slug, filename, mimeType, buffer, coverFilename, coverMimeType, coverBuffer]
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
