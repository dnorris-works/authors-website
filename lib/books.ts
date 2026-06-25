import fs from 'fs';
import path from 'path';

export type Book = {
    id: string;
    title: string;
    description: string;
    purchaseLink: string;
    cover: string;
    coverUrl: string;
    comingSoon: boolean;
};

export function getBooksForAuthor(authorKey: string): Book[] {
    const booksDir = path.join(process.cwd(), 'content', authorKey, 'books');

    if (!fs.existsSync(booksDir)) {
        return [];
    }

    const entries = fs.readdirSync(booksDir, { withFileTypes: true });
    const bookDirs = entries
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .sort();

    const books: Book[] = [];

    for (const dir of bookDirs) {
        const metaPath = path.join(booksDir, dir, 'meta.json');
        if (!fs.existsSync(metaPath)) continue;

        try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            books.push({
                id: dir,
                title: meta.title || '',
                description: meta.description || '',
                purchaseLink: meta.purchaseLink || '',
                cover: meta.cover || '',
                coverUrl: meta.cover
                    ? `/authors/${authorKey}/books/${dir}/${meta.cover}`
                    : `/authors/${authorKey}/logo.png`,
                comingSoon: meta.comingSoon || false,
            });
        } catch {
            console.warn(`Failed to parse meta.json for ${authorKey}/${dir}`);
        }
    }

    return books;
}
