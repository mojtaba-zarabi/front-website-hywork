'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PostSliderProps {
  images: string[];
  postTitle: string;
}

export default function PostSlider({ images, postTitle }: PostSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]">
        تصویری وجود ندارد
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={images[currentIndex]}
        alt={`${postTitle} - تصویر ${currentIndex + 1}`}
        fill
        sizes="(max-width: 768px) 100vw, 47vw"
        unoptimized
        className="w-full h-full object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full border-none cursor-pointer transition-all ${
                  index === currentIndex
                    ? 'bg-white w-4'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
