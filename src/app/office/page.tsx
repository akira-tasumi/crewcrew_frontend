'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { RefreshCw, MessageCircle, Loader2 } from 'lucide-react';
import {
  Building2,
  Users,
  Coffee,
  Cpu,
  MessageSquare,
  ClipboardList,
  X,
  Crown,
  BookOpen,
  Server,
  Zap,
} from 'lucide-react';
import MapCanvas, { type CrewSprite } from './MapCanvas';
import {
  TILE_TYPES,
  TILE_LABELS,
  AREA_BOUNDS,
  type TileType,
} from './constants';
import CrewDetailModal from '@/components/CrewDetailModal';
import { useAppSound } from '@/contexts/SoundContext';
import { apiUrl } from '@/lib/api';

type Crew = {
  id: number;
  name: string;
  role: string;
  level: number;
  exp: number;
  image: string;
  is_partner?: boolean;
};

type AreaInfo = {
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
};

// エリア情報の定義
// 時間帯を取得するヘルパー関数
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// 時間帯に応じたオフィス背景スタイルを取得
function getOfficeBackground(timeOfDay: string): string {
  switch (timeOfDay) {
    case 'morning':
      return 'bg-gradient-to-b from-orange-100 via-yellow-50 to-blue-50';
    case 'afternoon':
      return 'bg-gradient-to-b from-blue-100 via-blue-50 to-white';
    case 'evening':
      return 'bg-gradient-to-b from-orange-200 via-pink-100 to-purple-100';
    case 'night':
      return 'bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900';
    default:
      return 'bg-gradient-to-b from-blue-100 via-blue-50 to-white';
  }
}

type Partner = {
  id: number;
  name: string;
  role: string;
  level: number;
  image: string;
  personality: string | null;
  greeting: string;
};

type WhimsicalTalkResponse = {
  success: boolean;
  talk: string | null;
  partner_name: string | null;
  partner_image: string | null;
  error: string | null;
};

const AREA_INFO: Record<TileType, AreaInfo> = {
  [TILE_TYPES.FLOOR]: {
    name: '通路',
    icon: <Building2 size={20} />,
    description: 'クルーの移動経路',
    color: 'from-gray-400 to-gray-500',
  },
  [TILE_TYPES.WALL]: {
    name: '壁',
    icon: <Building2 size={20} />,
    description: 'オフィスの境界',
    color: 'from-gray-600 to-gray-700',
  },
  [TILE_TYPES.DESK]: {
    name: 'デスクエリア',
    icon: <ClipboardList size={20} />,
    description: '通常業務・リサーチを行うエリア',
    color: 'from-blue-400 to-blue-500',
  },
  [TILE_TYPES.MEETING]: {
    name: '会議スペース',
    icon: <MessageSquare size={20} />,
    description: '企画立案・アイデア出し・壁打ちを行うエリア',
    color: 'from-green-400 to-green-500',
  },
  [TILE_TYPES.AI_LAB]: {
    name: 'AIラボ',
    icon: <Cpu size={20} />,
    description: '重い推論処理・画像生成・データ分析を行うエリア',
    color: 'from-purple-400 to-purple-500',
  },
  [TILE_TYPES.MANAGEMENT]: {
    name: '管理エリア',
    icon: <Users size={20} />,
    description: '統括・進捗管理を行うエリア（相棒の常駐場所）',
    color: 'from-orange-400 to-orange-500',
  },
  [TILE_TYPES.BREAK]: {
    name: '休憩スペース',
    icon: <Coffee size={20} />,
    description: 'クルーの回復・待機エリア',
    color: 'from-pink-400 to-pink-500',
  },
  [TILE_TYPES.BOOKSHELF]: {
    name: '本棚',
    icon: <BookOpen size={20} />,
    description: '資料・ナレッジを保管するエリア',
    color: 'from-amber-400 to-amber-500',
  },
  [TILE_TYPES.SERVER_LARGE]: {
    name: 'サーバールーム',
    icon: <Server size={20} />,
    description: '大規模計算処理を行うエリア',
    color: 'from-slate-500 to-slate-600',
  },
  [TILE_TYPES.VENDING]: {
    name: '自販機エリア',
    icon: <Zap size={20} />,
    description: 'リフレッシュ・エネルギー補給エリア',
    color: 'from-cyan-400 to-cyan-500',
  },
};

