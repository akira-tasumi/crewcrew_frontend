'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Brain, Heart, Package, ArrowRightLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppSound } from '@/contexts/SoundContext';
import { apiUrl } from '@/lib/api';

type EquippedInfo = {
  gadget_id: number;
  crew_id: number;
  crew_name: string;
  slot_index: number;
};

type OwnedGadget = {
  id: number;
  name: string;
  description: string;
  icon: string;
  effect_type: string;
  base_effect_value: number;
  equipped_by: EquippedInfo | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  crewId: number;
  crewName: string;
  slotIndex: number;
  onEquipped: () => void;
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
  onEquipped,
}: Props) {
  const [gadgets, setGadgets] = useState<OwnedGadget[]>([]);
  const [loading, setLoading] = useState(false);
  const [equipping, setEquipping] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [swapConfirm, setSwapConfirm] = useState<OwnedGadget | null>(null);
  const { playSound } = useAppSound();

  // 所持ガジェット一覧を取得
  useEffect(() => {
    if (!isOpen) return;

    const fetchOwnedGadgets = async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl('/api/shop/my-gadgets'));
        if (res.ok) {
          const data = await res.json();
          setGadgets(data);
        }
      } catch (err) {
        console.error('Failed to fetch owned gadgets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedGadgets();
  }, [isOpen]);

  // ガジェット装備
  const handleEquip = async (gadget: OwnedGadget) => {
    // 他のクルーが装備中の場合、確認ダイアログを表示
    if (gadget.equipped_by && gadget.equipped_by.crew_id !== crewId) {
      setSwapConfirm(gadget);
      return;
    }

    await performEquip(gadget);
  };

  // 実際の装備処理
  const performEquip = async (gadget: OwnedGadget) => {
    setEquipping(gadget.id);
    setError(null);
    setSwapConfirm(null);

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
        playSound('success');
        onEquipped();
        onClose();
      } else {
        setError(data.error || '装備に失敗しました');
        playSound('error');
      }
    } catch (err) {
      console.error('Failed to equip gadget:', err);
      setError('装備に失敗しました');
      playSound('error');
    } finally {
      setEquipping(null);
    }
  };

  if (!isOpen) return null;

  // 未装備のガジェットと、別クルーが装備中のガジェットに分ける
  const availableGadgets = gadgets.filter(
    (g) => !g.equipped_by || g.equipped_by.crew_id === crewId
  );
  const equippedByOthers = gadgets.filter(
    (g) => g.equipped_by && g.equipped_by.crew_id !== crewId
  );

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
              <Package size={24} className="text-white" />
              <div>
                <h3 className="text-lg font-bold text-white">ガジェット選択</h3>
                <p className="text-white/80 text-sm">{crewName}のスロット{slotIndex + 1}に装備</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X size={24} />
            </button>
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
            ) : gadgets.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">所持しているガジェットがありません</p>
                <p className="text-gray-500 text-sm mt-2">
                  <Link
                    href="/shop"
                    className="text-purple-400 hover:text-purple-300 underline transition-colors"
                    onClick={onClose}
                  >
                    ショップ
                  </Link>
                  でガジェットを購入してください
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 装備可能なガジェット */}
                {availableGadgets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">装備可能</h4>
                    <div className="grid gap-3">
                      {availableGadgets.map((gadget, index) => (
                        <GadgetCard
                          key={gadget.id}
                          gadget={gadget}
                          index={index}
                          isEquipping={equipping === gadget.id}
                          isEquippedByThis={gadget.equipped_by?.crew_id === crewId}
                          onEquip={() => handleEquip(gadget)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 他クルーが装備中のガジェット */}
                {equippedByOthers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">他のクルーが装備中</h4>
                    <div className="grid gap-3">
                      {equippedByOthers.map((gadget, index) => (
                        <GadgetCard
                          key={gadget.id}
                          gadget={gadget}
                          index={index + availableGadgets.length}
                          isEquipping={equipping === gadget.id}
                          isEquippedByOther={true}
                          onEquip={() => handleEquip(gadget)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* 交換確認ダイアログ */}
        <AnimatePresence>
          {swapConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
              onClick={() => setSwapConfirm(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <ArrowRightLeft size={24} className="text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">ガジェット交換</h4>
                    <p className="text-gray-400 text-sm">{swapConfirm.name}</p>
                  </div>
                </div>

                <p className="text-gray-300 mb-6">
                  <span className="text-purple-400 font-bold">{swapConfirm.equipped_by?.crew_name}</span>
                  が装備中です。交換しますか？
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSwapConfirm(null)}
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => performEquip(swapConfirm)}
                    disabled={equipping === swapConfirm.id}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                  >
                    {equipping === swapConfirm.id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                      />
                    ) : (
                      '交換する'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// ガジェットカードコンポーネント
function GadgetCard({
  gadget,
  index,
  isEquipping,
  isEquippedByThis,
  isEquippedByOther,
  onEquip,
}: {
  gadget: OwnedGadget;
  index: number;
  isEquipping: boolean;
  isEquippedByThis?: boolean;
  isEquippedByOther?: boolean;
  onEquip: () => void;
}) {
  const effectInfo = EFFECT_TYPE_LABELS[gadget.effect_type] || { label: gadget.effect_type, icon: Zap, color: '#8B5CF6' };
  const Icon = effectInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-black/40 rounded-xl p-4 border transition-all ${
        isEquippedByOther
          ? 'border-orange-500/30 opacity-70 hover:opacity-100 cursor-pointer hover:border-orange-500/50'
          : isEquippedByThis
          ? 'border-green-500/30 opacity-60'
          : 'border-white/10 hover:border-purple-500/50 cursor-pointer'
      }`}
      onClick={() => !isEquippedByThis && onEquip()}
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
          <div className="flex items-center gap-2 flex-wrap">
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
            {isEquippedByOther && gadget.equipped_by && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                {gadget.equipped_by.crew_name}が装備中
              </span>
            )}
            {isEquippedByThis && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                装備中
              </span>
            )}
          </div>
        </div>

        {/* ボタン */}
        {!isEquippedByThis && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isEquipping}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              isEquippedByOther
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            }`}
          >
            {isEquipping ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              />
            ) : isEquippedByOther ? (
              '交換'
            ) : (
              '装備'
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
