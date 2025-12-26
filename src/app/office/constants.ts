/**
 * オフィスマップのタイル定義（拡張版）
 *
 * 各タイルは業務の種類と自然に対応しています：
 * - 床（通路）: クルーの移動経路
 * - デスクエリア: 通常のタスク処理、リサーチ
 * - 会議スペース: 企画立案、アイデア出し、壁打ち
 * - AIラボ: 重い推論処理、画像生成、データ分析
 * - 管理エリア: 統括、進捗管理、相棒の常駐場所
 * - 休憩スペース: クルーの回復、待機状態
 * - 本棚: 資料・ナレッジ保管
 * - サーバーラック（大）: 大規模計算処理
 * - 自販機・ウォーターサーバー: リフレッシュ
 */

// タイルタイプの定義
export const TILE_TYPES = {
  FLOOR: 0,        // 床（通路）- 移動可能な空間
  WALL: 1,         // 壁 - オフィスの境界
  DESK: 2,         // デスクエリア - 通常業務・リサーチ
  MEETING: 3,      // 会議スペース - 企画・壁打ち
  AI_LAB: 4,       // AIラボ - 重い推論・生成処理
  MANAGEMENT: 5,   // 管理エリア - 統括・進捗管理
  BREAK: 6,        // 休憩スペース - 回復・待機
  BOOKSHELF: 7,    // 本棚 - 資料・ナレッジ保管
  SERVER_LARGE: 8, // サーバーラック（大）- 大規模計算
  VENDING: 9,      // 自販機・ウォーターサーバー
} as const;

export type TileType = typeof TILE_TYPES[keyof typeof TILE_TYPES];

// タイルごとの色定義（Canvas描画用）
export const TILE_COLORS: Record<TileType, string> = {
  [TILE_TYPES.FLOOR]: '#E8E8E8',         // 明るいグレー（通路）
  [TILE_TYPES.WALL]: '#4A5568',           // ダークグレー（壁）
  [TILE_TYPES.DESK]: '#90CDF4',           // 水色（デスク）
  [TILE_TYPES.MEETING]: '#9AE6B4',        // 緑色（会議室）
  [TILE_TYPES.AI_LAB]: '#D6BCFA',         // 紫色（AIラボ）
  [TILE_TYPES.MANAGEMENT]: '#FBD38D',     // オレンジ（管理）
  [TILE_TYPES.BREAK]: '#FED7E2',          // ピンク（休憩）
  [TILE_TYPES.BOOKSHELF]: '#C9B896',      // ベージュ（本棚）
  [TILE_TYPES.SERVER_LARGE]: '#5D6D7E',   // ダークグレー（サーバー）
  [TILE_TYPES.VENDING]: '#85C1E9',        // 水色（自販機）
};

// タイルごとのラベル（UI表示用）
export const TILE_LABELS: Record<TileType, string> = {
  [TILE_TYPES.FLOOR]: '通路',
  [TILE_TYPES.WALL]: '壁',
  [TILE_TYPES.DESK]: 'デスク',
  [TILE_TYPES.MEETING]: '会議室',
  [TILE_TYPES.AI_LAB]: 'AIラボ',
  [TILE_TYPES.MANAGEMENT]: '管理室',
  [TILE_TYPES.BREAK]: '休憩室',
  [TILE_TYPES.BOOKSHELF]: '本棚',
  [TILE_TYPES.SERVER_LARGE]: 'サーバールーム',
  [TILE_TYPES.VENDING]: '自販機エリア',
};

// タイルサイズ（ピクセル）
export const TILE_SIZE = 32;

// マップサイズ（拡張版: 32x24）
export const MAP_WIDTH = 32;   // 横32マス
export const MAP_HEIGHT = 24;  // 縦24マス

