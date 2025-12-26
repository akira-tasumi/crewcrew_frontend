'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Rocket, Users, Zap, ChevronRight, Star, Lock, User, AlertCircle } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';

// 背景の浮遊パーティクル
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-purple-400/30 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// 特徴カード
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Icon size={20} className="text-white" />
        </div>
        <h3 className="font-bold text-white">{title}</h3>
      </div>
      <p className="text-purple-200 text-sm">{description}</p>
    </motion.div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { loginWithCredentials, isLoggedIn, isLoading } = useUser();
  const router = useRouter();

  // すでにログイン済みならリダイレクト
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, isLoading, router]);

  // 少し遅らせてフォームを表示（アニメーション用）
  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const result = await loginWithCredentials(username.trim(), password);

    if (result.success) {
      setSuccessMessage(result.message);
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* 背景エフェクト */}
      <FloatingParticles />

      {/* グロー効果 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />

      {/* メインコンテンツ */}
      <div className="relative z-10 w-full max-w-lg">
        {/* ロゴ・タイトル */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block mb-4"
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-3xl shadow-2xl flex items-center justify-center">
              <Sparkles size={48} className="text-white" />
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 mb-2">
            CrewCrew
          </h1>
          <p className="text-purple-200 text-lg">
            AIクルーと一緒に仕事を自動化しよう
          </p>
        </motion.div>

        {/* ログインフォーム */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* エラーメッセージ */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm"
                  >
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* 成功メッセージ */}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 text-sm"
                  >
                    <Sparkles size={18} />
                    <span>{successMessage}</span>
                  </motion.div>
                )}

                {/* ユーザーID */}
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    ユーザーID
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300/50">
                      <User size={20} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ユーザーIDを入力..."
                      maxLength={50}
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-5 py-4 bg-white/10 border-2 border-purple-400/50 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* パスワード */}
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">
                    パスワード
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300/50">
                      <Lock size={20} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="パスワードを入力..."
                      maxLength={100}
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-5 py-4 bg-white/10 border-2 border-purple-400/50 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={!username.trim() || !password.trim() || isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                      />
                      <span>ログイン中...</span>
                    </>
                  ) : (
                    <>
                      <Rocket size={24} />
                      <span>ログイン</span>
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* テストアカウント情報 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-400/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Star size={18} className="text-blue-400" />
                  <span className="text-blue-300 font-bold text-sm">テストアカウント</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200">通常テスト:</span>
                    <span className="font-mono text-white bg-white/10 px-2 py-1 rounded">test / test</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200">デモ (毎回リセット):</span>
                    <span className="font-mono text-white bg-white/10 px-2 py-1 rounded">demo / demo</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 特徴カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <FeatureCard
            icon={Users}
            title="AIクルー"
            description="個性豊かなAIクルーを集めて育成"
            delay={0.6}
          />
          <FeatureCard
            icon={Zap}
            title="タスク自動化"
            description="面倒な作業をAIにお任せ"
            delay={0.7}
          />
          <FeatureCard
            icon={Sparkles}
            title="レベルアップ"
            description="経験値を貯めてクルーを成長"
            delay={0.8}
          />
        </div>

        {/* フッター */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-purple-300/50 text-sm mt-8"
        >
          © 2024 CrewCrew - AI Automation Service
        </motion.p>
      </div>
    </div>
  );
}
