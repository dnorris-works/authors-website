import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

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
    const coverFile = formData.get('cover') as File | null;

    if (!authorKey || !bookId) {
        return NextResponse.json({ error: 'authorKey and bookId are required.' }, { status: 400 });
    }

    const bookDir = path.join(process.cwd(), 'content', authorKey, 'books', bookId);
    fs.mkdirSync(bookDir, { recursive: true });

    // Handle cover image upload
    let coverFilename = '';
    if (coverFile && coverFile.size > 0) {
        const ext = path.extname(coverFile.name) || '.jpg';
        coverFilename = `cover${ext}`;
        const buffer = Buffer.from(await coverFile.arrayBuffer());
        fs.writeFileSync(path.join(bookDir, coverFilename), buffer);

        // Also copy to public for serving
        const publicDir = path.join(process.cwd(), 'public', 'authors', authorKey, 'books', bookId);
        fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(path.join(publicDir, coverFilename), buffer);
    } else {
        // Keep existing cover filename if no new file uploaded
        const metaPath = path.join(bookDir, 'meta.json');
        if (fs.existsSync(metaPath)) {
            const existing = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            coverFilename = existing.cover || '';
        }
    }

    const meta = {
        title,
        description,
        purchaseLink,
        cover: coverFilename,
        comingSoon,
    };

    fs.writeFileSync(path.join(bookDir, 'meta.json'), JSON.stringify(meta, null, 4));

    return NextResponse.json({ ok: true });
}