/**
 * オフィスマップデータ（拡張版: 32x24）
 *
 * レイアウト設計意図：
 * - 上部: 管理エリアとAIラボ（重要処理エリア）+ サーバールーム
 * - 中央: デスクエリア複数ブロック、会議スペース複数
 * - 下部: 休憩スペース、自販機エリア
 * - 本棚は各エリアの境界に配置
 * - 広い通路で各エリアが自然に接続
 * - Gather風の賑やかで広々としたレイアウト
 *
 * 凡例:
 * 0: 床, 1: 壁, 2: デスク, 3: 会議, 4: AIラボ
 * 5: 管理, 6: 休憩, 7: 本棚, 8: サーバー（大）, 9: 自販機
 */
export const OFFICE_MAP: number[][] = [
  // 0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 0: 上壁
  [  1,  5,  5,  5,  5,  0,  0,  7,  0,  0,  0,  0,  0,  0,  7,  0,  0,  0,  0,  0,  0,  0,  0,  8,  8,  8,  8,  8,  8,  8,  0,  1], // 1: 管理エリア | 本棚 | 通路 | サーバールーム
  [  1,  5,  5,  5,  5,  0,  0,  7,  0,  0,  0,  0,  0,  0,  7,  0,  0,  0,  0,  0,  0,  0,  0,  8,  8,  8,  8,  8,  8,  8,  0,  1], // 2: 管理エリア | 本棚 | 通路 | サーバールーム
  [  1,  5,  5,  5,  5,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  8,  8,  8,  8,  8,  8,  8,  0,  1], // 3: 管理エリア | 通路 | サーバールーム
  [  1,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 4: 通路 | AIラボ | 通路
  [  1,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 5: 通路 | AIラボ | 通路
  [  1,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 6: 通路 | AIラボ | 通路
  [  1,  0,  2,  2,  2,  2,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  3,  3,  3,  3,  0,  0,  0,  2,  2,  2,  2,  2,  0,  0,  1], // 7: デスク1 | 通路 | 会議1 | デスク3
  [  1,  0,  2,  2,  2,  2,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  3,  3,  3,  3,  0,  0,  0,  2,  2,  2,  2,  2,  0,  0,  1], // 8: デスク1 | 通路 | 会議1 | デスク3
  [  1,  0,  2,  2,  2,  2,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  3,  3,  3,  3,  0,  0,  0,  2,  2,  2,  2,  2,  0,  0,  1], // 9: デスク1 | 通路 | 会議1 | デスク3
  [  1,  0,  2,  2,  2,  2,  0,  0,  0,  0,  0,  7,  7,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  2,  2,  2,  2,  2,  0,  0,  1], // 10: デスク1 | 本棚 | 通路 | デスク3
  [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  7,  7,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 11: 中央通路
  [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 12: 中央通路
  [  1,  0,  2,  2,  2,  2,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  3,  3,  3,  3,  0,  0,  0,  2,  2,  2,  2,  2,  0,  0,  1], // 13: デスク2 | 通路 | 会議2 | デスク4
  [  1,  0,  2,  2,  2,  2,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  3,  3,  3,  3,  0,  0,  0,  2,  2,  2,  2,  2,  0,  0,  1], // 14: デスク2 | 通路 | 会議2 | デスク4
  [  1,  0,  2,  2,  2,  2,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  3,  3,  3,  3,  3,  0,  0,  0,  2,  2,  2,  2,  2,  0,  0,  1], // 15: デスク2 | 通路 | 会議2 | デスク4
  [  1,  0,  2,  2,  2,  2,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  2,  2,  2,  2,  2,  0,  0,  1], // 16: デスク2 | 通路 | デスク4
  [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 17: 下部通路
  [  1,  0,  0,  9,  9,  0,  0,  0,  0,  6,  6,  6,  6,  6,  6,  0,  0,  0,  0,  6,  6,  6,  6,  6,  6,  0,  0,  9,  9,  0,  0,  1], // 18: 自販機 | 休憩1 | 通路 | 休憩2 | 自販機
  [  1,  0,  0,  9,  9,  0,  0,  0,  0,  6,  6,  6,  6,  6,  6,  0,  0,  0,  0,  6,  6,  6,  6,  6,  6,  0,  0,  9,  9,  0,  0,  1], // 19: 自販機 | 休憩1 | 通路 | 休憩2 | 自販機
  [  1,  0,  0,  0,  0,  0,  0,  0,  0,  6,  6,  6,  6,  6,  6,  0,  0,  0,  0,  6,  6,  6,  6,  6,  6,  0,  0,  0,  0,  0,  0,  1], // 20: 通路 | 休憩1 | 通路 | 休憩2 | 通路
  [  1,  0,  0,  0,  0,  0,  0,  0,  0,  6,  6,  6,  6,  6,  6,  0,  0,  0,  0,  6,  6,  6,  6,  6,  6,  0,  0,  0,  0,  0,  0,  1], // 21: 通路 | 休憩1 | 通路 | 休憩2 | 通路
  [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1], // 22: 下部通路
  [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1], // 23: 下壁
];

/**
 * エリア情報（クルー配置時に使用）
 *
 * 各エリアの座標範囲を定義。
 * クルーをエリア内のランダムな位置に配置する際に使用。
 */
export const AREA_BOUNDS = {
  MANAGEMENT: { x1: 1, y1: 1, x2: 4, y2: 3 },       // 管理エリア
  AI_LAB: { x1: 9, y1: 4, x2: 13, y2: 6 },          // AIラボ
  SERVER_ROOM: { x1: 23, y1: 1, x2: 29, y2: 3 },    // サーバールーム
  DESK_1: { x1: 2, y1: 7, x2: 5, y2: 10 },          // デスク1（左上）
  DESK_2: { x1: 2, y1: 13, x2: 5, y2: 16 },         // デスク2（左下）
  DESK_3: { x1: 24, y1: 7, x2: 28, y2: 10 },        // デスク3（右上）
  DESK_4: { x1: 24, y1: 13, x2: 28, y2: 16 },       // デスク4（右下）
  MEETING_1: { x1: 16, y1: 7, x2: 20, y2: 9 },      // 会議室1
  MEETING_2: { x1: 16, y1: 13, x2: 20, y2: 15 },    // 会議室2
  BREAK_1: { x1: 9, y1: 18, x2: 14, y2: 21 },       // 休憩室1
  BREAK_2: { x1: 19, y1: 18, x2: 24, y2: 21 },      // 休憩室2
  VENDING_1: { x1: 3, y1: 18, x2: 4, y2: 19 },      // 自販機エリア1
  VENDING_2: { x1: 27, y1: 18, x2: 28, y2: 19 },    // 自販機エリア2
} as const;

/**
 * クルーの状態とエリアのマッピング
 *
 * クルーの業務状態に応じて、どのエリアに配置するかを決定する際に使用。
 */
export const STATUS_TO_AREA: Record<string, TileType> = {
  'working': TILE_TYPES.DESK,        // 通常タスク処理中
  'researching': TILE_TYPES.DESK,    // リサーチ中
  'planning': TILE_TYPES.MEETING,    // 企画・壁打ち中
  'generating': TILE_TYPES.AI_LAB,   // AI生成処理中
  'analyzing': TILE_TYPES.AI_LAB,    // データ分析中
  'computing': TILE_TYPES.SERVER_LARGE, // 大規模計算処理中
  'managing': TILE_TYPES.MANAGEMENT, // 統括・管理中
  'idle': TILE_TYPES.BREAK,          // 待機中
  'resting': TILE_TYPES.BREAK,       // 休憩中
};

/**
 * クルーのロールと割り当てエリアのマッピング
 * ランダムウォーク時に使用
 */
export const ROLE_TO_AREAS: Record<string, (keyof typeof AREA_BOUNDS)[]> = {
  // エンジニア系
  'エンジニア': ['DESK_1', 'DESK_2', 'AI_LAB', 'SERVER_ROOM'],
  'プログラマー': ['DESK_1', 'DESK_2', 'AI_LAB', 'SERVER_ROOM'],
  'バックエンドエンジニア': ['DESK_1', 'AI_LAB', 'SERVER_ROOM'],
  'フロントエンドエンジニア': ['DESK_1', 'DESK_3', 'AI_LAB'],
  'データサイエンティスト': ['AI_LAB', 'SERVER_ROOM', 'DESK_2'],
  'AIエンジニア': ['AI_LAB', 'SERVER_ROOM'],
  'インフラエンジニア': ['SERVER_ROOM', 'DESK_2'],

  // クリエイター系
  'デザイナー': ['DESK_3', 'DESK_4', 'MEETING_1', 'BREAK_1'],
  'UIデザイナー': ['DESK_3', 'MEETING_1'],
  'UXデザイナー': ['DESK_3', 'MEETING_1', 'MEETING_2'],
  'グラフィックデザイナー': ['DESK_3', 'DESK_4'],
  'イラストレーター': ['DESK_4', 'BREAK_1'],
  'アーティスト': ['DESK_4', 'BREAK_1', 'BREAK_2'],
  '動画クリエイター': ['DESK_3', 'AI_LAB'],

  // ビジネス系
  'マーケター': ['MEETING_1', 'MEETING_2', 'DESK_1', 'DESK_3'],
  'プランナー': ['MEETING_1', 'MEETING_2', 'DESK_2'],
  '企画': ['MEETING_1', 'MEETING_2'],
  'ディレクター': ['MEETING_1', 'MEETING_2', 'MANAGEMENT'],
  'プロデューサー': ['MEETING_1', 'MANAGEMENT'],
  'マネージャー': ['MANAGEMENT', 'MEETING_1'],
  '営業': ['MEETING_1', 'MEETING_2', 'BREAK_1'],
  'コンサルタント': ['MEETING_1', 'MEETING_2', 'DESK_1'],

  // ライター・リサーチ系
  'ライター': ['DESK_2', 'DESK_4', 'BREAK_2'],
  'コピーライター': ['DESK_2', 'MEETING_1'],
  'リサーチャー': ['DESK_1', 'DESK_2', 'AI_LAB'],
  'アナリスト': ['DESK_1', 'AI_LAB', 'SERVER_ROOM'],
  'エディター': ['DESK_2', 'DESK_4'],

  // サポート系
  'アシスタント': ['DESK_1', 'DESK_2', 'DESK_3', 'DESK_4', 'BREAK_1', 'BREAK_2'],
  'サポート': ['DESK_1', 'DESK_2', 'BREAK_1'],
  '秘書': ['MANAGEMENT', 'DESK_1'],

  // デフォルト（マッチしない場合）
  'default': ['DESK_1', 'DESK_2', 'DESK_3', 'DESK_4', 'MEETING_1', 'MEETING_2', 'BREAK_1', 'BREAK_2'],
};

/**
 * エリア名からエリア境界を取得するヘルパー
 */
export function getAreaBounds(areaName: keyof typeof AREA_BOUNDS) {
  return AREA_BOUNDS[areaName];
}

/**
 * ロールに適したエリアをランダムに取得
 */
export function getRandomAreaForRole(role: string): keyof typeof AREA_BOUNDS {
  // ロールに部分一致するキーを探す
  const matchedKey = Object.keys(ROLE_TO_AREAS).find(key =>
    key !== 'default' && role.includes(key)
  );

  const areas = matchedKey ? ROLE_TO_AREAS[matchedKey] : ROLE_TO_AREAS['default'];
  return areas[Math.floor(Math.random() * areas.length)];
}

/**
 * エリア内のランダムな座標を取得
 */
export function getRandomPositionInArea(areaName: keyof typeof AREA_BOUNDS): { x: number; y: number } {
  const bounds = AREA_BOUNDS[areaName];
  const x = bounds.x1 + Math.floor(Math.random() * (bounds.x2 - bounds.x1 + 1));
  const y = bounds.y1 + Math.floor(Math.random() * (bounds.y2 - bounds.y1 + 1));
  return { x, y };
}
