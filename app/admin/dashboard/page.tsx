import { isAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { authorConfigs } from '@/lib/authors';
import { getAuthorProfile, toAuthor } from '@/lib/profiles';
import { getBooksForAuthor } from '@/lib/books';
import { getPool } from '@/lib/db';
import AdminDashboardClient from '@/components/AdminDashboard';

export type Download = {
    id: number;
    authorKey: string;
    slug: string;
    filename: string;
    mimeType: string;
};

async function getDownloadsForAuthor(authorKey: string): Promise<Download[]> {
    if (!process.env.DATABASE_URL) return [];
    const pool = getPool();
    const result = await pool.query(
        `SELECT id, author_key, slug, filename, mime_type
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
    }));
}

export default async function DashboardPage() {
    const authed = await isAuthenticated();
    if (!authed) redirect('/admin');

    const allData = await Promise.all(
        Object.values(authorConfigs).map(async config => {
            const profile = await getAuthorProfile(config.key);
            return {
                author: toAuthor(config, profile),
                books: await getBooksForAuthor(config.key),
                downloads: await getDownloadsForAuthor(config.key),
            };
        })
    );

    return <AdminDashboardClient allData={allData} />;
}
