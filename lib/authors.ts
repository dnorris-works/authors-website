export type AuthorConfig = {
    key: string;
    domain: string;
    heroImage: string | null;
    logo: string | null;
    favicon: string;
    accentColor: string;
    leadMagnetImage: string | null;
    mailerLiteAccount: string | null;
    mailerLiteForm: string | null;
};

export type Author = AuthorConfig & {
    name: string;
    tagline: string;
    subtagline: string | null;
    bio: string;
    photoUrl: string | null;
};

export const authorConfigs: Record<string, AuthorConfig> = {
    'dallennorris': {
        key: 'dallennorris',
        domain: 'dallennorris.com',
        heroImage: '/assets/dallennorris/hero.jpg',
        logo: '/assets/dallennorris/logo.png',
        favicon: '/assets/dallennorris/favicon.png',
        accentColor: '#6b4c3b',
        leadMagnetImage: '/assets/dallennorris/witness-persists.jpg',
        mailerLiteAccount: '2370300',
        mailerLiteForm: 'SeVfZH',
    },
    'adrianreeve': {
        key: 'adrianreeve',
        domain: 'adrianreeve.com',
        heroImage: null,
        logo: '/assets/adrianreeve/logo.svg',
        favicon: '/assets/adrianreeve/favicon.svg',
        accentColor: '#7a1f2e',
        leadMagnetImage: null,
        mailerLiteAccount: null,
        mailerLiteForm: null,
    },
};

export function getAuthorConfigByDomain(hostname: string): AuthorConfig | null {
    return Object.values(authorConfigs).find(
        a => hostname === a.domain || hostname.endsWith('.' + a.domain)
    ) ?? null;
}

export function getAuthorConfigByKey(key: string): AuthorConfig | null {
    return authorConfigs[key] ?? null;
}
