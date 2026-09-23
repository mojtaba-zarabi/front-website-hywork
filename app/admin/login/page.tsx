// app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // بررسی اطلاعات ورود
    if (email === 'admin@site.com' && password === 'admin123') {
      localStorage.setItem('adminToken', 'dummy-admin-token');
      console.log('ورود موفق - token ذخیره شد');
      router.push('/admin/dashboard');
    } else {
      setError('ایمیل یا رمز عبور اشتباه است');
      console.log('ورود ناموفق:', { email, password });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-10 w-full max-w-[400px] shadow-[0_20px_35px_rgba(0,0,0,0.1)]">
        <h2 className="text-center mb-8 text-[#1e293b] text-2xl font-bold">
          ورود به پنل مدیریت
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-5">
            <label className="block mb-2 font-medium text-[#334155] text-sm">
              ایمیل
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="admin@site.com"
              required
            />
          </div>
          
          <div className="mb-5">
            <label className="block mb-2 font-medium text-[#334155] text-sm">
              رمز عبور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="••••••"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-[13px] text-center mb-4">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e293b] text-white border-none py-3 rounded-[40px] text-base font-semibold cursor-pointer transition-all hover:bg-[#334155] disabled:opacity-70 disabled:cursor-not-allowed mt-2.5"
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
      </div>
    </div>
  );
}