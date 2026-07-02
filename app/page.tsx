import { headers } from 'next/headers';
import { getAuthorByDomain, getAuthorByKey, getAllAuthors } from '@/lib/authors';
import { getBooksForAuthor, getBookById } from '@/lib/books';
import AuthorPage from '@/components/AuthorPage';
import type { Metadata } from 'next';

async function resolveAuthor() {
    const headersList = await headers();
    const hostname = headersList.get('host') ?? '';
    const domain = hostname.split(':')[0];
    const devAuthor = process.env.AUTHOR;

    let author = await getAuthorByDomain(domain);
    if (!author && devAuthor) {
        author = await getAuthorByKey(devAuthor);
    }
    return author;
}

export async function generateMetadata(): Promise<Metadata> {
    const author = await resolveAuthor();

    if (!author) {
        return { title: 'Deep Field Press' };
    }

    return {
        title: author.name,
        description: author.tagline,
        ...(author.favicon ? { icons: { icon: author.favicon } } : {}),
    };
}

export default async function Home() {
    const author = await resolveAuthor();

    if (!author) {
        const authors = await getAllAuthors();

        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: '#faf6f1', color: '#2c2c2c' }}
            >
                <div className="text-center">
                    <h1 className="font-serif text-4xl mb-4">Deep Field Press</h1>
                    <p className="mb-8" style={{ color: '#8c7b6b' }}>Author websites by Deep Field Press.</p>
                    {authors.length > 0 && (
                        <ul className="space-y-3">
                            {authors.filter(a => a.domain).map(a => (
                                <li key={a.key}>
                                    <a
                                        href={`https://${a.domain}`}
                                        className="text-lg underline"
                                        style={{ color: '#6b4c3b' }}
                                    >
                                        {a.name || a.key}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        );
    }

    const [books, featuredBook] = await Promise.all([
        getBooksForAuthor(author.key),
        author.featuredBookId ? getBookById(author.key, author.featuredBookId) : Promise.resolve(null),
    ]);

    return <AuthorPage author={author} books={books} featuredBook={featuredBook} />;
}
