export type Author = {
    key: string;
    name: string;
    tagline: string;
    bio: string;
    domain: string;
    heroImage: string | null;
    logo: string | null;
    favicon: string;
    accentColor: string;
    mailerLiteAccount: string | null;
    mailerLiteForm: string | null;
};

export const authors: Record<string, Author> = {
    'dallenorris': {
        key: 'dallenorris',
        name: 'D. Allen Norris',
        tagline: 'Thinker, Storyteller, Author',
        bio: 'D. Allen Norris has always been drawn to the spaces where certainty frays—where the equations stop yielding answers and the questions begin. A lifelong fascination with science shaped an early view of the world as mechanism: elegant, deterministic, governed by laws that could be tested and known. That foundation held until it didn\'t. Something in the strangeness of the data—perhaps the observer effect, perhaps the fine-tuning problem, perhaps simply the stubborn mystery of consciousness—refused to resolve into matter alone.\n\nThe path to Catholicism was not a retreat from rigor but an extension of it. The Church\'s own history with science (Gregor Mendel in genetics, Georges Lemaître proposing the Big Bang, the Vatican Observatory still scanning the sky) offered permission to believe that faith and inquiry could coexist, even sharpen each other. The conversion was intellectual before it was devotional, and it remains both.',
        domain: 'dallennorris.com',
        heroImage: '/authors/dallenorris/hero.jpg',
        logo: '/authors/dallenorris/logo.png',
        favicon: '/authors/dallenorris/favicon.png',
        accentColor: '#6b4c3b',
        mailerLiteAccount: '2370300',
        mailerLiteForm: 'SeVfZH',
    },
    'adrianreeve': {
        key: 'adrianreeve',
        name: 'Adrian Reeve',
        tagline: 'Author of romantic fiction.',
        bio: 'Adrian Reeve has always been drawn to the spaces where certainty frays—where the equations stop yielding answers and the questions begin. A lifelong fascination with science shaped an early view of the world as mechanism: elegant, deterministic, governed by laws that could be tested and known. That foundation held until it didn\'t. Something in the strangeness of the data—perhaps the observer effect, perhaps the fine-tuning problem, perhaps simply the stubborn mystery of consciousness—refused to resolve into matter alone.\n\nThe path to Catholicism was not a retreat from rigor but an extension of it. The Church\'s own history with science (Gregor Mendel in genetics, Georges Lemaître proposing the Big Bang, the Vatican Observatory still scanning the sky) offered permission to believe that faith and inquiry could coexist, even sharpen each other. The conversion was intellectual before it was devotional, and it remains both.',
        domain: 'adrianreeve.com',
        heroImage: null,
        logo: '/authors/adrianreeve/logo.svg',
        favicon: '/authors/adrianreeve/favicon.svg',
        accentColor: '#6b4c3b',
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
