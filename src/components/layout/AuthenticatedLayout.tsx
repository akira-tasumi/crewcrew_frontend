'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import Header from './Header';
import Sidebar from './Sidebar';

// 認証不要のパス
const PUBLIC_PATHS = ['/login'];

export function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, isLoading } = useUser();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isLoading && !isLoggedIn && !isPublicPath) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, isPublicPath, router]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-purple-200 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // ログインページは認証不要・レイアウトなし
  if (isPublicPath) {
    return <>{children}</>;
  }

  // 未ログインでプライベートページ → リダイレクト中
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-purple-200 animate-pulse">Redirecting...</p>
        </div>
      </div>
    );
  }

  // ログイン済み → 通常レイアウト
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0f1419]">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f1419] dark:to-[#1a1f2e]">
          {children}
        </main>
      </div>
    </div>
  );
}
