'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, Cpu, Zap, Stars } from 'lucide-react';

// デフォルトのローディングメッセージ
const DEFAULT_MESSAGES = [
  'AIエージェントを召喚中...',
  '画像データを解析しています...',
  'ピクセルを調整中...',
  'クリエイティブな処理を実行中...',
  '仕上げを行っています...',
  'もう少しです！',
];

// アイコンのリスト
const ICONS = [Sparkles, Cpu, Zap, Stars, Loader2];

type LoadingOverlayProps = {
  isLoading: boolean;
  messages?: string[];
  messageInterval?: number; // メッセージ切り替え間隔（ms）
};

export default function LoadingOverlay({
  isLoading,
  messages = DEFAULT_MESSAGES,
  messageInterval = 2500,
}: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);

  // 表示/非表示のフェード制御
  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setIsFading(false);
      setProgress(0);
      setMessageIndex(0);
    } else if (isVisible) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsFading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isVisible]);

  // メッセージの切り替え
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
      setIconIndex((prev) => (prev + 1) % ICONS.length);
    }, messageInterval);

    return () => clearInterval(interval);
  }, [isLoading, messages.length, messageInterval]);

  // フェイク・プログレスバー
  useEffect(() => {
    if (!isLoading) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // 不規則な進み具合（1〜8%ずつ進む）
        const increment = Math.random() * 7 + 1;
        const newProgress = prev + increment;
        return Math.min(newProgress, 90);
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, [isLoading]);

  if (!isVisible) return null;

  const CurrentIcon = ICONS[iconIndex];

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 背景のグロー効果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* メインカード */}
      <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full mx-4 border border-white/10 shadow-2xl">
        {/* 浮遊するパーティクル */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-purple-400/40 rounded-full animate-float"
              style={{
                left: `${15 + i * 15}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* アイコンエリア */}
        <div className="relative flex justify-center mb-6">
          {/* 外側のリング */}
          <div className="absolute w-24 h-24 border-4 border-purple-500/30 rounded-full animate-spin-slow" />
          <div className="absolute w-20 h-20 border-2 border-pink-500/40 rounded-full animate-spin-reverse" />

          {/* アイコン */}
          <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 animate-bounce-gentle">
            <CurrentIcon size={32} className="text-white animate-pulse" />
          </div>
        </div>

        {/* メッセージ */}
        <div className="text-center mb-6 h-12 flex items-center justify-center">
          <p
            key={messageIndex}
            className="text-white text-lg font-medium animate-fade-in"
          >
            {messages[messageIndex]}
          </p>
        </div>

        {/* プログレスバー */}
        <div className="relative">
          <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* シャイン効果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-purple-300/70 text-xs">処理中</span>
            <span className="text-purple-300/70 text-xs">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* ドットアニメーション */}
        <div className="flex justify-center gap-1.5 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* カスタムアニメーション用スタイル */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        .animate-spin-reverse {
          animation: spin-reverse 6s linear infinite;
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(100%) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(80%) scale(1);
          }
          90% {
            opacity: 1;
            transform: translateY(-80%) scale(1);
          }
          100% {
            transform: translateY(-100%) scale(0);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
