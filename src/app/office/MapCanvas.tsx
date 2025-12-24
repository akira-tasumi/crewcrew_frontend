'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  OFFICE_MAP,
  TILE_TYPES,
  AREA_BOUNDS,
  type TileType,
} from './constants';

/**
 * リッチカラーパレット（立体感・質感重視）
 */
const PASTEL_COLORS = {
  // 床・壁
  floor: '#F5F0E8',
  floorLine: '#E8E0D5',
  wallTop: '#9AADD1',
  wallFront: '#7B8DB5',
  wallSide: '#6B7D9E',

  // 新しい床タイプ（リッチな質感）
  flooring: '#C9976A',      // 木目フローリング（深め）
  flooringDark: '#A87B52',  // フローリング暗部
  flooringLight: '#DCAB7E', // フローリング明部
  flooringLine: '#B88A5C',  // フローリングライン
  carpet: '#3D4A5C',        // オフィスカーペット（深め）
  carpetLight: '#4A5A6E',   // カーペット明部
  carpetNoise: '#343E4D',   // カーペットノイズ
  rug: '#5C3A1D',           // 会議室ラグ（深め）
  rugLight: '#7A4E2A',      // ラグ明部
  rugBorder: '#3D2810',     // ラグの縁取り
  tile: '#E8EDF2',          // 石畳タイル
  tileLine: '#C5D0DB',      // タイル目地

  // エリア別
  desk: '#D4E6F1',
  deskFurniture: '#4A5A6A',
  deskFurnitureTop: '#5D6D7E',
  deskFurnitureSide: '#3D4A58',
  monitor: '#1E2D3D',
  monitorScreen: '#85C1E9',
  monitorGlow: 'rgba(133, 193, 233, 0.4)',

  meeting: '#D5F5E3',
  meetingTable: '#8B4513',
  meetingTableTop: '#A0522D',
  meetingTableSide: '#6B3410',

  aiLab: '#E8DAEF',
  serverRack: '#2A3A4A',
  serverRackTop: '#3A4D5F',
  serverRackHighlight: '#5A7A9A',
  ledGreen: '#2ECC71',
  ledRed: '#E74C3C',
  ledBlue: '#3498DB',

  management: '#FCF3CF',
  managerDesk: '#6B3A10',
  managerDeskTop: '#8B4513',

  breakRoom: '#FDEDEC',
  plant: '#27AE60',
  plantDark: '#1E8449',
  plantPot: '#8B4513',
  plantPotDark: '#6B3410',
  coffeeMachine: '#4A5A6A',
  coffeeMachineTop: '#5D6D7E',
  coffee: '#5A3E2A',

  // 新規タイル
  bookshelf: '#C9A67A',
  bookshelfFrame: '#7A4A23',
  bookshelfSide: '#5A3A18',
  serverLarge: '#151E28',
  serverLargeTop: '#1E2A38',
  vending: '#1E2A38',
  vendingTop: '#2A3A4A',
  vendingGlass: '#85C1E9',

  // ガラスパーティション
  glass: 'rgba(200, 230, 255, 0.25)',
  glassBorder: 'rgba(150, 200, 240, 0.7)',
  glassHighlight: 'rgba(255, 255, 255, 0.4)',
  partition: '#6A7A8A',
  partitionTop: '#7F8C8D',

  // 窓
  windowFrame: '#4A5A6A',
  windowGlass: 'rgba(135, 206, 250, 0.75)',
  windowGlassTop: 'rgba(200, 235, 255, 0.95)',
  godRay: 'rgba(255, 255, 255, 0.06)',

  // クルー
  crewBorder: '#9B59B6',
  partnerBorder: '#F39C12',
  statusWorking: '#2ECC71',
  statusGenerating: '#9B59B6',
  statusIdle: '#95A5A6',

  // 影（リッチなソフトシャドウ）
  shadow: 'rgba(0, 0, 0, 0.25)',
  shadowSoft: 'rgba(0, 0, 0, 0.12)',
  shadowDeep: 'rgba(0, 0, 0, 0.4)',
  ao: 'rgba(0, 0, 0, 0.08)',  // アンビエントオクルージョン
};

/**
 * パーティクルの型定義
 */
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'data' | 'steam';
};

/**
 * クルーの表示データ型（Lerp用にgrid/pixelを分離）
 */
export type CrewSprite = {
  id: number;
  name: string;
  role?: string;      // クルーの役割
  gridX: number;      // 目標グリッド座標
  gridY: number;
  pixelX: number;     // 現在のピクセル座標（Lerpで補間）
  pixelY: number;
  imageUrl: string;
  status: string;
  isPartner?: boolean;
};

type MapCanvasProps = {
  crews?: CrewSprite[];
  onTileClick?: (x: number, y: number, tileType: TileType) => void;
  onCrewClick?: (crew: CrewSprite) => void;
  selectedCrewId?: number | null;
};

// Lerp補間係数（0〜1、大きいほど素早く追従）
const LERP_FACTOR = 0.12;

/**
 * 線形補間（Lerp）
 */
function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

/**
 * 窓の位置定義（壁タイル上に配置）
 */
const WINDOW_POSITIONS = [
  // 上壁（北側）の窓
  { x: 8, y: 0 },
  { x: 12, y: 0 },
  { x: 16, y: 0 },
  { x: 20, y: 0 },
  // 左壁の窓
  { x: 0, y: 5 },
  { x: 0, y: 10 },
  { x: 0, y: 15 },
  { x: 0, y: 20 },
  // 右壁の窓
  { x: 31, y: 5 },
  { x: 31, y: 10 },
  { x: 31, y: 15 },
  { x: 31, y: 20 },
];

/**
 * 座標がエリア内かチェック
 */
function isInArea(x: number, y: number, area: { x1: number; y1: number; x2: number; y2: number }): boolean {
  return x >= area.x1 && x <= area.x2 && y >= area.y1 && y <= area.y2;
}

/**
 * 座標がエリアの境界（縁）かチェック
 */
function isAreaBorder(x: number, y: number, area: { x1: number; y1: number; x2: number; y2: number }): boolean {
  if (!isInArea(x, y, area)) return false;
  return x === area.x1 || x === area.x2 || y === area.y1 || y === area.y2;
}

/**
 * MapCanvas - ミニチュアオフィス風2D空間を描画するCanvasコンポーネント
 * 拡張版: 32x24マップ、新規タイル、Lerp移動、パーティクル、ビネット
 */
