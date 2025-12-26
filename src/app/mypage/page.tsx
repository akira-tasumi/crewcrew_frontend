'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Building2,
  Briefcase,
  Camera,
  Save,
  LogOut,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useAppSound } from '@/contexts/SoundContext';
import { apiUrl } from '@/lib/api';

type ToastType = 'success' | 'error';

export default function MyPage() {
  const router = useRouter();
  const { apiUser, refreshApiUser, logout } = useUser();
  const { playSound } = useAppSound();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // フォーム状態
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarData, setAvatarData] = useState<string | null>(null);

  // UI状態
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 初期値を設定
  useEffect(() => {
    if (apiUser) {
      setCompanyName(apiUser.company_name || '');
      setUserName(apiUser.user_name || '');
      setJobTitle(apiUser.job_title || '');
      if (apiUser.avatar_data) {
        setAvatarPreview(apiUser.avatar_data);
        setAvatarData(apiUser.avatar_data);
      }
    }
  }, [apiUser]);

  // トースト表示
  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 画像リサイズ関数（最大500x500）
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 500;
          let width = img.width;
          let height = img.height;

          // アスペクト比を維持してリサイズ
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // JPEG形式で圧縮（品質0.8）
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // アバター選択ハンドラ
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
    playSound('click');
  };

  // ファイル選択時
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      showToast('画像ファイルを選択してください', 'error');
      return;
    }

    try {
      const resizedDataUrl = await resizeImage(file);
      setAvatarPreview(resizedDataUrl);
      setAvatarData(resizedDataUrl);
      playSound('confirm');
    } catch (error) {
      console.error('Failed to resize image:', error);
      showToast('画像の処理に失敗しました', 'error');
    }
  };

  // 保存ハンドラ
  const handleSave = async () => {
    if (!companyName.trim()) {
      showToast('会社名を入力してください', 'error');
      return;
    }

    setIsSaving(true);
    playSound('click');

    try {
      const response = await fetch(apiUrl('/api/users/me'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          user_name: userName.trim() || null,
          job_title: jobTitle.trim() || null,
          avatar_data: avatarData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // UserContextを更新
      await refreshApiUser();

      playSound('coin');
      showToast('プロフィールを保存しました', 'success');
    } catch (error) {
      console.error('Failed to save profile:', error);
      showToast('保存に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ログアウトハンドラ
  const handleLogout = () => {
    playSound('click');
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* ヘッダー */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => {
              playSound('click');
              router.back();
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            プロフィール設定
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* アバターセクション */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-col items-center">
            <motion.button
              onClick={handleAvatarClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 shadow-xl group"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={48} className="text-white" />
                </div>
              )}
              {/* ホバーオーバーレイ */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            </motion.button>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              クリックしてアバターを変更
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* 入力フォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6 space-y-6">
          {/* 会社名 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building2 size={16} />
              会社名
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="例: 株式会社CrewCrew"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 担当者名 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User size={16} />
              担当者名
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="例: 山田 太郎"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 役職 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Briefcase size={16} />
              役職
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="例: マーケティング部長"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* 保存ボタン */}
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileHover={!isSaving ? { scale: 1.02 } : {}}
          whileTap={!isSaving ? { scale: 0.98 } : {}}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-70 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all mb-6"
        >
          {isSaving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save size={20} />
              保存する
            </>
          )}
        </motion.button>

        {/* ログアウトボタン */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all"
        >
          <LogOut size={20} />
          ログアウト
        </motion.button>
      </div>

      {/* トースト通知 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
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
