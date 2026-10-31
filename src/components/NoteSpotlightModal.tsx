import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { GESTURE_DEFINITIONS, GESTURE_ORDER } from '../data/defaultQuest';
import { CustomNoteContent, GestureId } from '../types';
import { GesturePoseIcon } from './GesturePoseIcon';

interface NoteSpotlightModalProps {
  gestureId: GestureId | null;
  noteContent: CustomNoteContent | null;
  recipientName: string;
  senderName: string;
  unlockedCount: number;
  unlocked: GestureId[];
  onClose: () => void;
  onOpenFinalLetter: () => void;
}

export const NoteSpotlightModal: React.FC<NoteSpotlightModalProps> = ({
  gestureId,
  noteContent,
  recipientName,
  senderName,
  unlockedCount,
  unlocked,
  onClose,
  onOpenFinalLetter,
}) => {
  useEffect(() => {
    if (!gestureId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gestureId, onClose]);

  if (!gestureId || !noteContent) return null;

  const def = GESTURE_DEFINITIONS[gestureId];
  const nextLocked = GESTURE_ORDER.find((id) => !unlocked.includes(id)) ?? null;
  const allComplete = unlockedCount >= GESTURE_ORDER.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[26px] bg-[#FCFBF9] border border-black/10 p-7 sm:p-9 shadow-[0_28px_70px_-16px_rgba(24,24,27,0.3)] animate-letter-unfold"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close note"
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#52504C] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCF1F2] text-[#D45863] border border-[#D45863]/20">
            <GesturePoseIcon gesture={gestureId} className="w-5 h-5" />
          </div>
          <div>
            <div className="font-mono-tech text-[11px] uppercase tracking-wider text-[#D45863]">
              Note {def.order} · {def.symbol} {def.gestureName}
            </div>
            <div className="text-xs text-[#8E8A82]">For {recipientName}</div>
          </div>
        </div>

        <h3 className="font-editorial text-3xl sm:text-[34px] text-[#18181B] leading-tight mb-4">
          {noteContent.title}
        </h3>

        <p className="text-[15px] text-[#3F3D3A] leading-[1.75] whitespace-pre-line mb-7">
          {noteContent.message}
        </p>

        <div className="pt-5 border-t border-black/[0.07] flex items-center justify-between gap-3">
          <span className="font-editorial italic text-lg text-[#686662]">
            — {senderName}
          </span>

          {allComplete ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFinalLetter();
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#D45863] hover:bg-[#c04853] px-4 py-2 text-xs font-medium text-white transition cursor-pointer"
            >
              <span>Open Final Letter ♥</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#18181B] hover:bg-[#2c2c31] px-4 py-2 text-xs font-medium text-[#FAF8F5] transition cursor-pointer"
            >
              <span>
                {nextLocked
                  ? `Next: ${GESTURE_DEFINITIONS[nextLocked].symbol} ${GESTURE_DEFINITIONS[nextLocked].gestureName}`
                  : 'Continue'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
