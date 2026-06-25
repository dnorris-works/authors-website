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
        `SELECT id, author_key, folder, title, description, purchase_link, coming_soon, sort_order
         FROM authors.books
         WHERE author_key = $1
         ORDER BY sort_order ASC, created_at ASC`,
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
    const folder = formData.get('bookId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const purchaseLink = formData.get('purchaseLink') as string;
    const comingSoon = formData.get('comingSoon') === 'true';
    const sortOrder = parseInt(formData.get('sortOrder') as string ?? '0', 10);
    const coverFile = formData.get('cover') as File | null;

    if (!authorKey || !folder) {
        return NextResponse.json({ error: 'authorKey and bookId are required.' }, { status: 400 });
    }

    const pool = getPool();

    // Upsert book record
    await pool.query(
        `INSERT INTO authors.books (author_key, folder, title, description, purchase_link, coming_soon, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (author_key, folder)
         DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             purchase_link = EXCLUDED.purchase_link,
             coming_soon = EXCLUDED.coming_soon,
             sort_order = EXCLUDED.sort_order`,
        [authorKey, folder, title, description, purchaseLink, comingSoon, sortOrder]
    );

    // Save cover image if provided
    if (coverFile && coverFile.size > 0) {
        const buffer = Buffer.from(await coverFile.arrayBuffer());
        const mimeType = coverFile.type || 'image/jpeg';

        await pool.query(
            `INSERT INTO authors.images (author_key, folder, role, filename, mime_type, data)
             VALUES ($1, $2, 'cover', $3, $4, $5)
             ON CONFLICT (author_key, folder, role)
             DO UPDATE SET
                 filename = EXCLUDED.filename,
                 mime_type = EXCLUDED.mime_type,
                 data = EXCLUDED.data`,
            [authorKey, folder, coverFile.name, mimeType, buffer]
        );
    }

    return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
    const authed = await isAuthenticated();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { authorKey, folder } = await req.json();

    if (!authorKey || !folder) {
        return NextResponse.json({ error: 'authorKey and folder are required.' }, { status: 400 });
    }

    const pool = getPool();

    await pool.query(
        `DELETE FROM authors.books WHERE author_key = $1 AND folder = $2`,
        [authorKey, folder]
    );

    await pool.query(
        `DELETE FROM authors.images WHERE author_key = $1 AND folder = $2`,
        [authorKey, folder]
    );

    return NextResponse.json({ ok: true });
}