/**
 * クルーをエリア内のランダムな位置に配置
 */
function assignCrewPosition(
  crew: Crew,
  index: number,
  totalCrews: number
): CrewSprite {
  // 相棒は管理エリアに配置
  if (crew.is_partner) {
    return {
      id: crew.id,
      name: crew.name,
      role: crew.role,
      gridX: AREA_BOUNDS.MANAGEMENT.x1 + 1,
      gridY: AREA_BOUNDS.MANAGEMENT.y1 + 1,
      pixelX: (AREA_BOUNDS.MANAGEMENT.x1 + 1) * 32,
      pixelY: (AREA_BOUNDS.MANAGEMENT.y1 + 1) * 32,
      imageUrl: crew.image,
      status: 'managing',
      isPartner: true,
    };
  }

  // その他のクルーは各エリアに分散配置
  const areas = [
    { bounds: AREA_BOUNDS.DESK_1, status: 'working' },
    { bounds: AREA_BOUNDS.DESK_2, status: 'working' },
    { bounds: AREA_BOUNDS.DESK_3, status: 'working' },
    { bounds: AREA_BOUNDS.DESK_4, status: 'working' },
    { bounds: AREA_BOUNDS.MEETING_1, status: 'planning' },
    { bounds: AREA_BOUNDS.MEETING_2, status: 'planning' },
    { bounds: AREA_BOUNDS.AI_LAB, status: 'generating' },
    { bounds: AREA_BOUNDS.BREAK_1, status: 'idle' },
    { bounds: AREA_BOUNDS.BREAK_2, status: 'idle' },
  ];

  const areaIndex = index % areas.length;
  const area = areas[areaIndex];

  // エリア内でのオフセットを計算
  const areaWidth = area.bounds.x2 - area.bounds.x1 + 1;
  const areaHeight = area.bounds.y2 - area.bounds.y1 + 1;
  const positionInArea = Math.floor(index / areas.length);
  const offsetX = positionInArea % areaWidth;
  const offsetY = Math.floor(positionInArea / areaWidth) % areaHeight;

  const gridX = area.bounds.x1 + offsetX;
  const gridY = area.bounds.y1 + offsetY;

  return {
    id: crew.id,
    name: crew.name,
    role: crew.role,
    gridX,
    gridY,
    pixelX: gridX * 32,
    pixelY: gridY * 32,
    imageUrl: crew.image,
    status: area.status,
    isPartner: false,
  };
}

