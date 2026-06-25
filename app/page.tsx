import { headers } from 'next/headers';
import { getAuthorByDomain, getAuthorByKey } from '@/lib/authors';
import { getBooksForAuthor } from '@/lib/books';
import AuthorPage from '@/components/AuthorPage';
import { notFound } from 'next/navigation';

export default async function Home() {
    const headersList = await headers();
    const hostname = headersList.get('host') ?? '';

    // Strip port for local dev (localhost:3000 → localhost)
    const domain = hostname.split(':')[0];

    // Local dev fallback — set AUTHOR env var to test a specific author
    const devAuthor = process.env.AUTHOR;

    let author = getAuthorByDomain(domain);

    if (!author && devAuthor) {
        author = getAuthorByKey(devAuthor);
    }

    if (!author) {
        notFound();
    }

    const books = await getBooksForAuthor(author.key);

    return <AuthorPage author={author} books={books} />;
}
