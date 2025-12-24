/**
 * API Configuration
 *
 * 環境変数 NEXT_PUBLIC_API_URL からバックエンドのURLを取得
 * 未設定の場合はデフォルトで http://localhost:8000 を使用
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * APIエンドポイントのURLを生成する
 * @param path - APIパス（例: '/api/user'）
 * @returns 完全なURL
 */
export function apiUrl(path: string): string {
  // パスが / で始まらない場合は追加
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * fetchのラッパー関数（共通ヘッダーやエラーハンドリングを追加可能）
 * @param path - APIパス
 * @param options - fetch オプション
 * @returns fetch の Response
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = apiUrl(path);
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });
}
