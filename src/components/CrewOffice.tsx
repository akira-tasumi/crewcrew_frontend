'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import CrewImage from './CrewImage';
import { Crew } from './CrewCard';

// 性格ごとのセリフパターン
const PERSONALITY_QUOTES: Record<string, string[]> = {
  'Hot-blooded': [
    '次のタスク、早く来い！',
    '燃えてきたぜ！',
    '俺に任せろ！',
    'やる気満々だ！',
    '全力で行くぞ！',
  ],
  'Cool': [
    '...効率を考えよう',
    '冷静に分析中',
    'データを確認している',
    '問題ない',
    '予定通りだ',
  ],
  'Friendly': [
    'みんな元気？',
    '一緒に頑張ろう！',
    'チームワークが大事だね',
    '何か手伝おうか？',
    '今日もいい天気だね',
  ],
  'Mysterious': [
    '...ふむ',
    '興味深い...',
    '見えている...何かが',
    '運命は動いている',
    '...そうか',
  ],
  'Cheerful': [
    'わーい！',
    '楽しいね！',
    'ルンルン♪',
    '今日も最高！',
    'ハッピー！',
  ],
};

// デフォルトのセリフ
const DEFAULT_QUOTES = [
  '次のタスクは？',
  '休憩中...',
  'コーヒー飲みたい',
  'そろそろ仕事したい',
  '待機中〜',
  '何か手伝おうか？',
  '今日も頑張るぞ',
  'zzz...',
  '暇だなぁ',
  'タスクまだかな',
];

// 役割ごとの追加セリフ
const ROLE_QUOTES: Record<string, string[]> = {
  'エンジニア': ['コード書きたい', 'バグ見つけた気がする', 'リファクタしたい'],
  'デザイナー': ['良いデザイン思いついた', 'カラーパレット悩む', 'UIを改善したい'],
  'マーケター': ['データ分析中', 'KPI確認しなきゃ', 'キャンペーン考え中'],
  'ライター': ['ネタ探し中', '締め切りが...', '良い言葉が浮かんだ'],
  'アナリスト': ['数字が気になる', 'レポート作成中', 'トレンド分析したい'],
};

type CrewPosition = {
  id: number;
  x: number;
  y: number;
  floatOffset: { x: number; y: number };
  floatDuration: number;
};

type ActiveBubble = {
  crewId: number;
  message: string;
};

type CrewOfficeProps = {
  crews: Crew[];
  height?: string;
  onCrewClick?: (crew: Crew) => void;
};

