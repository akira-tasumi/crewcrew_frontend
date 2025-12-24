'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  X,
  Loader2,
  FileText,
  Crown,
  Search,
  MessageCircle,
  RefreshCw,
  CalendarCheck,
  Stamp,
  Link,
  FileEdit,
  Globe,
  Upload,
  FolderOpen,
  File,
  Rocket,
  ArrowRight,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useRef } from 'react';
import { emitCrewExpUpdate } from '@/lib/crewEvents';
import LevelUpNotification from '@/components/LevelUpNotification';
import DailyReportModal from '@/components/DailyReportModal';
import CollaborationDemo from '@/components/CollaborationDemo';
import { useAppSound } from '@/contexts/SoundContext';
import { apiUrl } from '@/lib/api';

type Task = {
  id: number;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  crewId: number;
  crewName: string;
  crewImage: string;
  result?: string;  // AIが生成したテキストをそのまま保持
  // EXP/レベルアップ情報
  expGained?: number;
  oldLevel?: number;
  newLevel?: number;
  leveledUp?: boolean;
};

type Crew = {
  id: number;
  name: string;
  role: string;
  level: number;
  exp: number;
  image: string;
};

type ExecuteTaskResponse = {
  success: boolean;
  result: string | null;  // AIが生成したテキストをそのまま受け取る
  crew_name: string;
  crew_id: number;
  error: string | null;
  // EXP/レベル関連
  old_level: number | null;
  new_level: number | null;
  new_exp: number | null;
  exp_gained: number | null;
  leveled_up: boolean;
  // コイン報酬
  coin_gained: number | null;
  new_coin: number | null;
  // ルビー報酬
  ruby_gained: number | null;
  new_ruby: number | null;
};

type RouteTaskResponse = {
  success: boolean;
  selected_crew_id: number;
  selected_crew_name: string;
  partner_comment: string;
  partner_name: string;
  error: string | null;
};

type ScoutResponse = {
  success: boolean;
  crew: {
    id: number;
    name: string;
    role: string;
    level: number;
    exp: number;
    image: string;
    personality: string | null;
    greeting: string;
    rarity: number;
  } | null;
  greeting: string | null;
  error: string | null;
  new_coin: number | null;
  rarity: number | null;
  partner_reaction: string | null;
};

type User = {
  id: number;
  company_name: string;
  coin: number;
  ruby: number;
  rank: string;
};

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

type StampInfo = {
  date: string;
  has_stamp: boolean;
};

type WebSummaryResponse = {
  success: boolean;
  summary: string | null;
  page_title: string | null;
  crew_id: number | null;
  crew_name: string | null;
  crew_image: string | null;
  error: string | null;
};

type FileSummaryResponse = {
  success: boolean;
  summary: string | null;
  filename: string | null;
  page_count: number | null;
  crew_id: number | null;
  crew_name: string | null;
  crew_image: string | null;
  error: string | null;
};

// Director Mode 型定義
type RequiredInput = {
  key: string;
  label: string;
  type: 'file' | 'url' | 'text';
};

type ProjectTask = {
  role: string;
  assigned_crew_id: number;
  assigned_crew_name: string;
  assigned_crew_image: string;
  instruction: string;
};

type DirectorPlanResponse = {
  success: boolean;
  project_title: string | null;
  description: string | null;
  required_inputs: RequiredInput[];
  tasks: ProjectTask[];
  partner_name: string | null;
  partner_image: string | null;
  error: string | null;
};

// プロジェクト実行結果の型
type ExecuteProjectTaskResult = {
  task_index: number;
  role: string;
  crew_name: string;
  crew_image: string;
  instruction: string;
  result: string;
  status: 'completed' | 'error';
};

type ExecuteProjectResponse = {
  success: boolean;
  project_title: string | null;
  task_results: ExecuteProjectTaskResult[];
  error: string | null;
};

type DailyReportResponse = {
  success: boolean;
  date: string;
  task_count: number;
  earned_coins: number;
  login_bonus_given: boolean;
  login_bonus_amount: number;
  stamps: StampInfo[];
  consecutive_days: number;
  labor_words: string;
  partner_name: string | null;
  partner_image: string | null;
  new_coin: number | null;
  error: string | null;
};

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
      // 朝: 明るいオレンジ〜黄色のグラデーション（朝日）
      return 'bg-gradient-to-b from-orange-100 via-yellow-50 to-blue-50';
    case 'afternoon':
      // 昼: 明るい青空
      return 'bg-gradient-to-b from-blue-100 via-blue-50 to-white';
    case 'evening':
      // 夕方: オレンジ〜紫のグラデーション（夕焼け）
      return 'bg-gradient-to-b from-orange-200 via-pink-100 to-purple-100';
    case 'night':
      // 夜: 暗い青〜紫（窓に明かり）
      return 'bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900';
    default:
      return 'bg-gradient-to-b from-blue-100 via-blue-50 to-white';
  }
}

// 時間帯に応じたテキストカラー
function getTextColorForTime(timeOfDay: string): string {
  return timeOfDay === 'night' ? 'text-white' : 'text-gray-800';
}

const DUMMY_TASKS: Task[] = [
  {
    id: 1,
    title: 'メール返信の下書き作成',
    status: 'completed',
    crewId: 1,
    crewName: 'フレイミー',
    crewImage: '/images/crews/monster_1.png',
  },
  {
    id: 2,
    title: '週次レポートの集計',
    status: 'completed',
    crewId: 2,
    crewName: 'アクアン',
    crewImage: '/images/crews/monster_2.png',
  },
];

