'use client';

import { useEffect, useState } from 'react';
import { Check, X, ExternalLink, Loader2 } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';

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
    description: 'Googleスライド、ドライブと連携',
    icon: '/images/integrations/google.png',
    connected: false, // 実際の認証状態を使用
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
  const { data: session, status: sessionStatus } = useSession();

  // Google連携状態を反映
  const isGoogleConnected = !!session?.accessToken;

  useEffect(() => {
    // TODO: FastAPI から取得
    // fetch('http://localhost:8000/api/integrations')
    setTimeout(() => {
      setIntegrations(DUMMY_INTEGRATIONS);
      setLoading(false);
    }, 500);
  }, []);

  const handleToggle = (id: string) => {
    // Google Workspaceの場合は実際の認証を使用
    if (id === 'google') {
      if (isGoogleConnected) {
        signOut({ redirect: false });
      } else {
        signIn('google');
      }
      return;
    }

    // その他のサービスはダミー
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
          {integrations.map((integration) => {
            // Google Workspaceは実際の認証状態を使用
            const isConnected = integration.id === 'google'
              ? isGoogleConnected
              : integration.connected;
            const isGoogleLoading = integration.id === 'google' && sessionStatus === 'loading';

            return (
              <div
                key={integration.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center gap-6"
              >
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl">
                  {integration.id === 'slack' && '💬'}
                  {integration.id === 'notion' && '📝'}
                  {integration.id === 'google' && (
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {integration.id === 'github' && '🐙'}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {integration.description}
                  </p>
                  {/* Google連携時はユーザー情報を表示 */}
                  {integration.id === 'google' && isConnected && session?.user && (
                    <div className="flex items-center gap-2 mt-2">
                      {session.user.image && (
                        <img
                          src={session.user.image}
                          alt={session.user.name ?? ''}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {session.user.email}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {isGoogleLoading ? (
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  ) : (
                    <>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                          <Check size={16} />
                          接続済み
                        </span>
                      )}

                      <button
                        onClick={() => handleToggle(integration.id)}
                        className={`px-5 py-2 rounded-xl font-medium transition-all ${
                          isConnected
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                        }`}
                      >
                        {isConnected ? (
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
                    </>
                  )}
                </div>
              </div>
            );
          })}
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
