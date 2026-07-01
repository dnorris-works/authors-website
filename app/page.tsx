import { headers } from 'next/headers';
import { getAuthorConfigByDomain, getAuthorConfigByKey } from '@/lib/authors';
import { getAuthorProfile, toAuthor } from '@/lib/profiles';
import { getBooksForAuthor } from '@/lib/books';
import AuthorPage from '@/components/AuthorPage';
import type { Metadata } from 'next';

async function resolveConfig() {
    const headersList = await headers();
    const hostname = headersList.get('host') ?? '';
    const domain = hostname.split(':')[0];
    const devAuthor = process.env.AUTHOR;

    let config = getAuthorConfigByDomain(domain);
    if (!config && devAuthor) {
        config = getAuthorConfigByKey(devAuthor);
    }
    return config;
}

export async function generateMetadata(): Promise<Metadata> {
    const config = await resolveConfig();

    if (!config) {
        return { title: 'Deep Field Press' };
    }

    const profile = await getAuthorProfile(config.key);

    return {
        title: profile.name,
        description: profile.tagline,
        icons: {
            icon: config.favicon,
        },
    };
}

export default async function Home() {
    const config = await resolveConfig();

    if (!config) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: '#faf6f1', color: '#2c2c2c' }}
            >
                <div className="text-center">
                    <h1 className="font-serif text-4xl mb-4">Deep Field Press</h1>
                    <p style={{ color: '#8c7b6b' }}>Author websites by Deep Field Press.</p>
                </div>
            </div>
        );
    }

    const [profile, books] = await Promise.all([
        getAuthorProfile(config.key),
        getBooksForAuthor(config.key),
    ]);

    return <AuthorPage author={toAuthor(config, profile)} books={books} />;
}
