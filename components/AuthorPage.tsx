'use client';

import { useState, useEffect } from 'react';
import type { Author } from '@/lib/authors';
import type { Book } from '@/lib/books';

type Props = {
    author: Author;
    books: Book[];
};

export default function AuthorPage({ author, books }: Props) {
    const [showAbout, setShowAbout] = useState(false);

    // Load MailerLite script if account is configured
    useEffect(() => {
        if (!author.mailerLiteAccount) return;
        if (document.getElementById('mailerlite-script')) return;

        const script = document.createElement('script');
        script.id = 'mailerlite-script';
        script.async = true;
        script.innerHTML = `(function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[]).push(arguments);},l=d.createElement(e),l.async=1,l.src=u,n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})(window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');ml('account', '${author.mailerLiteAccount}');`;
        document.head.appendChild(script);
    }, [author.mailerLiteAccount]);

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#faf6f1', color: '#2c2c2c' }}>

            {/* Header */}
            <header className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {author.logo && (
                        <img
                            src={author.logo}
                            alt={author.name}
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                        />
                    )}
                    <span style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1.25rem' }}>
                        {author.name}
                    </span>
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
                        style={{
                            margin: '0 24px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            minHeight: '500px',
                            maxWidth: '1152px',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                        }}
                    >
                        <img
                            src={author.heroImage}
                            alt={author.name}
                            style={{ width: '100%', height: '500px', objectFit: 'cover', display: 'block' }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '50%',
                                padding: '40px',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                            }}
                        >
                            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '3rem', color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                                {author.tagline}
                            </h1>
                            {author.subtagline && (
                                <p style={{ marginTop: '8px', fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' }}>
                                    {author.subtagline}
                                </p>
                            )}
                        </div>
                    </section>
                ) : (
                    <section className="max-w-6xl mx-auto px-6 py-12">
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '3rem', color: '#2c2c2c' }}>
                            {author.tagline}
                        </h1>
                        {author.subtagline && (
                            <p style={{ marginTop: '8px', fontSize: '1.1rem', color: '#8c7b6b', fontStyle: 'italic' }}>
                                {author.subtagline}
                            </p>
                        )}
                    </section>
                )}

                {/* Lead Magnet */}
                {author.mailerLiteAccount && author.mailerLiteForm && author.leadMagnetImage && (
                    <section
                        className="max-w-6xl mx-auto px-6 mt-16"
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                padding: '2.5rem',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                                maxWidth: '700px',
                            }}
                        >
                            <img
                                src={author.leadMagnetImage}
                                alt="Free eBook"
                                style={{ width: '120px', flexShrink: 0, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                            />
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#2c2c2c', marginBottom: '0.5rem' }}>
                                    Get your free eBook
                                </h2>
                                <div className="ml-embedded" data-form={author.mailerLiteForm} />
                                <p style={{ fontSize: '0.75rem', color: '#8c7b6b', marginTop: '0.5rem' }}>
                                    100% no spam
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Books */}
                {books.length > 0 && (
                    <section className="max-w-6xl mx-auto px-6 mt-16">
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                gap: '2rem',
                                maxWidth: '800px',
                            }}
                        >
                            {books.map(book => (
                                <div key={book.id} style={{ textAlign: 'center' }}>
                                    {book.comingSoon ? (
                                        <div
                                            style={{
                                                width: '100%',
                                                maxWidth: '180px',
                                                aspectRatio: '2/3',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto',
                                                background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
                                            }}
                                        >
                                            <span style={{ fontFamily: 'Georgia, serif', color: 'white', opacity: 0.8 }}>
                                                Coming Soon
                                            </span>
                                        </div>
                                    ) : book.purchaseLink ? (
                                        <a href={book.purchaseLink} target="_blank" rel="noopener noreferrer">
                                            <BookCover book={book} />
                                        </a>
                                    ) : (
                                        <BookCover book={book} />
                                    )}
                                    <p style={{ marginTop: '12px', fontSize: '0.875rem', fontWeight: '500' }}>
                                        {book.title}
                                    </p>
                                    <div
                                        style={{ marginTop: '4px', fontSize: '0.875rem', textAlign: 'left', color: '#8c7b6b' }}
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
                <p style={{ fontSize: '0.875rem', color: '#8c7b6b' }}>
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
                        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', marginBottom: '1rem' }}>
                            About
                        </h2>
                        <div style={{ fontSize: '1rem', lineHeight: '1.75', color: '#2c2c2c' }}>
                            {author.bio.split('\n\n').map((para, i) => (
                                <p key={i} style={{ marginTop: i > 0 ? '1rem' : '0' }}>
                                    {i === 0 && <strong>{author.name} </strong>}
                                    {i === 0 ? para.replace(author.name, '').trim() : para}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BookCover({ book }: { book: Book }) {
    return (
        <div
            style={{
                maxWidth: '180px',
                aspectRatio: '2/3',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                margin: '0 auto',
                position: 'relative',
            }}
        >
            <img
                src={book.coverUrl}
                alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
        </div>
    );
}
