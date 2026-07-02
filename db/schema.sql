-- Run this once against your PostgreSQL database
-- Creates the authors schema if it doesn't already exist

CREATE SCHEMA IF NOT EXISTS authors;

-- A book is the single listing type for anything an author offers: a
-- purchasable title, a free download, or both. `show` controls public
-- visibility; `downloadable` (+ the download_* columns) controls whether
-- readers can download a file for it directly from this site.
CREATE TABLE IF NOT EXISTS authors.books (
    id                    SERIAL PRIMARY KEY,
    author_key            TEXT NOT NULL,
    title                 TEXT NOT NULL DEFAULT '',
    description           TEXT NOT NULL DEFAULT '',
    purchase_link         TEXT NOT NULL DEFAULT '',
    coming_soon           BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order            INTEGER NOT NULL DEFAULT 0,
    show                  BOOLEAN NOT NULL DEFAULT TRUE,
    downloadable          BOOLEAN NOT NULL DEFAULT FALSE,
    download_slug         TEXT,
    download_filename     TEXT,
    download_mime_type    TEXT,
    download_data         BYTEA,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adds the show/download columns if this table already existed from a prior run.
ALTER TABLE authors.books ADD COLUMN IF NOT EXISTS show BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE authors.books ADD COLUMN IF NOT EXISTS downloadable BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE authors.books ADD COLUMN IF NOT EXISTS download_slug TEXT;
ALTER TABLE authors.books ADD COLUMN IF NOT EXISTS download_filename TEXT;
ALTER TABLE authors.books ADD COLUMN IF NOT EXISTS download_mime_type TEXT;
ALTER TABLE authors.books ADD COLUMN IF NOT EXISTS download_data BYTEA;

CREATE UNIQUE INDEX IF NOT EXISTS authors_books_download_slug_idx
    ON authors.books (author_key, download_slug) WHERE download_slug IS NOT NULL;

-- Holds every uploaded image. Book covers use book_id + role='cover'.
-- Author-level images (logo, favicon, hero, lead_magnet, photo) use
-- book_id IS NULL with a role identifying which image it is.
CREATE TABLE IF NOT EXISTS authors.images (
    id               SERIAL PRIMARY KEY,
    author_key       TEXT NOT NULL,
    book_id          INTEGER REFERENCES authors.books(id) ON DELETE CASCADE,
    role             TEXT NOT NULL,
    filename         TEXT NOT NULL,
    mime_type        TEXT NOT NULL,
    data             BYTEA NOT NULL,
    thumb_mime_type  TEXT,
    thumb_data       BYTEA,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (author_key, book_id, role)
);

-- Adds the resized-thumbnail columns if this table already existed from a prior run.
-- `data` keeps holding the original full-size upload; `thumb_data` is what's
-- actually served, since nothing in the UI displays covers at full size.
ALTER TABLE authors.images ADD COLUMN IF NOT EXISTS thumb_mime_type TEXT;
ALTER TABLE authors.images ADD COLUMN IF NOT EXISTS thumb_data BYTEA;

-- book_id is NULL for author-level images, and NULL doesn't collide with
-- the UNIQUE constraint above, so a separate partial index enforces
-- one row per (author_key, role) among author-level images.
CREATE UNIQUE INDEX IF NOT EXISTS authors_images_profile_role_idx
    ON authors.images (author_key, role) WHERE book_id IS NULL;

-- The full author record: identity, branding, and public-facing content.
-- Everything an author might change lives here so new authors can be
-- added and edited entirely from the admin dashboard, no deploy required.
CREATE TABLE IF NOT EXISTS authors.profiles (
    author_key         TEXT PRIMARY KEY,
    domain              TEXT,
    accent_color        TEXT NOT NULL DEFAULT '#2c2c2c',
    mailerlite_account  TEXT,
    mailerlite_form     TEXT,
    name                TEXT NOT NULL DEFAULT '',
    tagline             TEXT NOT NULL DEFAULT '',
    subtagline          TEXT NOT NULL DEFAULT '',
    bio                 TEXT NOT NULL DEFAULT '',
    photo_filename      TEXT,
    photo_mime_type     TEXT,
    photo_data          BYTEA,
    featured_book_id    INTEGER REFERENCES authors.books(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adds the domain/branding columns if this table already existed from a prior run.
ALTER TABLE authors.profiles ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE authors.profiles ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#2c2c2c';
ALTER TABLE authors.profiles ADD COLUMN IF NOT EXISTS mailerlite_account TEXT;
ALTER TABLE authors.profiles ADD COLUMN IF NOT EXISTS mailerlite_form TEXT;
-- The book featured in the email signup / lead-magnet section, replacing
-- the old standalone "lead magnet image" upload — the book's own (already
-- resized) cover is used instead, so there's nothing extra to keep in sync.
ALTER TABLE authors.profiles ADD COLUMN IF NOT EXISTS featured_book_id INTEGER REFERENCES authors.books(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS authors_profiles_domain_idx
    ON authors.profiles (domain) WHERE domain IS NOT NULL;

-- Seed with the content that used to live in lib/authors.ts so the
-- live site keeps showing the same copy after this migration runs.
INSERT INTO authors.profiles (author_key, domain, accent_color, mailerlite_account, mailerlite_form, name, tagline, subtagline, bio) VALUES
(
    'dallennorris',
    'dallennorris.com',
    '#6b4c3b',
    '2370300',
    'SeVfZH',
    'D. Allen Norris',
    'Thinker, Storyteller, Author',
    'Fiction about consciousness, embodiment, and the realities we are afraid to question.',
    $$D. Allen Norris has always been drawn to the spaces where certainty frays—where the equations stop yielding answers and the questions begin. A lifelong fascination with science shaped an early view of the world as mechanism: elegant, deterministic, governed by laws that could be tested and known. That foundation held until it didn't. Something in the strangeness of the data—perhaps the observer effect, perhaps the fine-tuning problem, perhaps simply the stubborn mystery of consciousness—refused to resolve into matter alone.

The path to Catholicism was not a retreat from rigor but an extension of it. The Church's own history with science (Gregor Mendel in genetics, Georges Lemaître proposing the Big Bang, the Vatican Observatory still scanning the sky) offered permission to believe that faith and inquiry could coexist, even sharpen each other. The conversion was intellectual before it was devotional, and it remains both.$$
),
(
    'adrianreeve',
    'adrianreeve.com',
    '#7a1f2e',
    NULL,
    NULL,
    'Adrian Reeve',
    'Upmarket Literary Fiction',
    'Author of Seen and Still Loved',
    'Adrian Reeve writes romantic fiction exploring themes of rejection, acceptance, and love.'
)
ON CONFLICT (author_key) DO NOTHING;

-- Back-fills domain/branding for rows created by an earlier version of this script.
UPDATE authors.profiles SET domain = 'dallennorris.com', accent_color = '#6b4c3b', mailerlite_account = '2370300', mailerlite_form = 'SeVfZH'
    WHERE author_key = 'dallennorris' AND domain IS NULL;
UPDATE authors.profiles SET domain = 'adrianreeve.com', accent_color = '#7a1f2e'
    WHERE author_key = 'adrianreeve' AND domain IS NULL;

-- Author photos now live in authors.images (role='photo') alongside the
-- other author-level images. Carries forward any photo uploaded through
-- an earlier version of the Edit Profile form before this change.
INSERT INTO authors.images (author_key, book_id, role, filename, mime_type, data)
SELECT author_key, NULL, 'photo', COALESCE(photo_filename, 'photo'), COALESCE(photo_mime_type, 'image/jpeg'), photo_data
FROM authors.profiles
WHERE photo_data IS NOT NULL
ON CONFLICT (author_key, role) WHERE book_id IS NULL DO NOTHING;

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

-- Downloads and books are now the same thing (a book with `downloadable = TRUE`).
-- Carries forward any standalone downloads created before this change into
-- authors.books so nothing already uploaded gets lost. Safe to re-run.
DO $$
DECLARE
    d RECORD;
    new_book_id INTEGER;
BEGIN
    FOR d IN SELECT * FROM authors.downloads LOOP
        IF NOT EXISTS (
            SELECT 1 FROM authors.books b
            WHERE b.author_key = d.author_key AND b.download_slug = d.slug
        ) THEN
            INSERT INTO authors.books
                (author_key, title, show, downloadable, download_slug, download_filename, download_mime_type, download_data, sort_order)
            VALUES
                (d.author_key, d.filename, FALSE, TRUE, d.slug, d.filename, d.mime_type, d.data, 0)
            RETURNING id INTO new_book_id;

            IF d.cover_data IS NOT NULL THEN
                INSERT INTO authors.images (author_key, book_id, role, filename, mime_type, data)
                VALUES (d.author_key, new_book_id, 'cover', COALESCE(d.cover_filename, 'cover'), COALESCE(d.cover_mime_type, 'image/jpeg'), d.cover_data);
            END IF;
        END IF;
    END LOOP;
END $$;

-- Once you've confirmed the migrated books above look right, authors.downloads
-- is no longer used by the app and can be dropped:
--   DROP TABLE authors.downloads;

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
