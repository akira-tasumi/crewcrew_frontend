'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, Coins } from 'lucide-react';
import CrewCard, { Crew, Skills } from '@/components/CrewCard';
import CrewDetailModal from '@/components/CrewDetailModal';
import CrewLogModal from '@/components/CrewLogModal';
import LevelUpNotification from '@/components/LevelUpNotification';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { onCrewExpUpdate, CrewExpUpdateEvent } from '@/lib/crewEvents';
import { useAppSound } from '@/contexts/SoundContext';
import { useUser } from '@/contexts/UserContext';
import { apiUrl } from '@/lib/api';

// ダミーのスキルデータ（バックエンドから取得するまでの仮データ）
const DUMMY_SKILLS: Record<number, Skills> = {
  1: { mail: 8, analysis: 3, summary: 5 },
  2: { mail: 4, summary: 7, communication: 6 },
  3: { analysis: 9, coding: 4 },
  4: { communication: 8, mail: 6, summary: 4 },
  5: { coding: 7, analysis: 5 },
  6: { coding: 10, analysis: 8, summary: 6 },
};

type LevelUpInfo = {
  crewName: string;
  newLevel: number;
};

// 利用可能な画像リスト
const AVAILABLE_IMAGES = [
  { id: 'monster_1', src: '/images/crews/monster_1.png', label: 'モンスター1' },
  { id: 'monster_2', src: '/images/crews/monster_2.png', label: 'モンスター2' },
  { id: 'monster_3', src: '/images/crews/monster_3.png', label: 'モンスター3' },
  { id: 'monster_4', src: '/images/crews/monster_4.png', label: 'モンスター4' },
  { id: 'monster_5', src: '/images/crews/monster_5.png', label: 'モンスター5' },
  { id: 'monster_6', src: '/images/crews/monster_6.png', label: 'モンスター6' },
];

// 無料性格リスト
const FREE_PERSONALITIES = [
  { key: '熱血', label: '熱血', description: '熱血で情熱的。語尾に「〜だぜ！」を使う。', emoji: '🔥' },
  { key: 'おだやか', label: 'おだやか', description: '穏やかで優しい。丁寧な敬語を使う。', emoji: '🌸' },
  { key: '明るい', label: '明るい', description: '明るくフレンドリー。「〜だよ！」「〜じゃん！」を使う。', emoji: '☀️' },
  { key: 'クール', label: 'クール', description: 'クールで寡黙。「...」を多用する。', emoji: '❄️' },
  { key: '頭脳派', label: '頭脳派', description: '真面目で責任感が強い。断定的な表現を使う。', emoji: '🧠' },
];

// 作成されたクルーの型
type CreatedCrewInfo = {
  id: number;
  name: string;
  role: string;
  image: string;
  greeting: string;
};

