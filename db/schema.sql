-- Run this once against your PostgreSQL database
-- Creates the authors schema if it doesn't already exist

CREATE SCHEMA IF NOT EXISTS authors;

CREATE TABLE IF NOT EXISTS authors.books (
    id            SERIAL PRIMARY KEY,
    author_key    TEXT NOT NULL,
    title         TEXT NOT NULL DEFAULT '',
    description   TEXT NOT NULL DEFAULT '',
    purchase_link TEXT NOT NULL DEFAULT '',
    coming_soon   BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS authors.images (
    id          SERIAL PRIMARY KEY,
    author_key  TEXT NOT NULL,
    book_id     INTEGER REFERENCES authors.books(id) ON DELETE CASCADE,
    role        TEXT NOT NULL,
    filename    TEXT NOT NULL,
    mime_type   TEXT NOT NULL,
    data        BYTEA NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (author_key, book_id, role)
);

CREATE TABLE IF NOT EXISTS authors.profiles (
    author_key      TEXT PRIMARY KEY,
    name            TEXT NOT NULL DEFAULT '',
    tagline         TEXT NOT NULL DEFAULT '',
    subtagline      TEXT NOT NULL DEFAULT '',
    bio             TEXT NOT NULL DEFAULT '',
    photo_filename  TEXT,
    photo_mime_type TEXT,
    photo_data      BYTEA,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed with the content that used to live in lib/authors.ts so the
-- live site keeps showing the same copy after this migration runs.
INSERT INTO authors.profiles (author_key, name, tagline, subtagline, bio) VALUES
(
    'dallennorris',
    'D. Allen Norris',
    'Thinker, Storyteller, Author',
    'Fiction about consciousness, embodiment, and the realities we are afraid to question.',
    $$D. Allen Norris has always been drawn to the spaces where certainty frays—where the equations stop yielding answers and the questions begin. A lifelong fascination with science shaped an early view of the world as mechanism: elegant, deterministic, governed by laws that could be tested and known. That foundation held until it didn't. Something in the strangeness of the data—perhaps the observer effect, perhaps the fine-tuning problem, perhaps simply the stubborn mystery of consciousness—refused to resolve into matter alone.

The path to Catholicism was not a retreat from rigor but an extension of it. The Church's own history with science (Gregor Mendel in genetics, Georges Lemaître proposing the Big Bang, the Vatican Observatory still scanning the sky) offered permission to believe that faith and inquiry could coexist, even sharpen each other. The conversion was intellectual before it was devotional, and it remains both.$$
),
(
    'adrianreeve',
    'Adrian Reeve',
    'Upmarket Literary Fiction',
    'Author of Seen and Still Loved',
    'Adrian Reeve writes romantic fiction exploring themes of rejection, acceptance, and love.'
)
ON CONFLICT (author_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS authors.downloads (
    id              SERIAL PRIMARY KEY,
    author_key      TEXT NOT NULL,
    slug            TEXT NOT NULL,
    filename        TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    data            BYTEA NOT NULL,
    cover_filename  TEXT,
    cover_mime_type TEXT,
    cover_data      BYTEA,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (author_key, slug)
);

-- Adds the cover_* columns if this table already existed from a prior run of this script.
ALTER TABLE authors.downloads ADD COLUMN IF NOT EXISTS cover_filename TEXT;
ALTER TABLE authors.downloads ADD COLUMN IF NOT EXISTS cover_mime_type TEXT;
ALTER TABLE authors.downloads ADD COLUMN IF NOT EXISTS cover_data BYTEA;

CREATE OR REPLACE FUNCTION authors.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER books_updated_at
    BEFORE UPDATE ON authors.books
    FOR EACH ROW EXECUTE FUNCTION authors.set_updated_at();

CREATE OR REPLACE TRIGGER images_updated_at
    BEFORE UPDATE ON authors.images
    FOR EACH ROW EXECUTE FUNCTION authors.set_updated_at();

CREATE OR REPLACE TRIGGER downloads_updated_at
    BEFORE UPDATE ON authors.downloads
    FOR EACH ROW EXECUTE FUNCTION authors.set_updated_at();

CREATE OR REPLACE TRIGGER profiles_updated_at
    BEFORE UPDATE ON authors.profiles
    FOR EACH ROW EXECUTE FUNCTION authors.set_updated_at();
