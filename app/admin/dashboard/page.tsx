import { isAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { authors } from '@/lib/authors';
import { getBooksForAuthor } from '@/lib/books';
import AdminDashboardClient from '@/components/AdminDashboard';

export default async function DashboardPage() {
    const authed = await isAuthenticated();
    if (!authed) redirect('/admin');

    const allBooks = Object.values(authors).map(author => ({
        author,
        books: getBooksForAuthor(author.key),
    }));

    return <AdminDashboardClient allBooks={allBooks} />;
}
