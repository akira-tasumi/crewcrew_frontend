'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoorOpen, Handshake, Sparkles, Coins, Heart, X } from 'lucide-react';
import CrewImage from './CrewImage';
import { Crew } from './CrewCard';
import { useAppSound } from '@/contexts/SoundContext';

// 感謝メッセージのパターン
const FAREWELL_MESSAGES = [
  'ボスのおかげで成長できました！新天地でも頑張ります！',
  'たくさんの経験をありがとう。この会社で学んだこと、一生忘れません。',
  '短い間でしたが、最高のチームでした！いつかまた会いましょう！',
  'ここでの日々は宝物です。新しい場所でも、教わったことを活かします！',
  'お世話になりました！ボスの元で働けて幸せでした！',
  '次のステージへ旅立ちます。いつか恩返しができますように！',
  'さよならじゃない、また会う日まで！ありがとうございました！',
  '最高の仲間たちに出会えて感謝です。みんなによろしく伝えてください！',
];

// 性格ごとの追加メッセージ
const PERSONALITY_FAREWELL: Record<string, string[]> = {
  'Hot-blooded': [
    '燃え尽きるまで戦えた！最高だったぜ！',
    '俺はもっと強くなって戻ってくる！待ってろよ！',
  ],
  'Cool': [
    '...感謝している。言葉にするのは苦手だが。',
    'データ上、最適な選択だ。...寂しくなるな。',
  ],
  'Friendly': [
    'みんな大好き！また遊びに来るね！',
    '友達でいてくれてありがとう！',
  ],
  'Mysterious': [
    '運命がまた我々を引き合わせるだろう...',
    '星が告げている。これは終わりではない、と。',
  ],
  'Cheerful': [
    'わーん、寂しいけど頑張る！ばいばーい！',
    '楽しかったー！また絶対会おうね！',
  ],
};

type FarewellStep = 'confirm' | 'message' | 'departure' | 'complete';

type FarewellModalProps = {
  isOpen: boolean;
  onClose: () => void;
  crew: Crew | null;
  onConfirm: (coinReward: number) => void;
};

// コイン計算関数
export function calculateFarewellCoin(crew: Crew): number {
  const levelBonus = crew.level * 100;
  const rarityBonus = (crew.rarity || 1) * 500;
  const expBonus = Math.floor(crew.exp / 10);
  return levelBonus + rarityBonus + expBonus;
}

