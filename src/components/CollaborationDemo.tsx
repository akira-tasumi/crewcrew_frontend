'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Play, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppSound } from '@/contexts/SoundContext';
import { apiUrl } from '@/lib/api';

type CollaborationStep = {
  agent_id: number;
  agent_name: string;
  agent_image: string;
  role: string;
  status: string;
  output: string | null;
};

type CollaborationResponse = {
  success: boolean;
  steps: CollaborationStep[];
  final_article: string | null;
  error: string | null;
};

type Phase =
  | 'idle'
  | 'analyst_thinking'
  | 'baton_pass'
  | 'writer_writing'
  | 'complete';

type Agent = {
  id: number;
  name: string;
  image: string;
  role: string;
  x: number;
  y: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  analystAgent: Agent;
  writerAgent: Agent;
};

export default function CollaborationDemo({
  isOpen,
  onClose,
  analystAgent,
  writerAgent,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [youtubeUrl, setYoutubeUrl] = useState(
    'https://www.youtube.com/watch?v=AI_future_2025'
  );
  const [result, setResult] = useState<CollaborationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { playSound } = useAppSound();

  // リセット
  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  // Confetti発射
  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3'],
    });
  }, []);

  // デモ実行
  const runDemo = useCallback(async () => {
    setError(null);
    setResult(null);

    playSound('click'); // 開始音

    // Phase 1: Analyst考え中
    setPhase('analyst_thinking');
    playSound('typing'); // タイピング音

    try {
      // APIを呼び出し（実際の処理が完了するまで待つ）
      const response = await fetch(apiUrl('/api/demo/collaboration'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data: CollaborationResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      // Phase 2: バトンパス
      setPhase('baton_pass');
      playSound('success'); // 分析完了音
      await new Promise((r) => setTimeout(r, 2000));

      // Phase 3: Writer執筆中
      setPhase('writer_writing');
      playSound('typing'); // タイピング音
      await new Promise((r) => setTimeout(r, 1500));

      // Phase 4: 完了
      setResult(data);
      setPhase('complete');
      playSound('celebrate'); // 祝福音
      fireConfetti();
    } catch (err) {
      playSound('error'); // エラー音
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setPhase('idle');
    }
  }, [youtubeUrl, fireConfetti, playSound]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={phase === 'idle' || phase === 'complete' ? onClose : undefined}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/grid.svg')] opacity-10" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <FileText size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">
                    クルー連携デモ
                  </h2>
                  <p className="text-white/80 text-sm">
                    YouTube動画 → ブログ記事化
                  </p>
                </div>
              </div>
              {(phase === 'idle' || phase === 'complete') && (
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              )}
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="p-6">
            {/* エージェント表示エリア */}
            <div className="relative h-48 mb-6 bg-slate-800/50 rounded-2xl overflow-hidden">
              {/* 背景グリッド */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-full w-px bg-slate-600"
                    style={{ left: `${i * 10 + 10}%` }}
                  />
                ))}
              </div>

              {/* Agent A (Analyst) */}
              <motion.div
                className="absolute left-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center"
                animate={
                  phase === 'analyst_thinking'
                    ? { scale: [1, 1.05, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.5, repeat: phase === 'analyst_thinking' ? Infinity : 0 }}
              >
                <div className="relative">
                  <motion.div
                    className={`w-20 h-20 rounded-full overflow-hidden border-4 shadow-lg ${
                      phase === 'analyst_thinking'
                        ? 'border-yellow-400'
                        : phase === 'complete'
                        ? 'border-green-400'
                        : 'border-slate-600'
                    }`}
                    animate={
                      phase === 'analyst_thinking'
                        ? { boxShadow: ['0 0 0 rgba(250,204,21,0)', '0 0 20px rgba(250,204,21,0.5)', '0 0 0 rgba(250,204,21,0)'] }
                        : {}
                    }
                    transition={{ duration: 1.5, repeat: phase === 'analyst_thinking' ? Infinity : 0 }}
                  >
                    <Image
                      src={analystAgent.image}
                      alt={analystAgent.name}
                      width={80}
                      height={80}
                      className="object-cover scale-150 translate-y-2"
                    />
                  </motion.div>

                  {/* 考え中アイコン */}
                  <AnimatePresence>
                    {phase === 'analyst_thinking' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-lg font-bold shadow-lg"
                      >
                        💭
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 完了チェック */}
                  {(phase === 'baton_pass' || phase === 'writer_writing' || phase === 'complete') && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1"
                    >
                      <CheckCircle size={16} className="text-white" />
                    </motion.div>
                  )}
                </div>

                <p className="mt-2 text-sm font-bold text-white">
                  {analystAgent.name}
                </p>
                <p className="text-xs text-slate-400">分析担当</p>
              </motion.div>

              {/* バトンパス（書類アイコン） */}
              <AnimatePresence>
                {phase === 'baton_pass' && (
                  <motion.div
                    initial={{ x: '20%', y: '-50%', opacity: 0, scale: 0 }}
                    animate={{
                      x: ['20%', '50%', '75%'],
                      y: ['-50%', '-80%', '-50%'],
                      opacity: [0, 1, 1, 0],
                      scale: [0.5, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    className="absolute top-1/2 left-[15%] text-4xl"
                    style={{ transform: 'translate(-50%, -50%)' }}
                  >
                    📄
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 接続線 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <motion.path
                  d="M 150 96 Q 400 60 650 96"
                  stroke={
                    phase === 'baton_pass'
                      ? '#facc15'
                      : phase === 'writer_writing' || phase === 'complete'
                      ? '#4ade80'
                      : '#475569'
                  }
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="10 5"
                  initial={{ pathLength: 0, opacity: 0.3 }}
                  animate={{
                    pathLength: phase !== 'idle' ? 1 : 0,
                    opacity: phase !== 'idle' ? 0.6 : 0.3,
                  }}
                  transition={{ duration: 1 }}
                />
              </svg>

              {/* Agent B (Writer) */}
              <motion.div
                className="absolute right-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center"
                animate={
                  phase === 'writer_writing'
                    ? { scale: [1, 1.05, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.5, repeat: phase === 'writer_writing' ? Infinity : 0 }}
              >
                <div className="relative">
                  <motion.div
                    className={`w-20 h-20 rounded-full overflow-hidden border-4 shadow-lg ${
                      phase === 'writer_writing'
                        ? 'border-blue-400'
                        : phase === 'complete'
                        ? 'border-green-400'
                        : 'border-slate-600'
                    }`}
                    animate={
                      phase === 'writer_writing'
                        ? { boxShadow: ['0 0 0 rgba(96,165,250,0)', '0 0 20px rgba(96,165,250,0.5)', '0 0 0 rgba(96,165,250,0)'] }
                        : {}
                    }
                    transition={{ duration: 1.5, repeat: phase === 'writer_writing' ? Infinity : 0 }}
                  >
                    <Image
                      src={writerAgent.image}
                      alt={writerAgent.name}
                      width={80}
                      height={80}
                      className="object-cover scale-150 translate-y-2"
                    />
                  </motion.div>

                  {/* 執筆中アイコン */}
                  <AnimatePresence>
                    {phase === 'writer_writing' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-400 text-blue-900 px-3 py-1 rounded-full text-lg font-bold shadow-lg"
                      >
                        ✍️
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 完了チェック */}
                  {phase === 'complete' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1"
                    >
                      <CheckCircle size={16} className="text-white" />
                    </motion.div>
                  )}
                </div>

                <p className="mt-2 text-sm font-bold text-white">
                  {writerAgent.name}
                </p>
                <p className="text-xs text-slate-400">ライター担当</p>
              </motion.div>

              {/* 納品！バナー */}
              <AnimatePresence>
                {phase === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full font-black text-lg shadow-lg"
                  >
                    🎉 納品完了！
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* URL入力 & 実行ボタン */}
            {phase === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    YouTube URL
                  </label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={runDemo}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all"
                >
                  <Play size={20} />
                  デモを実行する
                </motion.button>
              </motion.div>
            )}

            {/* 処理中の表示 */}
            {(phase === 'analyst_thinking' || phase === 'baton_pass' || phase === 'writer_writing') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <div className="flex items-center justify-center gap-3 text-slate-300">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-lg font-medium">
                    {phase === 'analyst_thinking' && `${analystAgent.name}が動画を分析中...`}
                    {phase === 'baton_pass' && '分析結果を引き継ぎ中...'}
                    {phase === 'writer_writing' && `${writerAgent.name}が記事を執筆中...`}
                  </span>
                </div>
              </motion.div>
            )}

            {/* 結果表示 */}
            {phase === 'complete' && result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-slate-700/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                  <h4 className="text-sm font-bold text-purple-400 mb-2">
                    📝 生成された記事
                  </h4>
                  <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {result.final_article}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    playSound('confirm');
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                >
                  完了
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
