'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Crown, ClipboardList, Target } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppSound } from '@/contexts/SoundContext';
import { apiUrl } from '@/lib/api';
import CrewImage from './CrewImage';

// 新しいスキル型（API連携用）
export type CrewSkillInfo = {
  name: string;
  level: number;
  skill_type: string;
  description: string;
  bonus_effect: string;
  slot_type: string;
};

// 旧スキル型（後方互換用）
export type SkillType = 'mail' | 'analysis' | 'summary' | 'coding' | 'communication';
export type Skills = Partial<Record<SkillType, number>>;

export type Crew = {
  id: number;
  name: string;
  role: string;
  level: number;
  exp: number;
  image: string;
  skills?: Skills;
  is_partner?: boolean;
  rarity?: number; // レアリティ（★1〜★5）
  personality?: string; // 性格キー (Hot-blooded, Cool, etc.)
};

// スキルタイプの色
const SKILL_TYPE_COLORS: Record<string, string> = {
  'Intelligence': '#3B82F6',
  'Creative': '#22C55E',
  'Communication': '#F59E0B',
  'Execution': '#EF4444',
};

type CrewCardProps = {
  crew: Crew;
  onDetail?: (crew: Crew) => void;
  onViewLog?: (crew: Crew) => void;
  isLevelingUp?: boolean;
  onLevelUpComplete?: () => void;
  floatDelay?: number;
};

// レアリティに応じた放射状グラデーション
const getRarityGradient = (rarity: number = 1): string => {
  switch (rarity) {
    case 5:
      return 'radial-gradient(ellipse at 50% 30%, rgba(234, 179, 8, 0.25) 0%, rgba(249, 115, 22, 0.15) 40%, transparent 70%)';
    case 4:
      return 'radial-gradient(ellipse at 50% 30%, rgba(249, 115, 22, 0.2) 0%, rgba(239, 68, 68, 0.12) 40%, transparent 70%)';
    case 3:
      return 'radial-gradient(ellipse at 50% 30%, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.12) 40%, transparent 70%)';
    case 2:
      return 'radial-gradient(ellipse at 50% 30%, rgba(59, 130, 246, 0.18) 0%, rgba(6, 182, 212, 0.1) 40%, transparent 70%)';
    default:
      return 'radial-gradient(ellipse at 50% 30%, rgba(156, 163, 175, 0.15) 0%, rgba(107, 114, 128, 0.08) 40%, transparent 70%)';
  }
};

// レアリティに応じた枠線色
const getRarityBorderClass = (rarity: number = 1): string => {
  switch (rarity) {
    case 5:
      return 'ring-2 ring-yellow-400/50 dark:ring-yellow-500/40';
    case 4:
      return 'ring-2 ring-orange-400/40 dark:ring-orange-500/30';
    case 3:
      return 'ring-2 ring-purple-400/40 dark:ring-purple-500/30';
    case 2:
      return 'ring-1 ring-blue-400/30 dark:ring-blue-500/25';
    default:
      return '';
  }
};

