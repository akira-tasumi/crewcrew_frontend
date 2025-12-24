'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Crown, Lock, Zap, Coins, Star, Plus, Target } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import type { Crew } from './CrewCard';
import confetti from 'canvas-confetti';
import GadgetShopModal from './GadgetShopModal';
import GadgetUpgradeModal, { type EquippedGadget } from './GadgetUpgradeModal';
import { useAppSound } from '@/contexts/SoundContext';
import { apiUrl } from '@/lib/api';

// スキル情報の型
type SkillInfo = {
  name: string;
  level: number;
  skill_type: string;
  description: string;
  bonus_effect: string;
  slot_type: string;
};


// 性格のマスタデータ
const PERSONALITIES: Record<string, { label: string; emoji: string; color: string }> = {
  'Hot-blooded': { label: '熱血', emoji: '🔥', color: '#EF4444' },
  'Cool': { label: 'クール', emoji: '❄️', color: '#3B82F6' },
  'Gentle': { label: 'おだやか', emoji: '🌸', color: '#EC4899' },
  'Serious': { label: '真面目', emoji: '📚', color: '#8B5CF6' },
  'Playful': { label: 'わんぱく', emoji: '☀️', color: '#F59E0B' },
  'Cautious': { label: '慎重', emoji: '🔍', color: '#10B981' },
  // 旧フォーマット対応
  '熱血': { label: '熱血', emoji: '🔥', color: '#EF4444' },
  'クール': { label: 'クール', emoji: '❄️', color: '#3B82F6' },
  'おだやか': { label: 'おだやか', emoji: '🌸', color: '#EC4899' },
  '真面目': { label: '真面目', emoji: '📚', color: '#8B5CF6' },
  'わんぱく': { label: 'わんぱく', emoji: '☀️', color: '#F59E0B' },
  '慎重': { label: '慎重', emoji: '🔍', color: '#10B981' },
};

// スキルタイプの色
const SKILL_TYPE_COLORS: Record<string, string> = {
  'Intelligence': '#3B82F6',
  'Creative': '#22C55E',
  'Communication': '#F59E0B',
  'Execution': '#EF4444',
};

type CrewDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  crew: Crew | null;
  onSetPartner?: (crew: Crew) => void;
  onUpgrade?: (crew: Crew) => void;
  isSettingPartner?: boolean;
  userRuby?: number; // ユーザーのルビー残高
  userCoin?: number; // ユーザーのコイン残高
  onCrewEvolved?: (evolvedCrew: Crew) => void; // 進化完了時のコールバック
  onCoinUpdated?: (newCoin: number) => void; // コイン更新時のコールバック
};

// 役割に応じた色テーマ
const ROLE_THEMES: Record<string, { primary: string; secondary: string; glow: string }> = {
  'リサーチャー': { primary: '#3B82F6', secondary: '#1D4ED8', glow: 'rgba(59, 130, 246, 0.5)' },
  'エンジニア': { primary: '#8B5CF6', secondary: '#6D28D9', glow: 'rgba(139, 92, 246, 0.5)' },
  'クリエイター': { primary: '#EC4899', secondary: '#BE185D', glow: 'rgba(236, 72, 153, 0.5)' },
  'アナリスト': { primary: '#10B981', secondary: '#047857', glow: 'rgba(16, 185, 129, 0.5)' },
  'コミュニケーター': { primary: '#F59E0B', secondary: '#D97706', glow: 'rgba(245, 158, 11, 0.5)' },
  'default': { primary: '#8B5CF6', secondary: '#6D28D9', glow: 'rgba(139, 92, 246, 0.5)' },
};



