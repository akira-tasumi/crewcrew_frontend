'use client';

import { useEffect, useState } from 'react';
import { Check, X, ExternalLink } from 'lucide-react';

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
};

const DUMMY_INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'チームコミュニケーションツールと連携',
    icon: '/images/integrations/slack.png',
    connected: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'ドキュメント管理ツールと連携',
    icon: '/images/integrations/notion.png',
    connected: false,
  },
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Gmail、カレンダー、ドライブと連携',
    icon: '/images/integrations/google.png',
    connected: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'リポジトリとイシュー管理を連携',
    icon: '/images/integrations/github.png',
    connected: false,
  },
];

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: FastAPI から取得
    // fetch('http://localhost:8000/api/integrations')
    setTimeout(() => {
      setIntegrations(DUMMY_INTEGRATIONS);
      setLoading(false);
    }, 500);
  }, []);

  const handleToggle = (id: string) => {
    // TODO: FastAPI に接続/切断リクエスト
    setIntegrations(
      integrations.map((i) =>
        i.id === id ? { ...i, connected: !i.connected } : i
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          連携設定
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          外部サービスとの連携を管理
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center gap-6"
            >
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl">
                {integration.id === 'slack' && '💬'}
                {integration.id === 'notion' && '📝'}
                {integration.id === 'google' && '📧'}
                {integration.id === 'github' && '🐙'}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {integration.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {integration.description}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {integration.connected && (
                  <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <Check size={16} />
                    接続済み
                  </span>
                )}

                <button
                  onClick={() => handleToggle(integration.id)}
                  className={`px-5 py-2 rounded-xl font-medium transition-all ${
                    integration.connected
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                  }`}
                >
                  {integration.connected ? (
                    <span className="flex items-center gap-1">
                      <X size={16} />
                      切断
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <ExternalLink size={16} />
                      連携する
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API設定セクション */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          API設定
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              APIキー
            </label>
            <div className="flex gap-3">
              <input
                type="password"
                value="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                readOnly
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
              />
              <button className="px-5 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                表示
              </button>
              <button className="px-5 py-3 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors">
                再生成
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            このAPIキーを使用して外部アプリケーションからクルクルにアクセスできます。
          </p>
        </div>
      </div>
    </div>
  );
}
