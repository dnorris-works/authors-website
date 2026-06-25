-- Run this once in the Railway PostgreSQL console
-- Schema: authors (already created)

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
