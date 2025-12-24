'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gem, Building2, Crown, User, ChevronDown, Moon, Sun, Volume2, VolumeX, Clock } from 'lucide-react';
import { useAppSound } from '@/contexts/SoundContext';
import confetti from 'canvas-confetti';
import { apiUrl } from '@/lib/api';

type User = {
  id: number;
  company_name: string;
  coin: number;
  ruby: number;
  rank: string;
};

function CompanyBadge({ companyName, rank }: { companyName: string; rank: string }) {
  const getRankColor = (rank: string) => {
    switch (rank.toUpperCase()) {
      case 'S':
        return 'from-yellow-400 to-amber-500 text-amber-900';
      case 'A':
        return 'from-purple-400 to-purple-600 text-white';
      case 'B':
        return 'from-blue-400 to-blue-600 text-white';
      case 'C':
        return 'from-green-400 to-green-600 text-white';
      default:
        return 'from-gray-400 to-gray-600 text-white';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 size={18} className="text-purple-500" />
      <span className="font-bold text-gray-800 dark:text-gray-100">{companyName}</span>
      <div
        className={`px-2 py-0.5 bg-gradient-to-r ${getRankColor(rank)} rounded-full text-xs font-bold`}
      >
        {rank}
      </div>
    </div>
  );
}

function CoinDisplay({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-yellow-400/20 dark:bg-yellow-400/10 px-3 py-1.5 rounded-xl">
      <Coins size={16} className="text-yellow-500" />
      <span className="font-bold text-yellow-700 dark:text-yellow-400">{coins.toLocaleString()}</span>
    </div>
  );
}

function RubyDisplay({ rubies }: { rubies: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-pink-400/20 dark:bg-pink-400/10 px-3 py-1.5 rounded-xl">
      <Gem size={16} className="text-pink-500" />
      <span className="font-bold text-pink-700 dark:text-pink-400">{rubies.toLocaleString()}</span>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { playSound } = useAppSound();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  const handleToggle = () => {
    playSound('click');
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={handleToggle}
      className="relative w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden"
      aria-label={isDark ? 'ライトモードに切替' : 'ダークモードに切替'}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
      <div className={`absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`} />
      <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
        {isDark ? (
          <Moon size={18} className="text-yellow-300" />
        ) : (
          <Sun size={18} className="text-white" />
        )}
      </div>
    </button>
  );
}

function SoundToggle() {
  const { isMuted, toggleMute, playSound } = useAppSound();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  const handleToggle = () => {
    toggleMute();
    // ミュート解除時に確認音を鳴らす
    if (isMuted) {
      setTimeout(() => playSound('confirm'), 100);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden ${
        isMuted
          ? 'bg-gray-200 dark:bg-gray-700'
          : 'bg-gradient-to-br from-green-400 to-emerald-500'
      }`}
      aria-label={isMuted ? 'サウンドをオンにする' : 'サウンドをオフにする'}
    >
      <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
        {isMuted ? (
          <VolumeX size={18} className="text-gray-500 dark:text-gray-400" />
        ) : (
          <Volume2 size={18} className="text-white" />
        )}
      </div>
    </button>
  );
}

function DigitalClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    setTime(new Date());

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted || !time) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse">
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
        <div className="w-16 h-5 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    );
  }

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  // 曜日を日本語で
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[time.getDay()];

  // 月/日
  const month = (time.getMonth() + 1).toString();
  const day = time.getDate().toString();

  const isDark = resolvedTheme === 'dark';

  // ライトモード: 明るく爽やかなデザイン
  // ダークモード: サイバーパンク風のデザイン
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border overflow-hidden transition-all duration-300 ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-purple-500/30 shadow-lg shadow-purple-500/10'
          : 'bg-gradient-to-r from-white via-purple-50 to-white border-purple-200 shadow-md shadow-purple-100'
      }`}
    >
      {/* 背景のグリッドパターン */}
      <div className={`absolute inset-0 ${isDark ? 'opacity-10' : 'opacity-20'}`}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: isDark
              ? `
                linear-gradient(to right, rgba(168, 85, 247, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(168, 85, 247, 0.3) 1px, transparent 1px)
              `
              : `
                linear-gradient(to right, rgba(168, 85, 247, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(168, 85, 247, 0.15) 1px, transparent 1px)
              `,
            backgroundSize: '8px 8px',
          }}
        />
      </div>

      {/* 走査線エフェクト（ダークモードのみ） */}
      {isDark && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-400/5 to-transparent"
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* キラキラエフェクト（ライトモードのみ） */}
      {!isDark && (
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute top-1 right-3 w-1 h-1 bg-purple-400 rounded-full" />
          <div className="absolute bottom-2 right-8 w-0.5 h-0.5 bg-pink-400 rounded-full" />
          <div className="absolute top-2 left-12 w-0.5 h-0.5 bg-cyan-400 rounded-full" />
        </motion.div>
      )}

      {/* アイコン */}
      <div className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-lg ${
        isDark ? 'bg-purple-500/20' : 'bg-purple-100'
      }`}>
        <Clock size={14} className={isDark ? 'text-purple-400' : 'text-purple-500'} />
      </div>

      {/* 日付 */}
      <div className="relative z-10 flex flex-col items-center text-[10px] leading-tight mr-1">
        <span className={`font-medium ${isDark ? 'text-purple-300/80' : 'text-purple-600'}`}>
          {month}/{day}
        </span>
        <span className={`font-bold ${isDark ? 'text-cyan-400/80' : 'text-pink-500'}`}>
          ({weekday})
        </span>
      </div>

      {/* 時刻 */}
      <div className="relative z-10 flex items-baseline gap-0.5 font-mono">
        <motion.span
          key={`h-${hours}`}
          initial={{ opacity: 0.5, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-lg font-bold ${
            isDark
              ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
              : 'text-purple-600'
          }`}
          style={{ fontFamily: "'Orbitron', 'Courier New', monospace" }}
        >
          {hours}
        </motion.span>
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-pink-400'}`}
        >
          :
        </motion.span>
        <motion.span
          key={`m-${minutes}`}
          initial={{ opacity: 0.5, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-lg font-bold ${
            isDark
              ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
              : 'text-purple-600'
          }`}
          style={{ fontFamily: "'Orbitron', 'Courier New', monospace" }}
        >
          {minutes}
        </motion.span>
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-pink-400'}`}
        >
          :
        </motion.span>
        <motion.span
          key={`s-${seconds}`}
          initial={{ opacity: 0.5, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-sm font-bold w-5 ${isDark ? 'text-purple-300' : 'text-purple-400'}`}
          style={{ fontFamily: "'Orbitron', 'Courier New', monospace" }}
        >
          {seconds}
        </motion.span>
      </div>

      {/* JST表示 */}
      <span className={`relative z-10 text-[9px] font-bold ml-1 ${
        isDark ? 'text-purple-400/60' : 'text-purple-400'
      }`}>
        JST
      </span>
    </motion.div>
  );
}

function UserProfile() {
  return (
    <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
      <DigitalClock />
      <div className="flex items-center gap-2">
        <SoundToggle />
        <ThemeToggle />
        <button className="flex items-center gap-1 group ml-1">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-md group-hover:ring-purple-300 transition-all">
            <User size={20} className="text-white" />
          </div>
          <ChevronDown
            size={16}
            className="text-gray-400 group-hover:text-purple-500 transition-colors"
          />
        </button>
      </div>
    </div>
  );
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showGodModeToast, setShowGodModeToast] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { playSound } = useAppSound();

  // ユーザー情報を取得
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/user'));
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // 定期的に更新（30秒ごと）
    const interval = setInterval(fetchUser, 30000);
    return () => clearInterval(interval);
  }, [fetchUser]);

  // God Mode発動時のconfetti
  const fireGodModeConfetti = useCallback(() => {
    // 金色の紙吹雪を大量に
    const count = 200;
    const defaults = {
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#FFE4B5', '#FFFF00'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  // God Mode APIを呼び出す
  const activateGodMode = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/user/god-mode'), {
        method: 'POST',
      });
      if (res.ok) {
        // 効果音
        playSound('coin');

        // 派手なconfetti
        fireGodModeConfetti();

        // トースト表示
        setShowGodModeToast(true);
        setTimeout(() => setShowGodModeToast(false), 4000);

        // ユーザー情報を再取得
        await fetchUser();
      }
    } catch (err) {
      console.error('Failed to activate god mode:', err);
    }
  }, [playSound, fireGodModeConfetti, fetchUser]);

  // ロゴクリックハンドラー
  const handleLogoClick = useCallback(() => {
    // タイムアウトをリセット
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);

    if (newCount >= 5) {
      // 5回クリックでGod Mode発動
      activateGodMode();
      setLogoClickCount(0);
    } else {
      // 1秒以内に次のクリックがなければリセット
      clickTimeoutRef.current = setTimeout(() => {
        setLogoClickCount(0);
      }, 1000);
    }
  }, [logoClickCount, activateGodMode]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo - 5回クリックでGod Mode */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={handleLogoClick}
        >
          <motion.div
            className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={logoClickCount > 0 ? { rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.2 }}
          >
            <span className="text-white font-bold text-lg">K</span>
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            クルクル
          </span>
          {/* クリックカウンター（デバッグ用に薄く表示） */}
          {logoClickCount > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.3, scale: 1 }}
              className="text-xs text-gray-400"
            >
              {logoClickCount}/5
            </motion.span>
          )}
        </div>

        {/* Resource Bar - Center */}
        {user ? (
          <div className="flex items-center gap-6 bg-gray-50 dark:bg-gray-800/50 px-6 py-2 rounded-2xl border border-gray-100 dark:border-gray-700">
            <CompanyBadge companyName={user.company_name} rank={user.rank} />
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <CoinDisplay coins={user.coin} />
            <RubyDisplay rubies={user.ruby} />
          </div>
        ) : (
          <div className="flex items-center gap-6 bg-gray-50 dark:bg-gray-800/50 px-6 py-2 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="animate-pulse flex items-center gap-4">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        )}

        {/* User Profile - Right */}
        <UserProfile />
      </div>

      {/* God Mode Toast */}
      <AnimatePresence>
        {showGodModeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[100] bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-3xl"
              >
                💰
              </motion.div>
              <div>
                <p className="font-black text-lg">DEBUG MODE ACTIVATED</p>
                <p className="text-white/90 text-sm">You are rich now! +10,000 Coins, +100 Rubies</p>
              </div>
              <motion.div
                animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-3xl"
              >
                💎
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