// 六角形ガジェット枠（リッチなデザイン）
function GadgetSlot({
  slotIndex,
  isUnlocked,
  requiredLevel,
  equippedGadget,
  onClick,
}: {
  slotIndex: number;
  isUnlocked: boolean;
  requiredLevel: number;
  equippedGadget?: EquippedGadget | null;
  onClick?: () => void;
}) {
  const hasGadget = !!equippedGadget;

  return (
    <motion.div
      whileHover={isUnlocked ? { scale: 1.08, y: -3 } : {}}
      whileTap={isUnlocked ? { scale: 0.95 } : {}}
      className="relative cursor-pointer"
      onClick={isUnlocked ? onClick : undefined}
    >
      {/* グロー効果 */}
      {hasGadget && (
        <div
          className="absolute inset-0 blur-xl opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, transparent 70%)',
          }}
        />
      )}

      <div className={`w-20 h-20 flex items-center justify-center transition-all relative ${
        hasGadget
          ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
          : isUnlocked
          ? 'bg-gradient-to-br from-purple-600/60 to-pink-600/60 hover:from-purple-500/80 hover:to-pink-500/80'
          : 'bg-gray-700/80'
      }`}
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          boxShadow: hasGadget
            ? '0 8px 25px rgba(251, 191, 36, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)'
            : isUnlocked
            ? '0 4px 15px rgba(168, 85, 247, 0.3)'
            : 'none',
        }}
      >
        {hasGadget ? (
          <span className="text-3xl drop-shadow-lg">{equippedGadget.gadget_icon}</span>
        ) : isUnlocked ? (
          <Plus size={28} className="text-white/80" />
        ) : (
          <Lock size={24} className="text-gray-400" />
        )}
      </div>

      {/* ラベル */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap font-bold text-center"
        style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}
      >
        {hasGadget ? (
          <span className="text-yellow-400">Lv.{equippedGadget.level}</span>
        ) : isUnlocked ? (
          <span className="text-purple-300">空きスロット</span>
        ) : (
          <span className="text-gray-500">Lv.{requiredLevel}で解放</span>
        )}
      </div>
    </motion.div>
  );
}

// 進化アニメーション状態
type EvolutionPhase = 'idle' | 'glowing' | 'whiteout' | 'reveal' | 'complete';

