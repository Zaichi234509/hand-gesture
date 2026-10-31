import React, { useEffect } from 'react';
import { Heart, Lock, MailOpen, Volume2, X } from 'lucide-react';
import { GESTURE_ORDER } from '../data/defaultQuest';
import { GestureId, QuestConfig } from '../types';
import { soundEngine } from '../utils/sound';

interface FinalLetterSectionProps {
  config: QuestConfig;
  unlocked: GestureId[];
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export const FinalLetterSection: React.FC<FinalLetterSectionProps> = ({
  config,
  unlocked,
  isModalOpen,
  onOpenModal,
  onCloseModal,
}) => {
  const total = GESTURE_ORDER.length;
  const count = unlocked.length;
  const isComplete = count >= total;

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isModalOpen, onCloseModal]);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-[24px] border p-6 sm:p-8 transition-all duration-500 ${
          isComplete
            ? 'bg-white border-[#D45863]/35 shadow-[0_20px_50px_-20px_rgba(212,88,99,0.22)]'
            : 'bg-[#F4F1EB]/80 border-black/[0.07]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                isComplete
                  ? 'bg-[#FCF1F2] border-[#D45863]/25 text-[#D45863]'
                  : 'bg-white/75 border-black/[0.06] text-[#8E8A82]'
              }`}
            >
              {isComplete ? <MailOpen className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[#8E8A82]">
                  {isComplete ? 'All 6 Signs Unlocked' : `Final Envelope · ${count} of ${total} Found`}
                </span>
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#18181B]">
                {isComplete ? config.finalLetterTitle : 'A Secret Letter Waiting at the End'}
              </h3>
              <p className="text-xs sm:text-sm text-[#686662] mt-1 max-w-xl">
                {isComplete
                  ? `You unlocked every gesture, ${config.recipientName}. Your final letter is open whenever you want to read it.`
                  : 'Unlock all six hand gestures above to unseal the final personal note tucked at the bottom of this page.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {isComplete ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playFinalLetterReveal();
                  onOpenModal();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#18181B] hover:bg-[#2b2b30] text-[#FAF8F5] px-5 py-2.5 text-sm font-medium shadow-sm transition cursor-pointer"
              >
                <Heart className="w-4 h-4 text-[#E0636B] fill-[#E0636B]" />
                <span>Read Secret Letter</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/70 border border-black/[0.06]">
                {GESTURE_ORDER.map((id) => {
                  const done = unlocked.includes(id);
                  return (
                    <span
                      key={id}
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        done ? 'bg-[#D45863] scale-110' : 'bg-[#D6D2C9]'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Stationery Final Letter Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto"
          onClick={onCloseModal}
        >
          <div
            className="relative my-auto w-full max-w-xl rounded-[28px] bg-[#FCFBF8] border border-black/10 p-7 sm:p-11 shadow-[0_32px_90px_-18px_rgba(24,24,27,0.35)] animate-letter-unfold"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle top wax-seal inspired minimal emblem */}
            <div className="flex items-center justify-between mb-8">
              <div className="inline-flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest text-[#9A968F]">
                <span className="h-2 w-2 rounded-full bg-[#D45863]" />
                <span>{formattedDate}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => soundEngine.playFinalLetterReveal()}
                  title="Replay warm chord"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#686662] transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onCloseModal}
                  aria-label="Close letter"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#52504C] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-mono-tech uppercase tracking-wider text-[#D45863] mb-2">
                For {config.recipientName}
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#18181B] leading-tight">
                {config.finalLetterTitle}
              </h2>
            </div>

            <div className="h-px w-full bg-black/[0.07] mb-7" />

            <p className="font-editorial italic text-2xl text-[#18181B] mb-4">
              {config.finalLetterGreeting}
            </p>

            <div className="space-y-4 text-[15px] text-[#3B3936] leading-[1.82] whitespace-pre-line">
              {config.finalLetterBody}
            </div>

            <div className="mt-9 pt-6 border-t border-black/[0.06] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs text-[#8E8A82] mb-0.5">{config.finalLetterSignoff}</p>
                <p className="font-editorial italic text-2xl text-[#18181B]">
                  {config.senderName}
                </p>
              </div>

              <button
                type="button"
                onClick={onCloseModal}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-[#18181B] hover:bg-[#2b2b30] text-[#FAF8F5] px-5 py-2 text-xs font-medium transition cursor-pointer"
              >
                <span>Keep Safe ♥</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
