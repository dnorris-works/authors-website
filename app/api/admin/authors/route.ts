import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { createAuthor } from '@/lib/authors';

export async function POST(req: NextRequest) {
    const authed = await isAuthenticated();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { key, domain, name } = await req.json();

    if (!key || !domain || !name) {
        return NextResponse.json({ error: 'key, domain, and name are required.' }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(key)) {
        return NextResponse.json({ error: 'Key may only contain lowercase letters, numbers, and hyphens.' }, { status: 400 });
    }

    try {
        await createAuthor({ key, domain, name });
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
            return NextResponse.json({ error: 'That key or domain is already in use.' }, { status: 409 });
        }
        console.error('Create author error:', err);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
