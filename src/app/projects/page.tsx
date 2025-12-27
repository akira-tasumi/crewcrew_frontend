'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Star,
  Trash2,
  Clock,
  Calendar,
  Loader2,
  FolderOpen,
  Rocket,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { useAppSound } from '@/contexts/SoundContext';
import CrewImage from '@/components/CrewImage';

type SavedProject = {
  id: number;
  title: string;
  description: string | null;
  prompt_template: string;
  crew_id: number | null;
  crew_name: string | null;
  is_favorite: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
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

// カードの色パターン
const CARD_COLORS = [
  'from-purple-400 to-pink-400',
  'from-blue-400 to-cyan-400',
  'from-orange-400 to-red-400',
  'from-green-400 to-emerald-400',
  'from-indigo-400 to-purple-400',
  'from-pink-400 to-rose-400',
];

export default function ProjectsPage() {
  const router = useRouter();
  const { playSound } = useAppSound();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // プロジェクト実行関連の状態
  const [executingProject, setExecutingProject] = useState<SavedProject | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [projectPlan, setProjectPlan] = useState<DirectorPlanResponse | null>(null);
  const [projectInputValues, setProjectInputValues] = useState<Record<string, string>>({});
  const [projectInputFiles, setProjectInputFiles] = useState<Record<string, File>>({});
  const [isProjectExecuting, setIsProjectExecuting] = useState(false);
  const [projectExecutionResults, setProjectExecutionResults] = useState<ExecuteProjectTaskResult[]>([]);
  const [currentExecutingTaskIndex, setCurrentExecutingTaskIndex] = useState(0);
  const [showProjectComplete, setShowProjectComplete] = useState(false);
  const [expandedTaskResults, setExpandedTaskResults] = useState<Record<number, boolean>>({});

  // プロジェクト一覧を取得
  const fetchProjects = async () => {
    try {
      const res = await fetch(apiUrl('/api/saved-projects'));
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // プロジェクトを実行（計画を取得）
  const handleRunProject = async (project: SavedProject) => {
    playSound('click');
    setExecutingProject(project);
    setIsLoadingPlan(true);
    setProjectPlan(null);
    setProjectInputValues({});
    setProjectInputFiles({});
    setProjectExecutionResults([]);
    setShowProjectComplete(false);

    try {
      // まず実行回数を更新
      await fetch(apiUrl(`/api/saved-projects/${project.id}/run`), {
        method: 'POST',
      });

      // プロジェクト計画を取得
      const response = await fetch(apiUrl('/api/director/plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_goal: project.prompt_template }),
      });

      const data: DirectorPlanResponse = await response.json();

      if (data.success) {
        playSound('success');
        setProjectPlan(data);
        // プロジェクト一覧を再取得して実行回数を更新
        fetchProjects();
      } else {
        playSound('error');
        alert(data.error || 'プロジェクト計画の作成に失敗しました');
        setExecutingProject(null);
      }
    } catch (error) {
      console.error('Project plan error:', error);
      playSound('error');
      alert('プロジェクト計画の作成に失敗しました');
      setExecutingProject(null);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // プロジェクト開始・実行（SSEストリーミング）
  const handleStartProject = async () => {
    if (!projectPlan || !executingProject) return;

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
      formData.append('user_goal', executingProject.prompt_template);
      formData.append('required_inputs_json', JSON.stringify(projectPlan.required_inputs));
      formData.append('tasks_json', JSON.stringify(projectPlan.tasks));
      formData.append('input_values_json', JSON.stringify(projectInputValues));

      // ファイルを追加（キー名:::ファイル名 形式）
      for (const [key, file] of Object.entries(projectInputFiles)) {
        console.log(`Adding file: key=${key}, name=${file.name}, size=${file.size}`);
        const blob = file.slice(0, file.size, file.type);
        const renamedFile = new globalThis.File([blob], `${key}:::${file.name}`, { type: file.type });
        formData.append('files', renamedFile);
      }

      // SSEストリーミングでタスク進捗を受信
      const response = await fetch(apiUrl('/api/director/execute-stream'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to start project execution');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'start':
                  console.log(`Project started with ${data.total_tasks} tasks`);
                  break;

                case 'task_start':
                  // タスク開始時に現在のインデックスを更新
                  setCurrentExecutingTaskIndex(data.task_index);
                  playSound('click');
                  console.log(`Task ${data.task_index} started: ${data.crew_name}`);
                  break;

                case 'task_complete':
                  // タスク完了時に結果を追加
                  setProjectExecutionResults((prev) => [...prev, data.task_result]);
                  playSound('confirm');
                  console.log(`Task ${data.task_index} completed: ${data.task_result.crew_name}`);
                  break;

                case 'complete':
                  // 全タスク完了
                  setCurrentExecutingTaskIndex(-1);
                  setShowProjectComplete(true);
                  playSound('levelUp');
                  console.log('Project completed!');
                  break;

                case 'error':
                  playSound('error');
                  alert(data.error || 'プロジェクトの実行に失敗しました');
                  setIsProjectExecuting(false);
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
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
    setExecutingProject(null);
    setProjectPlan(null);
    setIsProjectExecuting(false);
    setProjectInputValues({});
    setProjectInputFiles({});
    setProjectExecutionResults([]);
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    if (isProjectExecuting && !showProjectComplete) {
      // 実行中は閉じられない
      return;
    }
    setExecutingProject(null);
    setProjectPlan(null);
    setIsProjectExecuting(false);
    setProjectInputValues({});
    setProjectInputFiles({});
    setProjectExecutionResults([]);
    setShowProjectComplete(false);
  };

  // お気に入りトグル
  const handleToggleFavorite = async (project: SavedProject) => {
    playSound('select');
    try {
      const res = await fetch(apiUrl(`/api/saved-projects/${project.id}/favorite`), {
        method: 'POST',
      });

      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id ? { ...p, is_favorite: !p.is_favorite } : p
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // プロジェクト削除
  const handleDeleteProject = async (projectId: number) => {
    playSound('confirm');
    try {
      const res = await fetch(apiUrl(`/api/saved-projects/${projectId}`), {
        method: 'DELETE',
      });

      if (res.ok) {
        playSound('success');
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      playSound('error');
    }
  };

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 相対時間フォーマット
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return formatDate(dateStr);
  };

  // 結果の展開/折りたたみをトグル
  const toggleResultExpand = (index: number) => {
    setExpandedTaskResults((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-3">
          <FolderOpen className="text-purple-500" size={32} />
          保存済みプロジェクト
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          保存したプロジェクトをワンクリックで再実行できます
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={48} className="text-purple-500" />
          </motion.div>
        </div>
      ) : projects.length === 0 ? (
        /* 空状態 */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
            <Rocket size={48} className="text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            まだプロジェクトがありません
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            ダッシュボードでプロジェクトを実行した後、
            <br />
            「このプロジェクトを保存」から保存できます
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
          >
            ダッシュボードへ
          </motion.button>
        </motion.div>
      ) : (
        /* プロジェクト一覧 */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {projects.map((project, index) => {
            const colorClass = CARD_COLORS[index % CARD_COLORS.length];
            const isRunning = executingProject?.id === project.id && isLoadingPlan;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group"
              >
                {/* カラーバー */}
                <div className={`h-2 bg-gradient-to-r ${colorClass}`} />

                <div className="p-5">
                  {/* ヘッダー */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(project)}
                      className="ml-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Star
                        size={20}
                        className={
                          project.is_favorite
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }
                      />
                    </button>
                  </div>

                  {/* プロンプトプレビュー */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {project.prompt_template}
                    </p>
                  </div>

                  {/* 統計情報 */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Play size={12} />
                      <span>{project.run_count}回実行</span>
                    </div>
                    {project.last_run_at && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatRelativeTime(project.last_run_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRunProject(project)}
                      disabled={isRunning}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                        isRunning
                          ? 'bg-gray-400 cursor-not-allowed'
                          : `bg-gradient-to-r ${colorClass} hover:shadow-lg`
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          準備中...
                        </>
                      ) : (
                        <>
                          <Play size={18} />
                          今すぐ実行
                        </>
                      )}
                    </motion.button>
                    <button
                      onClick={() => setDeleteConfirmId(project.id)}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* 作成日 */}
                  <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(project.created_at)}に作成
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* 削除確認モーダル */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  プロジェクトを削除
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  このプロジェクトを削除しますか？
                  <br />
                  この操作は取り消せません。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-2 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDeleteProject(deleteConfirmId)}
                    className="flex-1 py-2 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
                  >
                    削除する
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* プロジェクト実行モーダル */}
      <AnimatePresence>
        {executingProject && projectPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col my-4"
            >
              {/* ヘッダー */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-white font-bold text-lg">
                    {projectPlan.project_title || executingProject.title}
                  </h3>
                  {projectPlan.description && (
                    <p className="text-white/80 text-sm mt-1">{projectPlan.description}</p>
                  )}
                </div>
                {(!isProjectExecuting || showProjectComplete) && (
                  <button
                    onClick={handleCloseModal}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                  >
                    <X size={24} />
                  </button>
                )}
              </div>

              {/* コンテンツ */}
              <div className="flex-1 overflow-y-auto p-6">
                {!isProjectExecuting ? (
                  /* 実行前: 入力フォームとタスク一覧 */
                  <>
                    {/* 必須入力 */}
                    {projectPlan.required_inputs.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-gray-800 dark:text-gray-200 font-bold mb-3">
                          必要な情報
                        </h4>
                        <div className="space-y-3">
                          {projectPlan.required_inputs.map((input) => (
                            <div key={input.key}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {input.label}
                              </label>
                              {input.type === 'file' ? (
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setProjectInputFiles((prev) => ({ ...prev, [input.key]: file }));
                                      setProjectInputValues((prev) => ({ ...prev, [input.key]: file.name }));
                                    }
                                  }}
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                                />
                              ) : (
                                <input
                                  type={input.type === 'url' ? 'url' : 'text'}
                                  value={projectInputValues[input.key] || ''}
                                  onChange={(e) =>
                                    setProjectInputValues((prev) => ({ ...prev, [input.key]: e.target.value }))
                                  }
                                  placeholder={input.type === 'url' ? 'https://...' : ''}
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* タスク一覧 */}
                    <div className="mb-6">
                      <h4 className="text-gray-800 dark:text-gray-200 font-bold mb-3">
                        実行タスク（{projectPlan.tasks.length}件）
                      </h4>
                      <div className="space-y-3">
                        {projectPlan.tasks.map((task, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 flex items-center gap-4"
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex-shrink-0">
                              <CrewImage
                                src={task.assigned_crew_image}
                                alt={task.assigned_crew_name}
                                width={48}
                                height={48}
                                className="object-cover scale-150 translate-y-1"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                  {task.assigned_crew_name}
                                </span>
                                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                  {task.role}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {task.instruction}
                              </p>
                            </div>
                            <div className="text-lg font-bold text-gray-300 dark:text-gray-600">
                              #{index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 実行ボタン */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartProject}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
                    >
                      <Rocket size={24} />
                      プロジェクトを開始
                    </motion.button>
                  </>
                ) : (
                  /* 実行中: 進捗表示 */
                  <>
                    {/* 進捗バー */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>進捗</span>
                        <span>
                          {projectExecutionResults.length} / {projectPlan.tasks.length}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(projectExecutionResults.length / projectPlan.tasks.length) * 100}%`,
                          }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                      </div>
                    </div>

                    {/* タスク結果一覧 */}
                    <div className="space-y-4">
                      {projectPlan.tasks.map((task, index) => {
                        const result = projectExecutionResults.find((r) => r.task_index === index);
                        const isCurrentTask = currentExecutingTaskIndex === index && !result;
                        const isExpanded = expandedTaskResults[index];

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-xl overflow-hidden border-2 transition-all ${
                              result
                                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                                : isCurrentTask
                                ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                            }`}
                          >
                            <div className="p-4 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex-shrink-0">
                                <CrewImage
                                  src={task.assigned_crew_image}
                                  alt={task.assigned_crew_name}
                                  width={48}
                                  height={48}
                                  className="object-cover scale-150 translate-y-1"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                    {task.assigned_crew_name}
                                  </span>
                                  {result ? (
                                    <CheckCircle2 size={16} className="text-green-500" />
                                  ) : isCurrentTask ? (
                                    <Loader2 size={16} className="text-yellow-500 animate-spin" />
                                  ) : (
                                    <Clock size={16} className="text-gray-400" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                  {task.instruction}
                                </p>
                              </div>
                              {result && (
                                <button
                                  onClick={() => toggleResultExpand(index)}
                                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronUp size={20} className="text-gray-500" />
                                  ) : (
                                    <ChevronDown size={20} className="text-gray-500" />
                                  )}
                                </button>
                              )}
                            </div>

                            {/* 結果表示 */}
                            <AnimatePresence>
                              {result && isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-gray-200 dark:border-gray-700"
                                >
                                  <div className="p-4 bg-white dark:bg-gray-800">
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

                    {/* 完了メッセージ */}
                    <AnimatePresence>
                      {showProjectComplete && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-6 p-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl text-center"
                        >
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                          >
                            <Sparkles size={48} className="text-purple-500 mx-auto mb-3" />
                          </motion.div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            プロジェクト完了！
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            すべてのタスクが正常に完了しました
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleProjectComplete}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg"
                          >
                            閉じる
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
