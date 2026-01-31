'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface PreviewOverlayProps {
  open: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export function PreviewOverlay({ open, title, content, onClose }: PreviewOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (overlayRef.current && cardRef.current) {
      if (open) {
        overlayRef.current.style.display = 'flex';
        gsap.to(overlayRef.current, { opacity: 1, duration: 0.25 });
        gsap.fromTo(
          cardRef.current,
          { y: 20, scale: 0.97 },
          { y: 0, scale: 1, duration: 0.3, ease: 'power3.out' }
        );
      } else {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.25,
          onComplete: () => {
            if (overlayRef.current) overlayRef.current.style.display = 'none';
          },
        });
      }
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[300] items-center justify-center p-6 hidden opacity-0"
      style={{
        background: 'rgba(45,42,38,0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        className="bg-app-white rounded-[16px] max-w-[560px] w-full max-h-[80vh] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.15)]"
      >
        <div className="py-4.5 px-6 border-b border-app-border flex justify-between items-center sticky top-0 bg-app-white z-[1] rounded-t-[16px]">
          <div className="font-heading text-[17px] text-dark">{title}</div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg text-muted transition-all duration-100 hover:bg-cream hover:text-dark active:scale-90 active:bg-stone"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div
          className="p-6"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
