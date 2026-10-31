import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  EyeOff,
  Heart,
  Link2,
  PenLine,
  RotateCcw,
} from 'lucide-react';
import { CustomizeDrawer } from './components/CustomizeDrawer';
import { FinalLetterSection } from './components/FinalLetterSection';
import { GestureStage } from './components/GestureStage';
import { NoteCard } from './components/NoteCard';
import { NoteSpotlightModal } from './components/NoteSpotlightModal';
import {
  buildShareableGiftUrl,
  GESTURE_DEFINITIONS,
  GESTURE_ORDER,
  loadQuestConfig,
  loadUnlockedGestures,
  parseGiftFromUrl,
  saveQuestConfig,
  saveUnlockedGestures,
} from './data/defaultQuest';
import { GestureId, QuestConfig } from './types';
import { soundEngine } from './utils/sound';

export const App: React.FC = () => {
  const initialGiftState = parseGiftFromUrl();

  const [config, setConfig] = useState<QuestConfig>(() => loadQuestConfig());
  const [unlocked, setUnlocked] = useState<GestureId[]>(() =>
    initialGiftState.isGiftMode ? [] : loadUnlockedGestures()
  );
  const [isGiftView, setIsGiftView] = useState<boolean>(initialGiftState.isGiftMode);
  const [isPreviewingGift, setIsPreviewingGift] = useState<boolean>(false);

  const [activeHold, setActiveHold] = useState<{
    gesture: GestureId | null;
    progress: number;
  }>({ gesture: null, progress: 0 });

  const [justUnlockedId, setJustUnlockedId] = useState<GestureId | null>(null);
  const [spotlightGesture, setSpotlightGesture] = useState<GestureId | null>(null);
  const [isFinalLetterOpen, setIsFinalLetterOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [copiedHeaderLink, setCopiedHeaderLink] = useState(false);

  useEffect(() => {
    document.title = `For ${config.recipientName} — Gesture Notes`;
  }, [config.recipientName]);

  const handleConfigChange = useCallback((next: QuestConfig) => {
    setConfig(next);
    saveQuestConfig(next);
  }, []);

  const handleUnlockGesture = useCallback((gesture: GestureId) => {
    setUnlocked((prev) => {
      if (prev.includes(gesture)) return prev;
      const next = [...prev, gesture];
      saveUnlockedGestures(next);
      return next;
    });

    setJustUnlockedId(gesture);
    setSpotlightGesture(gesture);
    window.setTimeout(() => {
      setJustUnlockedId((curr) => (curr === gesture ? null : curr));
    }, 2400);
  }, []);

  const handleActiveHoldChange = useCallback(
    (gesture: GestureId | null, progress: number) => {
      setActiveHold((prev) => {
        if (prev.gesture === gesture && Math.abs(prev.progress - progress) < 0.02) {
          return prev;
        }
        return { gesture, progress };
      });
    },
    []
  );

  const handleFocusNote = useCallback((gesture: GestureId) => {
    setSpotlightGesture(gesture);
  }, []);

  const handleResetProgress = useCallback(() => {
    setUnlocked([]);
    saveUnlockedGestures([]);
    setSpotlightGesture(null);
    setIsFinalLetterOpen(false);
  }, []);

  const handleUnlockAllPreview = useCallback(() => {
    setUnlocked([...GESTURE_ORDER]);
    saveUnlockedGestures([...GESTURE_ORDER]);
  }, []);

  const handleQuickShare = async () => {
    const url = buildShareableGiftUrl(config);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedHeaderLink(true);
      window.setTimeout(() => setCopiedHeaderLink(false), 2600);
    } catch {
      window.prompt('Copy this gift link for her:', url);
    }
  };

  const hideCreatorControls = isGiftView || isPreviewingGift;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#18181B]">
      {/* Clean Minimal Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/85 backdrop-blur-md border-b border-black/[0.06]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FCF1F2] border border-[#D45863]/20 text-[#D45863]">
              <Heart className="w-3.5 h-3.5 fill-[#D45863]" />
            </span>
            <span className="font-editorial text-xl text-[#18181B] truncate">
              For {config.recipientName}
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full bg-[#F2EFE9] px-2.5 py-0.5 font-mono-tech text-[11px] text-[#686662]">
              {unlocked.length} / {GESTURE_ORDER.length} UNLOCKED
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!hideCreatorControls ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsCustomizeOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-[#F4F1EB] border border-black/10 px-3.5 py-1.5 text-xs font-medium text-[#18181B] transition cursor-pointer"
                >
                  <PenLine className="w-3.5 h-3.5 text-[#D45863]" />
                  <span>Customize</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickShare}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#18181B] hover:bg-[#2c2c32] px-3.5 py-1.5 text-xs font-medium text-[#FAF8F5] transition cursor-pointer"
                >
                  {copiedHeaderLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Gift Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Share Gift Link</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <span className="inline-flex items-center rounded-full bg-[#F2EFE9] px-3 py-1 font-mono-tech text-[11px] text-[#686662]">
                {unlocked.length} OF {GESTURE_ORDER.length} FOUND
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-11 space-y-10">
        {/* Editorial Intro */}
        <section className="max-w-2xl space-y-2.5">
          <p className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#8E8A82]">
            {config.headerTagline}
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#18181B] tracking-tight leading-[1.08]">
            A little gesture quest,{' '}
            <span className="italic text-[#C84E59]">made for {config.recipientName}.</span>
          </h1>
          <p className="text-sm sm:text-[15px] text-[#686662] leading-relaxed">
            {config.introSubtitle}
          </p>
        </section>

        {/* Split Interactive Workspace: Sticky Viewfinder + 6-Card Collection */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
          {/* Left: Viewfinder & Checklist */}
          <div className="lg:col-span-6 lg:sticky lg:top-22 space-y-3.5">
            <GestureStage
              unlocked={unlocked}
              recipientName={config.recipientName}
              senderName={config.senderName}
              onUnlockGesture={handleUnlockGesture}
              onActiveHoldChange={handleActiveHoldChange}
              onFocusNote={handleFocusNote}
            />

            {/* Minimal 6-Sign Progress Strip */}
            <div className="rounded-2xl bg-white border border-black/[0.07] px-4 py-3 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="text-[11px] font-mono-tech uppercase tracking-wider text-[#8E8A82] shrink-0">
                Signs
              </span>
              <div className="flex items-center gap-1.5">
                {GESTURE_ORDER.map((id) => {
                  const def = GESTURE_DEFINITIONS[id];
                  const done = unlocked.includes(id);
                  const holding = activeHold.gesture === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        if (done) setSpotlightGesture(id);
                      }}
                      title={`${def.gestureName}: ${def.shortHint}`}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                        done
                          ? 'bg-[#FCF1F2] text-[#B8434E] border border-[#D45863]/25 cursor-pointer'
                          : holding
                            ? 'bg-[#18181B] text-white border border-black'
                            : 'bg-[#F4F1EB] text-[#686662] border border-transparent cursor-default'
                      }`}
                    >
                      <span>{def.symbol}</span>
                      {done && <Check className="w-3 h-3 text-[#D45863]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: 6 Unlockable Love Notes */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between px-0.5">
              <div>
                <h2 className="font-editorial text-2xl text-[#18181B]">Hidden Notes</h2>
                <p className="text-xs text-[#8E8A82]">
                  Hold each hand sign steady for a moment to unseal its card
                </p>
              </div>

              {unlocked.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-[#8E8A82] hover:text-[#18181B] hover:bg-black/[0.04] transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Replay</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {GESTURE_ORDER.map((id) => (
                <NoteCard
                  key={id}
                  gestureId={id}
                  noteContent={config.notes[id]}
                  isUnlocked={unlocked.includes(id)}
                  isHolding={activeHold.gesture === id && !unlocked.includes(id)}
                  holdProgress={activeHold.gesture === id ? activeHold.progress : 0}
                  isJustUnlocked={justUnlockedId === id}
                  onOpenNote={setSpotlightGesture}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Final Secret Letter */}
        <section className="pt-2">
          <FinalLetterSection
            config={config}
            unlocked={unlocked}
            isModalOpen={isFinalLetterOpen}
            onOpenModal={() => setIsFinalLetterOpen(true)}
            onCloseModal={() => setIsFinalLetterOpen(false)}
          />
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-black/[0.06] py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-[#9A968F]">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Crafted with <span className="text-[#D45863]">♥</span> · Camera processing stays 100% on your device
          </span>
          <button
            type="button"
            onClick={() => setIsCustomizeOpen(true)}
            className="text-[11px] text-[#9A968F] hover:text-[#18181B] underline underline-offset-4 transition cursor-pointer"
          >
            Personalize notes
          </button>
        </div>
      </footer>

      {/* Floating Exit-Preview Pill when Creator is previewing Recipient Mode */}
      {isPreviewingGift && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            type="button"
            onClick={() => setIsPreviewingGift(false)}
            className="inline-flex items-center gap-2 rounded-full bg-[#18181B] text-[#FAF8F5] px-4 py-2.5 text-xs font-medium shadow-lg hover:bg-[#2c2c32] transition cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5 text-[#E8838B]" />
            <span>Exit Recipient Preview</span>
          </button>
        </div>
      )}

      {/* Spotlight Single Note Modal */}
      <NoteSpotlightModal
        gestureId={spotlightGesture}
        noteContent={spotlightGesture ? config.notes[spotlightGesture] : null}
        recipientName={config.recipientName}
        senderName={config.senderName}
        unlockedCount={unlocked.length}
        unlocked={unlocked}
        onClose={() => setSpotlightGesture(null)}
        onOpenFinalLetter={() => {
          soundEngine.playFinalLetterReveal();
          setIsFinalLetterOpen(true);
        }}
      />

      {/* Personalization Studio Drawer */}
      <CustomizeDrawer
        isOpen={isCustomizeOpen}
        config={config}
        onChangeConfig={handleConfigChange}
        onResetProgress={handleResetProgress}
        onUnlockAllPreview={handleUnlockAllPreview}
        onEnterPreviewGiftView={() => setIsPreviewingGift(true)}
        onClose={() => setIsCustomizeOpen(false)}
      />
    </div>
  );
};

export default App;
