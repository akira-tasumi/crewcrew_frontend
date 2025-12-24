'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

type Task = {
  id: number;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
};

type Project = {
  id: number;
  name: string;
  description: string;
  tasks: Task[];
  color: string;
};

const DUMMY_PROJECTS: Project[] = [
  {
    id: 1,
    name: '週次レポート自動化',
    description: '毎週のレポート作成を自動化するプロジェクト',
    color: 'from-blue-400 to-cyan-400',
    tasks: [
      { id: 1, title: 'データ収集スクリプト作成', status: 'completed' },
      { id: 2, title: 'レポートテンプレート設計', status: 'in_progress' },
      { id: 3, title: '自動送信機能実装', status: 'pending' },
    ],
  },
  {
    id: 2,
    name: 'カスタマーサポート効率化',
    description: 'よくある質問への自動応答システム',
    color: 'from-purple-400 to-pink-400',
    tasks: [
      { id: 4, title: 'FAQ データベース構築', status: 'completed' },
      { id: 5, title: '応答パターン学習', status: 'completed' },
      { id: 6, title: 'チャットボット連携', status: 'in_progress' },
    ],
  },
  {
    id: 3,
    name: 'データ分析ダッシュボード',
    description: '売上データの可視化と分析',
    color: 'from-orange-400 to-red-400',
    tasks: [
      { id: 7, title: 'データソース接続', status: 'pending' },
      { id: 8, title: 'グラフコンポーネント作成', status: 'pending' },
    ],
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: FastAPI から取得
    // fetch('http://localhost:8000/api/projects')
    setTimeout(() => {
      setProjects(DUMMY_PROJECTS);
      setLoading(false);
    }, 500);
  }, []);

  const getTaskStats = (tasks: Task[]) => {
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { completed, total: tasks.length };
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="text-green-500" size={16} />;
      case 'in_progress':
        return <Clock className="text-yellow-500" size={16} />;
      case 'pending':
        return <AlertCircle className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            プロジェクト
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            タスクをプロジェクトごとに管理
          </p>
        </div>
        <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-5 py-3 rounded-xl transition-all flex items-center gap-2">
          <Plus size={18} />
          新規プロジェクト
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => {
            const stats = getTaskStats(project.tasks);
            const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

            return (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div className={`h-2 bg-gradient-to-r ${project.color}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {project.description}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-purple-500 transition-colors">
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <span>進捗</span>
                      <span>{stats.completed}/{stats.total} 完了</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${project.color} h-2 rounded-full transition-all`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {project.tasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-900"
                      >
                        {getStatusIcon(task.status)}
                        <span className="text-gray-700 dark:text-gray-300">{task.title}</span>
                      </div>
                    ))}
                    {project.tasks.length > 3 && (
                      <div className="text-sm text-gray-400 text-center pt-2">
                        他 {project.tasks.length - 3} 件のタスク
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
