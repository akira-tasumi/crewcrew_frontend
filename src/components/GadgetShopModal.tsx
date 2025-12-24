'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Zap, Brain, Heart, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppSound } from '@/contexts/SoundContext';
import { apiUrl } from '@/lib/api';

type Gadget = {
  id: number;
  name: string;
  description: string;
  icon: string;
  effect_type: string;
  base_effect_value: number;
  base_cost: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  crewId: number;
  crewName: string;
  slotIndex: number;
  userCoin: number;
  onEquipped: (newCoin: number) => void;
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

export default function GadgetShopModal({
  isOpen,
  onClose,
  crewId,
  crewName,
  slotIndex,
  userCoin,
  onEquipped,
}: Props) {
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { playSound } = useAppSound();

  // ガジェット一覧を取得
  useEffect(() => {
    if (!isOpen) return;

    const fetchGadgets = async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl('/api/gadgets'));
        if (res.ok) {
          const data = await res.json();
          setGadgets(data);
        }
      } catch (err) {
        console.error('Failed to fetch gadgets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGadgets();
  }, [isOpen]);

  // ガジェット購入・装備
  const handlePurchase = async (gadget: Gadget) => {
    if (userCoin < gadget.base_cost || purchasing) return;

    setPurchasing(gadget.id);
    setError(null);

    try {
      const res = await fetch(apiUrl(`/api/crews/${crewId}/gadgets/equip`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gadget_id: gadget.id,
          slot_index: slotIndex,
        }),
      });

      const data = await res.json();

      if (data.success) {
        playSound('coin');
        playSound('success');
        onEquipped(data.new_coin);
        onClose();
      } else {
        setError(data.error || '購入に失敗しました');
        playSound('error');
      }
    } catch (err) {
      console.error('Failed to purchase gadget:', err);
      setError('購入に失敗しました');
      playSound('error');
    } finally {
      setPurchasing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart size={24} className="text-white" />
              <div>
                <h3 className="text-lg font-bold text-white">ガジェットショップ</h3>
                <p className="text-white/80 text-sm">{crewName}のスロット{slotIndex + 1}に装備</p>
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
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
                />
              </div>
            ) : (
              <div className="grid gap-3">
                {gadgets.map((gadget, index) => {
                  const effectInfo = EFFECT_TYPE_LABELS[gadget.effect_type] || { label: gadget.effect_type, icon: Zap, color: '#8B5CF6' };
                  const Icon = effectInfo.icon;
                  const canAfford = userCoin >= gadget.base_cost;
                  const isPurchasing = purchasing === gadget.id;

                  return (
                    <motion.div
                      key={gadget.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-black/40 rounded-xl p-4 border transition-all ${
                        canAfford
                          ? 'border-white/10 hover:border-purple-500/50 cursor-pointer'
                          : 'border-red-500/20 opacity-60'
                      }`}
                      onClick={() => canAfford && handlePurchase(gadget)}
                    >
                      <div className="flex items-center gap-4">
                        {/* アイコン */}
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                          style={{
                            background: `linear-gradient(135deg, ${effectInfo.color}40, ${effectInfo.color}20)`,
                            border: `2px solid ${effectInfo.color}60`,
                          }}
                        >
                          {gadget.icon}
                        </div>

                        {/* 情報 */}
                        <div className="flex-1">
                          <h4 className="font-bold text-white mb-1">{gadget.name}</h4>
                          <p className="text-gray-400 text-sm mb-2">{gadget.description}</p>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                              style={{
                                background: `${effectInfo.color}30`,
                                color: effectInfo.color,
                              }}
                            >
                              <Icon size={12} />
                              {effectInfo.label} +{gadget.base_effect_value}
                            </span>
                          </div>
                        </div>

                        {/* 価格・購入ボタン */}
                        <motion.button
                          whileHover={canAfford ? { scale: 1.05 } : {}}
                          whileTap={canAfford ? { scale: 0.95 } : {}}
                          disabled={!canAfford || isPurchasing}
                          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                            canAfford
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-yellow-900 hover:shadow-lg hover:shadow-yellow-500/30'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {isPurchasing ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                            />
                          ) : (
                            <>
                              <Coins size={16} />
                              {gadget.base_cost}
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
