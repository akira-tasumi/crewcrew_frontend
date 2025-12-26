'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Image, FileText, Sparkles, Loader2 } from 'lucide-react';
import CrewImage from './CrewImage';

// メッセージの型定義
type MessageRole = 'crew' | 'user';
type MessageStatus = 'sent' | 'thinking' | 'generating' | 'completed';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  timestamp: Date;
  resultType?: 'text' | 'image'; // 生成結果のタイプ
  resultUrl?: string; // 画像URLなど
}

// クルーデータの型
interface CrewData {
  id: number;
  name: string;
  role: string;
  level: number;
  image: string;
}

// 役割別の挨拶メッセージ
const ROLE_GREETINGS: Record<string, string> = {
  'デザイナー': 'デザインの依頼ですね！どんな画像を作りますか？',
  'ライター': '執筆はお任せを。テーマを教えてください。',
  'エンジニア': '開発タスクですか？何を作りましょうか？',
  'リサーチャー': '調査ですね。何について調べますか？',
  'マーケター': 'マーケティング関連ですか？どんな分析をしましょう？',
  'アナリスト': 'データ分析ですね。どのデータを見ましょうか？',
  'プランナー': '企画立案ですか？どんな計画を立てましょう？',
  'コンサルタント': '相談ですね。何についてアドバイスしましょうか？',
};

// デフォルトの挨拶
const DEFAULT_GREETING = 'お仕事の依頼ですね！何をお手伝いしましょうか？';

// 役割別のダミー返答（思考後の応答）
const ROLE_RESPONSES: Record<string, string[]> = {
  'デザイナー': [
    '素敵なデザインが完成しました！ご確認ください。',
    'イメージ通りに仕上がりました。いかがでしょうか？',
    'クリエイティブな作品ができましたよ！',
  ],
  'ライター': [
    '記事を書き上げました。ご確認ください。',
    '読みやすい文章に仕上げました！',
    'コンテンツが完成しました。どうぞ！',
  ],
  'エンジニア': [
    'コードを実装しました。動作確認してください。',
    '実装完了です！テストもパスしています。',
    'プログラムが完成しました。',
  ],
  'リサーチャー': [
    '調査結果をまとめました。こちらをご覧ください。',
    'リサーチ完了です！興味深い発見がありました。',
    '分析レポートを作成しました。',
  ],
  'マーケター': [
    'マーケティング分析が完了しました！',
    '戦略レポートをまとめました。',
    'トレンド分析の結果です。',
  ],
  'アナリスト': [
    'データ分析が完了しました。',
    '分析レポートを作成しました。',
    '数値データをまとめました。',
  ],
  'プランナー': [
    '企画書を作成しました！',
    '計画案が完成しました。',
    'プロジェクト計画をまとめました。',
  ],
  'コンサルタント': [
    'アドバイスをまとめました。',
    '提案書を作成しました。',
    'コンサルティングレポートです。',
  ],
};

const DEFAULT_RESPONSES = [
  'タスクが完了しました！',
  '作業が終わりました。ご確認ください。',
  '完了です！いかがでしょうか？',
];

// 思考中のメッセージ
const THINKING_MESSAGES = [
  '考え中...',
  '分析中...',
  '処理中...',
];

// 生成中のメッセージ
const GENERATING_MESSAGES = [
  '生成中...',
  '作成中...',
  '出力中...',
];

interface TaskChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  crew: CrewData | null;
  onTaskComplete?: (result: string) => void;
}

