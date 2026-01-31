'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { Memory } from '@/lib/types';

const topicStyles: Record<string, string> = {
  research: 'bg-[rgba(163,177,138,0.15)] text-sage',
  strategy: 'bg-[rgba(201,169,110,0.15)] text-gold',
  personal: 'bg-[rgba(45,42,38,0.08)] text-charcoal',
  project: 'bg-[rgba(124,100,255,0.1)] text-[#6C63FF]',
};

interface BottomSheetProps {
  open: boolean;
  memory: Memory | null;
  onClose: () => void;
  onDelete: (id: number) => void;
}

export function BottomSheet({ open, memory, onClose, onDelete }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dragStartY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    if (open) {
      setConfirmDelete(false);
      setCopied(false);
    }
  }, [open, memory]);

  useEffect(() => {
    if (backdropRef.current) {
      gsap.to(backdropRef.current, {
        opacity: open ? 1 : 0,
        duration: 0.25,
        ease: 'power2.out',
        onComplete: () => {
          if (!open && backdropRef.current) {
            backdropRef.current.style.pointerEvents = 'none';
          }
        },
        onStart: () => {
          if (open && backdropRef.current) {
            backdropRef.current.style.pointerEvents = 'auto';
          }
        },
      });
    }

    if (sheetRef.current) {
      // Desktop: slide from right; Mobile: slide from bottom
      const isDesktop = window.innerWidth >= 640;
      if (isDesktop) {
        gsap.to(sheetRef.current, {
          x: open ? '0%' : '100%',
          duration: 0.35,
          ease: 'power3.out',
        });
      } else {
        gsap.to(sheetRef.current, {
          y: open ? '0%' : '100%',
          duration: 0.35,
          ease: 'power3.out',
        });
      }
    }
  }, [open]);

  const handleCopy = useCallback(() => {
    if (!memory) return;
    const plain = memory.title + '\n\n' + memory.body.replace(/<[^>]+>/g, '');
    navigator.clipboard.writeText(plain).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [memory]);

  const handleConfirmDelete = () => {
    setConfirmDelete(true);
  };

  const handleDelete = () => {
    if (memory) onDelete(memory.id);
    setConfirmDelete(false);
  };

  // Drag to dismiss (mobile)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragging.current = true;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translate(-50%, ${dy}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      const dy = e.changedTouches[0].clientY - dragStartY.current;
      if (sheetRef.current) sheetRef.current.style.transition = '';
      if (dy > 100) {
        onClose();
      } else if (sheetRef.current) {
        gsap.to(sheetRef.current, { y: 0, duration: 0.25, ease: 'power3.out' });
      }
    },
    [onClose]
  );

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-[250] opacity-0 pointer-events-none"
        style={{
          background: 'rgba(45,42,38,0.4)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed z-[260] bg-app-white flex flex-col shadow-[0_-8px_40px_rgba(0,0,0,0.12)]
          bottom-0 left-1/2 w-full max-w-[600px] h-[85dvh] rounded-t-[20px]
          sm:left-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[380px] sm:max-w-[65%] sm:h-full sm:rounded-none sm:shadow-[-8px_0_40px_rgba(0,0,0,0.12)]"
        style={{
          touchAction: 'none',
        }}
      >
        {/* Handle (mobile only) */}
        <div
          className="flex items-center justify-center pt-2.5 pb-0.5 cursor-grab shrink-0 sm:hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-9 h-1 rounded-sm bg-stone" />
        </div>

        {/* Header */}
        <div className="py-2.5 px-5 flex items-center justify-between border-b border-app-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="font-heading text-lg text-dark">Memory</div>
          </div>
          <div className="flex items-center gap-0.5">
            {/* Copy button */}
            <button
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-[120ms] ${
                copied ? 'text-sage' : 'text-muted hover:bg-cream hover:text-dark active:scale-[0.88] active:bg-stone'
              }`}
              onClick={handleCopy}
              title="Copy"
            >
              {copied ? (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </button>

            {/* Delete button */}
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#D14] transition-all duration-[120ms] hover:bg-[rgba(221,17,68,0.06)] active:scale-[0.88]"
              onClick={handleConfirmDelete}
              title="Delete"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>

            {/* Close button */}
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center text-base text-muted transition-all duration-100 hover:bg-cream hover:text-dark active:scale-90"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 px-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {confirmDelete ? (
            <div className="text-center py-5">
              <div className="text-[32px] mb-3">🗑</div>
              <div className="font-heading text-xl text-dark mb-1.5">Delete this memory?</div>
              <div className="text-[13.5px] text-muted mb-5">This can&apos;t be undone.</div>
              <div className="flex gap-2.5 max-w-[260px] mx-auto">
                <button
                  className="flex-1 py-3 rounded-[10px] bg-cream text-dark text-sm font-semibold transition-all hover:bg-stone"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3 rounded-[10px] bg-[#D14] text-white text-sm font-semibold transition-all active:scale-[0.96]"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : memory ? (
            <>
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-[0.8px] py-1 px-2.5 rounded-md mb-3 ${
                  topicStyles[memory.topic] ?? 'bg-cream text-muted'
                }`}
              >
                {memory.topicLabel}
              </span>
              <div className="text-lg font-bold text-dark leading-snug mb-2">
                {memory.title}
              </div>
              <div
                className="text-[14.5px] text-muted leading-[1.7] [&_strong]:text-dark [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: memory.body }}
              />
              <div className="mt-4 pt-3.5 border-t border-app-border flex items-center gap-1.5 text-xs text-muted-light">
                💬 From {memory.source} · {memory.date}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
