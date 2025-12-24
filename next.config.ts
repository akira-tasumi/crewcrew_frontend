const nextConfig = {
  // SSRモード（Amplify Web Compute対応）
  // output: 'export' は削除してSSRを有効化

  // 画像最適化を無効化（外部画像のため）
  images: {
    unoptimized: true,
  },

  // TypeScriptエラーを無視（ビルド時）
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