export default function TaskChatModal({
  isOpen,
  onClose,
  crew,
  onTaskComplete,
}: TaskChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // メッセージ追加のヘルパー
  const addMessage = useCallback((
    role: MessageRole,
    content: string,
    status: MessageStatus = 'sent',
    resultType?: 'text' | 'image'
  ) => {
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      status,
      timestamp: new Date(),
      resultType,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  // メッセージ更新のヘルパー
  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  // モーダルが開いたときに挨拶メッセージを追加
  useEffect(() => {
    if (isOpen && crew) {
      // メッセージをリセット
      setMessages([]);
      setInputValue('');

      // 少し遅延してから挨拶メッセージを表示
      const timer = setTimeout(() => {
        const greeting = ROLE_GREETINGS[crew.role] || DEFAULT_GREETING;
        addMessage('crew', greeting);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, crew, addMessage]);

  // メッセージが追加されたらスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 入力フォーカス
  useEffect(() => {
    if (isOpen && !isProcessing) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isProcessing]);

  // メッセージ送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing || !crew) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    // ユーザーメッセージを追加
    addMessage('user', userMessage);

    // 少し待ってからクルーの思考を開始
    await new Promise(resolve => setTimeout(resolve, 500));

    // 思考中メッセージを追加
    const thinkingMsg = THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)];
    const thinkingId = addMessage('crew', thinkingMsg, 'thinking');

    // 1.5秒思考
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 生成中に切り替え
    const generatingMsg = GENERATING_MESSAGES[Math.floor(Math.random() * GENERATING_MESSAGES.length)];
    updateMessage(thinkingId, { content: generatingMsg, status: 'generating' });

    // 2秒生成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 完了メッセージに切り替え
    const responses = ROLE_RESPONSES[crew.role] || DEFAULT_RESPONSES;
    const response = responses[Math.floor(Math.random() * responses.length)];

    // デザイナーの場合は画像結果を返す可能性がある
    const isDesigner = crew.role === 'デザイナー';
    const resultType: 'text' | 'image' = isDesigner && Math.random() > 0.3 ? 'image' : 'text';

    updateMessage(thinkingId, {
      content: response,
      status: 'completed',
      resultType,
    });

    setIsProcessing(false);

    // タスク完了コールバック
    onTaskComplete?.(response);
  };

  if (!crew) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* モーダル */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:h-[600px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl shadow-2xl border border-white/10 z-50 flex flex-col overflow-hidden"
          >
            {/* ヘッダー */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/30 to-pink-600/30">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 bg-white/10">
                  <CrewImage
                    src={crew.image}
                    alt={crew.name}
                    width={48}
                    height={48}
                    className="object-cover scale-150 translate-y-1"
                  />
                </div>
                {/* オンラインインジケーター */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">{crew.name}</h2>
                <p className="text-sm text-gray-400">{crew.role} • Lv.{crew.level}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* メッセージエリア */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'crew' && (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 mr-2 flex-shrink-0 bg-white/5">
                        <CrewImage
                          src={crew.image}
                          alt={crew.name}
                          width={32}
                          height={32}
                          className="object-cover scale-150 translate-y-0.5"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-white/10 text-gray-100'
                      }`}
                    >
                      {/* 思考中・生成中のアニメーション */}
                      {(message.status === 'thinking' || message.status === 'generating') ? (
                        <div className="flex items-center gap-2">
                          {message.status === 'thinking' ? (
                            <Sparkles size={16} className="text-purple-400 animate-pulse" />
                          ) : (
                            <Loader2 size={16} className="text-pink-400 animate-spin" />
                          )}
                          <span className="text-sm">{message.content}</span>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 bg-current rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  delay: i * 0.2,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm leading-relaxed">{message.content}</p>

                          {/* 結果タイプに応じたアイコン表示 */}
                          {message.status === 'completed' && message.resultType && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                {message.resultType === 'image' ? (
                                  <>
                                    <Image size={14} className="text-pink-400" />
                                    <span>画像を生成しました</span>
                                  </>
                                ) : (
                                  <>
                                    <FileText size={14} className="text-purple-400" />
                                    <span>テキストを生成しました</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* 入力エリア */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-white/10 bg-black/20"
            >
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    // 自動高さ調整
                    const textarea = e.target;
                    textarea.style.height = 'auto';
                    const newHeight = Math.min(textarea.scrollHeight, 128);
                    textarea.style.height = `${newHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.ctrlKey || e.shiftKey) {
                        // Ctrl+Enter or Shift+Enter: 改行を挿入
                        // デフォルト動作（改行）を許可
                        return;
                      } else {
                        // Enter only: 送信
                        e.preventDefault();
                        if (inputValue.trim() && !isProcessing) {
                          handleSubmit(e as unknown as React.FormEvent);
                        }
                      }
                    }
                  }}
                  placeholder={isProcessing ? '処理中...' : 'タスクを入力... (Ctrl+Enterで改行)'}
                  disabled={isProcessing}
                  rows={1}
                  style={{ minHeight: '44px' }}
                  className="flex-1 bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 resize-none overflow-y-auto"
                />
                <motion.button
                  type="submit"
                  disabled={!inputValue.trim() || isProcessing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {isProcessing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
