"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import useSound from "use-sound";

// 効果音の種類
export type SoundType =
  | "click"        // ボタンクリック
  | "success"      // タスク完了、成功
  | "levelUp"      // レベルアップ
  | "scout"        // スカウト演出
  | "cardFlip"     // カードめくり
  | "coin"         // コイン獲得
  | "error"        // エラー
  | "confirm"      // 確認
  | "select"       // 選択
  | "typing"       // タイピング演出
  | "drumroll"     // ドラムロール風
  | "celebrate";   // 祝福

// 音源ファイルのマッピング
const SOUND_FILES: Record<SoundType, string> = {
  click: "/sounds/click.mp3",
  success: "/sounds/success.mp3",
  levelUp: "/sounds/levelup.mp3",
  scout: "/sounds/scout.mp3",
  cardFlip: "/sounds/card_flip.mp3",
  coin: "/sounds/coin.mp3",
  error: "/sounds/error.mp3",
  confirm: "/sounds/confirm.mp3",
  select: "/sounds/select.mp3",
  typing: "/sounds/typing.mp3",
  drumroll: "/sounds/drumroll.mp3",
  celebrate: "/sounds/celebrate.mp3",
};

// デフォルトの音量（0.0 〜 1.0）- 業務アプリなので控えめに
const DEFAULT_VOLUME = 0.3;

type SoundContextType = {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  playSound: (type: SoundType) => void;
  volume: number;
  setVolume: (vol: number) => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(true); // デフォルトはミュート
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  // 各効果音のフック
  const [playClick] = useSound(SOUND_FILES.click, { volume, soundEnabled: !isMuted });
  const [playSuccess] = useSound(SOUND_FILES.success, { volume, soundEnabled: !isMuted });
  const [playLevelUp] = useSound(SOUND_FILES.levelUp, { volume, soundEnabled: !isMuted });
  const [playScout] = useSound(SOUND_FILES.scout, { volume, soundEnabled: !isMuted });
  const [playCardFlip] = useSound(SOUND_FILES.cardFlip, { volume, soundEnabled: !isMuted });
  const [playCoin] = useSound(SOUND_FILES.coin, { volume, soundEnabled: !isMuted });
  const [playError] = useSound(SOUND_FILES.error, { volume, soundEnabled: !isMuted });
  const [playConfirm] = useSound(SOUND_FILES.confirm, { volume, soundEnabled: !isMuted });
  const [playSelect] = useSound(SOUND_FILES.select, { volume, soundEnabled: !isMuted });
  const [playTyping] = useSound(SOUND_FILES.typing, { volume: volume * 0.5, soundEnabled: !isMuted }); // 他の音より控えめに
  const [playDrumroll] = useSound(SOUND_FILES.drumroll, { volume, soundEnabled: !isMuted });
  const [playCelebrate] = useSound(SOUND_FILES.celebrate, { volume, soundEnabled: !isMuted });

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (isMuted) return;

      switch (type) {
        case "click":
          playClick();
          break;
        case "success":
          playSuccess();
          break;
        case "levelUp":
          playLevelUp();
          break;
        case "scout":
          playScout();
          break;
        case "cardFlip":
          playCardFlip();
          break;
        case "coin":
          playCoin();
          break;
        case "error":
          playError();
          break;
        case "confirm":
          playConfirm();
          break;
        case "select":
          playSelect();
          break;
        case "typing":
          playTyping();
          break;
        case "drumroll":
          playDrumroll();
          break;
        case "celebrate":
          playCelebrate();
          break;
      }
    },
    [
      isMuted,
      playClick,
      playSuccess,
      playLevelUp,
      playScout,
      playCardFlip,
      playCoin,
      playError,
      playConfirm,
      playSelect,
      playTyping,
      playDrumroll,
      playCelebrate,
    ]
  );

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        setMuted,
        toggleMute,
        playSound,
        volume,
        setVolume,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useAppSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useAppSound must be used within a SoundProvider");
  }
  return context;
}
