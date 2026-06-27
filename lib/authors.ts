export type Author = {
    key: string;
    name: string;
    tagline: string;
    subtagline: string | null;
    bio: string;
    domain: string;
    heroImage: string | null;
    logo: string | null;
    favicon: string;
    accentColor: string;
    leadMagnetImage: string | null;
    mailerLiteAccount: string | null;
    mailerLiteForm: string | null;
};

export const authors: Record<string, Author> = {
    'dallennorris': {
        key: 'dallennorris',
        name: 'D. Allen Norris',
        tagline: 'Thinker, Storyteller, Author',
        subtagline: 'Fiction about consciousness, embodiment, and the realities we are afraid to question.',
        bio: 'D. Allen Norris has always been drawn to the spaces where certainty frays—where the equations stop yielding answers and the questions begin. A lifelong fascination with science shaped an early view of the world as mechanism: elegant, deterministic, governed by laws that could be tested and known. That foundation held until it didn\'t. Something in the strangeness of the data—perhaps the observer effect, perhaps the fine-tuning problem, perhaps simply the stubborn mystery of consciousness—refused to resolve into matter alone.\n\nThe path to Catholicism was not a retreat from rigor but an extension of it. The Church\'s own history with science (Gregor Mendel in genetics, Georges Lemaître proposing the Big Bang, the Vatican Observatory still scanning the sky) offered permission to believe that faith and inquiry could coexist, even sharpen each other. The conversion was intellectual before it was devotional, and it remains both.',
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
        name: 'Adrian Reeve',
        tagline: 'Upmarket Literary Fiction',
        subtagline: 'Author of Seen and Still Loved',
        bio: 'Adrian Reeve writes romantic fiction exploring themes of rejection, acceptance, and love.',
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

export function getAuthorByDomain(hostname: string): Author | null {
    return Object.values(authors).find(
        a => hostname === a.domain || hostname.endsWith('.' + a.domain)
    ) ?? null;
}

export function getAuthorByKey(key: string): Author | null {
    return authors[key] ?? null;
}
