import { isAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { authors } from '@/lib/authors';
import { getBooksForAuthor } from '@/lib/books';
import AdminDashboardClient from '@/components/AdminDashboard';

export default async function DashboardPage() {
    const authed = await isAuthenticated();
    if (!authed) redirect('/admin');

    const allBooks = await Promise.all(
        Object.values(authors).map(async author => ({
            author,
            books: await getBooksForAuthor(author.key),
        }))
    );

    return <AdminDashboardClient allBooks={allBooks} />;
}