// クルーのミニアイコンコンポーネント
function CrewMiniIcon({ image, name, isWorking }: { image: string; name: string; isWorking?: boolean }) {
  return (
    <motion.div
      className="relative"
      animate={isWorking ? { y: [0, -2, 0] } : {}}
      transition={isWorking ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${isWorking ? 'border-yellow-400' : 'border-gray-200 dark:border-gray-700'} bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900`}>
        <Image
          src={image}
          alt={name}
          width={40}
          height={40}
          className="object-cover scale-150 translate-y-1"
        />
      </div>
      {isWorking && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Sparkles size={10} className="text-yellow-800" />
        </motion.div>
      )}
    </motion.div>
  );
}

// 結果表示モーダル
function ResultModal({
  isOpen,
  onClose,
  task,
  crewImage,
}: {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  crewImage: string;
}) {
  if (!isOpen || !task) return null;

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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 bg-white/20">
                <Image
                  src={crewImage}
                  alt={task.crewName}
                  width={48}
                  height={48}
                  className="object-cover scale-150 translate-y-1"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold">{task.crewName}からの報告</h3>
                  {/* EXP獲得表示 */}
                  {task.expGained && (
                    <motion.span
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, delay: 0.3 }}
                      className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full"
                    >
                      EXP +{task.expGained} GET!
                    </motion.span>
                  )}
                </div>
                <p className="text-white/80 text-sm">{task.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* レベルアップ祝福メッセージ */}
          {task.leveledUp && task.oldLevel && task.newLevel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 overflow-hidden"
            >
              <div className="p-4 flex items-center justify-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-3xl"
                >
                  🎉
                </motion.div>
                <div className="text-center">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white font-black text-xl"
                  >
                    LEVEL UP!
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 font-bold"
                  >
                    Lv.{task.oldLevel} → Lv.{task.newLevel}
                  </motion.div>
                </div>
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-3xl"
                >
                  🎉
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* コンテンツ */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {task.result ? (
              <div className="prose dark:prose-invert max-w-none prose-headings:text-gray-800 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300">
                <div
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: task.result
                      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-purple-600 dark:text-purple-400">$1</h3>')
                      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2 text-gray-800 dark:text-gray-100">$1</h2>')
                      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2 text-gray-800 dark:text-gray-100">$1</h1>')
                      .replace(/^\* (.+)$/gm, '<li class="ml-4">$1</li>')
                      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                結果がありません
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium px-6 py-2 rounded-xl"
            >
              閉じる
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

type LevelUpInfo = {
  crewName: string;
  newLevel: number;
};


// 相棒表示コンポーネント（コンパクト版）
function PartnerDisplayCompact({
  partner,
  whimsicalTalk,
  isLoadingTalk,
  onRefreshTalk,
}: {
  partner: Partner | null;
  whimsicalTalk: string | null;
  isLoadingTalk: boolean;
  onRefreshTalk: () => void;
}) {
  if (!partner) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-dashed border-gray-300 dark:border-gray-600"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <Crown className="text-gray-400" size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              相棒を設定しよう
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              My Crewsページで指名できます
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const displayMessage = whimsicalTalk || partner.greeting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        {/* 相棒アイコン */}
        <motion.div
          className="relative cursor-pointer shrink-0"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          onClick={onRefreshTalk}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-400 shadow-md bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800">
            <Image
              src={partner.image}
              alt={partner.name}
              width={56}
              height={56}
              className="object-cover scale-150 translate-y-1"
            />
          </div>
          <motion.div
            className="absolute -top-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 shadow"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown size={10} className="text-yellow-800" />
          </motion.div>
        </motion.div>

        {/* 吹き出し */}
        <div className="flex-1 relative bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 shadow-sm min-h-[48px]">
          <div className="absolute left-0 top-1/2 -translate-x-1.5 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-white/80 dark:border-r-gray-800/80" />

          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              {partner.name}
            </span>
            <span className="text-[10px] text-gray-400">Lv.{partner.level}</span>
          </div>

          {isLoadingTalk ? (
            <div className="flex items-center gap-1.5 text-gray-400">
              <Loader2 size={12} className="animate-spin" />
              <span className="text-xs">考え中...</span>
            </div>
          ) : (
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
              {displayMessage}
            </p>
          )}

          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onRefreshTalk();
            }}
            disabled={isLoadingTalk}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            className="absolute -top-1.5 -right-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-full p-1 shadow transition-colors"
          >
            <RefreshCw size={10} className={isLoadingTalk ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [levelUpNotification, setLevelUpNotification] = useState<LevelUpInfo | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);

  // サウンド
  const { playSound } = useAppSound();

  // マネージャー機能
  const [isRouting, setIsRouting] = useState(false);
  const [partnerComment, setPartnerComment] = useState<string | null>(null);

  // スカウト機能
  const [isScouting, setIsScouting] = useState(false);
  const [scoutedCrew, setScoutedCrew] = useState<ScoutResponse['crew'] | null>(null);
  const [showScoutModal, setShowScoutModal] = useState(false);
  const [scoutRarity, setScoutRarity] = useState<number | null>(null);
  const [partnerReaction, setPartnerReaction] = useState<string | null>(null);
  const [isResumeFlipped, setIsResumeFlipped] = useState(false); // 履歴書がめくられたか

  // 気まぐれトーク機能
  const [whimsicalTalk, setWhimsicalTalk] = useState<string | null>(null);
  const [isLoadingTalk, setIsLoadingTalk] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<string>(getTimeOfDay());

  // 日報機能
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [dailyReport, setDailyReport] = useState<DailyReportResponse | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // 連携デモ機能
  const [showCollaborationDemo, setShowCollaborationDemo] = useState(false);

  // 入力モード機能（テキスト / URL読込 / ファイル / プロジェクト）
  type InputMode = 'text' | 'url' | 'file' | 'project';
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingWebSummary, setIsLoadingWebSummary] = useState(false);
  const [webSummaryResult, setWebSummaryResult] = useState<WebSummaryResponse | null>(null);
  const [showWebSummaryModal, setShowWebSummaryModal] = useState(false);

  // ファイルアップロード機能
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFileSummary, setIsLoadingFileSummary] = useState(false);
  const [fileSummaryResult, setFileSummaryResult] = useState<FileSummaryResponse | null>(null);
  const [showFileSummaryModal, setShowFileSummaryModal] = useState(false);

  // Director Mode（プロジェクト機能）
  const [projectGoal, setProjectGoal] = useState('');
  const [isLoadingProjectPlan, setIsLoadingProjectPlan] = useState(false);
  const [projectPlan, setProjectPlan] = useState<DirectorPlanResponse | null>(null);
  const [showProjectPlanModal, setShowProjectPlanModal] = useState(false);
  const [projectInputValues, setProjectInputValues] = useState<Record<string, string>>({});
  // Note: globalThis.File型を使用（lucide-reactのFileアイコンとの衝突を避けるため）
  const [projectInputFiles, setProjectInputFiles] = useState<Record<string, globalThis.File>>({});
  const projectFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // プロジェクト実行状態
  const [isProjectExecuting, setIsProjectExecuting] = useState(false);
  const [projectExecutionResults, setProjectExecutionResults] = useState<ExecuteProjectTaskResult[]>([]);
  const [currentExecutingTaskIndex, setCurrentExecutingTaskIndex] = useState(-1);
  const [showProjectComplete, setShowProjectComplete] = useState(false);
  const [expandedTaskResults, setExpandedTaskResults] = useState<Record<number, boolean>>({});

  // ユーザー情報を取得
  const fetchUser = async () => {
    try {
      const res = await fetch(apiUrl('/api/user'));
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  // 相棒情報を取得
  const fetchPartner = async () => {
    try {
      const res = await fetch(apiUrl('/api/partner'));
      if (res.ok) {
        const data = await res.json();
        setPartner(data);
      }
    } catch (err) {
      console.error('Failed to fetch partner:', err);
    }
  };

  // 気まぐれトークを取得
  const fetchWhimsicalTalk = async () => {
    if (isLoadingTalk) return;

    playSound('click'); // クリック音
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
  };

  // 日報を取得
  const fetchDailyReport = async () => {
    if (isLoadingReport) return;

    setIsLoadingReport(true);
    try {
      const res = await fetch(apiUrl('/api/daily-report'));
      if (res.ok) {
        const data: DailyReportResponse = await res.json();
        if (data.success) {
          setDailyReport(data);
          setShowDailyReport(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch daily report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    // クルー一覧を取得
    fetch(apiUrl('/api/crews'))
      .then((res) => res.json())
      .then((data) => {
        setCrews(data);
        if (data.length > 0) {
          setSelectedCrewId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to fetch crews:', err));

    // ユーザー情報を取得
    fetchUser();

    // 相棒情報を取得
    fetchPartner();

    // 気まぐれトークを取得
    fetchWhimsicalTalk();

    // 時間帯を定期的に更新（1分ごと）
    const timeInterval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);

    // タスク一覧（ダミー）
    setTimeout(() => {
      setTasks(DUMMY_TASKS);
      setLoading(false);
    }, 500);

    return () => clearInterval(timeInterval);
  }, []);

  const getSelectedCrew = () => crews.find((c) => c.id === selectedCrewId);

  // スカウト処理
  const handleScout = async () => {
    if (isScouting) return;
    if (!user || user.coin < 300) {
      playSound('error');
      alert('コインが足りません（必要: 300）');
      return;
    }

    playSound('coin'); // コイン消費音
    setIsScouting(true);
    setShowScoutModal(true);
    setIsResumeFlipped(false); // 履歴書を裏向きにリセット
    setScoutRarity(null);
    setPartnerReaction(null);

    try {
      const response = await fetch(apiUrl('/api/scout'), {
        method: 'POST',
      });
      const data: ScoutResponse = await response.json();

      if (data.success && data.crew) {
        setScoutedCrew(data.crew);
        setScoutRarity(data.rarity);
        setPartnerReaction(data.partner_reaction);
        playSound('scout'); // スカウト成功音
        // ユーザー情報とクルーリストを再取得
        fetchUser();
        fetch(apiUrl('/api/crews'))
          .then((res) => res.json())
          .then((data) => setCrews(data));
      } else {
        playSound('error');
        alert(data.error || 'スカウトに失敗しました');
        setShowScoutModal(false);
      }
    } catch (error) {
      console.error('Scout error:', error);
      alert('スカウトに失敗しました');
      setShowScoutModal(false);
    } finally {
      setIsScouting(false);
    }
  };

  // URL要約処理
  const handleWebSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isLoadingWebSummary) return;

    // URLバリデーション
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      playSound('error');
      alert('有効なURLを入力してください（http:// または https:// で始まる必要があります）');
      return;
    }

    playSound('click');
    setIsLoadingWebSummary(true);

    try {
      const response = await fetch(apiUrl('/api/tools/web-summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data: WebSummaryResponse = await response.json();

      if (data.success) {
        playSound('success');
        setWebSummaryResult(data);
        setShowWebSummaryModal(true);
        setUrlInput(''); // 入力をクリア
      } else {
        playSound('error');
        alert(data.error || 'Web記事の要約に失敗しました');
      }
    } catch (error) {
      console.error('Web summary error:', error);
      playSound('error');
      alert('Web記事の要約に失敗しました');
    } finally {
      setIsLoadingWebSummary(false);
    }
  };

  // ファイル要約処理
  const handleFileSummary = async (file: File) => {
    if (!file || isLoadingFileSummary) return;

    // ファイル形式チェック
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      playSound('error');
      alert('PDFファイルのみ対応しています。');
      return;
    }

    // ファイルサイズチェック（10MB）
    if (file.size > 10 * 1024 * 1024) {
      playSound('error');
      alert(`ファイルサイズが大きすぎます（最大10MB）。現在のサイズ: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    playSound('click');
    setIsLoadingFileSummary(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(apiUrl('/api/tools/file-summary'), {
        method: 'POST',
        body: formData,
      });

      const data: FileSummaryResponse = await response.json();

      if (data.success) {
        playSound('success');
        setFileSummaryResult(data);
        setShowFileSummaryModal(true);
      } else {
        playSound('error');
        alert(data.error || 'PDFの解析に失敗しました');
      }
    } catch (error) {
      console.error('File summary error:', error);
      playSound('error');
      alert('PDFの解析に失敗しました');
    } finally {
      setIsLoadingFileSummary(false);
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ドラッグ&ドロップハンドラ
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSummary(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSummary(files[0]);
    }
  };

  // Director Mode: プロジェクト計画作成
  const handleCreateProjectPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectGoal.trim() || isLoadingProjectPlan) return;

    if (!partner) {
      playSound('error');
      alert('プロジェクトを開始するには、先に相棒を任命してください。');
      return;
    }

    playSound('click');
    setIsLoadingProjectPlan(true);

    try {
      const response = await fetch(apiUrl('/api/director/plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_goal: projectGoal.trim() }),
      });

      const data: DirectorPlanResponse = await response.json();

      if (data.success) {
        playSound('success');
        setProjectPlan(data);
        setProjectInputValues({}); // 入力値をリセット
        setShowProjectPlanModal(true);
      } else {
        playSound('error');
        alert(data.error || 'プロジェクト計画の作成に失敗しました');
      }
    } catch (error) {
      console.error('Project plan error:', error);
      playSound('error');
      alert('プロジェクト計画の作成に失敗しました');
    } finally {
      setIsLoadingProjectPlan(false);
    }
  };

  // Director Mode: プロジェクト開始・実行
  const handleStartProject = async () => {
    if (!projectPlan) return;

    // 全ての必須入力が埋まっているかチェック
    const missingInputs = projectPlan.required_inputs.filter(
      (inp) => !projectInputValues[inp.key]?.trim()
    );
    if (missingInputs.length > 0) {
      playSound('error');
      alert(`以下の情報を入力してください: ${missingInputs.map((i) => i.label).join(', ')}`);
      return;
    }

    playSound('click');

    // 実行モードに切り替え
    setIsProjectExecuting(true);
    setProjectExecutionResults([]);
    setCurrentExecutingTaskIndex(0);
    setExpandedTaskResults({});

    try {
      // FormDataで送信（ファイルを含むため）
      const formData = new FormData();
      formData.append('project_title', projectPlan.project_title || '');
      formData.append('description', projectPlan.description || '');
      formData.append('user_goal', projectGoal);
      formData.append('required_inputs_json', JSON.stringify(projectPlan.required_inputs));
      formData.append('tasks_json', JSON.stringify(projectPlan.tasks));
      formData.append('input_values_json', JSON.stringify(projectInputValues));

      // ファイルを追加（キー名:::ファイル名 形式）
      // Note: globalThis.File を使用（lucide-reactのFileアイコンとの衝突を避けるため）
      // Note: 区切り文字に ::: を使用（キーに _ が含まれる可能性があるため）
      for (const [key, file] of Object.entries(projectInputFiles)) {
        console.log(`Adding file: key=${key}, name=${file.name}, size=${file.size}`);
        const blob = file.slice(0, file.size, file.type);
        const renamedFile = new globalThis.File([blob], `${key}:::${file.name}`, { type: file.type });
        formData.append('files', renamedFile);
      }

      const response = await fetch(apiUrl('/api/director/execute'), {
        method: 'POST',
        body: formData,
      });

      const data: ExecuteProjectResponse = await response.json();

      if (data.success) {
        // タスク結果をセット
        setProjectExecutionResults(data.task_results);
        setCurrentExecutingTaskIndex(-1); // 実行完了
        setShowProjectComplete(true);
        playSound('levelup');
      } else {
        playSound('error');
        alert(data.error || 'プロジェクトの実行に失敗しました');
        setIsProjectExecuting(false);
      }
    } catch (error) {
      console.error('Execute project error:', error);
      playSound('error');
      alert('プロジェクトの実行に失敗しました');
      setIsProjectExecuting(false);
    }
  };

  // プロジェクト完了後の処理
  const handleProjectComplete = () => {
    setShowProjectComplete(false);
    setShowProjectPlanModal(false);
    setIsProjectExecuting(false);
    setProjectPlan(null);
    setProjectGoal('');
    setProjectInputValues({});
    setProjectInputFiles({});
    setProjectExecutionResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting || isRouting) return;

    playSound('click'); // 送信音

    const taskText = inputValue;
    setInputValue('');
    setPartnerComment(null);

    // 相棒がいる場合はマネージャー機能を使用
    if (partner) {
      setIsRouting(true);

      try {
        // 相棒にルーティングを依頼
        const routeResponse = await fetch(apiUrl('/api/route-task'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: taskText }),
        });
        const routeData: RouteTaskResponse = await routeResponse.json();

        if (routeData.success) {
          // 相棒のコメントを表示
          setPartnerComment(routeData.partner_comment);
          // 選ばれたクルーに切り替え
          setSelectedCrewId(routeData.selected_crew_id);

          // 少し待ってからタスクを実行
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error('Routing error:', error);
      } finally {
        setIsRouting(false);
      }
    }

    // 選択されたクルーを取得（ルーティング後の値を使用）
    const crew = crews.find((c) => c.id === selectedCrewId);
    if (!crew) return;

    setIsSubmitting(true);

    // 新しいタスクを「進行中」で追加
    const newTaskId = Date.now();
    const newTask: Task = {
      id: newTaskId,
      title: taskText,
      status: 'in_progress',
      crewId: crew.id,
      crewName: crew.name,
      crewImage: crew.image,
    };
    setTasks((prev) => [newTask, ...prev]);

    try {
      // APIを呼び出し
      const response = await fetch(apiUrl('/api/execute-task'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crew_id: crew.id,
          task: taskText,
        }),
      });

      const data: ExecuteTaskResponse = await response.json();

      if (data.success) {
        playSound('success'); // タスク完了音

        // タスクを「完了」に更新（EXP/レベル情報も含める）
        setTasks((prev) =>
          prev.map((t) =>
            t.id === newTaskId
              ? {
                  ...t,
                  status: 'completed' as const,
                  result: data.result || undefined,
                  expGained: data.exp_gained || undefined,
                  oldLevel: data.old_level || undefined,
                  newLevel: data.new_level || undefined,
                  leveledUp: data.leveled_up,
                }
              : t
          )
        );

        // EXP更新イベントを発火（My Crewsページに通知）
        if (data.new_exp !== null && data.new_level !== null && data.exp_gained !== null) {
          emitCrewExpUpdate({
            crewId: data.crew_id,
            crewName: data.crew_name,
            newExp: data.new_exp,
            newLevel: data.new_level,
            expGained: data.exp_gained,
            leveledUp: data.leveled_up,
          });

          // レベルアップ時は通知を表示
          if (data.leveled_up) {
            playSound('levelUp'); // レベルアップ音
            setLevelUpNotification({
              crewName: data.crew_name,
              newLevel: data.new_level,
            });
          }
        }

        // コイン取得時はユーザー情報を再取得
        if (data.coin_gained) {
          fetchUser();
        }

        // 完了したタスクを自動的にモーダルで表示（EXP/レベル情報も含める）
        const completedTask: Task = {
          ...newTask,
          status: 'completed',
          result: data.result || undefined,
          expGained: data.exp_gained || undefined,
          oldLevel: data.old_level || undefined,
          newLevel: data.new_level || undefined,
          leveledUp: data.leveled_up,
        };
        setSelectedTask(completedTask);
        setIsModalOpen(true);
      } else {
        // エラー時はタスクを削除
        setTasks((prev) => prev.filter((t) => t.id !== newTaskId));
        console.error('Task execution failed:', data.error);
      }
    } catch (error) {
      // ネットワークエラー時
      setTasks((prev) => prev.filter((t) => t.id !== newTaskId));
      console.error('Network error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    if (task.status === 'completed' && task.result) {
      playSound('click');
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'in_progress':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Clock className="text-yellow-500" size={20} />
          </motion.div>
        );
      case 'pending':
        return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'in_progress':
        return '進行中';
      case 'pending':
        return '待機中';
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;

  // オフィス背景スタイル
  const officeBackground = getOfficeBackground(timeOfDay);
  const isNightTime = timeOfDay === 'night';

  return (
    <>
      {/* レベルアップ通知 */}
      <LevelUpNotification
        show={levelUpNotification !== null}
        crewName={levelUpNotification?.crewName || ''}
        newLevel={levelUpNotification?.newLevel || 0}
        onClose={() => setLevelUpNotification(null)}
      />

      {/* オフィス背景 */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${officeBackground}`}>
        {/* 夜の窓の明かり演出 */}
        {isNightTime && (
          <>
            <div className="absolute top-20 left-[10%] w-16 h-24 bg-yellow-200/30 rounded-sm" />
            <div className="absolute top-32 left-[25%] w-12 h-20 bg-yellow-300/20 rounded-sm" />
            <div className="absolute top-16 right-[15%] w-14 h-22 bg-orange-200/25 rounded-sm" />
            <div className="absolute top-28 right-[30%] w-10 h-18 bg-yellow-100/20 rounded-sm" />
            {/* 星エフェクト - 固定位置 */}
            {[5, 12, 25, 38, 45, 58, 72, 85, 92, 15, 33, 67, 78, 8, 55, 42, 88, 22, 63, 95].map((pos, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${pos}%`,
                  top: `${(i * 7) % 35 + 5}%`,
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 2 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.2,
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

      <div className="max-w-4xl mx-auto relative">
        {/* 時間帯インジケーター */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`absolute top-0 right-0 px-3 py-1.5 rounded-full text-xs font-medium ${
            isNightTime
              ? 'bg-indigo-800/50 text-indigo-200'
              : 'bg-white/50 text-gray-600'
          } backdrop-blur-sm`}
        >
          {timeOfDay === 'morning' && '🌅 朝'}
          {timeOfDay === 'afternoon' && '☀️ 昼'}
          {timeOfDay === 'evening' && '🌇 夕方'}
          {timeOfDay === 'night' && '🌙 夜'}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className={`text-2xl font-bold mb-1 ${isNightTime ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
            Dashboard
          </h1>
          <p className={`text-sm ${isNightTime ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
            クルーたちに仕事を依頼しよう
          </p>
        </motion.div>

        {/* ===== 上部: 新しいタスクを依頼（最優先） ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 mb-6 border border-gray-100 dark:border-gray-700"
        >
          {/* 入力モード切替タブ */}
          <div className="flex gap-2 mb-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSound('select');
                setInputMode('text');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FileEdit size={18} />
              テキスト入力
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSound('select');
                setInputMode('url');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                inputMode === 'url'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Link size={18} />
              URL読込
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSound('select');
                setInputMode('file');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                inputMode === 'file'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FolderOpen size={18} />
              ファイル
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSound('select');
                setInputMode('project');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                inputMode === 'project'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Rocket size={18} />
              新規プロジェクト
            </motion.button>
          </div>

          {/* テキスト入力モード */}
          {inputMode === 'text' && (
            <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="タスクを入力してください（例: 今週の売上データをまとめて）"
                  disabled={isSubmitting}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
              <motion.button
                type="submit"
                disabled={isSubmitting || !inputValue.trim()}
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                animate={isSubmitting ? { boxShadow: ['0 0 0 0 rgba(168, 85, 247, 0)', '0 0 20px 10px rgba(168, 85, 247, 0.4)', '0 0 0 0 rgba(168, 85, 247, 0)'] } : {}}
                transition={isSubmitting ? { duration: 0.8, repeat: Infinity } : {}}
                className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-fuchsia-500/30 min-w-[140px] justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    実行中...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    依頼
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* URL読込モード */}
          {inputMode === 'url' && (
            <form onSubmit={handleWebSummary} className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Globe size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="記事のURLをここに貼り付け..."
                  disabled={isLoadingWebSummary}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-cyan-300 dark:border-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 text-gray-800 dark:text-gray-100 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
              <motion.button
                type="submit"
                disabled={isLoadingWebSummary || !urlInput.trim()}
                whileHover={!isLoadingWebSummary ? { scale: 1.02 } : {}}
                whileTap={!isLoadingWebSummary ? { scale: 0.98 } : {}}
                animate={isLoadingWebSummary ? { boxShadow: ['0 0 0 0 rgba(6, 182, 212, 0)', '0 0 20px 10px rgba(6, 182, 212, 0.4)', '0 0 0 0 rgba(6, 182, 212, 0)'] } : {}}
                transition={isLoadingWebSummary ? { duration: 0.8, repeat: Infinity } : {}}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/30 min-w-[140px] justify-center"
              >
                {isLoadingWebSummary ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    読込中...
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    要約
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* ファイルアップロードモード */}
          {inputMode === 'file' && (
            <div className="mb-4">
              {/* 隠しファイル入力 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* ドラッグ&ドロップエリア */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isLoadingFileSummary && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer ${
                  isLoadingFileSummary
                    ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 cursor-wait'
                    : isDragging
                    ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/30 scale-[1.02]'
                    : 'border-orange-300 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-900/10 hover:border-orange-400 hover:bg-orange-100/50 dark:hover:bg-orange-900/20'
                }`}
              >
                {isLoadingFileSummary ? (
                  // ローディング表示
                  <div className="flex flex-col items-center justify-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="w-16 h-16 rounded-full border-4 border-orange-200 border-t-orange-500"
                    />
                    <div className="text-center">
                      <p className="text-orange-700 dark:text-orange-300 font-bold text-lg">
                        PDF解析中...
                      </p>
                      <p className="text-orange-600/70 dark:text-orange-400/70 text-sm mt-1">
                        クルーが資料を読み込んでいます
                      </p>
                    </div>
                  </div>
                ) : (
                  // 通常表示
                  <div className="flex flex-col items-center justify-center gap-3">
                    <motion.div
                      animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shadow-lg"
                    >
                      <Upload size={28} className="text-white" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-gray-700 dark:text-gray-200 font-bold text-lg">
                        {isDragging ? 'ここにドロップ！' : 'PDFをドラッグ＆ドロップ'}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        またはクリックしてファイルを選択
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                        対応形式: PDF（最大10MB）
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* プロジェクトモード */}
          {inputMode === 'project' && (
            <div className="mb-4">
              {/* 相棒PM表示 */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                {partner ? (
                  <>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400 bg-purple-100 dark:bg-purple-800">
                      <Image
                        src={partner.image}
                        alt={partner.name}
                        width={40}
                        height={40}
                        className="object-cover scale-150 translate-y-1"
                      />
                    </div>
                    <div>
                      <p className="text-purple-800 dark:text-purple-200 font-medium text-sm">
                        担当: <span className="font-bold">{partner.name}</span> (PM)
                      </p>
                      <p className="text-purple-600 dark:text-purple-400 text-xs">
                        最適なチームを編成します
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-purple-600 dark:text-purple-400 text-sm">
                    ※ プロジェクト機能を使うには、先に相棒を任命してください
                  </p>
                )}
              </div>

              {/* プロジェクト入力フォーム */}
              <form onSubmit={handleCreateProjectPlan} className="flex gap-3">
                <div className="flex-1 relative">
                  <Rocket size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" />
                  <input
                    type="text"
                    value={projectGoal}
                    onChange={(e) => setProjectGoal(e.target.value)}
                    placeholder="作りたいものや目的を入力してください（例: クライアントのPDFを元に、提案資料を作成して）"
                    disabled={isLoadingProjectPlan || !partner}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-gray-800 dark:text-gray-100 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isLoadingProjectPlan || !projectGoal.trim() || !partner}
                  whileHover={!isLoadingProjectPlan ? { scale: 1.02 } : {}}
                  whileTap={!isLoadingProjectPlan ? { scale: 0.98 } : {}}
                  animate={isLoadingProjectPlan ? { boxShadow: ['0 0 0 0 rgba(139, 92, 246, 0)', '0 0 20px 10px rgba(139, 92, 246, 0.4)', '0 0 0 0 rgba(139, 92, 246, 0)'] } : {}}
                  transition={isLoadingProjectPlan ? { duration: 0.8, repeat: Infinity } : {}}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30 min-w-[160px] justify-center"
                >
                  {isLoadingProjectPlan ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      計画中...
                    </>
                  ) : (
                    <>
                      <Users size={20} />
                      計画を立てる
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          )}

          {/* クルー選択（テキストモード時のみ表示） */}
          {inputMode === 'text' && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">担当:</span>
            <div className="flex gap-1.5 flex-wrap">
              {crews.map((crew) => (
                <motion.button
                  key={crew.id}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playSound('select');
                    setSelectedCrewId(crew.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                    selectedCrewId === crew.id
                      ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-fuchsia-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                    <Image
                      src={crew.image}
                      alt={crew.name}
                      width={24}
                      height={24}
                      className="object-cover scale-150 translate-y-0.5"
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    selectedCrewId === crew.id
                      ? 'text-fuchsia-700 dark:text-fuchsia-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {crew.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
          )}
        </motion.div>

        {/* マネージャーコメント表示 */}
        <AnimatePresence>
          {(isRouting || partnerComment) && partner && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-3 border border-purple-200 dark:border-purple-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100 shrink-0">
                  <Image
                    src={partner.image}
                    alt={partner.name}
                    width={40}
                    height={40}
                    className="object-cover scale-150 translate-y-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs bg-purple-200 dark:bg-purple-700 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded-full font-medium">
                      {partner.name}
                    </span>
                  </div>
                  {isRouting ? (
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-300 text-sm">
                      <Loader2 size={14} className="animate-spin" />
                      <span>最適なクルーを選定中...</span>
                    </div>
                  ) : (
                    <p className="text-gray-700 dark:text-gray-200 text-sm truncate">
                      {partnerComment}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== 中部: タスク進捗 & 相棒コメント ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* 統計カード（2列） */}
          <div className="lg:col-span-2 grid grid-cols-3 gap-3">
            {[
              { label: '完了', value: completedCount, color: 'text-green-500', bgColor: 'from-green-500/10 to-emerald-500/10', icon: '✓' },
              { label: '進行中', value: inProgressCount, color: 'text-amber-500', bgColor: 'from-amber-500/10 to-orange-500/10', icon: '⏳' },
              { label: '合計', value: tasks.length, color: 'text-fuchsia-500', bgColor: 'from-fuchsia-500/10 to-pink-500/10', icon: '📋' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className={`bg-gradient-to-br ${stat.bgColor} bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{stat.icon}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
                </div>
                <motion.div
                  key={stat.value}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className={`text-2xl font-bold ${stat.color}`}
                >
                  {stat.value}
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* 相棒コメント（1列） */}
          <PartnerDisplayCompact
            partner={partner}
            whimsicalTalk={whimsicalTalk}
            isLoadingTalk={isLoadingTalk}
            onRefreshTalk={fetchWhimsicalTalk}
          />
        </div>

      {/* タスク一覧 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          タスク進捗
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
            />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            まだタスクがありません。上のフォームから依頼してみましょう！
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                  onClick={() => handleTaskClick(task)}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                    task.status === 'in_progress'
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800'
                      : task.status === 'completed' && task.result
                        ? 'bg-gray-50 dark:bg-gray-900 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer'
                        : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <CrewMiniIcon
                    image={task.crewImage}
                    name={task.crewName}
                    isWorking={task.status === 'in_progress'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 dark:text-gray-100 truncate">
                      {task.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      担当: {task.crewName}
                    </div>
                    {task.status === 'completed' && task.result && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>回答あり</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {task.status === 'completed' && task.result && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="text-purple-500"
                      >
                        <FileText size={18} />
                      </motion.div>
                    )}
                    {getStatusIcon(task.status)}
                    <span
                      className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                          : task.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 animate-pulse'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

        {/* ===== 下部: 連携デモ & スカウト/日報ボタン ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* 連携デモバナー（控えめ） */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playSound('click');
              setShowCollaborationDemo(true);
            }}
            className="bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-orange-500/90 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white font-bold py-4 px-5 rounded-xl shadow-md flex items-center gap-3 transition-all relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
            <span className="text-xl">🤖</span>
            <div className="text-left relative z-10">
              <span className="text-sm block font-bold">連携デモ</span>
              <span className="text-[10px] opacity-70">YouTube → ブログ</span>
            </div>
            <span className="text-lg ml-auto">📝</span>
          </motion.button>

          {/* スカウトボタン */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleScout}
            disabled={isScouting || !user || user.coin < 300}
            className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-amber-900 font-bold py-4 px-5 rounded-xl shadow-md flex items-center gap-3 transition-all"
          >
            <Search size={20} />
            <div className="text-left">
              <span className="text-sm block font-bold">スカウト</span>
              <span className="text-[10px] opacity-70">300コイン</span>
            </div>
          </motion.button>

          {/* 業務終了ボタン */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playSound('click');
              fetchDailyReport();
            }}
            disabled={isLoadingReport}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-5 rounded-xl shadow-md flex items-center gap-3 transition-all"
          >
            {isLoadingReport ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">読み込み中...</span>
              </>
            ) : (
              <>
                <CalendarCheck size={20} />
                <div className="text-left">
                  <span className="text-sm block font-bold">日報</span>
                  <span className="text-[10px] opacity-70">業務終了</span>
                </div>
              </>
            )}
          </motion.button>
        </div>

        {/* 結果モーダル */}
        <ResultModal
          isOpen={isModalOpen}
          onClose={() => {
            playSound('confirm');
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          crewImage={selectedTask?.crewImage || '/images/crews/monster_1.png'}
        />

        {/* スカウトモーダル */}
        <AnimatePresence>
          {showScoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                if (!isScouting && scoutedCrew && isResumeFlipped) {
                  playSound('confirm');
                  setShowScoutModal(false);
                  setScoutedCrew(null);
                  setIsResumeFlipped(false);
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {isScouting && !scoutedCrew ? (
                  // スカウト中の演出
                  <div className="p-12 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-24 h-24 mx-auto mb-6 border-4 border-yellow-400 border-t-transparent rounded-full"
                    />
                    <motion.h3
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2"
                    >
                      スカウト中...
                    </motion.h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      新しいクルーを探しています
                    </p>
                  </div>
                ) : scoutedCrew && !isResumeFlipped ? (
                  // 履歴書（裏向き）- クリックでめくる
                  <motion.div
                    className="p-8 cursor-pointer"
                    onClick={() => {
                      playSound('cardFlip');
                      setIsResumeFlipped(true);
                      // ★4以上の場合は祝福音も鳴らす
                      if (scoutRarity && scoutRarity >= 4) {
                        setTimeout(() => playSound('celebrate'), 500);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="relative bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-2xl p-8 shadow-xl border-4 border-amber-300 dark:border-amber-600"
                      animate={{ rotateY: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {/* 封印っぽいデザイン */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <span className="text-white text-3xl font-black">履</span>
                        </motion.div>
                      </div>

                      {/* 「履歴書」テキスト */}
                      <div className="text-center mb-32">
                        <h2 className="text-3xl font-black text-amber-800 dark:text-amber-200">
                          履 歴 書
                        </h2>
                        <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">
                          RESUME
                        </p>
                      </div>

                      {/* タップして開く */}
                      <motion.div
                        className="text-center"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <p className="text-amber-700 dark:text-amber-300 font-bold">
                          タップして開く
                        </p>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ) : scoutedCrew && isResumeFlipped ? (
                  // スカウト成功（履歴書オープン後）
                  <>
                    {/* レアリティに応じた背景色 */}
                    <div className={`relative p-8 overflow-hidden ${
                      scoutRarity === 5
                        ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500'
                        : scoutRarity === 4
                        ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400'
                        : scoutRarity === 3
                        ? 'bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500'
                        : scoutRarity === 2
                        ? 'bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500'
                        : 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600'
                    }`}>
                      {/* ★4以上で紙吹雪エフェクト */}
                      {scoutRarity && scoutRarity >= 4 && (
                        <>
                          {[...Array(20)].map((_, i) => (
                            <motion.div
                              key={i}
                              className={`absolute w-3 h-3 ${
                                ['bg-yellow-200', 'bg-orange-200', 'bg-pink-200', 'bg-white'][i % 4]
                              }`}
                              style={{
                                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                              }}
                              initial={{
                                x: Math.random() * 400 - 50,
                                y: -20,
                                opacity: 1,
                                rotate: 0,
                              }}
                              animate={{
                                y: 400,
                                opacity: [1, 1, 0],
                                rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                              }}
                              transition={{
                                duration: 3 + Math.random() * 2,
                                delay: Math.random() * 2,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                            />
                          ))}
                        </>
                      )}

                      {/* レアリティ表示 */}
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
                        className="absolute top-4 left-4"
                      >
                        <div className={`px-3 py-1 rounded-full font-black text-lg shadow-lg ${
                          scoutRarity === 5
                            ? 'bg-gradient-to-r from-yellow-200 to-yellow-400 text-yellow-800'
                            : scoutRarity === 4
                            ? 'bg-gradient-to-r from-orange-200 to-orange-400 text-orange-800'
                            : scoutRarity === 3
                            ? 'bg-gradient-to-r from-purple-200 to-purple-400 text-purple-800'
                            : scoutRarity === 2
                            ? 'bg-gradient-to-r from-blue-200 to-blue-400 text-blue-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {'★'.repeat(scoutRarity || 1)}
                        </div>
                      </motion.div>

                      {/* NEW! バッジ */}
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
                        className="absolute top-4 right-4 bg-white text-yellow-600 text-xs font-black px-3 py-1 rounded-full shadow-lg"
                      >
                        NEW!
                      </motion.div>

                      {/* クルー画像 */}
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                        className={`relative mx-auto w-32 h-32 rounded-full overflow-hidden shadow-xl bg-gradient-to-br from-purple-100 to-pink-100 ${
                          scoutRarity === 5
                            ? 'border-4 border-yellow-300 ring-4 ring-yellow-400/50'
                            : scoutRarity === 4
                            ? 'border-4 border-orange-300 ring-4 ring-orange-400/50'
                            : 'border-4 border-white'
                        }`}
                      >
                        <motion.img
                          src={scoutedCrew.image}
                          alt={scoutedCrew.name}
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
                          {scoutedCrew.name}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                          {scoutedCrew.role}
                        </p>
                      </motion.div>
                    </div>

                    {/* 相棒の反応（★4以上） */}
                    {partnerReaction && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 p-4 border-b border-purple-200 dark:border-purple-700"
                      >
                        <p className="text-center text-purple-700 dark:text-purple-300 font-bold text-sm">
                          {partnerReaction}
                        </p>
                      </motion.div>
                    )}

                    {/* 挨拶メッセージ */}
                    <div className="p-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 relative"
                      >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-50 dark:bg-gray-900 rotate-45" />
                        <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed relative z-10">
                          {scoutedCrew.greeting}
                        </p>
                      </motion.div>

                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          playSound('confirm');
                          setShowScoutModal(false);
                          setScoutedCrew(null);
                          setIsResumeFlipped(false);
                        }}
                        className="w-full mt-6 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-yellow-900 font-bold py-3 rounded-xl shadow-lg transition-all"
                      >
                        よろしくね！
                      </motion.button>
                    </div>
                  </>
                ) : null}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 日報モーダル */}
        <DailyReportModal
          isOpen={showDailyReport}
          onClose={() => {
            setShowDailyReport(false);
            setDailyReport(null);
          }}
          report={dailyReport}
          partner={partner}
          onCoinUpdate={fetchUser}
        />

        {/* 連携デモモーダル */}
        <CollaborationDemo
          isOpen={showCollaborationDemo}
          onClose={() => setShowCollaborationDemo(false)}
          analystAgent={{
            id: 3,
            name: 'ロッキー',
            image: '/images/crews/monster_3.png',
            role: 'analyst',
            x: 0,
            y: 0,
          }}
          writerAgent={{
            id: 2,
            name: 'アクアン',
            image: '/images/crews/monster_2.png',
            role: 'writer',
            x: 0,
            y: 0,
          }}
        />

        {/* Web要約結果モーダル */}
        <AnimatePresence>
          {showWebSummaryModal && webSummaryResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                playSound('confirm');
                setShowWebSummaryModal(false);
                setWebSummaryResult(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ヘッダー */}
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {webSummaryResult.crew_image && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 bg-white/20">
                        <Image
                          src={webSummaryResult.crew_image}
                          alt={webSummaryResult.crew_name || 'クルー'}
                          width={48}
                          height={48}
                          className="object-cover scale-150 translate-y-1"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold">
                          {webSummaryResult.crew_name}からの要約レポート
                        </h3>
                        <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                          URL読込
                        </span>
                      </div>
                      {webSummaryResult.page_title && (
                        <p className="text-white/80 text-sm truncate max-w-md">
                          {webSummaryResult.page_title}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      playSound('confirm');
                      setShowWebSummaryModal(false);
                      setWebSummaryResult(null);
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* コンテンツ - クルーの吹き出し風 */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="flex gap-4">
                    {/* クルーアイコン */}
                    {webSummaryResult.crew_image && (
                      <motion.div
                        className="shrink-0"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-cyan-400 shadow-lg bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-800 dark:to-blue-800">
                          <Image
                            src={webSummaryResult.crew_image}
                            alt={webSummaryResult.crew_name || 'クルー'}
                            width={64}
                            height={64}
                            className="object-cover scale-150 translate-y-2"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* 吹き出し */}
                    <div className="flex-1 relative">
                      <div className="absolute left-0 top-6 -translate-x-2 w-0 h-0 border-t-[8px] border-b-[8px] border-r-[8px] border-transparent border-r-cyan-50 dark:border-r-gray-700" />
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-cyan-50 dark:bg-gray-700 rounded-2xl p-5 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Globe size={16} className="text-cyan-600 dark:text-cyan-400" />
                          <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                            記事の要約
                          </span>
                        </div>
                        {webSummaryResult.summary && (
                          <div className="prose dark:prose-invert max-w-none prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-li:text-gray-700 dark:prose-li:text-gray-200">
                            <div
                              className="whitespace-pre-wrap text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: webSummaryResult.summary
                                  .replace(/^• /gm, '<li class="ml-4 mb-2">')
                                  .replace(/^- /gm, '<li class="ml-4 mb-2">')
                                  .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-cyan-700 dark:text-cyan-300">$1</strong>')
                                  .replace(/\n/g, '<br />')
                              }}
                            />
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* フッター */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playSound('confirm');
                      setShowWebSummaryModal(false);
                      setWebSummaryResult(null);
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium px-6 py-2 rounded-xl"
                  >
                    閉じる
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ファイル要約結果モーダル */}
        <AnimatePresence>
          {showFileSummaryModal && fileSummaryResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                playSound('confirm');
                setShowFileSummaryModal(false);
                setFileSummaryResult(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ヘッダー */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {fileSummaryResult.crew_image && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 bg-white/20">
                        <Image
                          src={fileSummaryResult.crew_image}
                          alt={fileSummaryResult.crew_name || 'クルー'}
                          width={48}
                          height={48}
                          className="object-cover scale-150 translate-y-1"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold">
                          {fileSummaryResult.crew_name}からの解析レポート
                        </h3>
                        <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                          PDF解析
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <File size={14} />
                        <span className="truncate max-w-xs">{fileSummaryResult.filename}</span>
                        {fileSummaryResult.page_count && (
                          <span className="text-white/60">({fileSummaryResult.page_count}ページ)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      playSound('confirm');
                      setShowFileSummaryModal(false);
                      setFileSummaryResult(null);
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* コンテンツ - クルーの吹き出し風 */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="flex gap-4">
                    {/* クルーアイコン */}
                    {fileSummaryResult.crew_image && (
                      <motion.div
                        className="shrink-0"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-orange-400 shadow-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-800 dark:to-amber-800">
                          <Image
                            src={fileSummaryResult.crew_image}
                            alt={fileSummaryResult.crew_name || 'クルー'}
                            width={64}
                            height={64}
                            className="object-cover scale-150 translate-y-2"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* 吹き出し */}
                    <div className="flex-1 relative">
                      <div className="absolute left-0 top-6 -translate-x-2 w-0 h-0 border-t-[8px] border-b-[8px] border-r-[8px] border-transparent border-r-orange-50 dark:border-r-gray-700" />
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-orange-50 dark:bg-gray-700 rounded-2xl p-5 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <FileText size={16} className="text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
                            資料の要約
                          </span>
                        </div>
                        {fileSummaryResult.summary && (
                          <div className="prose dark:prose-invert max-w-none prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-li:text-gray-700 dark:prose-li:text-gray-200">
                            <div
                              className="whitespace-pre-wrap text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: fileSummaryResult.summary
                                  .replace(/^• /gm, '<li class="ml-4 mb-2">')
                                  .replace(/^- /gm, '<li class="ml-4 mb-2">')
                                  .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-orange-700 dark:text-orange-300">$1</strong>')
                                  .replace(/\n/g, '<br />')
                              }}
                            />
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* フッター */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playSound('confirm');
                      setShowFileSummaryModal(false);
                      setFileSummaryResult(null);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium px-6 py-2 rounded-xl"
                  >
                    閉じる
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* プロジェクト計画確認モーダル */}
        <AnimatePresence>
          {showProjectPlanModal && projectPlan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                // 実行中は閉じない
                if (isProjectExecuting) return;
                playSound('confirm');
                setShowProjectPlanModal(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 紙吹雪エフェクト */}
                {showProjectComplete && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                    {[...Array(50)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{
                          x: Math.random() * 100 + '%',
                          y: -20,
                          rotate: 0,
                          scale: Math.random() * 0.5 + 0.5,
                        }}
                        animate={{
                          y: '100vh',
                          rotate: Math.random() * 720 - 360,
                          x: `calc(${Math.random() * 100}% + ${Math.sin(i) * 100}px)`,
                        }}
                        transition={{
                          duration: Math.random() * 3 + 2,
                          delay: Math.random() * 0.5,
                          ease: 'linear',
                        }}
                        className={`absolute w-3 h-3 ${
                          ['bg-purple-500', 'bg-pink-500', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-orange-400'][i % 6]
                        }`}
                        style={{
                          borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '0%' : '2px',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* ヘッダー */}
                <div className={`p-5 ${isProjectExecuting ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {projectPlan.partner_image && (
                        <motion.div
                          animate={isProjectExecuting ? { rotate: [0, 5, -5, 0] } : { y: [0, -3, 0] }}
                          transition={{ duration: isProjectExecuting ? 0.5 : 2, repeat: Infinity }}
                          className="w-14 h-14 rounded-full overflow-hidden border-3 border-white/50 bg-white/20"
                        >
                          <Image
                            src={projectPlan.partner_image}
                            alt={projectPlan.partner_name || 'PM'}
                            width={56}
                            height={56}
                            className="object-cover scale-150 translate-y-1"
                          />
                        </motion.div>
                      )}
                      <div>
                        <h3 className="text-white font-bold text-xl">
                          {projectPlan.project_title}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {isProjectExecuting
                            ? (showProjectComplete ? 'プロジェクト完了！' : 'プロジェクト実行中...')
                            : `${projectPlan.partner_name}が以下のプランを立てました`
                          }
                        </p>
                      </div>
                    </div>
                    {!isProjectExecuting && (
                      <button
                        onClick={() => {
                          playSound('confirm');
                          setShowProjectPlanModal(false);
                        }}
                        className="text-white/80 hover:text-white transition-colors"
                      >
                        <X size={24} />
                      </button>
                    )}
                  </div>
                  {projectPlan.description && !isProjectExecuting && (
                    <p className="text-white/70 text-sm mt-3 bg-white/10 rounded-lg px-3 py-2">
                      {projectPlan.description}
                    </p>
                  )}
                </div>

                {/* コンテンツ */}
                <div className="p-6 overflow-y-auto max-h-[55vh]">
                  {isProjectExecuting ? (
                    /* 実行中モード */
                    <div className="space-y-4">
                      {projectPlan.tasks.map((task, index) => {
                        const result = projectExecutionResults.find((r) => r.task_index === index);
                        const isCurrentTask = !result && projectExecutionResults.length === index;
                        const isCompleted = result?.status === 'completed';
                        const isError = result?.status === 'error';

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`rounded-xl border-2 overflow-hidden ${
                              isCompleted
                                ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                                : isError
                                ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                                : isCurrentTask
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            <div className="p-4">
                              <div className="flex items-center gap-3">
                                {/* ステータスアイコン */}
                                <div className="flex-shrink-0">
                                  {isCompleted ? (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                                    >
                                      <CheckCircle2 size={20} className="text-white" />
                                    </motion.div>
                                  ) : isError ? (
                                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                      <AlertCircle size={20} className="text-white" />
                                    </div>
                                  ) : isCurrentTask ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                      className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                                    >
                                      <Loader2 size={20} className="text-white" />
                                    </motion.div>
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">{index + 1}</span>
                                    </div>
                                  )}
                                </div>

                                {/* クルー情報 */}
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
                                  <Image
                                    src={task.assigned_crew_image}
                                    alt={task.assigned_crew_name}
                                    width={40}
                                    height={40}
                                    className="object-cover scale-150 translate-y-1"
                                  />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-800 dark:text-gray-200">
                                      {task.assigned_crew_name}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full">
                                      {task.role}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                    {task.instruction}
                                  </p>
                                </div>

                                {/* アコーディオン開閉ボタン */}
                                {result && (
                                  <button
                                    onClick={() =>
                                      setExpandedTaskResults((prev) => ({
                                        ...prev,
                                        [index]: !prev[index],
                                      }))
                                    }
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                  >
                                    <motion.div
                                      animate={{ rotate: expandedTaskResults[index] ? 90 : 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <ChevronRight size={20} />
                                    </motion.div>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 結果表示（アコーディオン） */}
                            <AnimatePresence>
                              {result && expandedTaskResults[index] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-gray-200 dark:border-gray-700"
                                >
                                  <div className="p-4 bg-white/50 dark:bg-gray-900/50">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                      {result.result}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    /* 計画モード（従来のUI） */
                    <>
                      {/* チーム編成フローチャート */}
                      <div className="mb-6">
                        <h4 className="text-gray-800 dark:text-gray-200 font-bold text-sm mb-3 flex items-center gap-2">
                          <Users size={16} className="text-purple-500" />
                          チーム編成
                        </h4>
                        <div className="flex items-center flex-wrap gap-2">
                          {projectPlan.tasks.map((task, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl border border-purple-200 dark:border-purple-700"
                              >
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400 bg-purple-100 dark:bg-purple-800">
                                  <Image
                                    src={task.assigned_crew_image}
                                    alt={task.assigned_crew_name}
                                    width={48}
                                    height={48}
                                    className="object-cover scale-150 translate-y-1"
                                  />
                                </div>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                  {task.assigned_crew_name}
                                </span>
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full">
                                  {task.role}
                                </span>
                              </motion.div>
                              {index < projectPlan.tasks.length - 1 && (
                                <ChevronRight size={20} className="text-purple-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* タスクリスト */}
                      <div className="mb-6">
                        <h4 className="text-gray-800 dark:text-gray-200 font-bold text-sm mb-3 flex items-center gap-2">
                          <FileText size={16} className="text-purple-500" />
                          タスクリスト
                        </h4>
                        <div className="space-y-2">
                          {projectPlan.tasks.map((task, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                            >
                              <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                    {task.assigned_crew_name}
                                  </span>
                                  <span className="text-xs text-purple-600 dark:text-purple-400">
                                    ({task.role})
                                  </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                  {task.instruction}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* 不足情報フォーム（計画モードのみ表示） */}
                  {!isProjectExecuting && projectPlan.required_inputs.length > 0 && (
                    <div>
                      <h4 className="text-gray-800 dark:text-gray-200 font-bold text-sm mb-3 flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-500" />
                        必要な情報
                      </h4>
                      <div className="space-y-3">
                        {projectPlan.required_inputs.map((input, index) => (
                          <motion.div
                            key={input.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700"
                          >
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {input.label}
                              <span className="text-amber-500 ml-1">*</span>
                            </label>
                            {input.type === 'file' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      console.log(`File selected: key=${input.key}, name=${file.name}, size=${file.size}`);
                                      // ファイル名とファイル実体を保持
                                      setProjectInputValues((prev) => ({
                                        ...prev,
                                        [input.key]: file.name,
                                      }));
                                      setProjectInputFiles((prev) => {
                                        const updated = { ...prev, [input.key]: file };
                                        console.log('Updated projectInputFiles:', Object.keys(updated));
                                        return updated;
                                      });
                                    }
                                  }}
                                  className="hidden"
                                  id={`project-file-${input.key}`}
                                />
                                <label
                                  htmlFor={`project-file-${input.key}`}
                                  className="flex-1 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border-2 border-dashed border-amber-300 dark:border-amber-600 rounded-lg cursor-pointer hover:border-amber-400 transition-colors"
                                >
                                  <Upload size={18} className="text-amber-500" />
                                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                                    {projectInputValues[input.key] || 'ファイルを選択...'}
                                  </span>
                                </label>
                              </div>
                            ) : input.type === 'url' ? (
                              <input
                                type="url"
                                value={projectInputValues[input.key] || ''}
                                onChange={(e) =>
                                  setProjectInputValues((prev) => ({
                                    ...prev,
                                    [input.key]: e.target.value,
                                  }))
                                }
                                placeholder="https://..."
                                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-amber-300 dark:border-amber-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            ) : (
                              <input
                                type="text"
                                value={projectInputValues[input.key] || ''}
                                onChange={(e) =>
                                  setProjectInputValues((prev) => ({
                                    ...prev,
                                    [input.key]: e.target.value,
                                  }))
                                }
                                placeholder="入力してください..."
                                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-amber-300 dark:border-amber-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* フッター */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                  {showProjectComplete ? (
                    /* 完了時のフッター */
                    <div className="w-full flex justify-center">
                      <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleProjectComplete}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg"
                      >
                        <CheckCircle2 size={20} />
                        完了して閉じる
                      </motion.button>
                    </div>
                  ) : isProjectExecuting ? (
                    /* 実行中のフッター */
                    <div className="w-full flex justify-center">
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 size={20} />
                        </motion.div>
                        <span>タスクを実行中...</span>
                      </div>
                    </div>
                  ) : (
                    /* 計画モードのフッター */
                    <>
                      <button
                        onClick={() => {
                          playSound('confirm');
                          setShowProjectPlanModal(false);
                        }}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium px-4 py-2"
                      >
                        キャンセル
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStartProject}
                        disabled={
                          projectPlan.required_inputs.length > 0 &&
                          projectPlan.required_inputs.some(
                            (inp) => !projectInputValues[inp.key]?.trim()
                          )
                        }
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg"
                      >
                        <Rocket size={18} />
                        プロジェクトを開始する
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
