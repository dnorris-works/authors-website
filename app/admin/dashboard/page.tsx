import { isAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllAuthors } from '@/lib/authors';
import { getBooksForAuthor } from '@/lib/books';
import { getPool } from '@/lib/db';
import AdminDashboardClient from '@/components/AdminDashboard';

export type Download = {
    id: number;
    authorKey: string;
    slug: string;
    filename: string;
    mimeType: string;
    coverUrl: string | null;
};

async function getDownloadsForAuthor(authorKey: string): Promise<Download[]> {
    if (!process.env.DATABASE_URL) return [];
    const pool = getPool();
    const result = await pool.query(
        `SELECT id, author_key, slug, filename, mime_type, cover_data IS NOT NULL AS has_cover
         FROM authors.downloads
         WHERE author_key = $1
         ORDER BY created_at ASC`,
        [authorKey]
    );
    return result.rows.map(row => ({
        id: row.id,
        authorKey: row.author_key,
        slug: row.slug,
        filename: row.filename,
        mimeType: row.mime_type,
        coverUrl: row.has_cover ? `/api/download-cover/${row.author_key}/${row.slug}` : null,
    }));
}

export default async function DashboardPage() {
    const authed = await isAuthenticated();
    if (!authed) redirect('/admin');

    const authors = await getAllAuthors();
    const allData = await Promise.all(
        authors.map(async author => ({
            author,
            books: await getBooksForAuthor(author.key),
            downloads: await getDownloadsForAuthor(author.key),
        }))
    );

    return <AdminDashboardClient allData={allData} />;
}