export default function OfficePage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [crewSprites, setCrewSprites] = useState<CrewSprite[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewSprite | null>(null);
  const [selectedArea, setSelectedArea] = useState<TileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  // 時間帯・背景・気まぐれトーク用のstate
  const [timeOfDay, setTimeOfDay] = useState<string>(getTimeOfDay());
  const [partner, setPartner] = useState<Partner | null>(null);
  const [whimsicalTalk, setWhimsicalTalk] = useState<string | null>(null);
  const [isLoadingTalk, setIsLoadingTalk] = useState(false);

  // CrewDetailModal用のstate
  const [detailModalCrew, setDetailModalCrew] = useState<Crew | null>(null);
  const [userRuby, setUserRuby] = useState<number>(10);
  const [userCoin, setUserCoin] = useState<number>(0);
  const { playSound } = useAppSound();

  // 気まぐれトークを取得
  const fetchWhimsicalTalk = useCallback(async () => {
    if (isLoadingTalk) return;

    setIsLoadingTalk(true);
    try {
      const currentTime = getTimeOfDay();
      setTimeOfDay(currentTime);

      const res = await fetch(apiUrl('/api/partner/greeting'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_of_day: currentTime }),
      });

      if (res.ok) {
        const data: WhimsicalTalkResponse = await res.json();
        if (data.success && data.talk) {
          setWhimsicalTalk(data.talk);
        }
      }
    } catch (err) {
      console.error('Failed to fetch whimsical talk:', err);
    } finally {
      setIsLoadingTalk(false);
    }
  }, [isLoadingTalk]);

  // クルー一覧を取得
  const fetchCrews = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/crews'));
      if (res.ok) {
        const data = await res.json();
        setCrews(data);

        // 相棒情報を取得
        const partnerRes = await fetch(apiUrl('/api/partner'));
        let partnerId: number | null = null;
        if (partnerRes.ok) {
          const partnerData = await partnerRes.json();
          if (partnerData) {
            partnerId = partnerData.id;
            setPartner(partnerData); // 相棒情報をセット
          }
        }

        // クルーにis_partnerフラグを付与して配置
        const crewsWithPartner = data.map((c: Crew) => ({
          ...c,
          is_partner: c.id === partnerId,
        }));

        const sprites = crewsWithPartner.map((crew: Crew, index: number) =>
          assignCrewPosition(crew, index, crewsWithPartner.length)
        );
        setCrewSprites(sprites);
      }
    } catch (err) {
      console.error('Failed to fetch crews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ユーザーデータ取得（ルビー・コイン残高）
  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/user'));
      if (res.ok) {
        const data = await res.json();
        setUserRuby(data.ruby || 10);
        setUserCoin(data.coin || 0);
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  }, []);

  useEffect(() => {
    fetchCrews();
    fetchUserData();

    // 時間帯を定期的に更新（1分ごと）
    const timeInterval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, [fetchCrews, fetchUserData]);

  // クルークリック時のハンドラ
  const handleCrewClick = useCallback((crew: CrewSprite) => {
    playSound('click');
    setSelectedCrew(crew);
    setSelectedArea(null);
    setShowPanel(true);
  }, [playSound]);

  // 詳細モーダルを開く
  const openDetailModal = useCallback((crewData: Crew) => {
    playSound('click');
    setDetailModalCrew(crewData);
  }, [playSound]);

  // 進化完了時のハンドラー
  const handleCrewEvolved = useCallback((evolvedCrew: Crew) => {
    setCrews((prevCrews) =>
      prevCrews.map((c) =>
        c.id === evolvedCrew.id ? { ...c, ...evolvedCrew } : c
      )
    );
    setDetailModalCrew(evolvedCrew);
    fetchUserData();
  }, [fetchUserData]);

  // タイルクリック時のハンドラ
  const handleTileClick = useCallback((x: number, y: number, tileType: TileType) => {
    if (tileType !== TILE_TYPES.WALL && tileType !== TILE_TYPES.FLOOR) {
      setSelectedArea(tileType);
      setSelectedCrew(null);
      setShowPanel(true);
    } else {
      setShowPanel(false);
      setSelectedArea(null);
      setSelectedCrew(null);
    }
  }, []);

  // パネルを閉じる
  const closePanel = useCallback(() => {
    setShowPanel(false);
    setSelectedCrew(null);
    setSelectedArea(null);
  }, []);

  // 選択中のクルーの詳細情報
  const selectedCrewData = selectedCrew
    ? crews.find((c) => c.id === selectedCrew.id)
    : null;

  // オフィス背景スタイル
  const officeBackground = getOfficeBackground(timeOfDay);
  const isNightTime = timeOfDay === 'night';

  // 相棒の吹き出しに表示するメッセージ
  const displayMessage = whimsicalTalk || (partner?.greeting ?? '');

  return (
    <div className="h-full overflow-hidden relative">
      {/* 時間帯に応じた背景 */}
      <div className={`absolute inset-0 -z-10 transition-colors duration-1000 ${officeBackground}`}>
        {/* 夜の窓の明かり演出 */}
        {isNightTime && (
          <>
            <div className="absolute top-20 left-[10%] w-16 h-24 bg-yellow-200/30 rounded-sm" />
            <div className="absolute top-32 left-[25%] w-12 h-20 bg-yellow-300/20 rounded-sm" />
            <div className="absolute top-16 right-[15%] w-14 h-22 bg-orange-200/25 rounded-sm" />
            <div className="absolute top-28 right-[30%] w-10 h-18 bg-yellow-100/20 rounded-sm" />
            {/* 星エフェクト（CSSアニメーションで軽量化） */}
            {[5, 12, 25, 38, 45, 58, 72, 85, 92, 15, 33, 67, 78, 8, 55, 42, 88, 22, 63, 95].map((pos, i) => (
              <div
                key={`star-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${pos}%`,
                  top: `${(i * 7) % 35 + 5}%`,
                  animationDuration: `${2 + (i % 3)}s`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </>
        )}

        {/* 朝の太陽光演出 */}
        {timeOfDay === 'morning' && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200/40 rounded-full blur-3xl" />
        )}

        {/* 夕方の夕焼け演出 */}
        {timeOfDay === 'evening' && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-300/30 to-transparent" />
        )}
      </div>

      {/* マップエリア */}
      <div className="h-full flex items-center justify-center">
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
          />
        ) : (
          <MapCanvas
            crews={crewSprites}
            onCrewClick={handleCrewClick}
            onTileClick={handleTileClick}
            selectedCrewId={selectedCrew?.id}
          />
        )}
      </div>

      {/* 右上: タイトル & 統計 & 凡例 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-4 z-10 space-y-3"
      >
        {/* タイトル & 統計 */}
        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Building2 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Office</h1>
              <p className="text-xs text-gray-400">クルーたちのワークスペース</p>
            </div>
          </div>

          {/* 統計 */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {crewSprites.length}
              </p>
              <p className="text-xs text-gray-500">総クルー</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {crewSprites.filter((c) => c.status === 'working' || c.status === 'generating').length}
              </p>
              <p className="text-xs text-gray-500">稼働中</p>
            </div>
          </div>
        </div>

        {/* 凡例 */}
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">エリア凡例</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TILE_LABELS)
              .filter(([key]) => {
                const n = Number(key);
                return n !== TILE_TYPES.WALL && n !== TILE_TYPES.FLOOR;
              })
              .map(([key, label]) => {
                const tileType = Number(key) as TileType;
                const info = AREA_INFO[tileType];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-1.5 text-xs text-gray-300"
                  >
                    <div
                      className={`w-3 h-3 rounded bg-gradient-to-br ${info.color}`}
                    />
                    <span>{label}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 相棒の気まぐれトーク */}
        {partner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10"
          >
            <div className="flex items-center gap-3">
              {/* 相棒アイコン */}
              <motion.div
                className="relative cursor-pointer flex-shrink-0"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                onClick={fetchWhimsicalTalk}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400 shadow-lg bg-gradient-to-br from-purple-100 to-pink-100">
                  <Image
                    src={partner.image}
                    alt={partner.name}
                    width={48}
                    height={48}
                    className="object-cover scale-150 translate-y-1"
                  />
                </div>
                <motion.div
                  className="absolute -bottom-0.5 -right-0.5 bg-purple-500 rounded-full p-0.5 shadow-lg"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <MessageCircle size={10} className="text-white" />
                </motion.div>
              </motion.div>

              {/* 吹き出し */}
              <div className="flex-1 relative bg-white/10 rounded-lg p-2 min-h-[40px] flex items-center">
                <div className="absolute left-0 top-1/2 -translate-x-1.5 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-white/10" />

                {isLoadingTalk ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs">考え中...</span>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={displayMessage}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-gray-200 leading-relaxed"
                    >
                      {displayMessage}
                    </motion.p>
                  </AnimatePresence>
                )}

                {/* リフレッシュボタン */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchWhimsicalTalk();
                  }}
                  disabled={isLoadingTalk}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute -top-1.5 -right-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-full p-1 shadow-lg transition-colors"
                >
                  <RefreshCw size={10} className={isLoadingTalk ? 'animate-spin' : ''} />
                </motion.button>
              </div>
            </div>

            {/* 時間帯表示 */}
            <div className="mt-2 text-center">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isNightTime
                  ? 'bg-indigo-800/50 text-indigo-200'
                  : 'bg-white/20 text-gray-300'
              }`}>
                {timeOfDay === 'morning' && '🌅 朝'}
                {timeOfDay === 'afternoon' && '☀️ 昼'}
                {timeOfDay === 'evening' && '🌇 夕方'}
                {timeOfDay === 'night' && '🌙 夜'}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 右下: フローティングパネル */}
      <AnimatePresence mode="wait">
        {showPanel && (selectedCrew || selectedArea) && (
          <motion.div
            key={selectedCrew?.id ?? selectedArea ?? 'panel'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-4 right-4 z-20 w-80"
          >
            {selectedCrew && selectedCrewData ? (
              // クルー詳細パネル
              <div className="bg-black/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
                {/* ヘッダー */}
                <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 p-4 relative">
                  <button
                    onClick={closePanel}
                    className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="relative cursor-pointer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openDetailModal(selectedCrewData)}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/50 bg-white/20 hover:border-purple-400 transition-colors">
                        <Image
                          src={selectedCrewData.image}
                          alt={selectedCrewData.name}
                          width={56}
                          height={56}
                          className="object-cover scale-150 translate-y-1"
                        />
                      </div>
                      {selectedCrew.isPartner && (
                        <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                          <Crown size={10} className="text-yellow-800" />
                        </div>
                      )}
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">
                          {selectedCrewData.name}
                        </h3>
                        {selectedCrew.isPartner && (
                          <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-medium">
                            相棒
                          </span>
                        )}
                      </div>
                      <p className="text-white/80 text-sm">{selectedCrewData.role}</p>
                    </div>
                  </div>
                </div>

                {/* 詳細情報 */}
                <div className="p-4 space-y-3">
                  {/* レベル & EXP */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">
                        Level {selectedCrewData.level}
                      </span>
                      <span className="text-xs text-gray-400">
                        {selectedCrewData.exp}/100 EXP
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedCrewData.exp}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    </div>
                  </div>

                  {/* 現在の状態 */}
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1">現在のステータス</p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          selectedCrew.status === 'working'
                            ? 'bg-green-500'
                            : selectedCrew.status === 'generating'
                            ? 'bg-purple-500'
                            : selectedCrew.status === 'managing'
                            ? 'bg-orange-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-200">
                        {selectedCrew.status === 'working' && '作業中'}
                        {selectedCrew.status === 'generating' && 'AI処理中'}
                        {selectedCrew.status === 'planning' && '企画中'}
                        {selectedCrew.status === 'managing' && '管理中'}
                        {selectedCrew.status === 'idle' && '待機中'}
                        {selectedCrew.status === 'resting' && '休憩中'}
                      </span>
                    </div>
                  </div>

                  {/* 位置情報 */}
                  <p className="text-xs text-gray-500">
                    位置: ({selectedCrew.gridX}, {selectedCrew.gridY})
                  </p>
                </div>
              </div>
            ) : selectedArea ? (
              // エリア詳細パネル
              <div className="bg-black/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
                <div className={`bg-gradient-to-r ${AREA_INFO[selectedArea].color} bg-opacity-80 p-4 relative`}>
                  <button
                    onClick={closePanel}
                    className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                      {AREA_INFO[selectedArea].icon}
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {AREA_INFO[selectedArea].name}
                    </h3>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-gray-400 text-sm mb-3">
                    {AREA_INFO[selectedArea].description}
                  </p>

                  {/* このエリアにいるクルー */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">このエリアのクルー</p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {crewSprites
                        .filter((sprite) => {
                          // エリアの範囲内にいるクルーをフィルタ
                          const areaKey = Object.keys(AREA_BOUNDS).find((key) => {
                            const bounds = AREA_BOUNDS[key as keyof typeof AREA_BOUNDS];
                            return (
                              sprite.gridX >= bounds.x1 &&
                              sprite.gridX <= bounds.x2 &&
                              sprite.gridY >= bounds.y1 &&
                              sprite.gridY <= bounds.y2
                            );
                          });
                          // エリアタイプと一致するかチェック
                          if (!areaKey) return false;
                          const areaToTile: Record<string, TileType> = {
                            MANAGEMENT: TILE_TYPES.MANAGEMENT,
                            AI_LAB: TILE_TYPES.AI_LAB,
                            SERVER_ROOM: TILE_TYPES.SERVER_LARGE,
                            DESK_1: TILE_TYPES.DESK,
                            DESK_2: TILE_TYPES.DESK,
                            DESK_3: TILE_TYPES.DESK,
                            DESK_4: TILE_TYPES.DESK,
                            MEETING_1: TILE_TYPES.MEETING,
                            MEETING_2: TILE_TYPES.MEETING,
                            BREAK_1: TILE_TYPES.BREAK,
                            BREAK_2: TILE_TYPES.BREAK,
                            VENDING_1: TILE_TYPES.VENDING,
                            VENDING_2: TILE_TYPES.VENDING,
                          };
                          return areaToTile[areaKey] === selectedArea;
                        })
                        .map((sprite) => {
                          const crewData = crews.find((c) => c.id === sprite.id);
                          if (!crewData) return null;
                          return (
                            <div
                              key={sprite.id}
                              onClick={() => {
                                setSelectedCrew(sprite);
                                setSelectedArea(null);
                              }}
                              className="flex items-center gap-2 p-1.5 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-900/50">
                                <Image
                                  src={crewData.image}
                                  alt={crewData.name}
                                  width={24}
                                  height={24}
                                  className="object-cover scale-150 translate-y-0.5"
                                />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-200">
                                  {crewData.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {crewData.role}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      {crewSprites.filter((sprite) => {
                        const areaKey = Object.keys(AREA_BOUNDS).find((key) => {
                          const bounds = AREA_BOUNDS[key as keyof typeof AREA_BOUNDS];
                          return (
                            sprite.gridX >= bounds.x1 &&
                            sprite.gridX <= bounds.x2 &&
                            sprite.gridY >= bounds.y1 &&
                            sprite.gridY <= bounds.y2
                          );
                        });
                        if (!areaKey) return false;
                        const areaToTile: Record<string, TileType> = {
                          MANAGEMENT: TILE_TYPES.MANAGEMENT,
                          AI_LAB: TILE_TYPES.AI_LAB,
                          SERVER_ROOM: TILE_TYPES.SERVER_LARGE,
                          DESK_1: TILE_TYPES.DESK,
                          DESK_2: TILE_TYPES.DESK,
                          DESK_3: TILE_TYPES.DESK,
                          DESK_4: TILE_TYPES.DESK,
                          MEETING_1: TILE_TYPES.MEETING,
                          MEETING_2: TILE_TYPES.MEETING,
                          BREAK_1: TILE_TYPES.BREAK,
                          BREAK_2: TILE_TYPES.BREAK,
                          VENDING_1: TILE_TYPES.VENDING,
                          VENDING_2: TILE_TYPES.VENDING,
                        };
                        return areaToTile[areaKey] === selectedArea;
                      }).length === 0 && (
                        <p className="text-xs text-gray-500 italic">
                          このエリアにクルーはいません
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* クルー詳細モーダル（My Crewsと同じ） */}
      <CrewDetailModal
        isOpen={detailModalCrew !== null}
        onClose={() => setDetailModalCrew(null)}
        crew={detailModalCrew}
        onSetPartner={async (crew) => {
          try {
            const response = await fetch(apiUrl(`/api/crews/${crew.id}/set-partner`), {
              method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to set partner');
            playSound('success');
            fetchCrews();
            setDetailModalCrew(null);
          } catch (err) {
            playSound('error');
            console.error('Failed to set partner:', err);
          }
        }}
        onUpgrade={(crew) => {
          console.log('Upgrade:', crew);
        }}
        isSettingPartner={false}
        userRuby={userRuby}
        userCoin={userCoin}
        onCrewEvolved={handleCrewEvolved}
        onCoinUpdated={(newCoin) => setUserCoin(newCoin)}
      />
    </div>
  );
}