export default function CrewDetailModal({
  isOpen,
  onClose,
  crew,
  onSetPartner,
  onUpgrade,
  isSettingPartner,
  userRuby = 0,
  userCoin = 0,
  onCrewEvolved,
  onCoinUpdated,
}: CrewDetailModalProps) {
  const [showUpgradeEffect, setShowUpgradeEffect] = useState(false);
  const [evolutionPhase, setEvolutionPhase] = useState<EvolutionPhase>('idle');
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolvedCrewData, setEvolvedCrewData] = useState<Crew | null>(null);
  const [evolutionError, setEvolutionError] = useState<string | null>(null);

  // ガジェット関連state
  const [equippedGadgets, setEquippedGadgets] = useState<EquippedGadget[]>([]);
  const [showGadgetShop, setShowGadgetShop] = useState(false);
  const [showGadgetUpgrade, setShowGadgetUpgrade] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [selectedGadgetForUpgrade, setSelectedGadgetForUpgrade] = useState<EquippedGadget | null>(null);
  const [localCoin, setLocalCoin] = useState(userCoin);
  const { playSound } = useAppSound();

  // スキル関連state
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // 現在表示すべきクルー画像（進化後は新しい画像）
  const displayCrew = evolvedCrewData || crew;

  // 紙吹雪エフェクト
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#9B59B6', '#3498DB'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#9B59B6', '#3498DB'],
      });
    }, 250);
  }, []);

  // コイン同期
  useEffect(() => {
    setLocalCoin(userCoin);
  }, [userCoin]);

  // 装備中ガジェットを取得
  const fetchEquippedGadgets = useCallback(async () => {
    if (!crew) return;
    try {
      const res = await fetch(apiUrl(`/api/crews/${crew.id}/gadgets`));
      if (res.ok) {
        const data = await res.json();
        setEquippedGadgets(data);
      }
    } catch (err) {
      console.error('Failed to fetch equipped gadgets:', err);
    }
  }, [crew]);

  // スキルを取得（なければ自動付与）
  const fetchSkills = useCallback(async () => {
    if (!crew) return;
    try {
      // まずスキルを取得
      let res = await fetch(apiUrl(`/api/crews/${crew.id}/skills`));
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          // スキルがない場合は付与してから再取得
          await fetch(apiUrl(`/api/crews/${crew.id}/assign-skills`), { method: 'POST' });
          res = await fetch(apiUrl(`/api/crews/${crew.id}/skills`));
          if (res.ok) {
            setSkills(await res.json());
          }
        } else {
          setSkills(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  }, [crew]);

  // モーダルが開いたらデータを取得
  useEffect(() => {
    if (isOpen && crew) {
      fetchEquippedGadgets();
      fetchSkills();
    }
  }, [isOpen, crew, fetchEquippedGadgets, fetchSkills]);

  // リセット処理
  useEffect(() => {
    if (!isOpen) {
      setEvolutionPhase('idle');
      setIsEvolving(false);
      setEvolvedCrewData(null);
      setEvolutionError(null);
      setShowGadgetShop(false);
      setShowGadgetUpgrade(false);
      setSelectedGadgetForUpgrade(null);
      setSkills([]);
    }
  }, [isOpen]);

  if (!isOpen || !crew) return null;

  const theme = ROLE_THEMES[displayCrew?.role || crew.role] || ROLE_THEMES.default;

  // 性格情報を取得
  const personalityKey = crew.personality || 'Serious';
  const personalityInfo = PERSONALITIES[personalityKey] || { label: personalityKey, emoji: '💬', color: '#8B5CF6' };

  // 昇進可能かどうか（Lv.10以上、10ルビー以上、未進化）
  const canEvolve = crew.level >= 10 && userRuby >= 10 && !crew.role.startsWith('Senior ');
  const isAlreadyEvolved = crew.role.startsWith('Senior ');

  // スキル強化処理
  const handleUpgrade = async () => {
    if (isUpgrading || localCoin < 100) return;

    setIsUpgrading(true);
    setUpgradeError(null);
    setShowUpgradeEffect(true);
    playSound('levelUp');

    try {
      const res = await fetch(apiUrl(`/api/crews/${crew.id}/upgrade-skills`), {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // コインを更新
          setLocalCoin(data.new_coin);
          onCoinUpdated?.(data.new_coin);

          // スキルを再取得して表示を更新
          const skillsRes = await fetch(apiUrl(`/api/crews/${crew.id}/skills`));
          if (skillsRes.ok) {
            setSkills(await skillsRes.json());
          }
        } else {
          setUpgradeError(data.error || 'スキル強化に失敗しました');
        }
      } else {
        setUpgradeError('スキル強化に失敗しました');
      }
    } catch (err) {
      console.error('Failed to upgrade skills:', err);
      setUpgradeError('通信エラーが発生しました');
    } finally {
      setIsUpgrading(false);
      setTimeout(() => setShowUpgradeEffect(false), 500);
    }
  };

  // 進化処理
  const handleEvolve = async () => {
    if (isEvolving || !canEvolve) return;

    setIsEvolving(true);
    setEvolutionError(null);

    try {
      // Phase 1: Glowing（光る + 振動）
      setEvolutionPhase('glowing');
      await new Promise((r) => setTimeout(r, 1500));

      // Phase 2: Whiteout（ホワイトアウト）
      setEvolutionPhase('whiteout');
      await new Promise((r) => setTimeout(r, 800));

      // API呼び出し
      const response = await fetch(`/api/crews/${crew.id}/evolve`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '昇進に失敗しました');
      }

      // Phase 3: Reveal（新しい姿を表示）
      setEvolvedCrewData({
        ...crew,
        image: data.new_image || crew.image,
        role: data.new_role || crew.role,
        rarity: data.crew?.rarity || (crew.rarity || 1) + 1,
      });
      setEvolutionPhase('reveal');
      await new Promise((r) => setTimeout(r, 500));

      // Phase 4: Complete（紙吹雪）
      setEvolutionPhase('complete');
      fireConfetti();

      // 親コンポーネントに通知
      if (data.crew && onCrewEvolved) {
        onCrewEvolved(data.crew);
      }

    } catch (error) {
      console.error('Evolution failed:', error);
      setEvolutionError(error instanceof Error ? error.message : '昇進に失敗しました');
      setEvolutionPhase('idle');
    } finally {
      setIsEvolving(false);
    }
  };

  // 進化アニメーション用のスタイル
  const getEvolutionStyle = () => {
    switch (evolutionPhase) {
      case 'glowing':
        return {
          filter: 'brightness(3) saturate(1.5)',
          animation: 'shake 0.1s infinite',
        };
      case 'whiteout':
        return {
          filter: 'brightness(10)',
          opacity: 0.5,
        };
      case 'reveal':
        return {
          filter: 'brightness(1.5) saturate(1.2)',
          transform: 'scale(1.1)',
        };
      case 'complete':
        return {
          filter: 'brightness(1)',
          transform: 'scale(1)',
        };
      default:
        return {};
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="crew-detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={evolutionPhase === 'idle' || evolutionPhase === 'complete' ? onClose : undefined}
        style={evolutionPhase === 'whiteout' ? { background: 'rgba(255,255,255,0.9)' } : {}}
      >
        {/* CSS for shake animation */}
        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          @keyframes rainbow-border {
            0% { border-color: #ff0000; }
            16% { border-color: #ff8800; }
            33% { border-color: #ffff00; }
            50% { border-color: #00ff00; }
            66% { border-color: #0088ff; }
            83% { border-color: #8800ff; }
            100% { border-color: #ff0000; }
          }
          @keyframes golden-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}</style>

        {/* メインカード */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotateY: 15 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ perspective: '1000px' }}
        >
          {/* 放射状グラデーション背景 */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{
              background: `radial-gradient(ellipse at center, ${theme.primary}40 0%, ${theme.secondary}90 50%, #0f0f1a 100%)`,
            }}
          >
            {/* 集中線エフェクト */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            >
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-[200%] h-0.5 origin-left"
                  style={{
                    transform: `rotate(${i * 15}deg)`,
                    background: `linear-gradient(90deg, transparent 0%, ${theme.primary}30 30%, transparent 60%)`,
                  }}
                />
              ))}
            </motion.div>

            {/* パーティクルエフェクト */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: theme.primary,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* コンテンツ - 12カラムグリッドレイアウト */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 min-h-[500px] md:min-h-[580px]">

            {/* ============================================ */}
            {/* 左カラム: ビジュアルエリア (col-span-5) */}
            {/* ============================================ */}
            <div className="md:col-span-5 relative flex flex-col items-center justify-center p-6 rounded-l-3xl">
              {/* 閉じるボタン（モバイル用） */}
              {(evolutionPhase === 'idle' || evolutionPhase === 'complete') && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute top-4 right-4 md:hidden w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors z-20"
                >
                  <X size={24} />
                </motion.button>
              )}

              {/* キャラクター画像（大きく表示） */}
              <motion.div
                className="relative"
                animate={evolutionPhase === 'idle' || evolutionPhase === 'complete' ? { y: [0, -8, 0] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={getEvolutionStyle()}
              >
                {/* グロー効果 */}
                <div
                  className="absolute inset-0 blur-3xl opacity-70 scale-150"
                  style={{
                    background: evolutionPhase === 'glowing' || evolutionPhase === 'reveal'
                      ? 'rgba(255, 215, 0, 0.8)'
                      : theme.glow
                  }}
                />

                {/* 相棒バッジ */}
                {(displayCrew?.is_partner || crew.is_partner) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="absolute -top-4 -right-4 z-20 bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
                    style={{ boxShadow: '0 0 25px rgba(234, 179, 8, 0.7)' }}
                  >
                    <Crown size={18} className="text-yellow-900" />
                    <span className="text-sm font-black text-yellow-900">相棒</span>
                  </motion.div>
                )}

                {/* 進化後のSeniorバッジ */}
                {(evolutionPhase === 'reveal' || evolutionPhase === 'complete' || isAlreadyEvolved) && (
                  <motion.div
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 px-5 py-1.5 rounded-full flex items-center gap-1.5"
                    style={{
                      background: 'linear-gradient(135deg, #ffd700, #ffaa00, #ffd700)',
                      backgroundSize: '200% 100%',
                      animation: 'golden-shimmer 2s linear infinite',
                      boxShadow: '0 0 25px rgba(255, 215, 0, 0.8)',
                    }}
                  >
                    <Star size={16} className="text-yellow-900" fill="currentColor" />
                    <span className="text-sm font-black text-yellow-900">Senior</span>
                  </motion.div>
                )}

                {/* キャラ画像（大きく） */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: evolutionPhase === 'reveal' ? 1.15 : 1,
                    opacity: evolutionPhase === 'whiteout' ? 0.3 : 1
                  }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="relative w-56 h-56 md:w-72 md:h-72"
                  style={{
                    filter: `drop-shadow(0 25px 50px ${theme.glow})`,
                  }}
                >
                  <Image
                    src={displayCrew?.image || crew.image}
                    alt={displayCrew?.name || crew.name}
                    fill
                    className="object-contain"
                  />
                </motion.div>

                {/* 強化エフェクト */}
                <AnimatePresence>
                  {showUpgradeEffect && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 2, opacity: [0, 1, 0] }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-full h-full rounded-full border-4 border-yellow-400"
                        style={{ boxShadow: '0 0 80px rgba(234, 179, 8, 0.9)' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 進化中のオーラエフェクト */}
                {evolutionPhase === 'glowing' && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`aura-${i}`}
                        className="absolute inset-0"
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.125,
                        }}
                      >
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            background: 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, transparent 70%)',
                          }}
                        />
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>

              {/* 名前 & 役職 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mt-6"
              >
                <h2
                  className="text-3xl md:text-4xl font-black text-white mb-2"
                  style={{
                    textShadow: `0 0 30px ${theme.glow}, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000`,
                    WebkitTextStroke: '1px rgba(0,0,0,0.3)',
                  }}
                >
                  {displayCrew?.name || crew.name}
                </h2>
                <span
                  className="inline-block px-4 py-1 rounded-full text-sm font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    boxShadow: `0 4px 20px ${theme.glow}`,
                  }}
                >
                  {displayCrew?.role || crew.role}
                </span>
              </motion.div>

              {/* 相棒に任命ボタン（左カラム最下部） */}
              {(evolutionPhase === 'idle' || evolutionPhase === 'complete') && !crew.is_partner && onSetPartner && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(234, 179, 8, 0.7)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSetPartner(crew)}
                  disabled={isSettingPartner}
                  className="mt-6 w-full max-w-[220px] py-3 px-6 rounded-2xl font-bold text-base text-yellow-900 disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                    boxShadow: '0 6px 25px rgba(245, 158, 11, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                    textShadow: '1px 1px 0 rgba(255,255,255,0.3)',
                  }}
                >
                  <Crown size={20} />
                  相棒に任命
                </motion.button>
              )}

              {/* 進化完了メッセージ */}
              {evolutionPhase === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-center"
                >
                  <p className="text-2xl font-black text-yellow-400"
                    style={{ textShadow: '0 0 25px rgba(255,215,0,0.9)' }}
                  >
                    昇進おめでとう！
                  </p>
                </motion.div>
              )}
            </div>

            {/* ============================================ */}
            {/* 右カラム: データエリア (col-span-7) */}
            {/* ============================================ */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-7 bg-black/60 backdrop-blur-xl rounded-r-3xl md:rounded-l-none rounded-3xl p-6 flex flex-col border-l border-white/10"
            >
              {/* ヘッダー: 閉じるボタン & 性格タグ */}
              <div className="flex items-start justify-between mb-5">
                {/* 性格タグ */}
                <motion.div
                  initial={{ scale: 0, x: -20 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${personalityInfo.color}cc, ${personalityInfo.color}88)`,
                    boxShadow: `0 4px 20px ${personalityInfo.color}40`,
                  }}
                >
                  <span className="text-lg">{personalityInfo.emoji}</span>
                  <span className="text-white font-bold text-sm tracking-wide" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                    {personalityInfo.label}
                  </span>
                </motion.div>

                {/* 閉じるボタン（PC用） */}
                {(evolutionPhase === 'idle' || evolutionPhase === 'complete') && (
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="hidden md:flex w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white/80 hover:text-white transition-colors"
                  >
                    <X size={22} />
                  </motion.button>
                )}
              </div>

              {/* レベル & EXPバー */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mb-5"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className="px-5 py-2 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      boxShadow: '0 4px 20px rgba(245, 158, 11, 0.5)',
                    }}
                  >
                    <span
                      className="text-2xl font-black text-yellow-900"
                      style={{ textShadow: '1px 1px 0 rgba(255,255,255,0.5)' }}
                    >
                      Lv. {displayCrew?.level || crew.level}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold text-white/80 mb-1">
                      <span className="uppercase tracking-wider">Experience</span>
                      <span>{(displayCrew?.exp || crew.exp) % 100} / 100</span>
                    </div>
                    <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(displayCrew?.exp || crew.exp) % 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ boxShadow: '0 0 15px rgba(168, 85, 247, 0.6)' }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Section A: スキル（2列グリッド） */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Target size={14} className="text-purple-400" />
                  Skills
                </h3>

                {skills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {skills.map((skill, index) => {
                      const skillColor = SKILL_TYPE_COLORS[skill.skill_type] || '#8B5CF6';
                      const slotLabel = skill.slot_type === 'primary' ? '★' : skill.slot_type === 'sub' ? '◆' : '○';
                      const maxLevel = 10;
                      const percentage = (skill.level / maxLevel) * 100;
                      return (
                        <motion.div
                          key={`${skill.name || 'skill'}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="p-3 rounded-xl"
                          style={{ background: `${skillColor}18`, border: `1px solid ${skillColor}35` }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                              style={{ background: skillColor, color: '#fff' }}
                            >
                              {slotLabel}
                            </span>
                            <span className="text-sm font-bold text-white truncate flex-1">{skill.name}</span>
                            <span className="text-sm font-black text-yellow-400 flex-shrink-0">Lv.{skill.level}</span>
                          </div>
                          <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + index * 0.05, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{
                                background: `linear-gradient(90deg, ${skillColor}, ${skillColor}bb)`,
                                boxShadow: `0 0 8px ${skillColor}70`,
                              }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-2"
                    />
                    <span className="text-sm text-gray-400">読み込み中...</span>
                  </div>
                )}
              </div>

              {/* Section B: ガジェット */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">
                  Gadgets
                </h3>
                <div className="flex justify-start gap-5 py-2">
                  {[0, 1, 2].map((slotIndex) => {
                    const requiredLevel = slotIndex === 0 ? 1 : slotIndex === 1 ? 10 : 20;
                    const crewLevel = displayCrew?.level || crew.level;
                    const isUnlocked = crewLevel >= requiredLevel;
                    const equippedGadget = equippedGadgets.find(g => g.slot_index === slotIndex);

                    const handleSlotClick = () => {
                      playSound('click');
                      if (equippedGadget) {
                        setSelectedGadgetForUpgrade(equippedGadget);
                        setShowGadgetUpgrade(true);
                      } else {
                        setSelectedSlotIndex(slotIndex);
                        setShowGadgetShop(true);
                      }
                    };

                    return (
                      <GadgetSlot
                        key={slotIndex}
                        slotIndex={slotIndex}
                        isUnlocked={isUnlocked}
                        requiredLevel={requiredLevel}
                        equippedGadget={equippedGadget}
                        onClick={handleSlotClick}
                      />
                    );
                  })}
                </div>
              </div>

              {/* エラーメッセージ */}
              {evolutionError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/30 border border-red-500/50 rounded-xl text-red-200 text-sm text-center"
                >
                  {evolutionError}
                </motion.div>
              )}

              {/* スペーサー */}
              <div className="flex-1" />

              {/* Footer: アクションボタン */}
              {(evolutionPhase === 'idle' || evolutionPhase === 'complete') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3 mt-4"
                >
                  {/* 昇進ボタン（Lv.10以上で表示、未進化の場合のみ） */}
                  {canEvolve && evolutionPhase === 'idle' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEvolve}
                      disabled={isEvolving}
                      className="flex-1 py-4 px-6 rounded-2xl font-bold text-base text-white disabled:opacity-70 flex items-center justify-center gap-3 transition-all relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 50%, #ffd700 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'golden-shimmer 3s linear infinite',
                        boxShadow: '0 6px 30px rgba(255, 215, 0, 0.6)',
                      }}
                    >
                      <Star size={22} fill="currentColor" className="text-yellow-900" />
                      <span className="text-yellow-900 font-black">昇進させる</span>
                      <span className="bg-yellow-900/30 px-3 py-1 rounded-lg text-sm">
                        10💎
                      </span>
                    </motion.button>
                  )}

                  {/* スキル強化ボタン */}
                  {(!canEvolve || evolutionPhase === 'complete') && (
                    <motion.button
                      whileHover={localCoin >= 100 && !isUpgrading ? { scale: 1.02, boxShadow: '0 0 35px rgba(236, 72, 153, 0.7)' } : {}}
                      whileTap={localCoin >= 100 && !isUpgrading ? { scale: 0.98 } : {}}
                      onClick={handleUpgrade}
                      disabled={localCoin < 100 || isUpgrading}
                      className={`flex-1 py-4 px-6 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-3 transition-all ${localCoin < 100 || isUpgrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #be185d 100%)',
                        boxShadow: '0 6px 25px rgba(236, 72, 153, 0.5)',
                      }}
                    >
                      {isUpgrading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span className="font-black">強化中...</span>
                        </>
                      ) : (
                        <>
                          <Target size={22} />
                          <span className="font-black">スキル強化</span>
                          <span className="bg-white/20 px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                            <Coins size={14} />
                            100
                          </span>
                        </>
                      )}
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* 強化エラー表示 */}
              {upgradeError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center mt-3"
                >
                  {upgradeError}
                </motion.div>
              )}

              {/* 進化中のローディング表示 */}
              {(evolutionPhase === 'glowing' || evolutionPhase === 'whiteout') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center mt-6"
                >
                  <div className="flex items-center gap-3 bg-black/50 px-6 py-3 rounded-full">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full"
                    />
                    <span className="text-white font-bold">昇進中...</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* ガジェットショップモーダル */}
      <GadgetShopModal
        key="gadget-shop-modal"
        isOpen={showGadgetShop}
        onClose={() => setShowGadgetShop(false)}
        crewId={crew.id}
        crewName={crew.name}
        slotIndex={selectedSlotIndex}
        userCoin={localCoin}
        onEquipped={(newCoin) => {
          setLocalCoin(newCoin);
          onCoinUpdated?.(newCoin);
          fetchEquippedGadgets();
        }}
      />

      {/* ガジェット強化モーダル */}
      <GadgetUpgradeModal
        key="gadget-upgrade-modal"
        isOpen={showGadgetUpgrade}
        onClose={() => setShowGadgetUpgrade(false)}
        crewId={crew.id}
        crewName={crew.name}
        gadget={selectedGadgetForUpgrade}
        userCoin={localCoin}
        onUpgraded={(newCoin, upgradedGadget) => {
          setLocalCoin(newCoin);
          onCoinUpdated?.(newCoin);
          setEquippedGadgets(prev =>
            prev.map(g => g.id === upgradedGadget.id ? upgradedGadget : g)
          );
          setSelectedGadgetForUpgrade(upgradedGadget);
        }}
      />
    </AnimatePresence>
  );
}
