import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { GESTURE_DEFINITIONS } from '../data/defaultQuest';
import { CustomNoteContent, GestureId } from '../types';
import { GesturePoseIcon } from './GesturePoseIcon';

interface NoteCardProps {
  gestureId: GestureId;
  noteContent: CustomNoteContent;
  isUnlocked: boolean;
  isHolding: boolean;
  holdProgress: number;
  isJustUnlocked: boolean;
  onOpenNote: (gestureId: GestureId) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  gestureId,
  noteContent,
  isUnlocked,
  isHolding,
  holdProgress,
  isJustUnlocked,
  onOpenNote,
}) => {
  const def = GESTURE_DEFINITIONS[gestureId];

  if (!isUnlocked) {
    return (
      <div
        className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
          isHolding
            ? 'bg-white border-[#D45863]/55 shadow-[0_10px_30px_-12px_rgba(212,88,99,0.25)] -translate-y-0.5'
            : 'bg-[#F4F1EB]/75 hover:bg-[#F4F1EB] border-black/[0.07]'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono-tech text-[11px] text-[#8E8A82] tracking-wider">
              {def.order}
            </span>
            <span className="h-1 w-1 rounded-full bg-[#C9C4BB]" />
            <span className="text-xs font-medium text-[#52504C]">{def.gestureName}</span>
          </div>

          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
              isHolding
                ? 'bg-[#FCF1F2] border-[#D45863]/30 text-[#D45863]'
                : 'bg-white/70 border-black/[0.06] text-[#52504C]'
            }`}
          >
            <GesturePoseIcon gesture={gestureId} className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono-tech uppercase tracking-wider text-[#8E8A82]">
            <Lock className="w-3 h-3" />
            <span>{isHolding ? 'Unlocking note…' : 'Locked note'}</span>
          </div>
          <p className="text-xs text-[#686662] leading-relaxed">
            <span className="mr-1">{def.symbol}</span>
            {def.detailGuide}
          </p>
        </div>

        {/* Live Hold Progress Bar along bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/[0.04] overflow-hidden">
          <div
            className="h-full bg-[#D45863] transition-all duration-75"
            style={{ width: isHolding ? `${Math.round(holdProgress * 100)}%` : '0%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenNote(gestureId)}
      className={`group relative w-full text-left overflow-hidden rounded-2xl bg-white border p-5 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-14px_rgba(24,24,27,0.14)] ${
        isJustUnlocked
          ? 'border-[#D45863]/60 ring-2 ring-[#D45863]/15 animate-fade-up'
          : 'border-black/[0.08]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-2">
          <span className="font-mono-tech text-[11px] text-[#D45863] font-medium">
            {def.order}
          </span>
          <span className="text-sm leading-none">{def.symbol}</span>
          <span className="text-[11px] font-medium text-[#7A7771]">{def.gestureName}</span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-[#FCF1F2] px-2 py-0.5 text-[10px] font-medium text-[#C04954]">
          <Sparkles className="w-2.5 h-2.5" />
          Unlocked
        </span>
      </div>

      <h3 className="font-editorial text-2xl text-[#18181B] leading-snug mb-2 group-hover:text-[#B8434E] transition-colors">
        {noteContent.title}
      </h3>

      <p className="text-xs sm:text-[13px] text-[#575551] leading-relaxed line-clamp-3">
        {noteContent.message}
      </p>

      <div className="mt-3.5 pt-3 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#9A968F]">
        <span>Tap to read full card</span>
        <span className="group-hover:translate-x-0.5 transition-transform text-[#18181B]">→</span>
      </div>
    </button>
  );
};
