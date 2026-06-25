'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleLogin() {
        setLoading(true);
        setError('');

        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
            router.push('/admin/dashboard');
        } else {
            setError('Invalid username or password.');
            setLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-6"
            style={{ backgroundColor: '#faf6f1' }}
        >
            <div
                className="w-full max-w-sm rounded-xl p-10 shadow-lg"
                style={{ backgroundColor: '#ffffff' }}
            >
                <h1 className="font-serif text-2xl mb-8 text-center" style={{ color: '#2c2c2c' }}>
                    Admin
                </h1>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1" style={{ color: '#8c7b6b' }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            className="w-full border rounded-lg px-4 py-2 text-base outline-none focus:ring-2"
                            style={{ borderColor: '#d4c9be', color: '#2c2c2c' }}
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1" style={{ color: '#8c7b6b' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            className="w-full border rounded-lg px-4 py-2 text-base outline-none focus:ring-2"
                            style={{ borderColor: '#d4c9be', color: '#2c2c2c' }}
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full py-2 rounded-lg text-white font-medium transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: '#6b4c3b' }}
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}
