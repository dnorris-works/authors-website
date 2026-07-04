import { headers } from 'next/headers';
import { resolveAuthorFromHeader, getAllAuthors } from '@/lib/authors';
import { getBooksForAuthor, getBookById } from '@/lib/books';
import AuthorPage from '@/components/AuthorPage';
import type { Metadata } from 'next';

async function resolveAuthor() {
    const headersList = await headers();
    const authorKey = headersList.get('x-author-key');
    return resolveAuthorFromHeader(authorKey);
}

export async function generateMetadata(): Promise<Metadata> {
    const author = await resolveAuthor();

    if (!author) {
        return {
            title: 'Deep Field Press',
            description: "Deep Field Press publishes fiction that takes ideas seriously — stories built at the intersection of science, faith, and the questions we don't usually let ourselves ask out loud.",
        };
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
                <div className="text-center px-6">
                    <img
                        src="/dfp-logo.png"
                        alt="Deep Field Press"
                        width={120}
                        height={120}
                        className="mx-auto mb-6"
                        style={{ width: '120px', height: '120px', objectFit: 'contain' }}
                    />
                    <h1 className="font-serif text-4xl mb-6">Deep Field Press</h1>
                    <p className="max-w-xl mx-auto mb-4 text-lg leading-relaxed">
                        Deep Field Press publishes fiction that takes ideas seriously — stories built at the intersection of science, faith, and the questions we don&apos;t usually let ourselves ask out loud.
                    </p>
                    <p className="max-w-xl mx-auto mb-8 text-base leading-relaxed" style={{ color: '#8c7b6b' }}>
                        We distribute wide, bringing our authors&apos; work to readers wherever they read: Amazon/Kindle, Apple Books, Kobo, and independent retailers worldwide through Draft2Digital and IngramSpark.
                    </p>
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
