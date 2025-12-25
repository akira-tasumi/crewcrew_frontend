'use client';

import Image from 'next/image';

type CrewImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

/**
 * クルー画像表示コンポーネント
 * Base64データURIと通常のURLの両方に対応
 */
export default function CrewImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  priority,
}: CrewImageProps) {
  // Base64データURIかどうかを判定
  const isBase64 = src?.startsWith('data:');

  if (isBase64) {
    // Base64の場合は通常のimgタグを使用
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-contain ${className || ''}`}
        />
      );
    }
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  // 通常のURLの場合はNext.js Imageを使用
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 100}
      height={height || 100}
      className={className}
      priority={priority}
    />
  );
}
