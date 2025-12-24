'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ClipboardList, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Crew } from './CrewCard';
import { apiUrl } from '@/lib/api';

type TaskLog = {
  id: number;
  task: string;
  result: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  exp_earned: number;
  created_at: string;
  completed_at: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  crew: Crew | null;
};

export default function CrewLogModal({ isOpen, onClose, crew }: Props) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ログを取得
  const fetchLogs = useCallback(async () => {
    if (!crew) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl(`/api/crews/${crew.id}/logs`));
      if (!res.ok) {
        throw new Error('ログの取得に失敗しました');
      }
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [crew]);

  useEffect(() => {
    if (isOpen && crew) {
      fetchLogs();
    }
  }, [isOpen, crew, fetchLogs]);

  if (!isOpen || !crew) return null;

  // ステータスアイコン
  const getStatusIcon = (status: TaskLog['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={16} className="text-yellow-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  // ステータスラベル
  const getStatusLabel = (status: TaskLog['status']) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'in_progress':
        return '実行中';
      case 'failed':
        return '失敗';
      default:
        return '待機中';
    }
  };

  // 日時フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 bg-white/20">
                <Image
                  src={crew.image}
                  alt={crew.name}
                  width={48}
                  height={48}
                  className="object-cover scale-150 translate-y-1"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ClipboardList size={20} />
                  {crew.name}のタスク履歴
                </h3>
                <p className="text-white/80 text-sm">{crew.role}</p>
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle size={32} className="text-red-500 mb-3" />
                <p className="text-red-500">{error}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ClipboardList size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">まだタスク履歴がありません</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  ダッシュボードからタスクを依頼してみましょう
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                  >
                    {/* タスクヘッダー */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(log.status)}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            log.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : log.status === 'failed'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {getStatusLabel(log.status)}
                          </span>
                          {log.exp_earned > 0 && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                              +{log.exp_earned} EXP
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 font-medium line-clamp-2">
                          {log.task}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </span>
                    </div>

                    {/* 結果プレビュー */}
                    {log.result && log.status === 'completed' && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                          {log.result}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                全 {logs.length} 件のタスク
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium px-6 py-2 rounded-xl transition-colors"
              >
                閉じる
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
