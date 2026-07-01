import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function POST(req: NextRequest) {
    const authed = await isAuthenticated();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await req.formData();
    const authorKey = formData.get('authorKey') as string;
    const name = formData.get('name') as string;
    const tagline = formData.get('tagline') as string;
    const subtagline = formData.get('subtagline') as string;
    const bio = formData.get('bio') as string;
    const photoFile = formData.get('photo') as File | null;

    if (!authorKey) {
        return NextResponse.json({ error: 'authorKey is required.' }, { status: 400 });
    }

    const pool = getPool();

    if (photoFile && photoFile.size > 0) {
        const buffer = Buffer.from(await photoFile.arrayBuffer());
        const mimeType = photoFile.type || 'image/jpeg';

        await pool.query(
            `INSERT INTO authors.profiles (author_key, name, tagline, subtagline, bio, photo_filename, photo_mime_type, photo_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8::bytea)
             ON CONFLICT (author_key)
             DO UPDATE SET
                 name = EXCLUDED.name,
                 tagline = EXCLUDED.tagline,
                 subtagline = EXCLUDED.subtagline,
                 bio = EXCLUDED.bio,
                 photo_filename = EXCLUDED.photo_filename,
                 photo_mime_type = EXCLUDED.photo_mime_type,
                 photo_data = EXCLUDED.photo_data`,
            [authorKey, name, tagline, subtagline, bio, photoFile.name, mimeType, buffer]
        );
    } else {
        await pool.query(
            `INSERT INTO authors.profiles (author_key, name, tagline, subtagline, bio)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (author_key)
             DO UPDATE SET
                 name = EXCLUDED.name,
                 tagline = EXCLUDED.tagline,
                 subtagline = EXCLUDED.subtagline,
                 bio = EXCLUDED.bio`,
            [authorKey, name, tagline, subtagline, bio]
        );
    }

    return NextResponse.json({ ok: true });
}
