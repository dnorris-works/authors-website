import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { updateAuthorProfile, upsertAuthorImage, type AuthorImageRole } from '@/lib/authors';

const IMAGE_FIELDS: { field: string; role: AuthorImageRole }[] = [
    { field: 'photo', role: 'photo' },
    { field: 'logo', role: 'logo' },
    { field: 'favicon', role: 'favicon' },
    { field: 'hero', role: 'hero' },
    { field: 'leadMagnet', role: 'lead_magnet' },
];

export async function POST(req: NextRequest) {
    const authed = await isAuthenticated();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await req.formData();
    const authorKey = formData.get('authorKey') as string;

    if (!authorKey) {
        return NextResponse.json({ error: 'authorKey is required.' }, { status: 400 });
    }

    try {
        await updateAuthorProfile({
            authorKey,
            domain: formData.get('domain') as string,
            accentColor: (formData.get('accentColor') as string) || '#2c2c2c',
            mailerLiteAccount: formData.get('mailerLiteAccount') as string,
            mailerLiteForm: formData.get('mailerLiteForm') as string,
            name: formData.get('name') as string,
            tagline: formData.get('tagline') as string,
            subtagline: formData.get('subtagline') as string,
            bio: formData.get('bio') as string,
        });

        for (const { field, role } of IMAGE_FIELDS) {
            const file = formData.get(field) as File | null;
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                await upsertAuthorImage(authorKey, role, {
                    filename: file.name,
                    mimeType: file.type || 'image/jpeg',
                    buffer,
                });
            }
        }
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
            return NextResponse.json({ error: 'That domain is already in use by another author.' }, { status: 409 });
        }
        console.error('Profile save error:', err);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
