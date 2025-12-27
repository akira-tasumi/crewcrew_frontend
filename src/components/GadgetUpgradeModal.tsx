'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Zap, Brain, Heart, ArrowUp, Sparkles, Unplug } from 'lucide-react';
import { useState } from 'react';
import { useAppSound } from '@/contexts/SoundContext';
import confetti from 'canvas-confetti';
import { apiUrl } from '@/lib/api';

export type EquippedGadget = {
  id: number;
  gadget_id: number;
  gadget_name: string;
  gadget_icon: string;
  gadget_description: string;
  effect_type: string;
  level: number;
  slot_index: number;
  current_effect: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  crewId: number;
  crewName: string;
  gadget: EquippedGadget | null;
  userCoin: number;
  onUpgraded: (newCoin: number, upgradedGadget: EquippedGadget) => void;
  onUnequipped?: () => void;
};

// スキルタイプに合わせたエフェクト表示
const EFFECT_TYPE_LABELS: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  // 新形式（スキルタイプ）
  Intelligence: { label: 'Intelligence', icon: Brain, color: '#3B82F6' },
  Creative: { label: 'Creative', icon: Heart, color: '#22C55E' },
  Communication: { label: 'Communication', icon: Zap, color: '#F59E0B' },
  Execution: { label: 'Execution', icon: Zap, color: '#EF4444' },
  // 旧形式（後方互換）
  speed: { label: 'SPEED', icon: Zap, color: '#EF4444' },
  creativity: { label: 'CREATIVITY', icon: Brain, color: '#22C55E' },
  mood: { label: 'MOOD', icon: Heart, color: '#3B82F6' },
};

// 強化コスト計算（バックエンドと同じロジック）
function calculateUpgradeCost(baseCost: number, currentLevel: number): number {
  // 仮のbaseCostを使用（実際のbaseCostはAPIから取得すべきだが簡略化）
  const estimatedBaseCost = 500; // デフォルト値
  return Math.floor(estimatedBaseCost * 0.5 * currentLevel);
}

// 次レベルの効果計算
function calculateNextEffect(baseValue: number, nextLevel: number): number {
  return Math.floor(baseValue * (1 + 0.2 * (nextLevel - 1)));
}

