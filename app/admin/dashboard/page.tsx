import { isAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllAuthors } from '@/lib/authors';
import { getAllBooksForAuthor } from '@/lib/books';
import AdminDashboardClient from '@/components/AdminDashboard';

export default async function DashboardPage() {
    const authed = await isAuthenticated();
    if (!authed) redirect('/admin');

    const authors = await getAllAuthors();
    const allData = await Promise.all(
        authors.map(async author => ({
            author,
            books: await getAllBooksForAuthor(author.key),
        }))
    );

    return <AdminDashboardClient allData={allData} />;
}
