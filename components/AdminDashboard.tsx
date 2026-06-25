'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Author } from '@/lib/authors';
import type { Book } from '@/lib/books';

type AuthorBooks = {
    author: Author;
    books: Book[];
};

type Props = {
    allBooks: AuthorBooks[];
};

type EditingBook = {
    authorKey: string;
    bookId: number | null;
    title: string;
    description: string;
    purchaseLink: string;
    comingSoon: boolean;
    sortOrder: number;
    coverFile: File | null;
    existingCoverUrl: string;
};

const emptyBook = (authorKey: string): EditingBook => ({
    authorKey,
    bookId: null,
    title: '',
    description: '',
    purchaseLink: '',
    comingSoon: false,
    sortOrder: 0,
    coverFile: null,
    existingCoverUrl: '',
});

export default function AdminDashboardClient({ allBooks }: Props) {
    const router = useRouter();
    const [editing, setEditing] = useState<EditingBook | null>(null);
    const [viewing, setViewing] = useState<{ authorKey: string; book: Book } | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function handleLogout() {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin');
    }

    function startNew(authorKey: string) {
        setEditing(emptyBook(authorKey));
        setError('');
        setSuccess('');
    }

    function startView(authorKey: string, book: Book) {
        setViewing({ authorKey, book });
    }

    function startEdit(authorKey: string, book: Book) {
        setViewing(null);
        setEditing({
            authorKey,
            bookId: book.id,
            title: book.title,
            description: book.description,
            purchaseLink: book.purchaseLink,
            comingSoon: book.comingSoon,
            sortOrder: book.sortOrder,
            coverFile: null,
            existingCoverUrl: book.coverUrl,
        });
        setError('');
        setSuccess('');
    }

    async function handleSave() {
        if (!editing) return;
        setSaving(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('authorKey', editing.authorKey);
        if (editing.bookId !== null) {
            formData.append('bookId', String(editing.bookId));
        }
        formData.append('title', editing.title);
        formData.append('description', editing.description);
        formData.append('purchaseLink', editing.purchaseLink);
        formData.append('comingSoon', String(editing.comingSoon));
        formData.append('sortOrder', String(editing.sortOrder));
        if (editing.coverFile) {
            formData.append('cover', editing.coverFile);
        }

        const res = await fetch('/api/admin/books', {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            setSuccess('Saved successfully.');
            setEditing(null);
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? 'Something went wrong.');
        }

        setSaving(false);
    }

    async function handleDelete(authorKey: string, bookId: number) {
        if (!confirm('Delete this book? This cannot be undone.')) return;

        const res = await fetch('/api/admin/books', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authorKey, bookId }),
        });

        if (res.ok) {
            router.refresh();
        }
    }

    const inputStyle = { borderColor: '#d4c9be', color: '#2c2c2c', backgroundColor: '#ffffff' };

    return (
        <div className="min-h-screen px-6 py-8" style={{ backgroundColor: '#faf6f1', color: '#2c2c2c' }}>
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold" style={{ color: '#2c2c2c' }}>
                        Admin Dashboard
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="text-sm px-4 py-2 rounded-lg border transition-opacity hover:opacity-60"
                        style={{ borderColor: '#d4c9be', color: '#8c7b6b' }}
                    >
                        Sign out
                    </button>
                </div>

                {/* Author sections */}
                {allBooks.map(({ author, books }) => (
                    <section key={author.key} className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold" style={{ color: '#2c2c2c' }}>
                                {author.name}
                            </h2>
                            <button
                                onClick={() => startNew(author.key)}
                                className="text-sm px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-80"
                                style={{ backgroundColor: '#6b4c3b' }}
                            >
                                + Add Book
                            </button>
                        </div>

                        {books.length === 0 ? (
                            <p className="text-sm" style={{ color: '#8c7b6b' }}>No books yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {books.map(book => (
                                    <div
                                        key={book.id}
                                        className="flex justify-between items-center rounded-lg px-5 py-4"
                                        style={{ backgroundColor: '#ffffff', border: '1px solid #e8dfd5' }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={book.coverUrl}
                                                alt=""
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                                            />
                                            <div>
                                                <button
                                                    onClick={() => startView(author.key, book)}
                                                    className="font-medium text-left hover:underline"
                                                    style={{ color: '#2c2c2c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                >
                                                    {book.title || '(untitled)'}
                                                </button>
                                                {book.comingSoon && (
                                                    <p className="text-sm mt-0.5" style={{ color: '#8c7b6b' }}>
                                                        Coming Soon
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(author.key, book)}
                                                className="text-sm px-3 py-1.5 rounded border transition-opacity hover:opacity-60"
                                                style={{ borderColor: '#d4c9be', color: '#6b4c3b' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(author.key, book.id)}
                                                className="text-sm px-3 py-1.5 rounded border transition-opacity hover:opacity-60"
                                                style={{ borderColor: '#f4a4a4', color: '#c0392b' }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ))}

                {/* Read-only detail view */}
                {viewing && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setViewing(null)}
                    >
                        <div
                            className="w-full max-w-lg rounded-xl p-8 shadow-2xl overflow-y-auto"
                            style={{ backgroundColor: '#faf6f1', maxHeight: '90vh', color: '#2c2c2c' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex gap-5 mb-6">
                                <img
                                    src={viewing.book.coverUrl}
                                    alt=""
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                                />
                                <h2 className="text-xl font-bold self-end" style={{ color: '#2c2c2c' }}>
                                    {viewing.book.title}
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <DetailRow label="Description">
                                    <div
                                        className="text-base leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: viewing.book.description }}
                                    />
                                </DetailRow>

                                <DetailRow label="Purchase link">
                                    {viewing.book.purchaseLink ? (
                                        <a
                                            href={viewing.book.purchaseLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm underline"
                                            style={{ color: '#6b4c3b' }}
                                        >
                                            {viewing.book.purchaseLink}
                                        </a>
                                    ) : (
                                        <span className="text-sm" style={{ color: '#8c7b6b' }}>Not set</span>
                                    )}
                                </DetailRow>

                                <DetailRow label="Display order">
                                    <span className="text-sm">{viewing.book.sortOrder}</span>
                                </DetailRow>

                                <DetailRow label="Coming soon">
                                    <span className="text-sm">{viewing.book.comingSoon ? 'Yes' : 'No'}</span>
                                </DetailRow>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => startEdit(viewing.authorKey, viewing.book)}
                                    className="flex-1 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-80"
                                    style={{ backgroundColor: '#6b4c3b' }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setViewing(null)}
                                    className="flex-1 py-2 rounded-lg border font-medium transition-opacity hover:opacity-60"
                                    style={{ borderColor: '#d4c9be', color: '#8c7b6b' }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit / Add form */}
                {editing && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                    >
                        <div
                            className="w-full max-w-lg rounded-xl p-8 shadow-2xl overflow-y-auto"
                            style={{ backgroundColor: '#faf6f1', maxHeight: '90vh', color: '#2c2c2c' }}
                        >
                            <h2 className="text-xl font-bold mb-6" style={{ color: '#2c2c2c' }}>
                                {editing.bookId === null ? 'New Book' : 'Edit Book'}
                            </h2>

                            <div className="space-y-5">

                                <Field label="Title">
                                    <input
                                        type="text"
                                        value={editing.title}
                                        onChange={e => setEditing({ ...editing, title: e.target.value })}
                                        className="w-full border rounded-lg px-4 py-2 text-base outline-none"
                                        style={inputStyle}
                                    />
                                </Field>

                                <Field label="Display order">
                                    <input
                                        type="number"
                                        min="0"
                                        value={editing.sortOrder}
                                        onChange={e => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })}
                                        className="w-24 border rounded-lg px-4 py-2 text-base outline-none"
                                        style={inputStyle}
                                    />
                                </Field>

                                <Field label="Description">
                                    <textarea
                                        value={editing.description}
                                        onChange={e => setEditing({ ...editing, description: e.target.value })}
                                        rows={5}
                                        className="w-full border rounded-lg px-4 py-2 text-base outline-none resize-y"
                                        style={inputStyle}
                                    />
                                </Field>

                                <Field label="Purchase link">
                                    <input
                                        type="url"
                                        value={editing.purchaseLink}
                                        onChange={e => setEditing({ ...editing, purchaseLink: e.target.value })}
                                        className="w-full border rounded-lg px-4 py-2 text-base outline-none"
                                        style={inputStyle}
                                        placeholder="https://www.amazon.com/dp/..."
                                    />
                                </Field>

                                <Field label="Cover image">
                                    {editing.existingCoverUrl && (
                                        <p className="text-sm mb-2" style={{ color: '#8c7b6b' }}>
                                            Current cover on file
                                        </p>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setEditing({ ...editing, coverFile: e.target.files?.[0] ?? null })}
                                        className="text-sm"
                                        style={{ color: '#2c2c2c' }}
                                    />
                                </Field>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="comingSoon"
                                        checked={editing.comingSoon}
                                        onChange={e => setEditing({ ...editing, comingSoon: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor="comingSoon" className="text-sm" style={{ color: '#2c2c2c' }}>
                                        Coming soon
                                    </label>
                                </div>

                                {error && <p className="text-sm text-red-600">{error}</p>}
                                {success && <p className="text-sm text-green-600">{success}</p>}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 py-2 rounded-lg text-white font-medium transition-opacity disabled:opacity-50"
                                        style={{ backgroundColor: '#6b4c3b' }}
                                    >
                                        {saving ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditing(null)}
                                        className="flex-1 py-2 rounded-lg border font-medium transition-opacity hover:opacity-60"
                                        style={{ borderColor: '#d4c9be', color: '#8c7b6b' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm mb-1" style={{ color: '#8c7b6b' }}>{label}</label>
            {children}
        </div>
    );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-sm mb-1" style={{ color: '#8c7b6b' }}>{label}</p>
            <div style={{ color: '#2c2c2c' }}>{children}</div>
        </div>
    );
}
