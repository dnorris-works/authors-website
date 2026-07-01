import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Deep Field Press",
    description: "Author websites by Deep Field Press.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