export default function FarewellModal({ isOpen, onClose, crew, onConfirm }: FarewellModalProps) {
  const [step, setStep] = useState<FarewellStep>('confirm');
  const [farewellMessage, setFarewellMessage] = useState('');
  const [displayedCoins, setDisplayedCoins] = useState(0);
  const { playSound } = useAppSound();

  const coinReward = crew ? calculateFarewellCoin(crew) : 0;

  // モーダルが開くたびにリセット
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setDisplayedCoins(0);
    }
  }, [isOpen]);

  // 感謝メッセージをランダム選択
  const selectFarewellMessage = useCallback(() => {
    const allMessages = [...FAREWELL_MESSAGES];

    // 性格に応じたメッセージを追加
    if (crew?.personality && PERSONALITY_FAREWELL[crew.personality]) {
      allMessages.push(...PERSONALITY_FAREWELL[crew.personality]);
    }

    return allMessages[Math.floor(Math.random() * allMessages.length)];
  }, [crew?.personality]);

  // 承認ボタンを押したとき
  const handleApprove = () => {
    playSound('confirm');
    setFarewellMessage(selectFarewellMessage());
    setStep('message');
  };

  // メッセージを読んだ後
  const handleContinue = () => {
    playSound('click');
    setStep('departure');

    // 2秒後に完了ステップへ
    setTimeout(() => {
      setStep('complete');
      playSound('levelup');

      // コインカウントアップアニメーション
      const duration = 1500;
      const steps = 30;
      const increment = coinReward / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= coinReward) {
          setDisplayedCoins(coinReward);
          clearInterval(interval);
        } else {
          setDisplayedCoins(Math.floor(current));
        }
      }, duration / steps);
    }, 2500);
  };

  // 完了処理
  const handleComplete = () => {
    playSound('confirm');
    onConfirm(coinReward);
    onClose();
  };

  if (!crew) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* 背景オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={step === 'confirm' ? onClose : undefined}
          />

          {/* モーダル本体 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-gradient-to-b from-orange-50 to-amber-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* 夕焼け背景エフェクト */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-300/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
              {step === 'departure' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0] }}
                  transition={{ duration: 2 }}
                  className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-200/50 to-white/80"
                />
              )}
            </div>

            {/* 閉じるボタン（確認ステップのみ） */}
            {step === 'confirm' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-600/80 transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            )}

            <div className="relative p-6">
              {/* ===== Step 1: 確認 ===== */}
              <AnimatePresence mode="wait">
                {step === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-center"
                  >
                    {/* ヘッダー */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <DoorOpen className="text-orange-500" size={28} />
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        独立の承認
                      </h2>
                    </div>

                    {/* クルー画像 */}
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 rounded-full" />
                      <div className="relative w-full h-full p-2">
                        <CrewImage
                          src={crew.image}
                          alt={crew.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>

                    {/* クルー情報 */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {crew.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Lv.{crew.level} {crew.role}
                      </p>
                    </div>

                    {/* 確認メッセージ */}
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      <span className="font-bold text-gray-800 dark:text-gray-100">{crew.name}</span>
                      は新しい道を歩む準備ができています。
                      <br />
                      独立を承認しますか？
                    </p>

                    {/* 移籍金表示 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-2xl p-4 mb-6"
                    >
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <Coins size={16} className="text-yellow-500" />
                        <span>独立祝い金として受け取れます</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-black bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                          {coinReward.toLocaleString()}
                        </span>
                        <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          G
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        (Lv.{crew.level} × 100 + ★{crew.rarity || 1} × 500 + EXPボーナス)
                      </p>
                    </motion.div>

                    {/* ボタン */}
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        やめる
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleApprove}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow flex items-center justify-center gap-2"
                      >
                        <Handshake size={20} />
                        承認する
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ===== Step 2: 別れの言葉 ===== */}
                {step === 'message' && (
                  <motion.div
                    key="message"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-center py-4"
                  >
                    {/* クルー画像（大きめ） */}
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="relative w-40 h-40 mx-auto mb-6"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 dark:to-amber-800 rounded-full animate-pulse" />
                      <div className="relative w-full h-full p-3">
                        <CrewImage
                          src={crew.image}
                          alt={crew.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      {/* ハートエフェクト */}
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0, y: 0 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.5],
                            y: -50 - i * 20,
                            x: (Math.random() - 0.5) * 60,
                          }}
                          transition={{
                            duration: 2,
                            delay: i * 0.3,
                            repeat: Infinity,
                          }}
                          className="absolute top-0 left-1/2 -translate-x-1/2"
                        >
                          <Heart size={16} className="text-pink-400 fill-pink-400" />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* 感謝メッセージ */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-2xl p-5 mb-6"
                    >
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {crew.name}からのメッセージ
                      </p>
                      <p className="text-lg font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
                        「{farewellMessage}」
                      </p>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleContinue}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold shadow-lg shadow-orange-500/30"
                    >
                      見送る
                    </motion.button>
                  </motion.div>
                )}

                {/* ===== Step 3: 旅立ち ===== */}
                {step === 'departure' && (
                  <motion.div
                    key="departure"
                    initial={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    {/* ドアの演出 */}
                    <div className="relative h-64 flex items-center justify-center">
                      {/* 背景の光 */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.5 }}
                        transition={{ duration: 2 }}
                        className="absolute inset-0 bg-gradient-radial from-yellow-200/80 via-orange-100/40 to-transparent rounded-full"
                      />

                      {/* クルーが遠ざかる */}
                      <motion.div
                        initial={{ scale: 1, y: 0, opacity: 1 }}
                        animate={{ scale: 0.3, y: -30, opacity: 0 }}
                        transition={{ duration: 2, ease: 'easeIn' }}
                        className="relative w-32 h-32"
                      >
                        <CrewImage
                          src={crew.image}
                          alt={crew.name}
                          fill
                          className="object-contain"
                        />
                      </motion.div>

                      {/* 光のパーティクル */}
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{
                            opacity: 0,
                            scale: 0,
                            x: 0,
                            y: 0,
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: (Math.random() - 0.5) * 200,
                            y: (Math.random() - 0.5) * 200 - 50,
                          }}
                          transition={{
                            duration: 2,
                            delay: i * 0.1,
                          }}
                          className="absolute"
                        >
                          <Sparkles size={16} className="text-yellow-400" />
                        </motion.div>
                      ))}
                    </div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="text-gray-600 dark:text-gray-300 italic"
                    >
                      {crew.name}は新しい世界へ旅立ちました...
                    </motion.p>
                  </motion.div>
                )}

                {/* ===== Step 4: 完了 ===== */}
                {step === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    {/* 成功アイコン */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
                    >
                      <DoorOpen size={40} className="text-white" />
                    </motion.div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                      独立完了！
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {crew.name}の新しい旅路に幸あれ！
                    </p>

                    {/* コイン獲得演出 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-2xl p-5 mb-6"
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 0.5, repeat: 3 }}
                        >
                          <Coins size={28} className="text-yellow-500" />
                        </motion.div>
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          独立祝い金を獲得！
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-black bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                          +{displayedCoins.toLocaleString()}
                        </span>
                        <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                          G
                        </span>
                      </div>

                      {/* コインが飛び散るエフェクト */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                          animate={{
                            opacity: 0,
                            scale: 0,
                            x: (Math.random() - 0.5) * 150,
                            y: (Math.random() - 0.5) * 100 - 30,
                          }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          className="absolute left-1/2 top-1/2"
                        >
                          <Coins size={20} className="text-yellow-400" />
                        </motion.div>
                      ))}
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleComplete}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/30"
                    >
                      閉じる
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
