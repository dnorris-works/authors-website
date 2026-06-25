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
        `SELECT id, author_key, title, description, purchase_link, coming_soon, sort_order
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
    const bookId = formData.get('bookId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const purchaseLink = formData.get('purchaseLink') as string;
    const comingSoon = formData.get('comingSoon') === 'true';
    const sortOrder = parseInt(formData.get('sortOrder') as string ?? '0', 10);
    const coverFile = formData.get('cover') as File | null;

    if (!authorKey) {
        return NextResponse.json({ error: 'authorKey is required.' }, { status: 400 });
    }

    const pool = getPool();
    let id: number;

    if (bookId) {
        // Update existing book
        await pool.query(
            `UPDATE authors.books
             SET title = $1, description = $2, purchase_link = $3, coming_soon = $4, sort_order = $5
             WHERE id = $6 AND author_key = $7`,
            [title, description, purchaseLink, comingSoon, sortOrder, bookId, authorKey]
        );
        id = parseInt(bookId, 10);
    } else {
        // Insert new book
        const result = await pool.query(
            `INSERT INTO authors.books (author_key, title, description, purchase_link, coming_soon, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [authorKey, title, description, purchaseLink, comingSoon, sortOrder]
        );
        id = result.rows[0].id;
    }

    // Save cover image if provided
    if (coverFile && coverFile.size > 0) {
        const arrayBuffer = await coverFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = coverFile.type || 'image/jpeg';

        await pool.query(
            `INSERT INTO authors.images (author_key, book_id, role, filename, mime_type, data)
             VALUES ($1, $2, 'cover', $3, $4, $5::bytea)
             ON CONFLICT (author_key, book_id, role)
             DO UPDATE SET
                 filename = EXCLUDED.filename,
                 mime_type = EXCLUDED.mime_type,
                 data = EXCLUDED.data`,
            [authorKey, id, coverFile.name, mimeType, buffer]
        );
    }

    return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
    const authed = await isAuthenticated();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { authorKey, bookId } = await req.json();

    if (!authorKey || !bookId) {
        return NextResponse.json({ error: 'authorKey and bookId are required.' }, { status: 400 });
    }

    const pool = getPool();

    // Images deleted automatically via ON DELETE CASCADE
    await pool.query(
        `DELETE FROM authors.books WHERE id = $1 AND author_key = $2`,
        [bookId, authorKey]
    );

    return NextResponse.json({ ok: true });
}
