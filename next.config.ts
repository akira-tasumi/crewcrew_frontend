import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 1. 静的書き出しモードを有効化 (これで out フォルダが作られます)
  output: 'export',

  // 2. 画像最適化サーバーを無効化 (Amplifyの静的ホスティングでエラーにならないようにする)
  images: {
    unoptimized: true,
  },

  // 元々あった設定は残しておきます
  reactCompiler: true,
};

export default nextConfig;