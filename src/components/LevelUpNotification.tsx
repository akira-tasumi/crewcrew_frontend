'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, X } from 'lucide-react';

type LevelUpNotificationProps = {
  show: boolean;
  crewName: string;
  newLevel: number;
  onClose: () => void;
};

export default function LevelUpNotification({
  show,
  crewName,
  newLevel,
  onClose,
}: LevelUpNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -100, x: '-50%' }}
          className="fixed top-6 left-1/2 z-50"
        >
          <div className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-2xl shadow-2xl overflow-hidden">
            {/* キラキラ背景エフェクト */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    opacity: 0.8,
                    x: Math.random() * 400,
                    y: Math.random() * 100,
                  }}
                  animate={{
                    opacity: [0.8, 0, 0.8],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: Math.random() * 1.5,
                  }}
                />
              ))}
            </div>

            <div className="relative px-6 py-4 flex items-center gap-4">
              {/* アイコン */}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="bg-white/20 backdrop-blur-sm rounded-full p-3"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>

              {/* コンテンツ */}
              <div className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-black text-lg">LEVEL UP!</span>
                </div>
                <p className="text-white/90 text-sm">
                  <span className="font-bold">{crewName}</span> が{' '}
                  <span className="font-bold text-yellow-200">Lv.{newLevel}</span> になりました！
                </p>
                <p className="text-white/80 text-xs mt-1">
                  能力が向上しました！
                </p>
              </div>

              {/* 閉じるボタン */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="ml-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </motion.button>
            </div>

            {/* 下部のプログレスバー（自動で閉じるまでの時間表示） */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              onAnimationComplete={onClose}
              className="h-1 bg-white/50"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
