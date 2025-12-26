'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiUrl } from '@/lib/api';

// ローカルストレージ用ユーザー情報の型定義
export type UserData = {
  id: string;
  name: string;
  level: number;
  exp: number;
  gold: number;
  createdAt: string;
};

// バックエンドAPIからのユーザー情報
export type ApiUser = {
  id: number;
  company_name: string;
  user_name: string | null;
  job_title: string | null;
  avatar_data: string | null;
  coin: number;
  ruby: number;
  rank: string;
  office_level: number;
};

// ログインレスポンスの型
type LoginResponse = {
  success: boolean;
  message: string;
  user_id?: number;
  username?: string;
  user_name?: string;
  company_name?: string;
  is_demo?: boolean;
};

// コンテキストの型定義
type UserContextType = {
  user: UserData | null;
  apiUser: ApiUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (name: string) => void;
  loginWithCredentials: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  updateUser: (updates: Partial<UserData>) => void;
  addExp: (amount: number) => void;
  addGold: (amount: number) => void;
  // 新しいAPI連携メソッド
  refreshApiUser: () => Promise<void>;
  updateCoin: (newCoin: number) => void;
  updateRuby: (newRuby: number) => void;
  addCoin: (amount: number) => void;
  subtractCoin: (amount: number) => void;
  addRuby: (amount: number) => void;
  subtractRuby: (amount: number) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'crewcrew_user';

// レベルアップに必要な経験値を計算
const getExpForNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// UUIDを生成
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // バックエンドAPIからユーザー情報を取得
  const refreshApiUser = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/user'));
      if (res.ok) {
        const data = await res.json();
        setApiUser(data);
      }
    } catch (err) {
      console.error('Failed to fetch API user:', err);
    }
  }, []);

  // 初期化：localStorageからユーザー情報を読み込み & APIユーザーを取得
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored) as UserData;
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }

    // APIユーザーも取得
    refreshApiUser();
  }, [refreshApiUser]);

  // 定期的にAPIユーザーを更新（30秒ごと）
  useEffect(() => {
    const interval = setInterval(refreshApiUser, 30000);
    return () => clearInterval(interval);
  }, [refreshApiUser]);

  // ユーザー情報が変更されたらlocalStorageに保存
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  // ログイン処理（従来の名前のみ）
  const login = (name: string) => {
    const newUser: UserData = {
      id: generateId(),
      name: name.trim(),
      level: 1,
      exp: 0,
      gold: 1000, // 初期ゴールド
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    router.push('/');
  };

  // ID/パスワードでログイン
  const loginWithCredentials = async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data: LoginResponse = await res.json();

      if (data.success && data.user_id) {
        // ローカルユーザー情報を保存
        const newUser: UserData = {
          id: String(data.user_id),
          name: data.user_name || data.username || username,
          level: 1,
          exp: 0,
          gold: 3000,
          createdAt: new Date().toISOString(),
        };
        setUser(newUser);

        // APIユーザー情報を取得
        await refreshApiUser();

        router.push('/');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'ログインに失敗しました',
      };
    }
  };

  // ログアウト処理
  const logout = () => {
    // 先にlocalStorageを削除
    localStorage.removeItem(STORAGE_KEY);
    // stateをクリア
    setUser(null);
    setApiUser(null);
    // ログインページへ遷移（ページ全体をリロード）
    window.location.href = '/login';
  };

  // ユーザー情報の更新
  const updateUser = (updates: Partial<UserData>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  };

  // 経験値を追加（レベルアップ処理を含む）
  const addExp = (amount: number) => {
    if (!user) return;

    let newExp = user.exp + amount;
    let newLevel = user.level;

    // レベルアップ判定
    while (newExp >= getExpForNextLevel(newLevel)) {
      newExp -= getExpForNextLevel(newLevel);
      newLevel++;
    }

    setUser({
      ...user,
      exp: newExp,
      level: newLevel,
    });
  };

  // ゴールドを追加
  const addGold = (amount: number) => {
    if (!user) return;
    setUser({
      ...user,
      gold: Math.max(0, user.gold + amount),
    });
  };

  // === 新しいAPI連携メソッド ===

  // コインを直接更新（API呼び出し後の値を反映）
  const updateCoin = useCallback((newCoin: number) => {
    setApiUser((prev) => (prev ? { ...prev, coin: newCoin } : null));
  }, []);

  // ルビーを直接更新
  const updateRuby = useCallback((newRuby: number) => {
    setApiUser((prev) => (prev ? { ...prev, ruby: newRuby } : null));
  }, []);

  // コインを加算（楽観的更新）
  const addCoin = useCallback((amount: number) => {
    setApiUser((prev) => (prev ? { ...prev, coin: prev.coin + amount } : null));
  }, []);

  // コインを減算（楽観的更新）
  const subtractCoin = useCallback((amount: number) => {
    setApiUser((prev) => (prev ? { ...prev, coin: Math.max(0, prev.coin - amount) } : null));
  }, []);

  // ルビーを加算
  const addRuby = useCallback((amount: number) => {
    setApiUser((prev) => (prev ? { ...prev, ruby: prev.ruby + amount } : null));
  }, []);

  // ルビーを減算
  const subtractRuby = useCallback((amount: number) => {
    setApiUser((prev) => (prev ? { ...prev, ruby: Math.max(0, prev.ruby - amount) } : null));
  }, []);

  const value: UserContextType = {
    user,
    apiUser,
    isLoading,
    isLoggedIn: !!user,
    login,
    loginWithCredentials,
    logout,
    updateUser,
    addExp,
    addGold,
    // 新しいAPI連携メソッド
    refreshApiUser,
    updateCoin,
    updateRuby,
    addCoin,
    subtractCoin,
    addRuby,
    subtractRuby,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// カスタムフック
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// 認証ガードコンポーネント
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isLoggedIn && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, pathname, router]);

  // ローディング中はスケルトン表示
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

  // 未ログインでログインページ以外はnull（リダイレクト中）
  if (!isLoggedIn && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