export default function CrewOffice({ crews, height = 'h-[300px]', onCrewClick }: CrewOfficeProps) {
  const [isClient, setIsClient] = useState(false);
  const [positions, setPositions] = useState<CrewPosition[]>([]);
  const [activeBubble, setActiveBubble] = useState<ActiveBubble | null>(null);

  // クライアントサイドでのみレンダリング（Hydrationエラー防止）
  useEffect(() => {
    setIsClient(true);
  }, []);

  // クルーの位置をランダムに生成
  useEffect(() => {
    if (!isClient || crews.length === 0) return;

    const newPositions: CrewPosition[] = crews.map((crew, index) => {
      // グリッドベースの配置（重なりを減らす）
      const cols = Math.ceil(Math.sqrt(crews.length));
      const row = Math.floor(index / cols);
      const col = index % cols;

      // 基本位置にランダムなオフセットを追加
      const baseX = 10 + (col / cols) * 70;
      const baseY = 15 + (row / Math.ceil(crews.length / cols)) * 60;

      return {
        id: crew.id,
        x: baseX + (Math.random() - 0.5) * 15,
        y: baseY + (Math.random() - 0.5) * 10,
        floatOffset: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 8,
        },
        floatDuration: 3 + Math.random() * 2,
      };
    });

    setPositions(newPositions);
  }, [isClient, crews]);

  // セリフを取得
  const getQuote = useCallback((crew: Crew): string => {
    const allQuotes: string[] = [...DEFAULT_QUOTES];

    // 性格に応じたセリフを追加
    if (crew.personality && PERSONALITY_QUOTES[crew.personality]) {
      allQuotes.push(...PERSONALITY_QUOTES[crew.personality]);
    }

    // 役割に応じたセリフを追加
    if (crew.role && ROLE_QUOTES[crew.role]) {
      allQuotes.push(...ROLE_QUOTES[crew.role]);
    }

    return allQuotes[Math.floor(Math.random() * allQuotes.length)];
  }, []);

  // クルーをクリックしたとき
  const handleCrewClick = useCallback((crew: Crew) => {
    // 吹き出しを表示
    setActiveBubble({
      crewId: crew.id,
      message: getQuote(crew),
    });

    // 3秒後に消える
    setTimeout(() => {
      setActiveBubble((prev) => (prev?.crewId === crew.id ? null : prev));
    }, 3000);

    // 親コンポーネントにも通知
    onCrewClick?.(crew);
  }, [getQuote, onCrewClick]);

  // 奥行きに基づくスタイルを計算
  const getDepthStyle = useMemo(() => {
    return (y: number) => {
      // yが大きい（手前）ほどスケールが大きく、zIndexが高い
      const scale = 0.6 + (y / 100) * 0.5;
      const opacity = 0.7 + (y / 100) * 0.3;
      const zIndex = Math.floor(y);

      return { scale, opacity, zIndex };
    };
  }, []);

  // サーバーサイドでは何も表示しない
  if (!isClient) {
    return (
      <div className={`${height} relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900`}>
        {/* グリッド背景のみ表示 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
    );
  }

  return (
    <div className={`${height} relative overflow-hidden rounded-2xl`}>
      {/* 背景レイヤー */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

      {/* パースペクティブグリッド（床面） */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(to bottom, transparent 0%, rgba(99,102,241,0.05) 100%),
            linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'center bottom',
        }}
      />

      {/* 上部のグロー効果 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-purple-500/10 rounded-full blur-3xl" />

      {/* サイドのグロー */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[150px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[150px] h-[300px] bg-pink-500/5 rounded-full blur-3xl" />

      {/* 浮遊するパーティクル */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}

      {/* クルーたち */}
      {crews.map((crew) => {
        const position = positions.find((p) => p.id === crew.id);
        if (!position) return null;

        const depthStyle = getDepthStyle(position.y);

        return (
          <motion.div
            key={crew.id}
            className="absolute cursor-pointer"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              zIndex: depthStyle.zIndex,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: depthStyle.opacity,
              scale: depthStyle.scale,
              x: [0, position.floatOffset.x, 0, -position.floatOffset.x, 0],
              y: [0, position.floatOffset.y, 0, -position.floatOffset.y, 0],
            }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { duration: 0.5 },
              x: {
                duration: position.floatDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              y: {
                duration: position.floatDuration * 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            whileHover={{ scale: depthStyle.scale * 1.15 }}
            onClick={() => handleCrewClick(crew)}
          >
            {/* クルー画像 */}
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              {/* 影 */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/30 rounded-full blur-sm"
                style={{ transform: `translateX(-50%) scaleX(${depthStyle.scale})` }}
              />

              {/* グロー効果（レアリティに応じて） */}
              {crew.rarity && crew.rarity >= 3 && (
                <div
                  className={`absolute inset-0 rounded-full blur-md ${
                    crew.rarity === 5
                      ? 'bg-yellow-400/30'
                      : crew.rarity === 4
                      ? 'bg-orange-400/25'
                      : 'bg-purple-400/20'
                  }`}
                />
              )}

              {/* 画像 */}
              <div className="relative w-full h-full">
                <CrewImage
                  src={crew.image}
                  alt={crew.name}
                  fill
                  className="object-contain drop-shadow-lg"
                />
              </div>

              {/* 名前タグ */}
              <motion.div
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-[10px] md:text-xs font-medium text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  {crew.name}
                </span>
              </motion.div>
            </div>

            {/* 吹き出し */}
            <AnimatePresence>
              {activeBubble?.crewId === crew.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 z-50"
                >
                  <div className="relative bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    {/* 吹き出しの尻尾 */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white dark:border-t-gray-800" />
                    <div className="flex items-center gap-1.5">
                      <MessageCircle size={12} className="text-purple-500" />
                      <span className="text-xs md:text-sm text-gray-700 dark:text-gray-200 font-medium">
                        {activeBubble.message}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* クルーがいない場合のメッセージ */}
      {crews.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl mb-2"
            >
              🏢
            </motion.div>
            <p className="text-gray-400 text-sm">クルーを雇用してオフィスを賑やかにしよう！</p>
          </div>
        </div>
      )}

      {/* オフィスタイトル */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-gray-400">Crew Office</span>
        <span className="text-xs text-gray-500">({crews.length}人待機中)</span>
      </div>
    </div>
  );
}
