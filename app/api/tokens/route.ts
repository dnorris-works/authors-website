import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
    // Verify the request is from MailerLite via a shared secret
    const secret = req.headers.get('x-secret');
    if (!secret || secret !== process.env.DOWNLOAD_TOKEN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { authorKey, slug, email } = await req.json();

    if (!authorKey || !slug || !email) {
        return NextResponse.json({ error: 'authorKey, slug and email are required.' }, { status: 400 });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const pool = getPool();
    await pool.query(
        `INSERT INTO authors.download_tokens (token, author_key, slug, email, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [token, authorKey, slug, email, expiresAt]
    );

    const downloadUrl = `${process.env.SITE_URL}/download/${authorKey}/${slug}?token=${token}`;

    return NextResponse.json({ ok: true, downloadUrl });
}
