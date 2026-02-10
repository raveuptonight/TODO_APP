'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('ログインに失敗しました');
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
          <p className="text-gray-500 text-sm tracking-wider">LOGIN</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-dark rounded-2xl p-8 neon-border">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-gray-400 text-xs tracking-wider mb-2">EMAIL</label>
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
            <label className="block text-gray-400 text-xs tracking-wider mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-cyan-500/30
                focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold
              rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed tracking-wider neon-border"
          >
            {loading ? 'LOADING...' : 'LOGIN'}
          </button>

          <div className="mt-6 text-center">
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 text-sm tracking-wider">
              アカウント作成はこちら →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