export default function GadgetUpgradeModal({
  isOpen,
  onClose,
  crewId,
  crewName,
  gadget,
  userCoin,
  onUpgraded,
  onUnequipped,
}: Props) {
  const [upgrading, setUpgrading] = useState(false);
  const [unequipping, setUnequipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessEffect, setShowSuccessEffect] = useState(false);
  const { playSound } = useAppSound();

  if (!isOpen || !gadget) return null;

  const effectInfo = EFFECT_TYPE_LABELS[gadget.effect_type] || { label: gadget.effect_type, icon: Zap, color: '#8B5CF6' };
  const Icon = effectInfo.icon;
  const isMaxLevel = gadget.level >= 10;

  // baseCostの推定（current_effectとlevelから逆算）
  const estimatedBaseEffect = Math.floor(gadget.current_effect / (1 + 0.2 * (gadget.level - 1)));
  const nextEffect = calculateNextEffect(estimatedBaseEffect, gadget.level + 1);
  const upgradeCost = calculateUpgradeCost(500, gadget.level); // 簡略化
  const canAfford = userCoin >= upgradeCost;

  // 強化実行
  const handleUpgrade = async () => {
    if (upgrading || isMaxLevel || !canAfford) return;

    setUpgrading(true);
    setError(null);

    try {
      const res = await fetch(
        apiUrl(`/api/crews/${crewId}/gadgets/${gadget.gadget_id}/upgrade`),
        { method: 'POST' }
      );

      const data = await res.json();

      if (data.success) {
        // 成功エフェクト
        setShowSuccessEffect(true);
        playSound('success');
        playSound('levelUp');

        // キラキラ紙吹雪
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [effectInfo.color, '#FFD700', '#FFFFFF'],
        });

        setTimeout(() => {
          setShowSuccessEffect(false);
          onUpgraded(data.new_coin, data.upgraded_gadget);
        }, 1000);
      } else {
        setError(data.error || '強化に失敗しました');
        playSound('error');
      }
    } catch (err) {
      console.error('Failed to upgrade gadget:', err);
      setError('強化に失敗しました');
      playSound('error');
    } finally {
      setUpgrading(false);
    }
  };

  // 装備解除
  const handleUnequip = async () => {
    if (unequipping) return;

    setUnequipping(true);
    setError(null);

    try {
      const res = await fetch(
        apiUrl(`/api/crews/${crewId}/gadgets/${gadget.gadget_id}/unequip`),
        { method: 'POST' }
      );

      const data = await res.json();

      if (data.success) {
        playSound('success');
        onUnequipped?.();
        onClose();
      } else {
        setError(data.error || '解除に失敗しました');
        playSound('error');
      }
    } catch (err) {
      console.error('Failed to unequip gadget:', err);
      setError('解除に失敗しました');
      playSound('error');
    } finally {
      setUnequipping(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div
            className="p-4 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${effectInfo.color}80, ${effectInfo.color}40)`,
            }}
          >
            <div className="flex items-center gap-3">
              <Sparkles size={24} className="text-white" />
              <div>
                <h3 className="text-lg font-bold text-white">ガジェット強化</h3>
                <p className="text-white/80 text-sm">{crewName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full">
                <Coins size={16} className="text-yellow-400" />
                <span className="font-bold text-white">{userCoin.toLocaleString()}</span>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {/* ガジェット情報 */}
            <motion.div
              animate={showSuccessEffect ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="text-center mb-6"
            >
              <motion.div
                className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-5xl mb-4 relative"
                style={{
                  background: `linear-gradient(135deg, ${effectInfo.color}40, ${effectInfo.color}20)`,
                  border: `3px solid ${effectInfo.color}`,
                  boxShadow: showSuccessEffect
                    ? `0 0 40px ${effectInfo.color}`
                    : `0 0 20px ${effectInfo.color}40`,
                }}
                animate={showSuccessEffect ? { rotate: [0, 10, -10, 0] } : {}}
              >
                {gadget.gadget_icon}

                {/* レベルバッジ */}
                <div
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.5)',
                  }}
                >
                  {gadget.level}
                </div>
              </motion.div>

              <h4 className="text-xl font-bold text-white mb-2">{gadget.gadget_name}</h4>
              <p className="text-gray-400 text-sm">{gadget.gadget_description}</p>
            </motion.div>

            {/* ステータス変化 */}
            {!isMaxLevel && (
              <div className="bg-black/40 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">効果</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                    style={{
                      background: `${effectInfo.color}30`,
                      color: effectInfo.color,
                    }}
                  >
                    <Icon size={12} />
                    {effectInfo.label}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4">
                  {/* 現在 */}
                  <div className="text-center">
                    <div className="text-gray-500 text-xs mb-1">現在 (Lv.{gadget.level})</div>
                    <div className="text-2xl font-black text-white">+{gadget.current_effect}</div>
                  </div>

                  {/* 矢印 */}
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowUp size={24} className="text-yellow-400 rotate-90" />
                  </motion.div>

                  {/* 強化後 */}
                  <div className="text-center">
                    <div className="text-yellow-500 text-xs mb-1">Lv.{gadget.level + 1}</div>
                    <div
                      className="text-2xl font-black"
                      style={{ color: effectInfo.color }}
                    >
                      +{nextEffect}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 強化ボタン */}
            {isMaxLevel ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                  <Sparkles size={20} className="text-yellow-900" />
                  <span className="font-black text-yellow-900">MAX LEVEL</span>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={canAfford ? { scale: 1.02 } : {}}
                whileTap={canAfford ? { scale: 0.98 } : {}}
                onClick={handleUpgrade}
                disabled={!canAfford || upgrading}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                  canAfford
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {upgrading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                    />
                    強化中...
                  </>
                ) : (
                  <>
                    <ArrowUp size={20} />
                    強化する (+Lv.1)
                    <span className="bg-white/20 px-3 py-1 rounded-lg flex items-center gap-1">
                      <Coins size={14} />
                      {upgradeCost}
                    </span>
                  </>
                )}
              </motion.button>
            )}

            {!canAfford && !isMaxLevel && (
              <p className="text-red-400 text-sm text-center mt-3">
                コインが足りません
              </p>
            )}

            {/* 外すボタン */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUnequip}
              disabled={unequipping}
              className="w-full mt-3 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600 transition-all"
            >
              {unequipping ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  />
                  解除中...
                </>
              ) : (
                <>
                  <Unplug size={18} />
                  外す
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