// 新スキルバーコンポーネント
function NewSkillBar({ skill }: { skill: CrewSkillInfo }) {
  const color = SKILL_TYPE_COLORS[skill.skill_type] || '#8B5CF6';
  const slotLabel = skill.slot_type === 'primary' ? '★' : skill.slot_type === 'sub' ? '◆' : '○';
  const maxLevel = 10;
  const percentage = (skill.level / maxLevel) * 100;

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
        style={{ background: color, color: '#fff' }}
      >
        {slotLabel}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{skill.name}</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">Lv.{skill.level}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function CrewCard({ crew, onDetail, onViewLog, isLevelingUp, onLevelUpComplete, floatDelay = 0 }: CrewCardProps) {
  const [displayExp, setDisplayExp] = useState(crew.exp % 100);
  const [displayLevel, setDisplayLevel] = useState(crew.level);
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  const [crewSkills, setCrewSkills] = useState<CrewSkillInfo[]>([]);
  const prevExpRef = useRef(crew.exp);
  const prevLevelRef = useRef(crew.level);
  const { playSound } = useAppSound();

  // スキルを取得（なければ自動付与）
  const fetchSkills = useCallback(async () => {
    try {
      let res = await fetch(apiUrl(`/api/crews/${crew.id}/skills`));
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          // スキルがない場合は付与してから再取得
          await fetch(apiUrl(`/api/crews/${crew.id}/assign-skills`), { method: 'POST' });
          res = await fetch(apiUrl(`/api/crews/${crew.id}/skills`));
          if (res.ok) {
            setCrewSkills(await res.json());
          }
        } else {
          setCrewSkills(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  }, [crew.id]);

  // マウント時にスキルを取得
  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  // レアリティに基づくスタイル
  const rarityGradient = getRarityGradient(crew.rarity);
  const rarityBorderClass = getRarityBorderClass(crew.rarity);

  // EXPアニメーションとレベルアップ検出
  useEffect(() => {
    const prevExp = prevExpRef.current;
    const prevLevel = prevLevelRef.current;
    const newExp = crew.exp;
    const newLevel = crew.level;

    // レベルアップを検出
    if (newLevel > prevLevel || isLevelingUp) {
      // まずEXPバーを100%まで満タンにする
      setDisplayExp(100);

      // 0.5秒後にレベルアップエフェクトを表示
      const levelUpTimer = setTimeout(() => {
        setShowLevelUpEffect(true);
        setDisplayLevel(newLevel);
        playSound('levelUp'); // レベルアップ音

        // 0.3秒後にEXPバーをリセット
        setTimeout(() => {
          setDisplayExp(0);
          // さらに0.3秒後に新しいEXP値にアニメーション
          setTimeout(() => {
            setDisplayExp(newExp % 100);
          }, 300);
        }, 300);

        // 2秒後にレベルアップエフェクトを消す
        setTimeout(() => {
          setShowLevelUpEffect(false);
          onLevelUpComplete?.();
        }, 2000);
      }, 500);

      prevExpRef.current = newExp;
      prevLevelRef.current = newLevel;
      return () => clearTimeout(levelUpTimer);
    } else if (newExp !== prevExp) {
      // EXPのみ増加（レベルアップなし）
      setDisplayExp(newExp % 100);
      prevExpRef.current = newExp;
    }
  }, [crew.exp, crew.level, isLevelingUp, onLevelUpComplete, playSound]);

  // カード全体クリック時
  const handleCardClick = () => {
    playSound('click');
    onDetail?.(crew);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.2 } }}
      onClick={handleCardClick}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden relative flex flex-col h-full cursor-pointer ${rarityBorderClass}`}
      style={{
        backgroundImage: rarityGradient,
        animation: `float ${3 + (floatDelay % 3) * 0.5}s ease-in-out ${floatDelay * 0.3}s infinite`,
      }}
    >
      {/* レベルアップエフェクト */}
      <AnimatePresence>
        {showLevelUpEffect && (
          <>
            {/* 背景のフラッシュ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 z-10 pointer-events-none"
            />
            {/* キラキラパーティクル */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  scale: 0,
                  x: '50%',
                  y: '50%'
                }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`
                }}
                transition={{ duration: 1, delay: i * 0.05 }}
                className="absolute w-3 h-3 z-20 pointer-events-none"
              >
                <Sparkles className="w-full h-full text-yellow-400" />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 p-4 relative">
        <motion.div
          className="relative w-full aspect-square max-w-[180px] mx-auto"
          whileHover={{ scale: 1.05 }}
          animate={showLevelUpEffect ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <CrewImage
            src={crew.image}
            alt={crew.name}
            fill
            className="object-contain drop-shadow-lg"
          />
        </motion.div>
        {/* 相棒バッジ */}
        {crew.is_partner && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 left-3 bg-yellow-400 px-2 py-1 rounded-full shadow-md flex items-center gap-1"
          >
            <Crown size={12} className="text-yellow-800" />
            <span className="text-xs font-bold text-yellow-800">相棒</span>
          </motion.div>
        )}

        {/* レベルバッジ */}
        <motion.div
          className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md"
          animate={showLevelUpEffect ? { scale: [1, 1.3, 1], boxShadow: ['0 4px 6px rgba(0,0,0,0.1)', '0 0 30px rgba(234,179,8,0.8)', '0 4px 6px rgba(0,0,0,0.1)'] } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Lv.{displayLevel}
          </span>
        </motion.div>

        {/* レアリティ表示（★マーク） */}
        {crew.rarity && crew.rarity > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold shadow-md backdrop-blur-sm ${
              crew.rarity === 5
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900'
                : crew.rarity === 4
                ? 'bg-gradient-to-r from-orange-400 to-red-400 text-orange-900'
                : crew.rarity === 3
                ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-purple-900'
                : 'bg-gradient-to-r from-blue-400 to-cyan-400 text-blue-900'
            }`}
          >
            {'★'.repeat(crew.rarity)}
          </motion.div>
        )}

        {/* LEVEL UP! テキスト */}
        <AnimatePresence>
          {showLevelUpEffect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              className="absolute inset-0 flex items-center justify-center z-20"
            >
              <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white font-black text-2xl px-6 py-2 rounded-xl shadow-lg transform -rotate-3">
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3, repeat: 3 }}
                >
                  LEVEL UP!
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {crew.name}
          </h3>
          <span className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 text-pink-700 dark:text-pink-300 text-xs font-medium px-2.5 py-1 rounded-full">
            {crew.role}
          </span>
        </div>

        {/* EXP バー */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <div className="flex items-center gap-1">
              <span>EXP</span>
              {showLevelUpEffect && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-yellow-500 font-bold flex items-center gap-0.5"
                >
                  <TrendingUp size={12} />
                  +10
                </motion.span>
              )}
            </div>
            <span>{displayExp}/100</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${displayExp}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-2 rounded-full ${
                displayExp >= 100
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
            />
          </div>
        </div>

        {/* スキルセクション */}
        {crewSkills.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <Target size={14} className="text-purple-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">スキル</span>
            </div>
            <div className="space-y-2">
              {crewSkills.map((skill, index) => (
                <NewSkillBar key={`${skill.name || 'skill'}-${index}`} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {/* スペーサー: ボタンを下に押し下げる */}
        <div className="flex-1" />

        {/* アクションボタン */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              playSound('click');
              onDetail?.(crew);
            }}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            詳細
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              playSound('click');
              onViewLog?.(crew);
            }}
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-1.5"
          >
            <ClipboardList size={16} />
            ログ
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
