'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Author } from '@/lib/authors';
import type { Book } from '@/lib/books';
import type { Download } from '@/app/admin/dashboard/page';

type AuthorData = {
    author: Author;
    books: Book[];
    downloads: Download[];
};

type Props = {
    allData: AuthorData[];
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

type EditingDownload = {
    authorKey: string;
    slug: string;
    filename: string;
    file: File | null;
    coverFile: File | null;
    existingCoverUrl: string | null;
    isNew: boolean;
};

type EditingProfile = {
    authorKey: string;
    domain: string;
    accentColor: string;
    mailerLiteAccount: string;
    mailerLiteForm: string;
    name: string;
    tagline: string;
    subtagline: string;
    bio: string;
    photoFile: File | null;
    existingPhotoUrl: string | null;
    logoFile: File | null;
    existingLogoUrl: string | null;
    faviconFile: File | null;
    existingFaviconUrl: string | null;
    heroFile: File | null;
    existingHeroUrl: string | null;
    leadMagnetFile: File | null;
    existingLeadMagnetUrl: string | null;
};

type NewAuthor = {
    key: string;
    domain: string;
    name: string;
};

const emptyNewAuthor: NewAuthor = { key: '', domain: '', name: '' };

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

const emptyDownload = (authorKey: string): EditingDownload => ({
    authorKey,
    slug: '',
    filename: '',
    file: null,
    coverFile: null,
    existingCoverUrl: null,
    isNew: true,
});

export default function AdminDashboardClient({ allData }: Props) {
    const router = useRouter();
    const [editing, setEditing] = useState<EditingBook | null>(null);
    const [viewing, setViewing] = useState<{ authorKey: string; book: Book } | null>(null);
    const [editingDownload, setEditingDownload] = useState<EditingDownload | null>(null);
    const [editingProfile, setEditingProfile] = useState<EditingProfile | null>(null);
    const [addingAuthor, setAddingAuthor] = useState<NewAuthor | null>(null);
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

    function startEditDownload(download: Download) {
        setEditingDownload({
            authorKey: download.authorKey,
            slug: download.slug,
            filename: download.filename,
            file: null,
            coverFile: null,
            existingCoverUrl: download.coverUrl,
            isNew: false,
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
        if (editing.bookId !== null) formData.append('bookId', String(editing.bookId));
        formData.append('title', editing.title);
        formData.append('description', editing.description);
        formData.append('purchaseLink', editing.purchaseLink);
        formData.append('comingSoon', String(editing.comingSoon));
        formData.append('sortOrder', String(editing.sortOrder));
        if (editing.coverFile) formData.append('cover', editing.coverFile);

        const res = await fetch('/api/admin/books', { method: 'POST', body: formData });

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
        if (res.ok) router.refresh();
    }

    async function handleSaveDownload() {
        if (!editingDownload) return;
        setSaving(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('authorKey', editingDownload.authorKey);
        formData.append('slug', editingDownload.slug);
        formData.append('filename', editingDownload.filename);
        if (editingDownload.file) formData.append('file', editingDownload.file);
        if (editingDownload.coverFile) formData.append('cover', editingDownload.coverFile);

        const res = await fetch('/api/admin/downloads', { method: 'POST', body: formData });

        if (res.ok) {
            setSuccess('Download saved.');
            setEditingDownload(null);
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? 'Something went wrong.');
        }
        setSaving(false);
    }

    async function handleDeleteDownload(authorKey: string, slug: string) {
        if (!confirm('Delete this download? This cannot be undone.')) return;
        const res = await fetch('/api/admin/downloads', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authorKey, slug }),
        });
        if (res.ok) router.refresh();
    }

    function startEditProfile(author: Author) {
        setEditingProfile({
            authorKey: author.key,
            domain: author.domain ?? '',
            accentColor: author.accentColor,
            mailerLiteAccount: author.mailerLiteAccount ?? '',
            mailerLiteForm: author.mailerLiteForm ?? '',
            name: author.name,
            tagline: author.tagline,
            subtagline: author.subtagline ?? '',
            bio: author.bio,
            photoFile: null,
            existingPhotoUrl: author.photoUrl,
            logoFile: null,
            existingLogoUrl: author.logo,
            faviconFile: null,
            existingFaviconUrl: author.favicon,
            heroFile: null,
            existingHeroUrl: author.heroImage,
            leadMagnetFile: null,
            existingLeadMagnetUrl: author.leadMagnetImage,
        });
        setError('');
        setSuccess('');
    }

    async function handleSaveProfile() {
        if (!editingProfile) return;
        setSaving(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('authorKey', editingProfile.authorKey);
        formData.append('domain', editingProfile.domain);
        formData.append('accentColor', editingProfile.accentColor);
        formData.append('mailerLiteAccount', editingProfile.mailerLiteAccount);
        formData.append('mailerLiteForm', editingProfile.mailerLiteForm);
        formData.append('name', editingProfile.name);
        formData.append('tagline', editingProfile.tagline);
        formData.append('subtagline', editingProfile.subtagline);
        formData.append('bio', editingProfile.bio);
        if (editingProfile.photoFile) formData.append('photo', editingProfile.photoFile);
        if (editingProfile.logoFile) formData.append('logo', editingProfile.logoFile);
        if (editingProfile.faviconFile) formData.append('favicon', editingProfile.faviconFile);
        if (editingProfile.heroFile) formData.append('hero', editingProfile.heroFile);
        if (editingProfile.leadMagnetFile) formData.append('leadMagnet', editingProfile.leadMagnetFile);

        const res = await fetch('/api/admin/profile', { method: 'POST', body: formData });

        if (res.ok) {
            setSuccess('Profile saved.');
            setEditingProfile(null);
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? 'Something went wrong.');
        }
        setSaving(false);
    }

    async function handleAddAuthor() {
        if (!addingAuthor) return;
        setSaving(true);
        setError('');
        setSuccess('');

        const res = await fetch('/api/admin/authors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addingAuthor),
        });

        if (res.ok) {
            setSuccess('Author added.');
            setAddingAuthor(null);
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? 'Something went wrong.');
        }
        setSaving(false);
    }

    const inputStyle = { borderColor: '#d4c9be', color: '#2c2c2c', backgroundColor: '#ffffff' };

    return (
        <div className="min-h-screen px-6 py-8" style={{ backgroundColor: '#faf6f1', color: '#2c2c2c' }}>
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold" style={{ color: '#2c2c2c' }}>Admin Dashboard</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setAddingAuthor({ ...emptyNewAuthor }); setError(''); setSuccess(''); }}
                            className="text-sm px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-80"
                            style={{ backgroundColor: '#6b4c3b' }}
                        >
                            + Add Author
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-sm px-4 py-2 rounded-lg border transition-opacity hover:opacity-60"
                            style={{ borderColor: '#d4c9be', color: '#8c7b6b' }}
                        >
                            Sign out
                        </button>
                    </div>
                </div>

                {/* Author sections */}
                {allData.map(({ author, books, downloads }) => (
                    <section key={author.key} className="mb-16">

                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                {author.photoUrl && (
                                    <img
                                        src={author.photoUrl}
                                        alt={author.name}
                                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '9999px' }}
                                    />
                                )}
                                <a
                                    href={`https://${author.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-2xl font-bold hover:underline"
                                    style={{ color: '#2c2c2c' }}
                                >
                                    {author.name || '(unnamed)'}
                                </a>
                            </div>
                            <button
                                onClick={() => startEditProfile(author)}
                                className="text-sm px-4 py-2 rounded-lg border transition-opacity hover:opacity-60"
                                style={{ borderColor: '#d4c9be', color: '#6b4c3b' }}
                            >
                                Edit Profile
                            </button>
                        </div>

                        {/* Books */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold" style={{ color: '#2c2c2c' }}>Books</h3>
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
                                                        <p className="text-sm mt-0.5" style={{ color: '#8c7b6b' }}>Coming Soon</p>
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
                        </div>

                        {/* Downloads */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold" style={{ color: '#2c2c2c' }}>Downloads</h3>
                                <button
                                    onClick={() => setEditingDownload(emptyDownload(author.key))}
                                    className="text-sm px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-80"
                                    style={{ backgroundColor: '#6b4c3b' }}
                                >
                                    + Add Download
                                </button>
                            </div>

                            {downloads.length === 0 ? (
                                <p className="text-sm" style={{ color: '#8c7b6b' }}>No downloads yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {downloads.map(download => (
                                        <div
                                            key={download.id}
                                            className="rounded-lg px-5 py-4"
                                            style={{ backgroundColor: '#ffffff', border: '1px solid #e8dfd5' }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-4" style={{ flex: 1, minWidth: 0, marginRight: '1rem' }}>
                                                    {download.coverUrl && (
                                                        <img
                                                            src={download.coverUrl}
                                                            alt=""
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                                                        />
                                                    )}
                                                    <div style={{ minWidth: 0 }}>
                                                        <p className="font-medium" style={{ color: '#2c2c2c' }}>{download.filename}</p>
                                                        <p
                                                            className="text-sm mt-1 select-all"
                                                            style={{ color: '#6b4c3b', wordBreak: 'break-all' }}
                                                        >
                                                            https://{author.domain}/download/{download.slug}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2" style={{ flexShrink: 0 }}>
                                                    <button
                                                        onClick={() => startEditDownload(download)}
                                                        className="text-sm px-3 py-1.5 rounded border transition-opacity hover:opacity-60"
                                                        style={{ borderColor: '#d4c9be', color: '#6b4c3b' }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <a
                                                        href={`https://${author.domain}/download/${download.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm px-3 py-1.5 rounded border transition-opacity hover:opacity-60"
                                                        style={{ borderColor: '#d4c9be', color: '#6b4c3b' }}
                                                    >
                                                        Test
                                                    </a>
                                                    <button
                                                        onClick={() => handleDeleteDownload(download.authorKey, download.slug)}
                                                        className="text-sm px-3 py-1.5 rounded border transition-opacity hover:opacity-60"
                                                        style={{ borderColor: '#f4a4a4', color: '#c0392b' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </section>
                ))}

                {/* Read-only book detail view */}
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
                                    <div className="text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: viewing.book.description }} />
                                </DetailRow>
                                <DetailRow label="Purchase link">
                                    {viewing.book.purchaseLink ? (
                                        <a href={viewing.book.purchaseLink} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{ color: '#6b4c3b' }}>
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

                {/* Edit / Add book form */}
                {editing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div
                            className="w-full max-w-lg rounded-xl p-8 shadow-2xl overflow-y-auto"
                            style={{ backgroundColor: '#faf6f1', maxHeight: '90vh', color: '#2c2c2c' }}
                        >
                            <h2 className="text-xl font-bold mb-6" style={{ color: '#2c2c2c' }}>
                                {editing.bookId === null ? 'New Book' : 'Edit Book'}
                            </h2>
                            <div className="space-y-5">
                                <Field label="Title">
                                    <input type="text" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full border rounded-lg px-4 py-2 text-base outline-none" style={inputStyle} />
                                </Field>
                                <Field label="Display order">
                                    <input type="number" min="0" value={editing.sortOrder} onChange={e => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} className="w-24 border rounded-lg px-4 py-2 text-base outline-none" style={inputStyle} />
                                </Field>
                                <Field label="Description">
                                    <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={5} className="w-full border rounded-lg px-4 py-2 text-base outline-none resize-y" style={inputStyle} />
                                </Field>
                                <Field label="Purchase link">
                                    <input type="url" value={editing.purchaseLink} onChange={e => setEditing({ ...editing, purchaseLink: e.target.value })} className="w-full border rounded-lg px-4 py-2 text-base outline-none" style={inputStyle} placeholder="https://www.amazon.com/dp/..." />
                                </Field>
                                <Field label="Cover image">
                                    {editing.existingCoverUrl && <p className="text-sm mb-2" style={{ color: '#8c7b6b' }}>Current cover on file</p>}
                                    <input type="file" accept="image/*" onChange={e => setEditing({ ...editing, coverFile: e.target.files?.[0] ?? null })} className="text-sm" style={{ color: '#2c2c2c' }} />
                                </Field>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="comingSoon" checked={editing.comingSoon} onChange={e => setEditing({ ...editing, comingSoon: e.target.checked })} className="w-4 h-4" />
                                    <label htmlFor="comingSoon" className="text-sm" style={{ color: '#2c2c2c' }}>Coming soon</label>
                                </div>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                {success && <p className="text-sm text-green-600">{success}</p>}
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg text-white font-medium transition-opacity disabled:opacity-50" style={{ backgroundColor: '#6b4c3b' }}>
                                        {saving ? 'Saving…' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-lg border font-medium transition-opacity hover:opacity-60" style={{ borderColor: '#d4c9be', color: '#8c7b6b' }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add / Edit download form */}
                {editingDownload && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div
                            className="w-full max-w-lg rounded-xl p-8 shadow-2xl overflow-y-auto"
                            style={{ backgroundColor: '#faf6f1', maxHeight: '90vh', color: '#2c2c2c' }}
                        >
                            <h2 className="text-xl font-bold mb-6" style={{ color: '#2c2c2c' }}>
                                {editingDownload.isNew ? 'Add Download' : 'Edit Download'}
                            </h2>
                            <div className="space-y-5">
                                <Field label="Slug (used in the URL, e.g. witness-persists)">
                                    <input
                                        type="text"
                                        value={editingDownload.slug}
                                        onChange={e => setEditingDownload({ ...editingDownload, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                        className="w-full border rounded-lg px-4 py-2 text-base outline-none"
                                        style={inputStyle}
                                        placeholder="witness-persists"
                                        readOnly={!editingDownload.isNew}
                                    />
                                </Field>
                                <Field label="Filename (what the subscriber sees)">
                                    <input
                                        type="text"
                                        value={editingDownload.filename}
                                        onChange={e => setEditingDownload({ ...editingDownload, filename: e.target.value })}
                                        className="w-full border rounded-lg px-4 py-2 text-base outline-none"
                                        style={inputStyle}
                                        placeholder="The-Witness-Persists.epub"
                                    />
                                </Field>
                                <Field label={editingDownload.isNew ? 'File' : 'Replace file (optional)'}>
                                    <input
                                        type="file"
                                        onChange={e => setEditingDownload({ ...editingDownload, file: e.target.files?.[0] ?? null })}
                                        className="text-sm"
                                        style={{ color: '#2c2c2c' }}
                                    />
                                    <p className="text-xs mt-1" style={{ color: '#8c7b6b' }}>
                                        The file readers will download — e.g. an .epub, .pdf, or .mobi file.
                                    </p>
                                </Field>
                                <Field label="Cover image">
                                    {editingDownload.existingCoverUrl && (
                                        <img
                                            src={editingDownload.existingCoverUrl}
                                            alt=""
                                            style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }}
                                        />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setEditingDownload({ ...editingDownload, coverFile: e.target.files?.[0] ?? null })}
                                        className="text-sm"
                                        style={{ color: '#2c2c2c' }}
                                    />
                                </Field>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                {success && <p className="text-sm text-green-600">{success}</p>}
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleSaveDownload} disabled={saving} className="flex-1 py-2 rounded-lg text-white font-medium transition-opacity disabled:opacity-50" style={{ backgroundColor: '#6b4c3b' }}>
                                        {saving ? 'Saving…' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditingDownload(null)} className="flex-1 py-2 rounded-lg border font-medium transition-opacity hover:opacity-60" style={{ borderColor: '#d4c9be', color: '#8c7b6b' }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit profile form */}
                {editingProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div
                            className="w-full max-w-lg rounded-xl p-8 shadow-2xl overflow-y-auto"
                            style={{ backgroundColor: '#faf6f1', maxHeight: '90vh', color: '#2c2c2c' }}
                        >
                            <h2 className="text-xl font-bold mb-6" style={{ color: '#2c2c2c' }}>
                                Edit Profile
                            </h2>
                            <div className="space-y-5">
                                <Field label="Domain">
                                    <input type="text" value={editingProfile.domain} onChange={e => setEditingProfile({ ...editingProfile, domain: e.target.value })} className="w-full border rounded-lg px-4 py-2 text-base outline-none" style={inputStyle} placeholder="example.com" />
                                </Field>
                                <Field label="Accent color">
                                    <input type="color" value={editingProfile.accentColor} onChange={e => setEditingProfile({ ...editingProfile, accentColor: e.target.value })} className="h-10 w-20 border rounded-lg outline-none" style={inputStyle} />
                                </Field>
                                <Field label="MailerLite account ID">
                                    <input type="text" value={editingProfile.mailerLiteAccount} onChange={e => setEditingProfile({ ...editingProfile, mailerLiteAccount: e.target.value })} className="w-full border rounded-lg px-4 py-2 text-base outline-none" style={inputStyle} />
                                </Field>
                                <Field label="MailerLite form ID">
                                    <input type="text" value={editingProfile.mailerLiteForm} onChange={e => setEditingProfile({ ...editingProfile, mailerLiteForm: e.target.value })} className="w-full border rounded-lg px-4 py-2 text-base outline-none" style={inputStyle} />
                                </Field>
                                <Field label="Name">
                                    <input type="text" value={editingProfile.name} onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })} className="w-full border rounded-lg px-4 py-2 text-base outline-none" style={inputStyle} />
                                </Field>
                                <Field label="Tagline">
                                    <input type="text" value={editingProfile.tagline} onChange={e => setEditingProfile({ ...editingProfile, tagline: e.target.value })} className="w-full border rounded-lg px-4 py-2 text-base outline-none" style={inputStyle} />
                                </Field>
                                <Field label="Subtagline">
                                    <input type="text" value={editingProfile.subtagline} onChange={e => setEditingProfile({ ...editingProfile, subtagline: e.target.value })} className="w-full border rounded-lg px-4 py-2 text-base outline-none" style={inputStyle} />
                                </Field>
                                <Field label="Bio">
                                    <textarea value={editingProfile.bio} onChange={e => setEditingProfile({ ...editingProfile, bio: e.target.value })} rows={8} className="w-full border rounded-lg px-4 py-2 text-base outline-none resize-y" style={inputStyle} />
                                </Field>
                                <Field label="Photo">
                                    {editingProfile.existingPhotoUrl && (
                                        <img
                                            src={editingProfile.existingPhotoUrl}
                                            alt=""
                                            style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '9999px', marginBottom: '0.5rem' }}
                                        />
                                    )}
                                    <input type="file" accept="image/*" onChange={e => setEditingProfile({ ...editingProfile, photoFile: e.target.files?.[0] ?? null })} className="text-sm" style={{ color: '#2c2c2c' }} />
                                </Field>
                                <Field label="Logo">
                                    {editingProfile.existingLogoUrl && (
                                        <img
                                            src={editingProfile.existingLogoUrl}
                                            alt=""
                                            style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '0.5rem' }}
                                        />
                                    )}
                                    <input type="file" accept="image/*" onChange={e => setEditingProfile({ ...editingProfile, logoFile: e.target.files?.[0] ?? null })} className="text-sm" style={{ color: '#2c2c2c' }} />
                                </Field>
                                <Field label="Favicon">
                                    {editingProfile.existingFaviconUrl && (
                                        <img
                                            src={editingProfile.existingFaviconUrl}
                                            alt=""
                                            style={{ width: '32px', height: '32px', objectFit: 'contain', marginBottom: '0.5rem' }}
                                        />
                                    )}
                                    <input type="file" accept="image/*" onChange={e => setEditingProfile({ ...editingProfile, faviconFile: e.target.files?.[0] ?? null })} className="text-sm" style={{ color: '#2c2c2c' }} />
                                </Field>
                                <Field label="Hero image">
                                    {editingProfile.existingHeroUrl && (
                                        <img
                                            src={editingProfile.existingHeroUrl}
                                            alt=""
                                            style={{ width: '160px', height: '90px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }}
                                        />
                                    )}
                                    <input type="file" accept="image/*" onChange={e => setEditingProfile({ ...editingProfile, heroFile: e.target.files?.[0] ?? null })} className="text-sm" style={{ color: '#2c2c2c' }} />
                                </Field>
                                <Field label="Lead magnet cover image">
                                    {editingProfile.existingLeadMagnetUrl && (
                                        <img
                                            src={editingProfile.existingLeadMagnetUrl}
                                            alt=""
                                            style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }}
                                        />
                                    )}
                                    <input type="file" accept="image/*" onChange={e => setEditingProfile({ ...editingProfile, leadMagnetFile: e.target.files?.[0] ?? null })} className="text-sm" style={{ color: '#2c2c2c' }} />
                                </Field>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                {success && <p className="text-sm text-green-600">{success}</p>}
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleSaveProfile} disabled={saving} className="flex-1 py-2 rounded-lg text-white font-medium transition-opacity disabled:opacity-50" style={{ backgroundColor: '#6b4c3b' }}>
                                        {saving ? 'Saving…' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditingProfile(null)} className="flex-1 py-2 rounded-lg border font-medium transition-opacity hover:opacity-60" style={{ borderColor: '#d4c9be', color: '#8c7b6b' }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add author form */}
                {addingAuthor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div
                            className="w-full max-w-lg rounded-xl p-8 shadow-2xl overflow-y-auto"
                            style={{ backgroundColor: '#faf6f1', maxHeight: '90vh', color: '#2c2c2c' }}
                        >
                            <h2 className="text-xl font-bold mb-6" style={{ color: '#2c2c2c' }}>
                                Add Author
                            </h2>
                            <div className="space-y-5">
                                <Field label="Key (used internally, e.g. janedoe)">
                                    <input
                                        type="text"
                                        value={addingAuthor.key}
                                        onChange={e => setAddingAuthor({ ...addingAuthor, key: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                        className="w-full border rounded-lg px-4 py-2 text-base outline-none"
                                        style={inputStyle}
                                        placeholder="janedoe"
                                    />
                                </Field>
                                <Field label="Domain">
                                    <input
                                        type="text"
                                        value={addingAuthor.domain}
                                        onChange={e => setAddingAuthor({ ...addingAuthor, domain: e.target.value })}
                                        className="w-full border rounded-lg px-4 py-2 text-base outline-none"
                                        style={inputStyle}
                                        placeholder="janedoe.com"
                                    />
                                </Field>
                                <Field label="Name">
                                    <input
                                        type="text"
                                        value={addingAuthor.name}
                                        onChange={e => setAddingAuthor({ ...addingAuthor, name: e.target.value })}
                                        className="w-full border rounded-lg px-4 py-2 text-base outline-none"
                                        style={inputStyle}
                                        placeholder="Jane Doe"
                                    />
                                </Field>
                                <p className="text-xs" style={{ color: '#8c7b6b' }}>
                                    You can add tagline, bio, images, and everything else after creating the author.
                                </p>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                {success && <p className="text-sm text-green-600">{success}</p>}
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleAddAuthor} disabled={saving} className="flex-1 py-2 rounded-lg text-white font-medium transition-opacity disabled:opacity-50" style={{ backgroundColor: '#6b4c3b' }}>
                                        {saving ? 'Saving…' : 'Add Author'}
                                    </button>
                                    <button onClick={() => setAddingAuthor(null)} className="flex-1 py-2 rounded-lg border font-medium transition-opacity hover:opacity-60" style={{ borderColor: '#d4c9be', color: '#8c7b6b' }}>
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
