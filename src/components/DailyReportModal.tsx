'use client';

import { motion, AnimatePresence } from 'framer-motion';
import CrewImage from '@/components/CrewImage';
import { X, CalendarCheck, Stamp, Coins, CheckCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAppSound } from '@/contexts/SoundContext';

type StampInfo = {
  date: string;
  has_stamp: boolean;
};

type DailyReportResponse = {
  success: boolean;
  date: string;
  task_count: number;
  earned_coins: number;
  login_bonus_given: boolean;
  login_bonus_amount: number;
  stamps: StampInfo[];
  consecutive_days: number;
  labor_words: string;
  partner_name: string | null;
  partner_image: string | null;
  new_coin: number | null;
  error: string | null;
};

type Partner = {
  id: number;
  name: string;
  role: string;
  level: number;
  image: string;
  personality: string | null;
  greeting: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  report: DailyReportResponse | null;
  partner: Partner | null;
  onCoinUpdate: () => void;
};

// 演出フェーズ
type Phase = 'counting' | 'stamp' | 'partner' | 'complete';

export default function DailyReportModal({
  isOpen,
  onClose,
  report,
  partner,
  onCoinUpdate,
}: Props) {
  const [phase, setPhase] = useState<Phase>('counting');
  const [displayedTaskCount, setDisplayedTaskCount] = useState(0);
  const [displayedCoins, setDisplayedCoins] = useState(0);
  const [stampPressed, setStampPressed] = useState(false);
  const { playSound } = useAppSound();

  // Confetti発射
  const fireConfetti = useCallback(() => {
    // 左から
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.2, y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#FFFF00'],
    });
    // 右から
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.8, y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#FFFF00'],
    });
  }, []);

  // アニメーションシーケンス
  useEffect(() => {
    if (!isOpen || !report) {
      // リセット
      setPhase('counting');
      setDisplayedTaskCount(0);
      setDisplayedCoins(0);
      setStampPressed(false);
      return;
    }

    // 開始時にドラムロール音
    playSound('drumroll');

    // Phase 1: カウントアップ（1.5秒）
    const taskDuration = 1500;
    const taskInterval = 50;
    const taskSteps = taskDuration / taskInterval;
    const taskIncrement = Math.ceil(report.task_count / taskSteps);

    const coinDuration = 1500;
    const coinInterval = 30;
    const coinSteps = coinDuration / coinInterval;
    const coinIncrement = Math.ceil(report.earned_coins / coinSteps);

    let taskCounter = 0;
    let coinCounter = 0;

    const taskTimer = setInterval(() => {
      taskCounter += taskIncrement;
      if (taskCounter >= report.task_count) {
        setDisplayedTaskCount(report.task_count);
        clearInterval(taskTimer);
      } else {
        setDisplayedTaskCount(taskCounter);
      }
    }, taskInterval);

    const coinTimer = setInterval(() => {
      coinCounter += coinIncrement;
      if (coinCounter >= report.earned_coins) {
        setDisplayedCoins(report.earned_coins);
        clearInterval(coinTimer);
      } else {
        setDisplayedCoins(coinCounter);
      }
    }, coinInterval);

    // Phase 2: スタンプ（1.5秒後）
    const stampTimeout = setTimeout(() => {
      setPhase('stamp');
    }, 1800);

    // スタンプが押される（2.5秒後）
    const stampPressTimeout = setTimeout(() => {
      setStampPressed(true);
      playSound('celebrate'); // クラッカー音
      fireConfetti();
    }, 2800);

    // Phase 3: 相棒（4秒後）
    const partnerTimeout = setTimeout(() => {
      setPhase('partner');
    }, 4000);

    // Phase 4: 完了（5秒後）
    const completeTimeout = setTimeout(() => {
      setPhase('complete');
      playSound('success'); // 完了音
      if (report.login_bonus_given) {
        playSound('coin'); // ボーナスコイン音
        onCoinUpdate();
      }
    }, 5000);

    return () => {
      clearInterval(taskTimer);
      clearInterval(coinTimer);
      clearTimeout(stampTimeout);
      clearTimeout(stampPressTimeout);
      clearTimeout(partnerTimeout);
      clearTimeout(completeTimeout);
    };
  }, [isOpen, report, fireConfetti, onCoinUpdate, playSound]);

  if (!isOpen || !report) return null;

  // 曜日名
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={phase === 'complete' ? onClose : undefined}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/40 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-4 border-orange-300 dark:border-orange-600"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー - 暖色系グラデーション */}
          <div className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 p-6 relative overflow-hidden">
            {/* 装飾的な円 */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-300/30 rounded-full" />
            <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-orange-300/30 rounded-full" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-white/30 rounded-full p-2"
                >
                  <CalendarCheck size={32} className="text-orange-800" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-black text-orange-900">本日の業務報告</h2>
                  <p className="text-orange-800/80 text-sm">{report.date}</p>
                </div>
              </div>
              {phase === 'complete' && (
                <button
                  onClick={onClose}
                  className="text-orange-800/80 hover:text-orange-900 transition-colors"
                >
                  <X size={24} />
                </button>
              )}
            </div>
          </div>

          {/* Step 1: カウントアップ演出 */}
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <p className="text-center text-orange-800 dark:text-orange-200 font-bold mb-4 text-lg">
                🎉 今日の成果... 🎉
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* タスク数 - ドラムロール風 */}
                <motion.div
                  className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-800/50 dark:to-amber-800/50 rounded-2xl p-4 text-center border-2 border-orange-200 dark:border-orange-700"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle size={20} className="text-orange-600" />
                    <p className="text-orange-700 dark:text-orange-300 text-sm font-medium">
                      消化タスク
                    </p>
                  </div>
                  <motion.p
                    className="text-5xl font-black text-orange-600 dark:text-orange-400"
                    animate={phase === 'counting' ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.1, repeat: phase === 'counting' ? Infinity : 0 }}
                  >
                    {displayedTaskCount}
                    <span className="text-xl ml-1">件</span>
                  </motion.p>
                </motion.div>

                {/* 獲得コイン - ドラムロール風 */}
                <motion.div
                  className="bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-800/50 dark:to-amber-800/50 rounded-2xl p-4 text-center border-2 border-yellow-200 dark:border-yellow-700"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Coins size={20} className="text-yellow-600" />
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                      獲得コイン
                    </p>
                  </div>
                  <motion.p
                    className="text-5xl font-black text-yellow-600 dark:text-yellow-400"
                    animate={phase === 'counting' ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.1, repeat: phase === 'counting' ? Infinity : 0 }}
                  >
                    {displayedCoins}
                    <span className="text-xl ml-1">枚</span>
                  </motion.p>
                </motion.div>
              </div>
            </motion.div>

            {/* Step 2: スタンプカード（カレンダー風） */}
            <AnimatePresence>
              {(phase === 'stamp' || phase === 'partner' || phase === 'complete') && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="mb-6"
                >
                  <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-800/30 dark:to-orange-800/30 rounded-2xl p-4 border-2 border-amber-300 dark:border-amber-600 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Stamp size={20} className="text-amber-700" />
                        <h3 className="font-bold text-amber-900 dark:text-amber-200">
                          出勤カード
                        </h3>
                      </div>
                      <div className="bg-amber-200 dark:bg-amber-700 px-3 py-1 rounded-full">
                        <span className="text-amber-800 dark:text-amber-200 text-sm font-bold">
                          連続 {report.consecutive_days} 日 🔥
                        </span>
                      </div>
                    </div>

                    {/* 7日分のスタンプカード */}
                    <div className="grid grid-cols-7 gap-2">
                      {report.stamps.map((stamp, index) => {
                        const stampDate = new Date(stamp.date);
                        const dayOfWeek = stampDate.getDay();
                        const dayNumber = stampDate.getDate();
                        const isToday = stamp.date === report.date;

                        return (
                          <motion.div
                            key={stamp.date}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.05 * index }}
                            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center shadow-md ${
                              isToday
                                ? 'bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 border-2 border-orange-400'
                                : 'bg-white dark:bg-gray-700'
                            }`}
                          >
                            <span
                              className={`text-xs font-bold ${
                                dayOfWeek === 0
                                  ? 'text-red-500'
                                  : dayOfWeek === 6
                                  ? 'text-blue-500'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {dayNames[dayOfWeek]}
                            </span>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                              {dayNumber}
                            </span>

                            {/* スタンプ - 今日の分は特別演出 */}
                            {stamp.has_stamp && (
                              <motion.div
                                initial={
                                  isToday
                                    ? { scale: 5, rotate: -30, opacity: 0 }
                                    : { scale: 1, opacity: 1 }
                                }
                                animate={
                                  isToday && stampPressed
                                    ? { scale: 1, rotate: 0, opacity: 1 }
                                    : isToday
                                    ? { scale: 5, rotate: -30, opacity: 0 }
                                    : { scale: 1, opacity: 1 }
                                }
                                transition={
                                  isToday
                                    ? { type: 'spring', stiffness: 500, damping: 15 }
                                    : { delay: 0.1 * index }
                                }
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 ${
                                    isToday
                                      ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-300'
                                      : 'bg-red-500/80 border-red-300'
                                  }`}
                                >
                                  <span className="text-white font-black text-sm">
                                    {isToday ? 'お疲' : '済'}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: 相棒の労いメッセージ */}
            <AnimatePresence>
              {(phase === 'partner' || phase === 'complete') && partner && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-4 border-2 border-purple-200 dark:border-purple-700"
                >
                  <div className="flex items-start gap-4">
                    {/* 相棒画像 */}
                    <motion.div
                      className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-400 shadow-lg bg-gradient-to-br from-purple-100 to-pink-100 flex-shrink-0"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <CrewImage
                        src={partner.image}
                        alt={partner.name}
                        width={80}
                        height={80}
                        className="object-cover scale-150 translate-y-2"
                      />
                    </motion.div>

                    {/* メッセージ */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-purple-200 dark:bg-purple-700 text-purple-700 dark:text-purple-200 text-xs font-bold px-2 py-0.5 rounded-full">
                          {report.partner_name}
                        </span>
                        <span className="text-purple-500 text-xs">からのメッセージ</span>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-md relative"
                      >
                        {/* 吹き出しの三角 */}
                        <div className="absolute left-0 top-4 -translate-x-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white dark:border-r-gray-800" />
                        <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
                          {report.labor_words}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* フッター */}
          <AnimatePresence>
            {phase === 'complete' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-orange-200 dark:border-orange-700 p-4 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    playSound('confirm');
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-4 rounded-2xl shadow-lg transition-all text-lg"
                >
                  🌙 お疲れ様でした！
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
