import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-secret');
    if (!secret || secret !== process.env.DOWNLOAD_TOKEN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const pool = getPool();
    const result = await pool.query(
        `DELETE FROM authors.download_tokens
         WHERE expires_at < NOW() OR used = TRUE`
    );

    return NextResponse.json({ ok: true, deleted: result.rowCount });
}
