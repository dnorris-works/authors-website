import { getPool } from './db';

export type Book = {
    id: number;
    title: string;
    description: string;
    purchaseLink: string;
    coverUrl: string;
    comingSoon: boolean;
    sortOrder: number;
};

export async function getBooksForAuthor(authorKey: string): Promise<Book[]> {
    if (!process.env.DATABASE_URL) {
        return [];
    }

    const pool = getPool();
    const result = await pool.query(
        `SELECT id, title, description, purchase_link, coming_soon, sort_order
         FROM authors.books
         WHERE author_key = $1
         ORDER BY sort_order ASC, created_at ASC`,
        [authorKey]
    );

    return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        purchaseLink: row.purchase_link,
        coverUrl: `/api/images/${authorKey}/${row.id}/cover`,
        comingSoon: row.coming_soon,
        sortOrder: row.sort_order,
    }));
}
