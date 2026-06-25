import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const { username, password } = await req.json();

    const validUser = process.env.ADMIN_USER;
    const validPass = process.env.ADMIN_PASS;

    if (!validUser || !validPass) {
        return NextResponse.json({ error: 'Admin credentials not configured.' }, { status: 500 });
    }

    if (username === validUser && password === validPass) {
        await setSession();
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
}
