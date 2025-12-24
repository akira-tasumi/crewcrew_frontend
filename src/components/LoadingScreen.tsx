"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// ランダムメッセージ
const LOADING_MESSAGES = [
  "クルーたちを起こしています...",
  "コーヒーを淹れています...",
  "最強のプロンプトを構築中...",
  "サーバーの機嫌を取っています...",
  "AIに魔法をかけています...",
  "データを集めています...",
  "クルーたちがミーティング中...",
  "もうすぐ準備完了です...",
];

// チップス（操作方法など）
const TIPS = [
  "💡 相棒を設定すると、タスクの振り分けを自動でしてくれます",
  "💡 クルーをクリックすると気まぐれトークが聞けます",
  "💡 タスクを依頼するとクルーのEXPが上がります",
  "💡 レベルが上がるとクルーの能力が向上します",
  "💡 スカウトで新しい仲間を見つけよう",
  "💡 日報機能で1日の成果を確認できます",
  "💡 連携デモでクルーの協力プレイを体験しよう",
  "💡 ★の数が多いほどレアなクルーです",
];

type LoadingScreenProps = {
  isLoading: boolean;
  partnerImage?: string;
  fullScreen?: boolean;
};

export default function LoadingScreen({
  isLoading,
  partnerImage = "/images/crews/monster_1.png",
  fullScreen = true,
}: LoadingScreenProps) {
  const [message, setMessage] = useState(LOADING_MESSAGES[0]);
  const [tip, setTip] = useState(TIPS[0]);

  useEffect(() => {
    if (!isLoading) return;

    // 初回のランダム選択
    setMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);

    // 3秒ごとにメッセージを変更
    const messageInterval = setInterval(() => {
      setMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 3000);

    // 5秒ごとにチップスを変更
    const tipInterval = setInterval(() => {
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }, 5000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(tipInterval);
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`${
            fullScreen ? "fixed inset-0 z-50" : "absolute inset-0"
          } bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-sm flex flex-col items-center justify-center`}
        >
          {/* キラキラ背景 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* メインコンテンツ */}
          <div className="relative z-10 text-center">
            {/* バウンスするアイコン */}
            <motion.div
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative mx-auto w-24 h-24 mb-6"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-xl bg-gradient-to-br from-purple-400 to-pink-400">
                <Image
                  src={partnerImage}
                  alt="Loading"
                  width={96}
                  height={96}
                  className="object-cover scale-150 translate-y-2"
                />
              </div>
              {/* 跳ねる影 */}
              <motion.div
                animate={{
                  scale: [1, 0.8, 1],
                  opacity: [0.3, 0.15, 0.3],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/30 rounded-full blur-sm"
              />
            </motion.div>

            {/* ローディングスピナー */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-white/20 border-t-white rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-4 border-pink-400/20 border-b-pink-400 rounded-full"
              />
            </div>

            {/* ローディングメッセージ */}
            <AnimatePresence mode="wait">
              <motion.p
                key={message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-white text-lg font-medium mb-8"
              >
                {message}
              </motion.p>
            </AnimatePresence>

            {/* プログレスドット */}
            <div className="flex justify-center gap-2 mb-8">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              ))}
            </div>

            {/* チップス */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tip}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-sm mx-auto px-4"
              >
                <p className="text-white/70 text-sm">{tip}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// インラインローディング（小さいバージョン）
export function InlineLoading({ message = "読み込み中..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
      />
      <span className="text-gray-500 dark:text-gray-400 text-sm">{message}</span>
    </div>
  );
}
