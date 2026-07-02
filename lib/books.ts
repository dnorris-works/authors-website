import { getPool } from './db';

export type Book = {
    id: number;
    title: string;
    description: string;
    purchaseLink: string;
    coverUrl: string;
    comingSoon: boolean;
    sortOrder: number;
    show: boolean;
    downloadable: boolean;
    downloadSlug: string | null;
    downloadFilename: string | null;
};

function toBook(authorKey: string, row: {
    id: number;
    title: string;
    description: string;
    purchase_link: string;
    coming_soon: boolean;
    sort_order: number;
    show: boolean;
    downloadable: boolean;
    download_slug: string | null;
    download_filename: string | null;
}): Book {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        purchaseLink: row.purchase_link,
        coverUrl: `/api/images/${authorKey}/${row.id}/cover`,
        comingSoon: row.coming_soon,
        sortOrder: row.sort_order,
        show: row.show,
        downloadable: row.downloadable,
        downloadSlug: row.download_slug,
        downloadFilename: row.download_filename,
    };
}

const BOOK_COLUMNS = `id, title, description, purchase_link, coming_soon, sort_order, show, downloadable, download_slug, download_filename`;

// Public site: only books the author has chosen to show.
export async function getBooksForAuthor(authorKey: string): Promise<Book[]> {
    if (!process.env.DATABASE_URL) return [];

    const pool = getPool();
    const result = await pool.query(
        `SELECT ${BOOK_COLUMNS}
         FROM authors.books
         WHERE author_key = $1 AND show = TRUE
         ORDER BY sort_order ASC, created_at ASC`,
        [authorKey]
    );

    return result.rows.map(row => toBook(authorKey, row));
}

// Admin dashboard: every book regardless of visibility, so hidden ones can still be managed.
export async function getAllBooksForAuthor(authorKey: string): Promise<Book[]> {
    if (!process.env.DATABASE_URL) return [];

    const pool = getPool();
    const result = await pool.query(
        `SELECT ${BOOK_COLUMNS}
         FROM authors.books
         WHERE author_key = $1
         ORDER BY sort_order ASC, created_at ASC`,
        [authorKey]
    );

    return result.rows.map(row => toBook(authorKey, row));
}
