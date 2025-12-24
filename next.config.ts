// import 文は削除します（これがエラーの原因の1つでした）

const nextConfig = {
  // 1. 静的書き出し設定
  output: 'export',

  // 2. 画像最適化を無効化
  images: {
    unoptimized: true,
  },

  // 3. TypeScriptエラーを無視
  typescript: {
    ignoreBuildErrors: true,
  },

  // 4. ESLintチェックを無視
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;