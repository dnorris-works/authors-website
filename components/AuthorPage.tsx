'use client';

import { useState } from 'react';
import type { Author } from '@/lib/authors';
import type { Book } from '@/lib/books';
import Image from 'next/image';

type Props = {
    author: Author;
    books: Book[];
};

export default function AuthorPage({ author, books }: Props) {
    const [showAbout, setShowAbout] = useState(false);

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#faf6f1', color: '#2c2c2c' }}>

            {/* Header */}
            <header className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {author.logo && (
                        <Image
                            src={author.logo}
                            alt={`${author.name} logo`}
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    )}
                    <span className="font-serif font-bold text-xl">{author.name}</span>
                </div>
                <nav>
                    <button
                        onClick={() => setShowAbout(true)}
                        className="text-sm hover:opacity-60 transition-opacity"
                        style={{ color: '#2c2c2c' }}
                    >
                        About
                    </button>
                </nav>
            </header>

            <main>
                {/* Hero */}
                {author.heroImage ? (
                    <section
                        className="max-w-6xl mx-auto mx-4 rounded-xl overflow-hidden relative"
                        style={{ minHeight: '500px', margin: '0 24px' }}
                    >
                        <Image
                            src={author.heroImage}
                            alt={author.name}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div
                            className="absolute bottom-0 left-0 w-1/2 p-10 flex flex-col justify-end"
                            style={{
                                background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                                minHeight: '50%',
                            }}
                        >
                            <h1 className="font-serif text-5xl text-white mb-3 drop-shadow">
                                {author.tagline}
                            </h1>
                        </div>
                    </section>
                ) : (
                    <section className="max-w-6xl mx-auto px-6 py-12">
                        <h1 className="font-serif text-5xl" style={{ color: '#2c2c2c' }}>
                            {author.tagline}
                        </h1>
                    </section>
                )}

                {/* Books */}
                {books.length > 0 && (
                    <section className="max-w-6xl mx-auto px-6 mt-16">
                        <div
                            className="grid gap-8"
                            style={{
                                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                maxWidth: '800px',
                            }}
                        >
                            {books.map(book => (
                                <div key={book.id} className="text-center">
                                    {book.comingSoon ? (
                                        <div
                                            className="w-full rounded-lg overflow-hidden shadow-md flex items-center justify-center mx-auto"
                                            style={{
                                                maxWidth: '180px',
                                                aspectRatio: '2/3',
                                                background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
                                            }}
                                        >
                                            <span className="font-serif text-white opacity-80 text-lg">
                                                Coming Soon
                                            </span>
                                        </div>
                                    ) : book.purchaseLink ? (
                                        <a
                                            href={book.purchaseLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block group"
                                        >
                                            <BookCover book={book} author={author} />
                                        </a>
                                    ) : (
                                        <BookCover book={book} author={author} />
                                    )}
                                    <p className="mt-3 text-sm font-medium">{book.title}</p>
                                    <div
                                        className="mt-1 text-sm text-left"
                                        style={{ color: '#8c7b6b' }}
                                        dangerouslySetInnerHTML={{ __html: book.description }}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Footer */}
            <footer
                className="max-w-6xl mx-auto px-6 py-8 mt-16 text-center"
                style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
            >
                <p className="text-sm" style={{ color: '#8c7b6b' }}>
                    Published by Deep Field Press
                </p>
            </footer>

            {/* About Modal */}
            {showAbout && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setShowAbout(false)}
                >
                    <div
                        className="rounded-xl p-10 max-w-xl w-full max-h-[80vh] overflow-y-auto relative shadow-2xl"
                        style={{ backgroundColor: '#faf6f1' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowAbout(false)}
                            className="absolute top-4 right-4 text-3xl leading-none"
                            style={{ color: '#8c7b6b' }}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <h2 className="font-serif text-2xl mb-4">About</h2>
                        <div className="text-base leading-relaxed" style={{ color: '#2c2c2c' }}>
                            {author.bio.split('\n\n').map((para, i) => (
                                <p key={i} className={i > 0 ? 'mt-4' : ''}>
                                    <strong>{i === 0 ? author.name : ''}</strong>
                                    {i === 0 ? para.replace(author.name, '') : para}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BookCover({ book, author }: { book: Book; author: Author }) {
    return (
        <div
            className="rounded-lg overflow-hidden shadow-md mx-auto transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
            style={{ maxWidth: '180px', aspectRatio: '2/3', position: 'relative' }}
        >
            <Image
                src={book.coverUrl}
                alt={`${book.title} cover`}
                fill
                className="object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = author.logo ?? '/favicon.ico';
                }}
            />
        </div>
    );
}