export default function MapCanvas({
  crews = [],
  onTileClick,
  onCrewClick,
  selectedCrewId,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crewImagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const crewPositionsRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  // 静的レイヤーキャッシュ用
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticDrawnRef = useRef(false);
  const gradientCacheRef = useRef<Map<string, CanvasGradient>>(new Map());

  // ホバー中のクルーとマウス位置
  const [hoveredCrew, setHoveredCrew] = useState<CrewSprite | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const canvasWidth = MAP_WIDTH * TILE_SIZE;
  const canvasHeight = MAP_HEIGHT * TILE_SIZE;

  // パーティクル数の上限
  const MAX_PARTICLES = 20;

  /**
   * ソフトシャドウを描画（強力なドロップシャドウ）
   */
  const drawSoftShadow = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    blur: number = 10,
    offsetY: number = 5,
    opacity: number = 0.3
  ) => {
    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${opacity})`;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = offsetY;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height, width / 2 * 0.9, height * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);

  /**
   * 接地影を描画（オブジェクトの足元の濃い短い影）
   */
  const drawContactShadow = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number
  ) => {
    const gradient = ctx.createRadialGradient(
      x + width / 2, y, 0,
      x + width / 2, y, width / 2
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y, width / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  /**
   * 壁際のアンビエントオクルージョン（AO）を描画
   */
  const drawWallAO = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    direction: 'top' | 'left' | 'right' | 'bottom'
  ) => {
    const aoSize = 12;
    let gradient: CanvasGradient;

    switch (direction) {
      case 'top':
        gradient = ctx.createLinearGradient(px, py, px, py + aoSize);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px, py, TILE_SIZE, aoSize);
        break;
      case 'bottom':
        gradient = ctx.createLinearGradient(px, py + TILE_SIZE, px, py + TILE_SIZE - aoSize);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px, py + TILE_SIZE - aoSize, TILE_SIZE, aoSize);
        break;
      case 'left':
        gradient = ctx.createLinearGradient(px, py, px + aoSize, py);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px, py, aoSize, TILE_SIZE);
        break;
      case 'right':
        gradient = ctx.createLinearGradient(px + TILE_SIZE, py, px + TILE_SIZE - aoSize, py);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px + TILE_SIZE - aoSize, py, aoSize, TILE_SIZE);
        break;
    }
  }, []);

  /**
   * 3D風の立体的なボックスを描画（天板・側面・影の3層構造）
   */
  const draw3DBox = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    topColor: string,
    sideColor: string,
    frontColor: string
  ) => {
    // 接地影
    drawContactShadow(ctx, x, y + height + depth, width);

    // 前面（最も暗い）
    ctx.fillStyle = frontColor;
    ctx.fillRect(x, y + depth, width, height);

    // 側面（少し明るい）
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(x + width, y + depth);
    ctx.lineTo(x + width + depth * 0.3, y);
    ctx.lineTo(x + width + depth * 0.3, y + height);
    ctx.lineTo(x + width, y + depth + height);
    ctx.closePath();
    ctx.fill();

    // 天板（最も明るい）
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(x, y + depth);
    ctx.lineTo(x + depth * 0.3, y);
    ctx.lineTo(x + width + depth * 0.3, y);
    ctx.lineTo(x + width, y + depth);
    ctx.closePath();
    ctx.fill();

    // 天板のハイライト
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + depth);
    ctx.lineTo(x + depth * 0.3 + 2, y + 2);
    ctx.lineTo(x + width * 0.4, y + 2);
    ctx.lineTo(x + width * 0.4 - depth * 0.3, y + depth);
    ctx.closePath();
    ctx.fill();
  }, [drawContactShadow]);

  /**
   * 金属の光沢ハイライトを描画
   */
  const drawMetalHighlight = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // 鋭いハイライト線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + width - 4, y + 2);
    ctx.stroke();

    // 縦のハイライト
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + 2, y + height * 0.6);
    ctx.stroke();
  }, []);

  /**
   * パーティクル生成（上限付き）
   */
  const spawnParticle = useCallback((type: 'data' | 'steam', x: number, y: number) => {
    // パーティクル数が上限に達していたら生成しない
    if (particlesRef.current.length >= MAX_PARTICLES) return;

    const particle: Particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * (type === 'data' ? 2 : 0.5),
      vy: type === 'data' ? -Math.random() * 2 - 1 : -Math.random() * 1.5 - 0.5,
      life: type === 'data' ? 60 : 90,
      maxLife: type === 'data' ? 60 : 90,
      size: type === 'data' ? 3 : 4,
      color: type === 'data' ? '#F1C40F' : 'rgba(255, 255, 255, 0.6)',
      type,
    };
    particlesRef.current.push(particle);
  }, [MAX_PARTICLES]);

  /**
   * パーティクル更新
   */
  const updateParticles = useCallback(() => {
    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.type === 'steam') {
        p.vx *= 0.98;
        p.size += 0.05;
      }
      return p.life > 0;
    });
  }, []);

  /**
   * パーティクル描画
   */
  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const p of particlesRef.current) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'data') {
        // データパーティクル（四角形）
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        // スチームパーティクル（円形）
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  /**
   * 木目フローリング（エントランス・通路用）- リッチ3D版
   */
  const drawWoodFlooring = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number
  ) => {
    // ベースグラデーション（立体感）
    const baseGradient = ctx.createLinearGradient(px, py, px, py + TILE_SIZE);
    baseGradient.addColorStop(0, PASTEL_COLORS.flooringLight);
    baseGradient.addColorStop(0.3, PASTEL_COLORS.flooring);
    baseGradient.addColorStop(1, PASTEL_COLORS.flooringDark);
    ctx.fillStyle = baseGradient;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // 各板のグラデーション（個別の立体感）
    const boardHeight = TILE_SIZE / 4;
    for (let i = 0; i < 4; i++) {
      const boardY = py + i * boardHeight;
      const boardGradient = ctx.createLinearGradient(px, boardY, px, boardY + boardHeight);

      // 板ごとに微妙な色差
      const shade = ((x + y + i) % 3) * 0.05;
      boardGradient.addColorStop(0, `rgba(255, 255, 255, ${0.15 - shade})`);
      boardGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      boardGradient.addColorStop(1, `rgba(0, 0, 0, ${0.08 + shade})`);

      ctx.fillStyle = boardGradient;
      ctx.fillRect(px, boardY, TILE_SIZE, boardHeight);
    }

    // 板間の溝（影を込めた立体的なライン）
    for (let i = 1; i < 4; i++) {
      const lineY = py + i * boardHeight;

      // 溝の影（上側）
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, lineY);
      ctx.lineTo(px + TILE_SIZE, lineY);
      ctx.stroke();

      // 溝のハイライト（下側）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px, lineY + 1);
      ctx.lineTo(px + TILE_SIZE, lineY + 1);
      ctx.stroke();
    }

    // 縦方向の目地（互い違い配置）
    const offset = (y % 2) * (TILE_SIZE / 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + offset + TILE_SIZE / 4, py);
    ctx.lineTo(px + offset + TILE_SIZE / 4, py + TILE_SIZE);
    ctx.stroke();

    // 木目のグレイン（リアルな木目模様）
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.12)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const grainY = py + 3 + i * 6 + (x % 3) * 2;
      const waveAmp = (x + y + i) % 2 === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(px + 1, grainY);
      ctx.bezierCurveTo(
        px + 8, grainY + waveAmp,
        px + 16, grainY - waveAmp,
        px + 24, grainY + waveAmp * 0.5
      );
      ctx.bezierCurveTo(px + 28, grainY, px + 30, grainY - waveAmp * 0.5, px + 31, grainY);
      ctx.stroke();
    }

    // 光の反射（窓からの光をシミュレート）
    const reflectionGradient = ctx.createLinearGradient(px, py, px + TILE_SIZE, py + TILE_SIZE);
    reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    reflectionGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
    ctx.fillStyle = reflectionGradient;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  }, []);

  /**
   * 石畳タイル（エントランス用）
   */
  const drawStoneTile = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number
  ) => {
    // タイルベース
    ctx.fillStyle = PASTEL_COLORS.tile;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // タイルの微妙な色差
    const shade = ((x + y) % 2) * 8;
    ctx.fillStyle = `rgba(0, 0, 0, ${shade / 255})`;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // 目地
    ctx.strokeStyle = PASTEL_COLORS.tileLine;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

    // 光沢
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(px + 2, py + 2, 12, 6);
  }, []);

  /**
   * オフィスカーペット（デスクエリア用）- リッチ3D版
   */
  const drawCarpet = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number
  ) => {
    // ベースグラデーション（深みのある質感）
    const baseGradient = ctx.createLinearGradient(px, py, px + TILE_SIZE, py + TILE_SIZE);
    baseGradient.addColorStop(0, PASTEL_COLORS.carpetLight);
    baseGradient.addColorStop(0.5, PASTEL_COLORS.carpet);
    baseGradient.addColorStop(1, PASTEL_COLORS.carpetNoise);
    ctx.fillStyle = baseGradient;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // 繊維テクスチャ（縦横の織り目）
    const seed = x * 31 + y * 17;

    // 縦方向の繊維
    for (let i = 0; i < 16; i++) {
      const fiberX = px + i * 2;
      const shade = ((seed + i) % 3) * 0.02;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + shade})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(fiberX, py);
      ctx.lineTo(fiberX, py + TILE_SIZE);
      ctx.stroke();
    }

    // 横方向の繊維
    for (let i = 0; i < 16; i++) {
      const fiberY = py + i * 2;
      const shade = ((seed + i * 3) % 3) * 0.02;
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.03 + shade})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px, fiberY);
      ctx.lineTo(px + TILE_SIZE, fiberY);
      ctx.stroke();
    }

    // パイル（毛足）のノイズテクスチャ
    for (let i = 0; i < 20; i++) {
      const noiseX = px + ((seed + i * 7) % 30) + 1;
      const noiseY = py + ((seed + i * 11) % 30) + 1;
      const noiseSize = ((seed + i) % 2) + 1;
      const brightness = ((seed + i * 5) % 2) === 0 ? 255 : 0;
      const alpha = 0.03 + ((seed + i) % 3) * 0.01;
      ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${alpha})`;
      ctx.fillRect(noiseX, noiseY, noiseSize, noiseSize);
    }

    // 環境光のアンビエント（部屋の端に向かって暗く）
    const ambientGradient = ctx.createRadialGradient(
      px + TILE_SIZE / 2, py + TILE_SIZE / 2, 0,
      px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE
    );
    ambientGradient.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
    ambientGradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
    ctx.fillStyle = ambientGradient;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  }, []);

  /**
   * 高級ラグ（会議室用）
   */
  const drawLuxuryRug = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number,
    area: { x1: number; y1: number; x2: number; y2: number }
  ) => {
    // ラグベース色
    ctx.fillStyle = PASTEL_COLORS.rug;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // 内側のパターン
    ctx.fillStyle = 'rgba(139, 90, 43, 0.3)';
    const patternOffset = (x + y) % 2;
    if (patternOffset === 0) {
      ctx.fillRect(px + 4, py + 4, 12, 12);
      ctx.fillRect(px + 16, py + 16, 12, 12);
    } else {
      ctx.fillRect(px + 16, py + 4, 12, 12);
      ctx.fillRect(px + 4, py + 16, 12, 12);
    }

    // 縁取り（エリアの境界タイルのみ）
    ctx.strokeStyle = PASTEL_COLORS.rugBorder;
    ctx.lineWidth = 3;

    if (y === area.y1) {
      ctx.beginPath();
      ctx.moveTo(px, py + 1);
      ctx.lineTo(px + TILE_SIZE, py + 1);
      ctx.stroke();
    }
    if (y === area.y2) {
      ctx.beginPath();
      ctx.moveTo(px, py + TILE_SIZE - 1);
      ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE - 1);
      ctx.stroke();
    }
    if (x === area.x1) {
      ctx.beginPath();
      ctx.moveTo(px + 1, py);
      ctx.lineTo(px + 1, py + TILE_SIZE);
      ctx.stroke();
    }
    if (x === area.x2) {
      ctx.beginPath();
      ctx.moveTo(px + TILE_SIZE - 1, py);
      ctx.lineTo(px + TILE_SIZE - 1, py + TILE_SIZE);
      ctx.stroke();
    }

    // コーナー装飾
    if (x === area.x1 && y === area.y1) {
      ctx.fillStyle = PASTEL_COLORS.rugBorder;
      ctx.beginPath();
      ctx.arc(px + 4, py + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (x === area.x2 && y === area.y1) {
      ctx.fillStyle = PASTEL_COLORS.rugBorder;
      ctx.beginPath();
      ctx.arc(px + TILE_SIZE - 4, py + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (x === area.x1 && y === area.y2) {
      ctx.fillStyle = PASTEL_COLORS.rugBorder;
      ctx.beginPath();
      ctx.arc(px + 4, py + TILE_SIZE - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (x === area.x2 && y === area.y2) {
      ctx.fillStyle = PASTEL_COLORS.rugBorder;
      ctx.beginPath();
      ctx.arc(px + TILE_SIZE - 4, py + TILE_SIZE - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  /**
   * 旧フローリングパターン（互換用）
   */
  const drawFloorPattern = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number
  ) => {
    ctx.fillStyle = PASTEL_COLORS.floor;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    ctx.strokeStyle = PASTEL_COLORS.floorLine;
    ctx.lineWidth = 1;

    for (let i = 0; i < 4; i++) {
      const lineY = py + (i + 1) * (TILE_SIZE / 4);
      ctx.beginPath();
      ctx.moveTo(px, lineY);
      ctx.lineTo(px + TILE_SIZE, lineY);
      ctx.stroke();
    }

    const offset = (Math.floor(py / TILE_SIZE) % 2) * (TILE_SIZE / 2);
    ctx.beginPath();
    ctx.moveTo(px + offset + TILE_SIZE / 4, py);
    ctx.lineTo(px + offset + TILE_SIZE / 4, py + TILE_SIZE);
    ctx.stroke();
  }, []);

  /**
   * 壁を2.5D風に描画（窓対応）
   */
  const drawWall = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number
  ) => {
    const wallHeight = 8;

    // 窓かどうかチェック
    const hasWindow = WINDOW_POSITIONS.some(w => w.x === x && w.y === y);

    ctx.fillStyle = PASTEL_COLORS.wallFront;
    ctx.fillRect(px, py + wallHeight, TILE_SIZE, TILE_SIZE - wallHeight);

    ctx.fillStyle = PASTEL_COLORS.wallTop;
    ctx.beginPath();
    ctx.moveTo(px, py + wallHeight);
    ctx.lineTo(px + 4, py);
    ctx.lineTo(px + TILE_SIZE - 4, py);
    ctx.lineTo(px + TILE_SIZE, py + wallHeight);
    ctx.closePath();
    ctx.fill();

    if (hasWindow) {
      // 窓を描画
      const windowX = px + 4;
      const windowY = py + 6;
      const windowW = TILE_SIZE - 8;
      const windowH = TILE_SIZE - 10;

      // 窓枠
      ctx.fillStyle = PASTEL_COLORS.windowFrame;
      ctx.fillRect(windowX - 2, windowY - 2, windowW + 4, windowH + 4);

      // 窓ガラス（グラデーション）
      const glassGradient = ctx.createLinearGradient(windowX, windowY, windowX, windowY + windowH);
      glassGradient.addColorStop(0, PASTEL_COLORS.windowGlassTop);
      glassGradient.addColorStop(1, PASTEL_COLORS.windowGlass);
      ctx.fillStyle = glassGradient;
      ctx.fillRect(windowX, windowY, windowW, windowH);

      // 窓の十字枠
      ctx.strokeStyle = PASTEL_COLORS.windowFrame;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(windowX + windowW / 2, windowY);
      ctx.lineTo(windowX + windowW / 2, windowY + windowH);
      ctx.moveTo(windowX, windowY + windowH / 2);
      ctx.lineTo(windowX + windowW, windowY + windowH / 2);
      ctx.stroke();

      // 窓の反射光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(windowX + 2, windowY + 2, 6, windowH / 2 - 4);
    } else {
      // 通常の壁レンガパターン
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      for (let row = 0; row < 3; row++) {
        const rowY = py + wallHeight + row * 8;
        const offset = row % 2 === 0 ? 0 : TILE_SIZE / 2;
        ctx.beginPath();
        ctx.moveTo(px, rowY);
        ctx.lineTo(px + TILE_SIZE, rowY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px + offset, rowY);
        ctx.lineTo(px + offset, rowY + 8);
        ctx.stroke();
      }
    }
  }, []);

  /**
   * ガラスパーティション（会議室・AIラボ囲い用）
   */
  const drawGlassPartition = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    sides: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean }
  ) => {
    ctx.fillStyle = PASTEL_COLORS.glass;
    ctx.strokeStyle = PASTEL_COLORS.glassBorder;
    ctx.lineWidth = 2;

    if (sides.top) {
      ctx.fillRect(px, py, TILE_SIZE, 4);
      ctx.beginPath();
      ctx.moveTo(px, py + 2);
      ctx.lineTo(px + TILE_SIZE, py + 2);
      ctx.stroke();
    }
    if (sides.bottom) {
      ctx.fillRect(px, py + TILE_SIZE - 4, TILE_SIZE, 4);
      ctx.beginPath();
      ctx.moveTo(px, py + TILE_SIZE - 2);
      ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE - 2);
      ctx.stroke();
    }
    if (sides.left) {
      ctx.fillRect(px, py, 4, TILE_SIZE);
      ctx.beginPath();
      ctx.moveTo(px + 2, py);
      ctx.lineTo(px + 2, py + TILE_SIZE);
      ctx.stroke();
    }
    if (sides.right) {
      ctx.fillRect(px + TILE_SIZE - 4, py, 4, TILE_SIZE);
      ctx.beginPath();
      ctx.moveTo(px + TILE_SIZE - 2, py);
      ctx.lineTo(px + TILE_SIZE - 2, py + TILE_SIZE);
      ctx.stroke();
    }

    // 反射光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    if (sides.top) ctx.fillRect(px + 4, py + 1, 8, 2);
    if (sides.left) ctx.fillRect(px + 1, py + 4, 2, 8);
  }, []);

  /**
   * ローパーティション（デスク間仕切り）
   */
  const drawLowPartition = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    horizontal: boolean
  ) => {
    ctx.fillStyle = PASTEL_COLORS.partition;

    if (horizontal) {
      // 横方向のパーティション
      ctx.fillRect(px + 2, py + TILE_SIZE / 2 - 2, TILE_SIZE - 4, 4);
      // 上部の丸みフレーム
      ctx.fillStyle = '#95A5A6';
      ctx.fillRect(px + 2, py + TILE_SIZE / 2 - 3, TILE_SIZE - 4, 1);
    } else {
      // 縦方向のパーティション
      ctx.fillRect(px + TILE_SIZE / 2 - 2, py + 2, 4, TILE_SIZE - 4);
      ctx.fillStyle = '#95A5A6';
      ctx.fillRect(px + TILE_SIZE / 2 - 3, py + 2, 1, TILE_SIZE - 4);
    }
  }, []);

  /**
   * ゴッドレイ（窓からの光の差し込み）を描画
   */
  const drawGodRays = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const window of WINDOW_POSITIONS) {
      const wx = window.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = window.y * TILE_SIZE + TILE_SIZE;

      ctx.fillStyle = PASTEL_COLORS.godRay;
      ctx.beginPath();

      if (window.y === 0) {
        // 上壁からの光（下向き台形）
        ctx.moveTo(wx - 8, wy);
        ctx.lineTo(wx + 8, wy);
        ctx.lineTo(wx + 40, wy + 120);
        ctx.lineTo(wx - 40, wy + 120);
      } else if (window.x === 0) {
        // 左壁からの光（右向き台形）
        ctx.moveTo(wx, wy - TILE_SIZE / 2 - 8);
        ctx.lineTo(wx, wy - TILE_SIZE / 2 + 8);
        ctx.lineTo(wx + 100, wy + 30);
        ctx.lineTo(wx + 100, wy - 30);
      } else if (window.x === 31) {
        // 右壁からの光（左向き台形）
        ctx.moveTo(wx, wy - TILE_SIZE / 2 - 8);
        ctx.lineTo(wx, wy - TILE_SIZE / 2 + 8);
        ctx.lineTo(wx - 100, wy + 30);
        ctx.lineTo(wx - 100, wy - 30);
      }

      ctx.closePath();
      ctx.fill();
    }
  }, []);

  /**
   * モニターの環境光（床への青白い光）
   */
  const drawMonitorGlow = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    time: number
  ) => {
    // モニターの位置（デスクの上部）
    const monitorX = px + TILE_SIZE / 2;
    const monitorY = py + 10;

    // 光の点滅
    const intensity = 0.15 + Math.sin(time * 0.002) * 0.05;

    // 床への放射光
    const glowGradient = ctx.createRadialGradient(
      monitorX, monitorY + 20, 0,
      monitorX, monitorY + 20, 25
    );
    glowGradient.addColorStop(0, `rgba(133, 193, 233, ${intensity})`);
    glowGradient.addColorStop(1, 'rgba(133, 193, 233, 0)');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.ellipse(monitorX, monitorY + 20, 25, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  /**
   * 影を描画（家具用）
   */
  const drawFurnitureShadow = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    width: number,
    height: number,
    offsetX: number = 2,
    offsetY: number = 2
  ) => {
    ctx.fillStyle = PASTEL_COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(
      px + width / 2 + offsetX,
      py + height + offsetY,
      width / 2,
      4,
      0, 0, Math.PI * 2
    );
    ctx.fill();
  }, []);

  /**
   * デスクエリア（机+PCモニター）- リッチ3D版
   */
  const drawDesk = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number,
    time: number
  ) => {
    // オフィスカーペットを敷く
    drawCarpet(ctx, px, py, x, y);

    // デスクエリアの薄い色オーバーレイ
    ctx.fillStyle = 'rgba(212, 230, 241, 0.1)';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    const deskPattern = (x + y) % 2;
    if (deskPattern === 0) {
      // モニター環境光（家具より先に描画）
      drawMonitorGlow(ctx, px, py, time);

      // 3D机を描画（天板・側面・前面の3層構造）
      const deskX = px + 3;
      const deskY = py + 10;
      const deskW = 26;
      const deskH = 14;
      const deskDepth = 4;

      // 接地影
      drawContactShadow(ctx, deskX, deskY + deskH + deskDepth + 2, deskW);

      // 机の脚（左右）
      ctx.fillStyle = PASTEL_COLORS.deskFurnitureSide;
      ctx.fillRect(deskX + 2, deskY + deskDepth + 8, 3, 8);
      ctx.fillRect(deskX + deskW - 5, deskY + deskDepth + 8, 3, 8);

      // 机の前面パネル
      ctx.fillStyle = PASTEL_COLORS.deskFurnitureSide;
      ctx.fillRect(deskX, deskY + deskDepth, deskW, deskH);

      // 机の側面（右側の奥行き表現）
      ctx.fillStyle = PASTEL_COLORS.deskFurniture;
      ctx.beginPath();
      ctx.moveTo(deskX + deskW, deskY + deskDepth);
      ctx.lineTo(deskX + deskW + deskDepth * 0.4, deskY);
      ctx.lineTo(deskX + deskW + deskDepth * 0.4, deskY + deskH);
      ctx.lineTo(deskX + deskW, deskY + deskDepth + deskH);
      ctx.closePath();
      ctx.fill();

      // 机の天板
      const topGradient = ctx.createLinearGradient(deskX, deskY, deskX + deskW, deskY + deskDepth);
      topGradient.addColorStop(0, PASTEL_COLORS.deskFurnitureTop);
      topGradient.addColorStop(0.5, '#6D7D8E');
      topGradient.addColorStop(1, PASTEL_COLORS.deskFurniture);
      ctx.fillStyle = topGradient;
      ctx.beginPath();
      ctx.moveTo(deskX, deskY + deskDepth);
      ctx.lineTo(deskX + deskDepth * 0.4, deskY);
      ctx.lineTo(deskX + deskW + deskDepth * 0.4, deskY);
      ctx.lineTo(deskX + deskW, deskY + deskDepth);
      ctx.closePath();
      ctx.fill();

      // 天板のハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(deskX + 1, deskY + deskDepth);
      ctx.lineTo(deskX + deskDepth * 0.4 + 1, deskY + 1);
      ctx.lineTo(deskX + deskW * 0.3, deskY + 1);
      ctx.lineTo(deskX + deskW * 0.3 - deskDepth * 0.4, deskY + deskDepth);
      ctx.closePath();
      ctx.fill();

      // 3Dモニター
      const monX = px + 10;
      const monY = py + 2;
      const monW = 12;
      const monH = 9;
      const monDepth = 2;

      // モニター影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(monX + monW / 2, monY + monH + 4, monW / 2 - 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // モニター本体（前面）
      ctx.fillStyle = PASTEL_COLORS.monitor;
      ctx.fillRect(monX, monY + monDepth, monW, monH);

      // モニター上面
      ctx.fillStyle = '#2A3D4F';
      ctx.beginPath();
      ctx.moveTo(monX, monY + monDepth);
      ctx.lineTo(monX + monDepth * 0.3, monY);
      ctx.lineTo(monX + monW + monDepth * 0.3, monY);
      ctx.lineTo(monX + monW, monY + monDepth);
      ctx.closePath();
      ctx.fill();

      // モニター画面（光る効果）
      const screenBrightness = 0.85 + Math.sin(time * 0.003) * 0.15;
      const screenGradient = ctx.createLinearGradient(monX + 1, monY + monDepth + 1, monX + monW - 2, monY + monH);
      screenGradient.addColorStop(0, `rgba(180, 220, 255, ${screenBrightness})`);
      screenGradient.addColorStop(1, `rgba(100, 180, 230, ${screenBrightness * 0.9})`);
      ctx.fillStyle = screenGradient;
      ctx.fillRect(monX + 1, monY + monDepth + 1, monW - 2, monH - 2);

      // 画面の反射
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(monX + 2, monY + monDepth + 2, 3, monH - 4);

      // モニタースタンド
      ctx.fillStyle = PASTEL_COLORS.monitor;
      ctx.fillRect(monX + monW / 2 - 2, monY + monH + monDepth, 4, 4);
      ctx.fillRect(monX + monW / 2 - 4, monY + monH + monDepth + 3, 8, 2);

      // キーボード（3D）
      ctx.fillStyle = '#D5D8DC';
      ctx.fillRect(px + 7, py + 20, 18, 5);
      ctx.fillStyle = '#BDC3C7';
      ctx.fillRect(px + 7, py + 21, 18, 4);
      // キーの凹凸
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(px + 8 + i * 3, py + 22, 2, 2);
      }

      // メタリックハイライト
      drawMetalHighlight(ctx, deskX, deskY + deskDepth, deskW, 3);

    } else {
      // 3Dオフィスチェア
      const chairX = px + 10;
      const chairY = py + 8;

      // 椅子の影
      drawContactShadow(ctx, chairX, py + 28, 12);

      // 椅子の脚（5本足）
      ctx.fillStyle = '#2C3E50';
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const legX = chairX + 6 + Math.cos(angle) * 5;
        const legY = py + 26 + Math.sin(angle) * 2;
        ctx.fillRect(legX - 1, legY, 2, 3);
      }

      // 中央支柱
      ctx.fillStyle = '#34495E';
      ctx.fillRect(chairX + 5, py + 20, 2, 8);

      // 座面（3D）
      const seatGradient = ctx.createRadialGradient(chairX + 6, py + 18, 0, chairX + 6, py + 18, 8);
      seatGradient.addColorStop(0, '#5DADE2');
      seatGradient.addColorStop(1, '#2E86C1');
      ctx.fillStyle = seatGradient;
      ctx.beginPath();
      ctx.ellipse(chairX + 6, py + 18, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // 座面のハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(chairX + 4, py + 16, 3, 1.5, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // 背もたれ（3D）
      const backGradient = ctx.createLinearGradient(chairX + 2, chairY, chairX + 10, chairY + 8);
      backGradient.addColorStop(0, '#5DADE2');
      backGradient.addColorStop(1, '#2471A3');
      ctx.fillStyle = backGradient;
      ctx.beginPath();
      ctx.roundRect(chairX + 2, chairY, 8, 10, 2);
      ctx.fill();

      // 背もたれのハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(chairX + 3, chairY + 1, 2, 8);
    }

    // デスク間のローパーティション（偶数行の下端に）
    if (y % 3 === 0 && deskPattern === 0) {
      drawLowPartition(ctx, px, py, true);
    }
  }, [drawCarpet, drawContactShadow, drawMonitorGlow, drawLowPartition, drawMetalHighlight]);

  /**
   * 会議スペース（テーブル）- 高級ラグ＋ガラスパーティション
   */
  const drawMeeting = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number
  ) => {
    // 会議室エリアを判定
    const meeting1 = AREA_BOUNDS.MEETING_1;
    const meeting2 = AREA_BOUNDS.MEETING_2;
    const isInMeeting1 = isInArea(x, y, meeting1);
    const isInMeeting2 = isInArea(x, y, meeting2);
    const meetingArea = isInMeeting1 ? meeting1 : meeting2;

    // 高級ラグを敷く
    drawLuxuryRug(ctx, px, py, x, y, meetingArea);

    // 緑のオーバーレイ（薄く）
    ctx.fillStyle = 'rgba(213, 245, 227, 0.2)';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    const isCenter = (x === 18 || x === 19) && (y === 8 || y === 14);
    const isEdge = ((x === 17 || x === 20) && (y === 8 || y === 14));

    if (isCenter) {
      drawFurnitureShadow(ctx, px, py + 8, TILE_SIZE, 16);
      ctx.fillStyle = PASTEL_COLORS.meetingTable;
      ctx.fillRect(px, py + 8, TILE_SIZE, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(px, py + 8, TILE_SIZE, 4);
    } else if (isEdge) {
      ctx.fillStyle = PASTEL_COLORS.meetingTable;
      if (x === 17) {
        ctx.beginPath();
        ctx.ellipse(px + TILE_SIZE, py + 16, 8, 8, 0, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
        ctx.fillRect(px + TILE_SIZE - 8, py + 8, 8, 16);
      } else {
        ctx.beginPath();
        ctx.ellipse(px, py + 16, 8, 8, 0, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fill();
        ctx.fillRect(px, py + 8, 8, 16);
      }
    } else {
      const chairPositions = [
        { cx: 10, cy: 12 },
        { cx: 22, cy: 12 },
        { cx: 10, cy: 22 },
        { cx: 22, cy: 22 },
      ];

      chairPositions.forEach((pos, i) => {
        if ((x + y + i) % 3 === 0) {
          ctx.fillStyle = '#E67E22';
          ctx.beginPath();
          ctx.arc(px + pos.cx, py + pos.cy, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // ガラスパーティションを描画（境界タイル）
    const sides = {
      top: y === meetingArea.y1,
      bottom: y === meetingArea.y2,
      left: x === meetingArea.x1,
      right: x === meetingArea.x2,
    };
    if (sides.top || sides.bottom || sides.left || sides.right) {
      drawGlassPartition(ctx, px, py, sides);
    }
  }, [drawLuxuryRug, drawFurnitureShadow, drawGlassPartition]);

  /**
   * AIラボ（サーバーラック）- リッチ3D版
   */
  const drawAILab = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number,
    time: number
  ) => {
    // ダークなテクニカルフロア（グラデーション）
    const floorGradient = ctx.createLinearGradient(px, py, px + TILE_SIZE, py + TILE_SIZE);
    floorGradient.addColorStop(0, '#2A3240');
    floorGradient.addColorStop(0.5, '#252D38');
    floorGradient.addColorStop(1, '#1F2630');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // テクニカルグリッドパターン（サーバールーム風）
    ctx.strokeStyle = 'rgba(100, 120, 140, 0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(px, py + i * 8);
      ctx.lineTo(px + TILE_SIZE, py + i * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + i * 8, py);
      ctx.lineTo(px + i * 8, py + TILE_SIZE);
      ctx.stroke();
    }

    // 冷却光のアンビエント
    const coolGlow = ctx.createRadialGradient(px + 16, py + 16, 0, px + 16, py + 16, 24);
    coolGlow.addColorStop(0, 'rgba(100, 180, 255, 0.08)');
    coolGlow.addColorStop(1, 'rgba(100, 180, 255, 0)');
    ctx.fillStyle = coolGlow;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    if ((x + 1) % 2 === 0) {
      // 3Dサーバーラック
      const rackX = px + 4;
      const rackY = py + 1;
      const rackW = 24;
      const rackH = 28;
      const rackDepth = 5;

      // 接地影
      drawContactShadow(ctx, rackX, py + 30, rackW);

      // ラック前面（最も暗い）
      const frontGradient = ctx.createLinearGradient(rackX, rackY, rackX, rackY + rackH);
      frontGradient.addColorStop(0, PASTEL_COLORS.serverRack);
      frontGradient.addColorStop(0.5, '#1A252F');
      frontGradient.addColorStop(1, '#0F171F');
      ctx.fillStyle = frontGradient;
      ctx.fillRect(rackX, rackY + rackDepth, rackW, rackH);

      // ラック側面（右）
      ctx.fillStyle = PASTEL_COLORS.serverRackTop;
      ctx.beginPath();
      ctx.moveTo(rackX + rackW, rackY + rackDepth);
      ctx.lineTo(rackX + rackW + rackDepth * 0.4, rackY);
      ctx.lineTo(rackX + rackW + rackDepth * 0.4, rackY + rackH);
      ctx.lineTo(rackX + rackW, rackY + rackDepth + rackH);
      ctx.closePath();
      ctx.fill();

      // ラック天板
      ctx.fillStyle = PASTEL_COLORS.serverRackTop;
      ctx.beginPath();
      ctx.moveTo(rackX, rackY + rackDepth);
      ctx.lineTo(rackX + rackDepth * 0.4, rackY);
      ctx.lineTo(rackX + rackW + rackDepth * 0.4, rackY);
      ctx.lineTo(rackX + rackW, rackY + rackDepth);
      ctx.closePath();
      ctx.fill();

      // サーバーユニット（4段）
      for (let i = 0; i < 4; i++) {
        const unitY = rackY + rackDepth + 2 + i * 7;

        // ユニット本体（微妙なグラデーション）
        const unitGradient = ctx.createLinearGradient(rackX + 2, unitY, rackX + rackW - 4, unitY + 5);
        unitGradient.addColorStop(0, '#1C2833');
        unitGradient.addColorStop(0.5, '#212F3C');
        unitGradient.addColorStop(1, '#1C2833');
        ctx.fillStyle = unitGradient;
        ctx.fillRect(rackX + 2, unitY, rackW - 4, 5);

        // 通気口パターン
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let v = 0; v < 3; v++) {
          ctx.fillRect(rackX + 14 + v * 3, unitY + 1, 2, 3);
        }

        // LED群（アニメーション）
        for (let j = 0; j < 4; j++) {
          const phase = time * 0.004 + i * 1.2 + j * 0.8 + x * 0.5;
          const activity = (Math.sin(phase) + 1) / 2;

          // LEDの光彩効果
          if (activity > 0.5) {
            const glowRadius = 3 + activity * 2;
            const ledGlow = ctx.createRadialGradient(
              rackX + 4 + j * 3, unitY + 2.5, 0,
              rackX + 4 + j * 3, unitY + 2.5, glowRadius
            );
            ledGlow.addColorStop(0, `rgba(46, 204, 113, ${activity * 0.4})`);
            ledGlow.addColorStop(1, 'rgba(46, 204, 113, 0)');
            ctx.fillStyle = ledGlow;
            ctx.fillRect(rackX + 1, unitY, 12, 5);
          }

          // LED本体
          ctx.fillStyle = activity > 0.5 ? PASTEL_COLORS.ledGreen : 'rgba(46, 204, 113, 0.3)';
          ctx.beginPath();
          ctx.arc(rackX + 4 + j * 3, unitY + 2.5, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // フレームのメタリックハイライト
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rackX + 1, rackY + rackDepth);
      ctx.lineTo(rackX + 1, rackY + rackDepth + rackH - 1);
      ctx.stroke();

      // データパーティクル生成
      if (Math.random() < 0.025) {
        spawnParticle('data', px + 16, py);
      }

    } else {
      // 3Dケーブルトレイ
      const trayY = py + 4;

      // トレイ本体
      ctx.fillStyle = '#34495E';
      ctx.fillRect(px + 6, trayY, 20, 4);
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(px + 6, trayY + 4, 20, 20);

      // ケーブル群（3D的な曲線）
      const cableColors = ['#3498DB', '#E74C3C', '#F39C12', '#2ECC71'];
      for (let c = 0; c < 4; c++) {
        const cableX = px + 8 + c * 5;
        const waveOffset = Math.sin(time * 0.001 + c) * 0.5;

        // ケーブルの影
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cableX + 1, py);
        ctx.bezierCurveTo(
          cableX + 1, py + 12 + waveOffset,
          cableX + 8 + c * 2 + 1, py + 18,
          cableX + 4 + 1, py + 32
        );
        ctx.stroke();

        // ケーブル本体
        ctx.strokeStyle = cableColors[c];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cableX, py);
        ctx.bezierCurveTo(
          cableX, py + 12 + waveOffset,
          cableX + 8 + c * 2, py + 18,
          cableX + 4, py + 32
        );
        ctx.stroke();

        // ケーブルのハイライト
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cableX - 0.5, py);
        ctx.bezierCurveTo(
          cableX - 0.5, py + 12 + waveOffset,
          cableX + 7.5 + c * 2, py + 18,
          cableX + 3.5, py + 32
        );
        ctx.stroke();
      }
    }

    // ガラスパーティション（AIラボの境界）
    const aiLabArea = AREA_BOUNDS.AI_LAB;
    const sides = {
      top: y === aiLabArea.y1,
      bottom: y === aiLabArea.y2,
      left: x === aiLabArea.x1,
      right: x === aiLabArea.x2,
    };
    if (sides.top || sides.bottom || sides.left || sides.right) {
      drawGlassPartition(ctx, px, py, sides);
    }
  }, [drawContactShadow, spawnParticle, drawGlassPartition]);

  /**
   * 管理エリア
   */
  const drawManagement = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number
  ) => {
    ctx.fillStyle = PASTEL_COLORS.management;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    drawFloorPattern(ctx, px, py);
    ctx.fillStyle = 'rgba(252, 243, 207, 0.5)';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    if (x === 2 && y === 2) {
      drawFurnitureShadow(ctx, px - 4, py + 6, 36, 20);

      ctx.fillStyle = PASTEL_COLORS.managerDesk;
      ctx.fillRect(px - 4, py + 6, 36, 20);

      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(px - 4, py + 6, 36, 4);

      ctx.fillStyle = PASTEL_COLORS.monitor;
      ctx.fillRect(px, py + 2, 10, 8);
      ctx.fillRect(px + 14, py + 2, 10, 8);

      ctx.fillStyle = PASTEL_COLORS.monitorScreen;
      ctx.fillRect(px + 1, py + 3, 8, 5);
      ctx.fillRect(px + 15, py + 3, 8, 5);
    } else {
      if (y === 1 && x === 1) {
        ctx.fillStyle = '#ECF0F1';
        ctx.fillRect(px + 4, py + 4, 24, 18);
        ctx.strokeStyle = '#BDC3C7';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 4, py + 4, 24, 18);

        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 8, py + 10);
        ctx.lineTo(px + 20, py + 10);
        ctx.stroke();

        ctx.strokeStyle = '#3498DB';
        ctx.beginPath();
        ctx.moveTo(px + 8, py + 14);
        ctx.lineTo(px + 24, py + 14);
        ctx.stroke();
      }
    }
  }, [drawFloorPattern, drawFurnitureShadow]);

  /**
   * 休憩スペース（観葉植物、コーヒーメーカー）- リッチ3D版
   */
  const drawBreakRoom = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number,
    time: number
  ) => {
    // 暖かみのある木目フローリング
    drawWoodFlooring(ctx, px, py, x, y);

    // 休憩スペースの暖かいオーバーレイ
    const warmGlow = ctx.createRadialGradient(px + 16, py + 16, 0, px + 16, py + 16, 24);
    warmGlow.addColorStop(0, 'rgba(253, 237, 236, 0.3)');
    warmGlow.addColorStop(1, 'rgba(253, 237, 236, 0.1)');
    ctx.fillStyle = warmGlow;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    const itemType = (x + y) % 3;

    if (itemType === 0) {
      // 3D観葉植物
      const potX = px + 10;
      const potY = py + 18;

      // 鉢の影
      drawContactShadow(ctx, potX - 2, py + 30, 16);

      // 鉢（3D - 台形）
      const potGradient = ctx.createLinearGradient(potX, potY, potX + 12, potY);
      potGradient.addColorStop(0, PASTEL_COLORS.plantPot);
      potGradient.addColorStop(0.5, '#A0522D');
      potGradient.addColorStop(1, PASTEL_COLORS.plantPotDark);
      ctx.fillStyle = potGradient;
      ctx.beginPath();
      ctx.moveTo(potX, potY);
      ctx.lineTo(potX - 2, py + 30);
      ctx.lineTo(potX + 14, py + 30);
      ctx.lineTo(potX + 12, potY);
      ctx.closePath();
      ctx.fill();

      // 鉢の縁
      ctx.fillStyle = '#6D4C41';
      ctx.beginPath();
      ctx.ellipse(potX + 6, potY, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 土
      ctx.fillStyle = '#4E342E';
      ctx.beginPath();
      ctx.ellipse(potX + 6, potY, 5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 葉のアニメーション
      const sway = Math.sin(time * 0.002) * 1.5;

      // 茎
      ctx.strokeStyle = '#388E3C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 16, py + 18);
      ctx.quadraticCurveTo(px + 16 + sway * 0.5, py + 12, px + 16 + sway, py + 6);
      ctx.stroke();

      // 葉（グラデーション付き）
      const leaves = [
        { cx: 16 + sway, cy: 8, rx: 4, ry: 7, angle: 0 },
        { cx: 11 + sway * 0.7, cy: 12, rx: 5, ry: 4, angle: -0.4 },
        { cx: 21 + sway * 0.7, cy: 12, rx: 5, ry: 4, angle: 0.4 },
        { cx: 14 + sway * 0.5, cy: 16, rx: 4, ry: 3, angle: -0.6 },
        { cx: 18 + sway * 0.5, cy: 16, rx: 4, ry: 3, angle: 0.6 },
      ];

      for (const leaf of leaves) {
        // 葉の影
        ctx.fillStyle = 'rgba(0, 100, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(px + leaf.cx + 1, py + leaf.cy + 1, leaf.rx, leaf.ry, leaf.angle, 0, Math.PI * 2);
        ctx.fill();

        // 葉本体
        const leafGradient = ctx.createRadialGradient(
          px + leaf.cx - 1, py + leaf.cy - 1, 0,
          px + leaf.cx, py + leaf.cy, leaf.rx
        );
        leafGradient.addColorStop(0, '#4CAF50');
        leafGradient.addColorStop(1, PASTEL_COLORS.plantDark);
        ctx.fillStyle = leafGradient;
        ctx.beginPath();
        ctx.ellipse(px + leaf.cx, py + leaf.cy, leaf.rx, leaf.ry, leaf.angle, 0, Math.PI * 2);
        ctx.fill();

        // 葉脈
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(px + leaf.cx - leaf.rx * 0.8, py + leaf.cy);
        ctx.lineTo(px + leaf.cx + leaf.rx * 0.8, py + leaf.cy);
        ctx.stroke();
      }

    } else if (itemType === 1) {
      // 3Dコーヒーメーカー
      const machineX = px + 7;
      const machineY = py + 6;
      const machineW = 18;
      const machineH = 22;
      const machineDepth = 4;

      // 接地影
      drawContactShadow(ctx, machineX, py + 30, machineW);

      // 本体前面
      const frontGradient = ctx.createLinearGradient(machineX, machineY, machineX + machineW, machineY);
      frontGradient.addColorStop(0, '#5D6D7E');
      frontGradient.addColorStop(0.5, PASTEL_COLORS.coffeeMachine);
      frontGradient.addColorStop(1, '#3D4A58');
      ctx.fillStyle = frontGradient;
      ctx.fillRect(machineX, machineY + machineDepth, machineW, machineH);

      // 本体上面
      ctx.fillStyle = PASTEL_COLORS.coffeeMachineTop;
      ctx.beginPath();
      ctx.moveTo(machineX, machineY + machineDepth);
      ctx.lineTo(machineX + machineDepth * 0.3, machineY);
      ctx.lineTo(machineX + machineW + machineDepth * 0.3, machineY);
      ctx.lineTo(machineX + machineW, machineY + machineDepth);
      ctx.closePath();
      ctx.fill();

      // 給水タンク（半透明）
      ctx.fillStyle = 'rgba(100, 180, 220, 0.4)';
      ctx.fillRect(machineX + 2, machineY + machineDepth + 2, 6, 10);
      ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
      ctx.fillRect(machineX + 2, machineY + machineDepth + 6, 6, 6);

      // コントロールパネル
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(machineX + 10, machineY + machineDepth + 2, 6, 8);

      // ディスプレイ
      ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
      ctx.fillRect(machineX + 11, machineY + machineDepth + 3, 4, 3);

      // カップホルダー
      ctx.fillStyle = '#1C2833';
      ctx.fillRect(machineX + 4, machineY + machineDepth + 14, 12, 8);

      // コーヒーカップ（3D）
      const cupGradient = ctx.createLinearGradient(machineX + 6, machineY + 20, machineX + 14, machineY + 20);
      cupGradient.addColorStop(0, '#FDFEFE');
      cupGradient.addColorStop(0.5, '#ECF0F1');
      cupGradient.addColorStop(1, '#BDC3C7');
      ctx.fillStyle = cupGradient;
      ctx.beginPath();
      ctx.moveTo(machineX + 6, machineY + 18);
      ctx.lineTo(machineX + 5, machineY + 26);
      ctx.lineTo(machineX + 15, machineY + 26);
      ctx.lineTo(machineX + 14, machineY + 18);
      ctx.closePath();
      ctx.fill();

      // コーヒー液面
      ctx.fillStyle = PASTEL_COLORS.coffee;
      ctx.beginPath();
      ctx.ellipse(machineX + 10, machineY + 19, 3.5, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 動作LED
      const ledPhase = Math.sin(time * 0.005);
      const ledGlow = ctx.createRadialGradient(machineX + 16, machineY + 12, 0, machineX + 16, machineY + 12, 4);
      ledGlow.addColorStop(0, ledPhase > 0 ? 'rgba(46, 204, 113, 0.8)' : 'rgba(46, 204, 113, 0.3)');
      ledGlow.addColorStop(1, 'rgba(46, 204, 113, 0)');
      ctx.fillStyle = ledGlow;
      ctx.beginPath();
      ctx.arc(machineX + 16, machineY + 12, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ledPhase > 0 ? '#2ECC71' : '#27AE60';
      ctx.beginPath();
      ctx.arc(machineX + 16, machineY + 12, 2, 0, Math.PI * 2);
      ctx.fill();

      // スチームパーティクル
      if (Math.random() < 0.03) {
        spawnParticle('steam', machineX + 10, machineY + 16);
      }

    } else {
      // 3Dソファ
      const sofaX = px + 3;
      const sofaY = py + 10;
      const sofaW = 26;
      const sofaH = 12;
      const sofaDepth = 4;

      // 接地影
      drawContactShadow(ctx, sofaX, py + 28, sofaW);

      // ソファ座面（3D）
      const seatGradient = ctx.createLinearGradient(sofaX, sofaY, sofaX + sofaW, sofaY + sofaH);
      seatGradient.addColorStop(0, '#AF7AC5');
      seatGradient.addColorStop(0.5, '#9B59B6');
      seatGradient.addColorStop(1, '#7D3C98');
      ctx.fillStyle = seatGradient;
      ctx.beginPath();
      ctx.roundRect(sofaX, sofaY + sofaDepth, sofaW, sofaH, 3);
      ctx.fill();

      // 座面の上面
      ctx.fillStyle = '#AF7AC5';
      ctx.beginPath();
      ctx.moveTo(sofaX + 2, sofaY + sofaDepth);
      ctx.lineTo(sofaX + 2 + sofaDepth * 0.3, sofaY);
      ctx.lineTo(sofaX + sofaW - 2 + sofaDepth * 0.3, sofaY);
      ctx.lineTo(sofaX + sofaW - 2, sofaY + sofaDepth);
      ctx.closePath();
      ctx.fill();

      // 背もたれ（3D）
      const backGradient = ctx.createLinearGradient(sofaX, sofaY - 6, sofaX + sofaW, sofaY);
      backGradient.addColorStop(0, '#8E44AD');
      backGradient.addColorStop(1, '#6C3483');
      ctx.fillStyle = backGradient;
      ctx.beginPath();
      ctx.roundRect(sofaX + 1, sofaY - 2, sofaW - 2, 8, [3, 3, 0, 0]);
      ctx.fill();

      // 背もたれのハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(sofaX + 3, sofaY - 1, sofaW - 6, 2);

      // クッション
      const cushionGradient = ctx.createRadialGradient(
        sofaX + 8, sofaY + sofaDepth + 4, 0,
        sofaX + 8, sofaY + sofaDepth + 4, 5
      );
      cushionGradient.addColorStop(0, '#F4D03F');
      cushionGradient.addColorStop(1, '#D4AC0D');
      ctx.fillStyle = cushionGradient;
      ctx.beginPath();
      ctx.ellipse(sofaX + 8, sofaY + sofaDepth + 5, 5, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // クッションのハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(sofaX + 6, sofaY + sofaDepth + 3, 2, 1.5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // アームレスト（左右）
      ctx.fillStyle = '#7D3C98';
      ctx.beginPath();
      ctx.roundRect(sofaX - 1, sofaY + sofaDepth - 2, 4, sofaH + 2, 2);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(sofaX + sofaW - 3, sofaY + sofaDepth - 2, 4, sofaH + 2, 2);
      ctx.fill();
    }
  }, [drawWoodFlooring, drawContactShadow, spawnParticle]);

  /**
   * 本棚 - リッチ3D版
   */
  const drawBookshelf = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number
  ) => {
    // 木目フローリング
    drawWoodFlooring(ctx, px, py, x, y);

    // 3D本棚
    const shelfX = px + 3;
    const shelfY = py + 1;
    const shelfW = 26;
    const shelfH = 28;
    const shelfDepth = 5;

    // 接地影
    drawContactShadow(ctx, shelfX, py + 30, shelfW);

    // 本棚前面（枠）
    const frameGradient = ctx.createLinearGradient(shelfX, shelfY, shelfX + shelfW, shelfY);
    frameGradient.addColorStop(0, PASTEL_COLORS.bookshelfFrame);
    frameGradient.addColorStop(0.5, '#D4A76A');
    frameGradient.addColorStop(1, PASTEL_COLORS.bookshelfSide);
    ctx.fillStyle = frameGradient;
    ctx.fillRect(shelfX, shelfY + shelfDepth, shelfW, shelfH);

    // 本棚側面（右）
    ctx.fillStyle = PASTEL_COLORS.bookshelfSide;
    ctx.beginPath();
    ctx.moveTo(shelfX + shelfW, shelfY + shelfDepth);
    ctx.lineTo(shelfX + shelfW + shelfDepth * 0.4, shelfY);
    ctx.lineTo(shelfX + shelfW + shelfDepth * 0.4, shelfY + shelfH);
    ctx.lineTo(shelfX + shelfW, shelfY + shelfDepth + shelfH);
    ctx.closePath();
    ctx.fill();

    // 本棚天板
    ctx.fillStyle = PASTEL_COLORS.bookshelfFrame;
    ctx.beginPath();
    ctx.moveTo(shelfX, shelfY + shelfDepth);
    ctx.lineTo(shelfX + shelfDepth * 0.4, shelfY);
    ctx.lineTo(shelfX + shelfW + shelfDepth * 0.4, shelfY);
    ctx.lineTo(shelfX + shelfW, shelfY + shelfDepth);
    ctx.closePath();
    ctx.fill();

    // 内部（暗い）
    ctx.fillStyle = '#2C1810';
    ctx.fillRect(shelfX + 2, shelfY + shelfDepth + 2, shelfW - 4, shelfH - 4);

    // 棚板（3D）
    for (let i = 0; i < 4; i++) {
      const boardY = shelfY + shelfDepth + 1 + i * 7;

      // 棚板上面
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(shelfX + 2, boardY, shelfW - 4, 2);

      // 棚板ハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(shelfX + 2, boardY, shelfW - 4, 1);
    }

    // 本（3D風 - 各本が少し飛び出している）
    const bookColors = [
      { main: '#E74C3C', dark: '#C0392B' },
      { main: '#3498DB', dark: '#2980B9' },
      { main: '#2ECC71', dark: '#27AE60' },
      { main: '#F39C12', dark: '#D68910' },
      { main: '#9B59B6', dark: '#8E44AD' },
      { main: '#1ABC9C', dark: '#17A589' },
    ];

    for (let row = 0; row < 3; row++) {
      for (let book = 0; book < 5; book++) {
        const bookX = shelfX + 4 + book * 4.5;
        const bookY = shelfY + shelfDepth + 3 + row * 7;
        const bookH = 4 + (((x + y + row + book) % 2) * 1);
        const colorSet = bookColors[(row + book + x + y) % bookColors.length];
        const bookDepth = 1 + ((row + book) % 2) * 0.5;

        // 本の上面（飛び出し効果）
        ctx.fillStyle = colorSet.dark;
        ctx.fillRect(bookX, bookY - bookDepth, 3, bookDepth);

        // 本の背表紙（正面）
        ctx.fillStyle = colorSet.main;
        ctx.fillRect(bookX, bookY, 3, bookH);

        // 本のハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(bookX, bookY, 1, bookH);

        // 本のタイトル線（装飾）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(bookX + 0.5, bookY + 1, 2, 0.5);
      }
    }

    // フレームのハイライト
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(shelfX + 1, shelfY + shelfDepth);
    ctx.lineTo(shelfX + 1, shelfY + shelfDepth + shelfH - 1);
    ctx.stroke();
  }, [drawWoodFlooring, drawContactShadow]);

  /**
   * サーバーラック（大）
   */
  const drawServerLarge = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number,
    time: number
  ) => {
    ctx.fillStyle = '#1C2833';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // グリッドライン
    ctx.strokeStyle = 'rgba(52, 73, 94, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(px, py + i * 8);
      ctx.lineTo(px + TILE_SIZE, py + i * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + i * 8, py);
      ctx.lineTo(px + i * 8, py + TILE_SIZE);
      ctx.stroke();
    }

    // サーバーユニット（パターンで配置）
    if ((x + y) % 2 === 0) {
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(px + 2, py + 2, 28, 28);

      // ユニットスロット
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#1C2833';
        ctx.fillRect(px + 4, py + 4 + i * 7, 24, 5);

        // 大量のLED
        for (let j = 0; j < 6; j++) {
          const phase = time * 0.004 + i * 0.8 + j * 0.5 + x * 0.3;
          const brightness = (Math.sin(phase) + 1) / 2;
          const r = Math.floor(brightness * 100);
          const g = Math.floor(brightness * 255);
          const b = Math.floor(brightness * 100);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.arc(px + 6 + j * 4, py + 6 + i * 7, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // データパーティクル生成
      if (Math.random() < 0.04) {
        spawnParticle('data', px + 16, py);
      }
    } else {
      // ケーブル配線
      ctx.strokeStyle = PASTEL_COLORS.ledBlue;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(px + 6 + i * 10, py);
        ctx.bezierCurveTo(
          px + 6 + i * 10, py + 12,
          px + 16, py + 20,
          px + 16, py + TILE_SIZE
        );
        ctx.stroke();
      }
    }
  }, [spawnParticle]);

  /**
   * 自販機・ウォーターサーバー
   */
  const drawVending = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    x: number,
    y: number,
    time: number
  ) => {
    ctx.fillStyle = PASTEL_COLORS.floor;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    drawFloorPattern(ctx, px, py);

    const isVending = x % 2 === 0;

    if (isVending) {
      // 自販機
      drawFurnitureShadow(ctx, px + 4, py + 2, 24, 28);

      ctx.fillStyle = PASTEL_COLORS.vending;
      ctx.fillRect(px + 4, py + 2, 24, 28);

      // ガラス窓
      ctx.fillStyle = PASTEL_COLORS.vendingGlass;
      ctx.fillRect(px + 6, py + 4, 20, 16);

      // 商品（缶）
      const canColors = ['#E74C3C', '#F39C12', '#3498DB', '#2ECC71'];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          const color = canColors[(row + col) % canColors.length];
          ctx.fillStyle = color;
          ctx.fillRect(px + 7 + col * 5, py + 5 + row * 8, 4, 6);
        }
      }

      // 取り出し口
      ctx.fillStyle = '#1C2833';
      ctx.fillRect(px + 10, py + 22, 12, 6);

      // 光るボタン
      const glowPhase = Math.sin(time * 0.003);
      ctx.fillStyle = glowPhase > 0 ? '#2ECC71' : '#27AE60';
      ctx.beginPath();
      ctx.arc(px + 24, py + 12, 2, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // ウォーターサーバー
      drawFurnitureShadow(ctx, px + 8, py + 4, 16, 24);

      // タンク部分
      ctx.fillStyle = 'rgba(133, 193, 233, 0.8)';
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 10, 7, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 水の揺れ
      const waterLevel = Math.sin(time * 0.002) * 1;
      ctx.fillStyle = 'rgba(52, 152, 219, 0.6)';
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 10 + waterLevel, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // サーバー本体
      ctx.fillStyle = '#ECF0F1';
      ctx.fillRect(px + 10, py + 18, 12, 10);

      // 蛇口
      ctx.fillStyle = '#7F8C8D';
      ctx.fillRect(px + 14, py + 20, 4, 2);
      ctx.fillRect(px + 15, py + 22, 2, 4);
    }
  }, [drawFloorPattern, drawFurnitureShadow]);

  /**
   * タイルを描画
   */
  const drawTile = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileType: TileType,
    time: number
  ) => {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    switch (tileType) {
      case TILE_TYPES.FLOOR:
        // 通路は木目フローリング
        drawWoodFlooring(ctx, px, py, x, y);
        break;
      case TILE_TYPES.WALL:
        drawWall(ctx, px, py, x, y);
        break;
      case TILE_TYPES.DESK:
        drawDesk(ctx, px, py, x, y, time);
        break;
      case TILE_TYPES.MEETING:
        drawMeeting(ctx, px, py, x, y);
        break;
      case TILE_TYPES.AI_LAB:
        drawAILab(ctx, px, py, x, y, time);
        break;
      case TILE_TYPES.MANAGEMENT:
        drawManagement(ctx, px, py, x, y);
        break;
      case TILE_TYPES.BREAK:
        drawBreakRoom(ctx, px, py, x, y, time);
        break;
      case TILE_TYPES.BOOKSHELF:
        drawBookshelf(ctx, px, py, x, y);
        break;
      case TILE_TYPES.SERVER_LARGE:
        drawServerLarge(ctx, px, py, x, y, time);
        break;
      case TILE_TYPES.VENDING:
        drawVending(ctx, px, py, x, y, time);
        break;
    }

    // グリッド線（薄く）
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.02)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
  }, [
    drawWoodFlooring, drawWall, drawDesk, drawMeeting, drawAILab,
    drawManagement, drawBreakRoom, drawBookshelf, drawServerLarge, drawVending
  ]);

  /**
   * クルーを描画（呼吸アニメーション + Lerp補間座標使用）
   */
  const drawCrew = useCallback((
    ctx: CanvasRenderingContext2D,
    crew: CrewSprite,
    isSelected: boolean,
    time: number
  ) => {
    // Lerp補間された座標を取得・更新
    let currentPos = crewPositionsRef.current.get(crew.id);
    if (!currentPos) {
      currentPos = { x: crew.pixelX, y: crew.pixelY };
      crewPositionsRef.current.set(crew.id, currentPos);
    }

    const targetX = crew.gridX * TILE_SIZE;
    const targetY = crew.gridY * TILE_SIZE;

    currentPos.x = lerp(currentPos.x, targetX, LERP_FACTOR);
    currentPos.y = lerp(currentPos.y, targetY, LERP_FACTOR);

    const breathOffset = Math.sin(time * 0.004 + crew.id * 0.5) * 2;

    const px = currentPos.x;
    const py = currentPos.y + breathOffset;
    const size = TILE_SIZE - 6;
    const centerX = px + TILE_SIZE / 2;
    const centerY = py + TILE_SIZE / 2;

    if (isSelected) {
      ctx.fillStyle = 'rgba(155, 89, 182, 0.3)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, TILE_SIZE / 2 + 4, 0, Math.PI * 2);
      ctx.fill();

      const pulseSize = TILE_SIZE / 2 + 4 + Math.sin(time * 0.01) * 3;
      ctx.strokeStyle = 'rgba(155, 89, 182, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 2, size / 2 - 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // クルー本体
    const gradient = ctx.createRadialGradient(
      centerX - 3, centerY - 3, 0,
      centerX, centerY, size / 2
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, crew.isPartner ? '#FEF3C7' : '#EDE9FE');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = crew.isPartner ? PASTEL_COLORS.partnerBorder : PASTEL_COLORS.crewBorder;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.stroke();

    const img = crewImagesRef.current.get(crew.id);
    if (img && img.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2 - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, px + 4, py + 2, size - 2, size - 2);
      ctx.restore();
    } else {
      ctx.fillStyle = '#6B7280';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(crew.name.charAt(0), centerX, centerY);
    }

    if (crew.isPartner) {
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', centerX, py - 2);
    }

    // 状態バルーン
    const statusEmoji: Record<string, string> = {
      working: '💻',
      generating: '⚡',
      planning: '🗣️',
      managing: '📊',
      idle: '💤',
      resting: '☕',
    };

    const emoji = statusEmoji[crew.status] || '💭';

    const bubbleOffset = Math.sin(time * 0.003 + crew.id) * 1;
    const bubbleX = centerX + 10;
    const bubbleY = py - 6 + bubbleOffset;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(bubbleX - 8, bubbleY - 8, 16, 16, 4);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bubbleX - 4, bubbleY + 8);
    ctx.lineTo(bubbleX - 8, bubbleY + 12);
    ctx.lineTo(bubbleX, bubbleY + 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bubbleX - 8, bubbleY - 8, 16, 16, 4);
    ctx.stroke();

    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, bubbleX, bubbleY);

    const statusColor = {
      working: PASTEL_COLORS.statusWorking,
      generating: PASTEL_COLORS.statusGenerating,
      planning: '#3498DB',
      managing: '#F39C12',
      idle: PASTEL_COLORS.statusIdle,
      resting: '#E67E22',
    }[crew.status] || PASTEL_COLORS.statusIdle;

    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE - 6, py + TILE_SIZE - 6 - breathOffset, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE - 6, py + TILE_SIZE - 6 - breathOffset, 4, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  /**
   * 環境光のアンビエントオーバーレイ
   */
  const drawAmbientLight = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    // 左上からの暖かい日光
    const sunGradient = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, canvasWidth * 0.7
    );
    sunGradient.addColorStop(0, 'rgba(255, 248, 220, 0.12)');
    sunGradient.addColorStop(0.5, 'rgba(255, 248, 220, 0.05)');
    sunGradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
    ctx.fillStyle = sunGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // AIラボからの青い光
    const aiLabCenter = {
      x: (AREA_BOUNDS.AI_LAB.x1 + AREA_BOUNDS.AI_LAB.x2) / 2 * TILE_SIZE,
      y: (AREA_BOUNDS.AI_LAB.y1 + AREA_BOUNDS.AI_LAB.y2) / 2 * TILE_SIZE
    };
    const aiGlow = ctx.createRadialGradient(
      aiLabCenter.x, aiLabCenter.y, 0,
      aiLabCenter.x, aiLabCenter.y, TILE_SIZE * 4
    );
    const aiPulse = 0.04 + Math.sin(time * 0.002) * 0.02;
    aiGlow.addColorStop(0, `rgba(100, 180, 255, ${aiPulse})`);
    aiGlow.addColorStop(1, 'rgba(100, 180, 255, 0)');
    ctx.fillStyle = aiGlow;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 右下からの暖かい光（休憩スペースの暖色）
    const breakGradient = ctx.createRadialGradient(
      canvasWidth, canvasHeight, 0,
      canvasWidth, canvasHeight, canvasWidth * 0.5
    );
    breakGradient.addColorStop(0, 'rgba(255, 200, 150, 0.06)');
    breakGradient.addColorStop(1, 'rgba(255, 200, 150, 0)');
    ctx.fillStyle = breakGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight]);

  /**
   * ビネット効果を描画（強化版）
   */
  const drawVignette = useCallback((ctx: CanvasRenderingContext2D) => {
    // メインビネット（四隅を暗く）
    const gradient = ctx.createRadialGradient(
      canvasWidth / 2, canvasHeight / 2, canvasHeight * 0.35,
      canvasWidth / 2, canvasHeight / 2, canvasHeight * 0.95
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.45)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 壁際の環境遮蔽（AO）- 上壁
    const topAO = ctx.createLinearGradient(0, 0, 0, TILE_SIZE * 2);
    topAO.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
    topAO.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topAO;
    ctx.fillRect(0, 0, canvasWidth, TILE_SIZE * 2);

    // 左壁
    const leftAO = ctx.createLinearGradient(0, 0, TILE_SIZE * 1.5, 0);
    leftAO.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
    leftAO.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = leftAO;
    ctx.fillRect(0, 0, TILE_SIZE * 1.5, canvasHeight);

    // 右壁
    const rightAO = ctx.createLinearGradient(canvasWidth, 0, canvasWidth - TILE_SIZE * 1.5, 0);
    rightAO.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
    rightAO.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rightAO;
    ctx.fillRect(canvasWidth - TILE_SIZE * 1.5, 0, TILE_SIZE * 1.5, canvasHeight);

    // 下壁
    const bottomAO = ctx.createLinearGradient(0, canvasHeight, 0, canvasHeight - TILE_SIZE * 1.5);
    bottomAO.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    bottomAO.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bottomAO;
    ctx.fillRect(0, canvasHeight - TILE_SIZE * 1.5, canvasWidth, TILE_SIZE * 1.5);
  }, [canvasWidth, canvasHeight]);

  /**
   * 静的レイヤー（タイル、ゴッドレイ、ビネット）をオフスクリーンCanvasに描画
   */
  const drawStaticLayer = useCallback((ctx: CanvasRenderingContext2D) => {
    // タイルを描画（time=0で静的に）
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tileType = OFFICE_MAP[y][x] as TileType;
        drawTile(ctx, x, y, tileType, 0);
      }
    }

    // ゴッドレイ（窓からの光の差し込み）を描画
    drawGodRays(ctx);

    // 環境光（静的なアンビエント効果のみ）
    drawAmbientLight(ctx, 0);
  }, [drawTile, drawGodRays, drawAmbientLight]);

  /**
   * マップ全体を描画（静的キャッシュ + 動的要素）
   */
  const drawMap = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 静的レイヤーをキャッシュから描画
    if (staticCanvasRef.current) {
      ctx.drawImage(staticCanvasRef.current, 0, 0);
    }

    // パーティクル更新・描画（動的）
    updateParticles();
    drawParticles(ctx);

    // クルーを描画（動的）
    for (const crew of crews) {
      const isSelected = crew.id === selectedCrewId;
      drawCrew(ctx, crew, isSelected, time);
    }

    // ビネット効果（軽量なので毎フレーム）
    drawVignette(ctx);
  }, [
    crews, selectedCrewId, canvasWidth, canvasHeight,
    drawCrew, drawVignette, updateParticles, drawParticles
  ]);

  /**
   * クルー画像をプリロード
   */
  useEffect(() => {
    for (const crew of crews) {
      if (!crewImagesRef.current.has(crew.id)) {
        const img = new Image();
        img.src = crew.imageUrl;
        crewImagesRef.current.set(crew.id, img);
      }
    }
  }, [crews]);

  /**
   * 静的レイヤーのキャッシュを初期化
   */
  useEffect(() => {
    // 静的キャッシュが既に存在する場合はスキップ
    if (staticDrawnRef.current && staticCanvasRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const staticCanvas = document.createElement('canvas');
    staticCanvas.width = canvasWidth * dpr;
    staticCanvas.height = canvasHeight * dpr;

    const staticCtx = staticCanvas.getContext('2d');
    if (!staticCtx) return;

    staticCtx.scale(dpr, dpr);

    // 静的レイヤーを描画
    drawStaticLayer(staticCtx);

    staticCanvasRef.current = staticCanvas;
    staticDrawnRef.current = true;
  }, [canvasWidth, canvasHeight, drawStaticLayer]);

  /**
   * アニメーションループ
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    let lastTime = 0;
    // フレームレートを約24fps（42ms間隔）に調整して軽量化
    const FRAME_INTERVAL = 42;

    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= FRAME_INTERVAL) {
        drawMap(ctx, currentTime);
        lastTime = currentTime;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawMap, canvasWidth, canvasHeight]);

  /**
   * クリックイベントハンドラ
   */
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;

    // クルーがクリックされたかチェック
    const clickedCrew = crews.find((crew) => crew.gridX === x && crew.gridY === y);
    if (clickedCrew && onCrewClick) {
      onCrewClick(clickedCrew);
      return;
    }

    if (onTileClick) {
      const tileType = OFFICE_MAP[y][x] as TileType;
      onTileClick(x, y, tileType);
    }
  }, [crews, onCrewClick, onTileClick]);

  /**
   * マウス移動イベントハンドラ（ホバー検知）
   */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const gridX = Math.floor(mouseX / TILE_SIZE);
    const gridY = Math.floor(mouseY / TILE_SIZE);

    // マウス位置を更新
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // クルーがホバーされているかチェック
    const hovered = crews.find((crew) => crew.gridX === gridX && crew.gridY === gridY);
    setHoveredCrew(hovered || null);
  }, [crews]);

  /**
   * マウス離脱イベントハンドラ
   */
  const handleMouseLeave = useCallback(() => {
    setHoveredCrew(null);
    setMousePos(null);
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-xl shadow-2xl cursor-pointer"
        style={{
          imageRendering: 'auto',
        }}
      />

      {/* ホバーツールチップ */}
      {hoveredCrew && mousePos && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="bg-black/85 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg border border-white/20">
            <p className="font-bold text-sm whitespace-nowrap">{hoveredCrew.name}</p>
            {hoveredCrew.role && (
              <p className="text-xs text-gray-300 whitespace-nowrap">{hoveredCrew.role}</p>
            )}
          </div>
          {/* 吹き出しの矢印 */}
          <div
            className="absolute left-2 bottom-0 translate-y-full w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(0, 0, 0, 0.85)',
            }}
          />
        </div>
      )}
    </div>
  );
}
