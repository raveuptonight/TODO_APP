'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登録に失敗しました');
      } else {
        router.push('/login?registered=true');
      }
    } catch (err) {
      setError('登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen normal-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-cyan-300 mb-2"
            style={{ textShadow: '0 0 20px #00d4ff' }}>
            🎰 PACHINKO TODO 🎰
          </h1>
          <p className="text-gray-500 text-sm tracking-wider">CREATE ACCOUNT</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-dark rounded-2xl p-8 neon-border">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-gray-400 text-xs tracking-wider mb-2">NAME (任意)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-cyan-500/30
                focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              placeholder="プレイヤー名"
            />
          </div>

          <div className="mb-5">
            <label className="block text-gray-400 text-xs tracking-wider mb-2">EMAIL *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-cyan-500/30
                focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 text-xs tracking-wider mb-2">PASSWORD *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-cyan-500/30
                focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              minLength={6}
              required
            />
            <p className="text-gray-600 text-xs mt-1">6文字以上</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold
              rounded-xl hover:from-pink-500 hover:to-purple-500 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed tracking-wider neon-border-pink"
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 text-sm tracking-wider">
              ← ログインはこちら
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
