'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Gem,
  ShoppingBag,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Package,
  User,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useAppSound } from '@/contexts/SoundContext';
import { apiUrl } from '@/lib/api';

type GadgetItem = {
  id: number;
  name: string;
  description: string;
  icon: string;
  effect_type: string;
  base_effect_value: number;
  price: number;
  is_owned: boolean;
  equipped_by: string | null;
};

type PersonalityItem = {
  id: number;
  personality_key: string;
  name: string;
  description: string;
  emoji: string;
  ruby_price: number;
  is_owned: boolean;
};

type ShopData = {
  gadgets: GadgetItem[];
  personalities: PersonalityItem[];
  user_coin: number;
  user_ruby: number;
};

type ToastType = 'success' | 'error';

export default function ShopPage() {
  const { apiUser, updateCoin, updateRuby, refreshApiUser } = useUser();
  const { playSound } = useAppSound();

  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [activeTab, setActiveTab] = useState<'gadgets' | 'personalities'>('gadgets');

  // ショップデータ取得
  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const res = await fetch(apiUrl('/api/shop/items'));
      if (res.ok) {
        const data = await res.json();
        setShopData(data);
      }
    } catch (error) {
      console.error('Failed to fetch shop data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // トースト表示
  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ガジェット購入
  const handlePurchaseGadget = async (gadget: GadgetItem) => {
    if (gadget.is_owned || (shopData && shopData.user_coin < gadget.price)) return;

    setPurchasingId(`gadget-${gadget.id}`);
    playSound('click');

    try {
      const res = await fetch(apiUrl(`/api/shop/purchase/gadget/${gadget.id}`), {
        method: 'POST',
      });
      const result = await res.json();

      if (result.success) {
        playSound('coin');
        showToast(result.message, 'success');
        // コイン更新
        if (result.new_coin !== null) {
          updateCoin(result.new_coin);
        }
        // ショップデータ再取得
        await fetchShopData();
        await refreshApiUser();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      showToast('購入に失敗しました', 'error');
    } finally {
      setPurchasingId(null);
    }
  };

  // 性格購入
  const handlePurchasePersonality = async (personality: PersonalityItem) => {
    if (personality.is_owned || (shopData && shopData.user_ruby < personality.ruby_price)) return;

    setPurchasingId(`personality-${personality.id}`);
    playSound('click');

    try {
      const res = await fetch(apiUrl(`/api/shop/purchase/personality/${personality.id}`), {
        method: 'POST',
      });
      const result = await res.json();

      if (result.success) {
        playSound('coin');
        showToast(result.message, 'success');
        // ルビー更新
        if (result.new_ruby !== null) {
          updateRuby(result.new_ruby);
        }
        // ショップデータ再取得
        await fetchShopData();
        await refreshApiUser();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      showToast('購入に失敗しました', 'error');
    } finally {
      setPurchasingId(null);
    }
  };

  // エフェクトタイプのラベル
  const getEffectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      Intelligence: '知性',
      Creative: '創造性',
      Communication: 'コミュ力',
      Execution: '実行力',
    };
    return labels[type] || type;
  };

  // エフェクトタイプの色
  const getEffectTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Intelligence: 'from-blue-400 to-blue-600',
      Creative: 'from-purple-400 to-purple-600',
      Communication: 'from-green-400 to-green-600',
      Execution: 'from-orange-400 to-orange-600',
    };
    return colors[type] || 'from-gray-400 to-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={48} className="animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* ヘッダー */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">ショップ</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">ガジェットや性格を購入しよう</p>
            </div>
          </div>

          {/* 所持通貨 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-400/20 dark:bg-yellow-400/10 px-4 py-2 rounded-xl">
              <Coins size={20} className="text-yellow-500" />
              <span className="font-bold text-yellow-700 dark:text-yellow-400 text-lg">
                {shopData?.user_coin.toLocaleString() || apiUser?.coin.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-pink-400/20 dark:bg-pink-400/10 px-4 py-2 rounded-xl">
              <Gem size={20} className="text-pink-500" />
              <span className="font-bold text-pink-700 dark:text-pink-400 text-lg">
                {shopData?.user_ruby || apiUser?.ruby || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-md w-fit">
          <button
            onClick={() => {
              setActiveTab('gadgets');
              playSound('click');
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'gadgets'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Package size={18} />
            ガジェット
          </button>
          <button
            onClick={() => {
              setActiveTab('personalities');
              playSound('click');
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'personalities'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Sparkles size={18} />
            特殊性格
          </button>
        </div>
      </div>

      {/* ガジェット一覧 */}
      <AnimatePresence mode="wait">
        {activeTab === 'gadgets' && (
          <motion.div
            key="gadgets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shopData?.gadgets.map((gadget) => {
                const isPurchasing = purchasingId === `gadget-${gadget.id}`;
                const canAfford = (shopData?.user_coin || 0) >= gadget.price;

                return (
                  <motion.div
                    key={gadget.id}
                    whileHover={{ scale: 1.02 }}
                    className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 transition-all flex flex-col h-full ${
                      gadget.is_owned
                        ? 'border-green-400 dark:border-green-500'
                        : 'border-transparent hover:border-purple-300 dark:hover:border-purple-600'
                    }`}
                  >
                    {/* アイコンと名前 */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-4xl">{gadget.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">{gadget.name}</h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getEffectTypeColor(
                            gadget.effect_type
                          )}`}
                        >
                          {getEffectTypeLabel(gadget.effect_type)} +{gadget.base_effect_value}
                        </span>
                      </div>
                    </div>

                    {/* 説明 */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-1">
                      {gadget.description}
                    </p>

                    {/* 装備中表示 */}
                    {gadget.equipped_by && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-2">
                        <User size={12} />
                        {gadget.equipped_by}が装備中
                      </div>
                    )}

                    {/* 購入ボタン */}
                    {gadget.is_owned ? (
                      <div className="flex items-center justify-center gap-2 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 font-medium">
                        <Check size={18} />
                        購入済み
                      </div>
                    ) : (
                      <motion.button
                        onClick={() => handlePurchaseGadget(gadget)}
                        disabled={!canAfford || isPurchasing}
                        whileHover={canAfford && !isPurchasing ? { scale: 1.02 } : {}}
                        whileTap={canAfford && !isPurchasing ? { scale: 0.98 } : {}}
                        className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                          canAfford
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md hover:shadow-lg'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isPurchasing ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Coins size={18} />
                            {gadget.price.toLocaleString()}
                          </>
                        )}
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 性格一覧 */}
        {activeTab === 'personalities' && (
          <motion.div
            key="personalities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto"
          >
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 dark:from-pink-500/5 dark:to-purple-500/5 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Gem size={16} className="text-pink-500" />
                特殊性格はルビーで購入できます。購入した性格はクルー作成時に選択可能になります。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shopData?.personalities.map((personality) => {
                const isPurchasing = purchasingId === `personality-${personality.id}`;
                const canAfford = (shopData?.user_ruby || 0) >= personality.ruby_price;

                return (
                  <motion.div
                    key={personality.id}
                    whileHover={{ scale: 1.02 }}
                    className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 transition-all flex flex-col h-full ${
                      personality.is_owned
                        ? 'border-green-400 dark:border-green-500'
                        : 'border-transparent hover:border-pink-300 dark:hover:border-pink-600'
                    }`}
                  >
                    {/* 絵文字と名前 */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-4xl">{personality.emoji}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">{personality.name}</h3>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-pink-400 to-purple-400 text-white">
                          特殊性格
                        </span>
                      </div>
                    </div>

                    {/* 説明 */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-1">
                      {personality.description}
                    </p>

                    {/* 購入ボタン */}
                    {personality.is_owned ? (
                      <div className="flex items-center justify-center gap-2 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 font-medium">
                        <Check size={18} />
                        アンロック済み
                      </div>
                    ) : (
                      <motion.button
                        onClick={() => handlePurchasePersonality(personality)}
                        disabled={!canAfford || isPurchasing}
                        whileHover={canAfford && !isPurchasing ? { scale: 1.02 } : {}}
                        whileTap={canAfford && !isPurchasing ? { scale: 0.98 } : {}}
                        className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                          canAfford
                            ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md hover:shadow-lg'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isPurchasing ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Gem size={18} />
                            {personality.ruby_price}
                          </>
                        )}
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* トースト通知 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <Check size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