// クルー追加モーダル
function AddCrewModal({
  isOpen,
  onClose,
  onCrewAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCrewAdded: (crew: CreatedCrewInfo) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [personalityKey, setPersonalityKey] = useState(FREE_PERSONALITIES[0].key);
  const [imageMode, setImageMode] = useState<'ai' | 'select'>('ai');
  const [selectedImage, setSelectedImage] = useState(AVAILABLE_IMAGES[0].src);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { playSound } = useAppSound();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      playSound('error');
      setSubmitError('名前と役割を入力してください');
      return;
    }

    playSound('click');
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(apiUrl('/api/crews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          personality_key: personalityKey,
          // AI生成モードの場合はimageを送らない（バックエンドで生成）
          image: imageMode === 'select' ? selectedImage : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || 'クルーの作成に失敗しました';
        throw new Error(errorMessage);
      }

      const createdCrew = await response.json();

      playSound('celebrate'); // 成功時にお祝い音

      // 成功時はフォームをリセットしてモーダルを閉じる
      setName('');
      setRole('');
      setPersonalityKey(FREE_PERSONALITIES[0].key);
      setImageMode('ai');
      setSelectedImage(AVAILABLE_IMAGES[0].src);
      onCrewAdded({
        id: createdCrew.id,
        name: createdCrew.name,
        role: createdCrew.role,
        image: createdCrew.image,
        greeting: createdCrew.greeting,
      });
      onClose();
    } catch (err) {
      playSound('error');
      console.error(err);
      const message = err instanceof Error ? err.message : 'クルーの作成に失敗しました';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">新しいクルーを追加</h3>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          {/* AI生成中のローディングオーバーレイ */}
          <LoadingOverlay
            isLoading={isSubmitting && imageMode === 'ai'}
            messages={[
              'クルーのプロフィールを作成中...',
              'AIがアイコンをデザイン中...',
              'ピクセルを丁寧に配置しています...',
              '個性的なキャラクターを生成中...',
              '最終調整をしています...',
              'まもなく完成です！',
            ]}
          />

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
            {/* 名前 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: スパーキー"
                disabled={isSubmitting}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
            </div>

            {/* 役割 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                役割 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="例: クリエイター"
                disabled={isSubmitting}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
            </div>

            {/* 性格（選択式） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                性格 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {FREE_PERSONALITIES.map((p) => (
                  <motion.button
                    key={p.key}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      playSound('select');
                      setPersonalityKey(p.key);
                    }}
                    disabled={isSubmitting}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      personalityKey === p.key
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                    } disabled:opacity-50`}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1">
                      <span className={`font-medium ${
                        personalityKey === p.key
                          ? 'text-purple-700 dark:text-purple-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {p.label}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {p.description}
                      </p>
                    </div>
                    {personalityKey === p.key && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* アイコン選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                アイコン
              </label>

              {/* モード切り替えタブ */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setImageMode('ai')}
                  disabled={isSubmitting}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    imageMode === 'ai'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  AIで自動生成
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('select')}
                  disabled={isSubmitting}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    imageMode === 'select'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  既存から選択
                </button>
              </div>

              {/* AI生成モード */}
              {imageMode === 'ai' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        AIがユニークなアイコンを生成します
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ベースモンスターからランダムなバリエーションを作成
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 手動選択モード */}
              {imageMode === 'select' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-6 gap-2"
                >
                  {AVAILABLE_IMAGES.map((img) => (
                    <motion.button
                      key={img.id}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedImage(img.src)}
                      disabled={isSubmitting}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                        selectedImage === img.src
                          ? 'border-purple-500 ring-2 ring-purple-300'
                          : 'border-gray-200 dark:border-gray-700'
                      } bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 disabled:opacity-50`}
                    >
                      <img
                        src={img.src}
                        alt={img.label}
                        className="w-full h-full object-cover scale-150 translate-y-1"
                      />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* エラー表示 */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 text-center"
              >
                <p className="text-red-600 dark:text-red-400 text-sm">{submitError}</p>
              </motion.div>
            )}

            {/* 送信ボタン */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {imageMode === 'ai' ? 'AIが生成中...' : '作成中...'}
                </>
              ) : (
                <>
                  <Plus size={18} />
                  クルーを追加
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// 入社挨拶モーダル
function WelcomeModal({
  isOpen,
  onClose,
  crew,
}: {
  isOpen: boolean;
  onClose: () => void;
  crew: CreatedCrewInfo | null;
}) {
  if (!isOpen || !crew) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 紙吹雪アニメーション背景 */}
          <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-8 overflow-hidden">
            {/* キラキラエフェクト */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                initial={{
                  x: Math.random() * 300,
                  y: -20,
                  opacity: 0,
                }}
                animate={{
                  y: 200,
                  opacity: [0, 1, 1, 0],
                  rotate: 360,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}

            {/* NEW! バッジ */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
              className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full shadow-lg"
            >
              NEW!
            </motion.div>

            {/* クルー画像 */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-purple-100 to-pink-100"
            >
              <motion.img
                src={crew.image}
                alt={crew.name}
                className="w-full h-full object-cover scale-150 translate-y-2"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* 名前と役割 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-4"
            >
              <h2 className="text-2xl font-black text-white drop-shadow-lg">
                {crew.name}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {crew.role}
              </p>
            </motion.div>
          </div>

          {/* 挨拶メッセージ */}
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 relative"
            >
              {/* 吹き出しの三角 */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-50 dark:bg-gray-900 rotate-45" />

              <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed relative z-10">
                {crew.greeting}
              </p>
            </motion.div>

            {/* ボタン */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
            >
              よろしくね！
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CrewsPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelUpNotification, setLevelUpNotification] = useState<LevelUpInfo | null>(null);
  const [levelingUpCrewId, setLevelingUpCrewId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [welcomeCrew, setWelcomeCrew] = useState<CreatedCrewInfo | null>(null);
  const [selectedDetailCrew, setSelectedDetailCrew] = useState<Crew | null>(null);
  const [selectedLogCrew, setSelectedLogCrew] = useState<Crew | null>(null);
  const { playSound } = useAppSound();

  // UserContextからグローバルなユーザー情報を取得
  const { apiUser, refreshApiUser, addCoin, updateCoin, subtractRuby } = useUser();
  const userRuby = apiUser?.ruby ?? 10;
  const userCoin = apiUser?.coin ?? 0;

  // クルーデータを取得
  const fetchCrews = useCallback(() => {
    fetch(apiUrl('/api/crews'))
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        // バックエンドからskillsが来るまで、ダミーデータをマージ
        const crewsWithSkills = data.map((crew: Crew) => ({
          ...crew,
          skills: crew.skills || DUMMY_SKILLS[crew.id] || {},
        }));
        setCrews(crewsWithSkills);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('クルーデータを取得できませんでした');
        setLoading(false);
      });
  }, []);

  // ユーザーデータを取得（UserContext経由）
  const fetchUserData = useCallback(() => {
    refreshApiUser().catch((err) => {
      console.error('Failed to refresh user data:', err);
    });
  }, [refreshApiUser]);

  useEffect(() => {
    fetchCrews();
    fetchUserData();
  }, [fetchCrews, fetchUserData]);

  // EXP更新イベントをリッスン
  useEffect(() => {
    const unsubscribe = onCrewExpUpdate((event: CustomEvent<CrewExpUpdateEvent>) => {
      const { crewId, crewName, newExp, newLevel, leveledUp } = event.detail;

      // クルーのEXP/レベルを更新
      setCrews((prevCrews) =>
        prevCrews.map((crew) =>
          crew.id === crewId
            ? { ...crew, exp: newExp, level: newLevel }
            : crew
        )
      );

      // レベルアップした場合は通知を表示
      if (leveledUp) {
        setLevelingUpCrewId(crewId);
        setLevelUpNotification({ crewName, newLevel });
      }
    });

    return unsubscribe;
  }, []);

  const handleDetail = (crew: Crew) => {
    playSound('click');
    setSelectedDetailCrew(crew);
  };

  const handleViewLog = (crew: Crew) => {
    playSound('click');
    setSelectedLogCrew(crew);
  };

  const handleSetPartner = async (crew: Crew) => {
    playSound('click');
    try {
      const response = await fetch(apiUrl(`/api/crews/${crew.id}/set-partner`), {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to set partner');

      playSound('success'); // 設定成功音
      // クルーリストを更新（is_partnerフラグを反映）
      fetchCrews();
      // モーダルを閉じる
      setSelectedDetailCrew(null);
    } catch (err) {
      playSound('error');
      console.error('Failed to set partner:', err);
    }
  };

  const handleUpgrade = (crew: Crew) => {
    // TODO: 強化処理（コイン消費でEXPを与える）
    console.log('Upgrade:', crew);
  };

  // 進化完了時のハンドラー
  const handleCrewEvolved = useCallback((evolvedCrew: Crew) => {
    // クルーリストを更新
    setCrews((prevCrews) =>
      prevCrews.map((c) =>
        c.id === evolvedCrew.id ? { ...c, ...evolvedCrew } : c
      )
    );
    // 選択中のクルーも更新
    setSelectedDetailCrew(evolvedCrew);
    // ユーザーデータを再取得（ルビー残高更新）
    fetchUserData();
  }, [fetchUserData]);

  // 独立（Farewell）処理
  const handleFarewell = useCallback((crew: Crew, coinReward: number) => {
    // まずUIからクルーを削除（即座に反映）
    setCrews((prevCrews) => prevCrews.filter((c) => c.id !== crew.id));
    setSelectedDetailCrew(null);

    // コインをUIに反映（UserContext経由でグローバルに反映）
    addCoin(coinReward);

    // バックグラウンドでAPI呼び出し（エラーが出てもUIには影響しない）
    const deleteUrl = apiUrl(`/api/crews/${crew.id}`);
    const coinUrl = apiUrl('/api/user/add-coin');

    console.log('[Farewell] Deleting crew:', crew.id, 'URL:', deleteUrl);

    fetch(deleteUrl, { method: 'DELETE' })
      .then((res) => {
        console.log('[Farewell] Delete response:', res.status);
        return fetch(coinUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: coinReward }),
        });
      })
      .then(() => {
        console.log('[Farewell] Coin added:', coinReward);
        // API完了後にUserContextを更新（サーバーの実際の値を反映）
        refreshApiUser();
      })
      .catch((error) => {
        console.warn('[Farewell] API error (UI already updated):', error);
      });
  }, [addCoin, refreshApiUser]);

  const handleLevelUpComplete = useCallback(() => {
    setLevelingUpCrewId(null);
  }, []);

  const handleCloseNotification = useCallback(() => {
    setLevelUpNotification(null);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <>
      {/* レベルアップ通知 */}
      <LevelUpNotification
        show={levelUpNotification !== null}
        crewName={levelUpNotification?.crewName || ''}
        newLevel={levelUpNotification?.newLevel || 0}
        onClose={handleCloseNotification}
      />

      {/* クルー追加モーダル */}
      <AddCrewModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCrewAdded={(crew) => {
          fetchCrews();
          setWelcomeCrew(crew);
        }}
      />

      {/* 入社挨拶モーダル */}
      <WelcomeModal
        isOpen={welcomeCrew !== null}
        onClose={() => {
          playSound('confirm');
          setWelcomeCrew(null);
        }}
        crew={welcomeCrew}
      />

      {/* クルー詳細モーダル（ブロスタ風） */}
      <CrewDetailModal
        isOpen={selectedDetailCrew !== null}
        onClose={() => setSelectedDetailCrew(null)}
        crew={selectedDetailCrew}
        onSetPartner={handleSetPartner}
        onUpgrade={handleUpgrade}
        isSettingPartner={false}
        userRuby={userRuby}
        userCoin={userCoin}
        onCrewEvolved={handleCrewEvolved}
        onCoinUpdated={(newCoin) => updateCoin(newCoin)}
        onFarewell={handleFarewell}
      />

      {/* クルーログモーダル */}
      <CrewLogModal
        isOpen={selectedLogCrew !== null}
        onClose={() => setSelectedLogCrew(null)}
        crew={selectedLogCrew}
      />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              My Crews
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              クルーを育成して、様々なタスクをこなせるようにしよう
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound('click');
              setIsAddModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25"
          >
            <Plus size={18} />
            新しいクルーを追加
            <span className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-0.5 text-sm">
              <Coins size={14} className="text-yellow-300" />
              500
            </span>
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
            />
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-6 text-center"
          >
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {crews.map((crew, index) => (
              <CrewCard
                key={crew.id}
                crew={crew}
                onDetail={handleDetail}
                onViewLog={handleViewLog}
                isLevelingUp={levelingUpCrewId === crew.id}
                onLevelUpComplete={handleLevelUpComplete}
                floatDelay={index}
              />
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}
