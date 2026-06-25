import { getPool } from './db';

export type Book = {
    id: string;
    folder: string;
    title: string;
    description: string;
    purchaseLink: string;
    coverUrl: string;
    comingSoon: boolean;
    sortOrder: number;
};

export async function getBooksForAuthor(authorKey: string): Promise<Book[]> {
    if (!process.env.DATABASE_URL) {
        // Local dev without a database — return empty
        return [];
    }

    const pool = getPool();
    const result = await pool.query(
        `SELECT id, folder, title, description, purchase_link, coming_soon, sort_order
         FROM authors.books
         WHERE author_key = $1
         ORDER BY sort_order ASC, created_at ASC`,
        [authorKey]
    );

    return result.rows.map(row => ({
        id: String(row.id),
        folder: row.folder,
        title: row.title,
        description: row.description,
        purchaseLink: row.purchase_link,
        coverUrl: `/api/images/${authorKey}/${row.folder}/cover`,
        comingSoon: row.coming_soon,
        sortOrder: row.sort_order,
    }));
}
