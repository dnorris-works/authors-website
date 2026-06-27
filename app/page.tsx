import { headers } from 'next/headers';
import { getAuthorByDomain, getAuthorByKey } from '@/lib/authors';
import { getBooksForAuthor } from '@/lib/books';
import AuthorPage from '@/components/AuthorPage';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const hostname = headersList.get('host') ?? '';
    const domain = hostname.split(':')[0];
    const devAuthor = process.env.AUTHOR;

    let author = getAuthorByDomain(domain);
    if (!author && devAuthor) {
        author = getAuthorByKey(devAuthor);
    }

    if (!author) {
        return { title: 'Deep Field Press' };
    }

    return {
        title: author.name,
        description: author.tagline,
        icons: {
            icon: author.favicon,
        },
    };
}

export default async function Home() {
    const headersList = await headers();
    const hostname = headersList.get('host') ?? '';

    const domain = hostname.split(':')[0];
    const devAuthor = process.env.AUTHOR;

    let author = getAuthorByDomain(domain);

    if (!author && devAuthor) {
        author = getAuthorByKey(devAuthor);
    }

    if (!author) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: '#faf6f1', color: '#2c2c2c' }}
            >
                <div className="text-center">
                    <h1 className="font-serif text-4xl mb-4">Deep Field Press</h1>
                    <p style={{ color: '#8c7b6b' }}>Author websites by Deep Field Press.</p>
                </div>
            </div>
        );
    }

    const books = await getBooksForAuthor(author.key);

    return <AuthorPage author={author} books={books} />;
}
