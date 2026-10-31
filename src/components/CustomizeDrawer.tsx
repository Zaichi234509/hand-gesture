import React, { useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  Link2,
  RotateCcw,
  Sparkles,
  Unlock,
  X,
} from 'lucide-react';
import {
  buildShareableGiftUrl,
  DEFAULT_QUEST_CONFIG,
  GESTURE_DEFINITIONS,
  GESTURE_ORDER,
} from '../data/defaultQuest';
import { GestureId, QuestConfig } from '../types';

interface CustomizeDrawerProps {
  isOpen: boolean;
  config: QuestConfig;
  onChangeConfig: (next: QuestConfig) => void;
  onResetProgress: () => void;
  onUnlockAllPreview: () => void;
  onEnterPreviewGiftView: () => void;
  onClose: () => void;
}

const PRESETS: {
  id: string;
  label: string;
  apply: (curr: QuestConfig) => QuestConfig;
}[] = [
  {
    id: 'just_because',
    label: 'Just Because',
    apply: (curr) => ({
      ...DEFAULT_QUEST_CONFIG,
      recipientName: curr.recipientName,
      senderName: curr.senderName,
    }),
  },
  {
    id: 'playful',
    label: 'Sweet & Playful',
    apply: (curr) => ({
      ...curr,
      introSubtitle:
        'Six tiny hand signs to unlock six reasons why you are officially my favorite human.',
      notes: {
        open_palm: {
          title: 'Hi, Pretty',
          message:
            'Yes, I made a whole website just to watch you wave at your screen and smile. Worth every second.',
        },
        peace: {
          title: 'Partner in Crime',
          message:
            'Whether we are getting food, doing nothing at all, or getting lost together—everything is ten times more fun with you.',
        },
        finger_heart: {
          title: 'Certified Cutie',
          message:
            'Look at you doing a finger heart right now. Honestly unfair how effortlessly cute you are.',
        },
        ily: {
          title: 'More Than Yesterday',
          message:
            'Three fingers up for three words I never get tired of meaning: I love you.',
        },
        thumbs_up: {
          title: '10 / 10 Girlfriend',
          message:
            'Official review is in: smartest, sweetest, prettiest person in my world. Would choose you in every lifetime.',
        },
        two_hand_heart: {
          title: 'You Have All of It',
          message:
            'Both hands, full heart—thank you for making my life brighter just by being in it.',
        },
      },
      finalLetterTitle: 'Okay, Real Talk for a Second',
      finalLetterGreeting: 'Hey baby,',
      finalLetterBody: `Behind the playful notes, I really just wanted to make something uniquely yours today.\n\nYou bring so much warmth, laughter, and calm into my days without even trying. Thank you for every late-night chat, every shared laugh, and every little moment with me.\n\nI hope this made you smile at your screen—because making you happy is easily my favorite thing to do.`,
      finalLetterSignoff: 'Always yours,',
    }),
  },
  {
    id: 'missing_you',
    label: 'Missing You',
    apply: (curr) => ({
      ...curr,
      introSubtitle:
        'Until I get to hold your hand in person again, here are six little notes waiting for yours.',
      notes: {
        open_palm: {
          title: 'Across the Distance',
          message:
            'Consider this wave me reaching through the screen just to remind you that you are on my mind right now.',
        },
        peace: {
          title: 'Counting Down',
          message:
            'Every day apart is just one day closer to our next hug, our next meal together, and our next long walk.',
        },
        finger_heart: {
          title: 'Pocket-Sized Love',
          message:
            'Sending you a tiny heart you can open anytime the day feels long and you want me close.',
        },
        ily: {
          title: 'No Matter Where',
          message:
            'Near or far, morning or midnight—my favorite notification and my favorite thought is always you.',
        },
        thumbs_up: {
          title: 'So Proud of You',
          message:
            'Even when I am not right beside you, I am rooting for everything you are doing today.',
        },
        two_hand_heart: {
          title: 'Saving the Best Hug',
          message:
            'Next time I see you, remind me that I owe you the longest hug in the world.',
        },
      },
      finalLetterTitle: 'For Whenever You Miss Me',
      finalLetterGreeting: 'My love,',
      finalLetterBody: `I wished I could be right next to you right now, so I built the next best thing—something small that responds to your hands even when mine aren't holding them.\n\nNo matter how busy our days get, you are always the best part of mine. Keep going, take care of yourself today, and remember how deeply loved you are.`,
      finalLetterSignoff: 'Counting the moments until I see you,',
    }),
  },
];

export const CustomizeDrawer: React.FC<CustomizeDrawerProps> = ({
  isOpen,
  config,
  onChangeConfig,
  onResetProgress,
  onUnlockAllPreview,
  onEnterPreviewGiftView,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'notes' | 'letter'>('general');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const updateField = <K extends keyof QuestConfig>(key: K, value: QuestConfig[K]) => {
    onChangeConfig({ ...config, [key]: value });
  };

  const updateNote = (id: GestureId, field: 'title' | 'message', value: string) => {
    onChangeConfig({
      ...config,
      notes: {
        ...config.notes,
        [id]: {
          ...config.notes[id],
          [field]: value,
        },
      },
    });
  };

  const handleCopyGiftLink = async () => {
    const url = buildShareableGiftUrl(config);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2800);
    } catch {
      window.prompt('Copy this personalized gift link for her:', url);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-lg flex-col bg-[#FAF8F5] border-l border-black/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.08] bg-white">
          <div>
            <h2 className="font-editorial text-2xl text-[#18181B]">Personalize Her Gift</h2>
            <p className="text-xs text-[#7A7771]">
              Changes save automatically · Share via custom link when ready
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customize panel"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] hover:bg-black/[0.09] text-[#52504C] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 bg-white border-b border-black/[0.06]">
          {[
            { id: 'general', label: 'Names & Vibe' },
            { id: 'notes', label: '6 Gesture Notes' },
            { id: 'letter', label: 'Final Letter' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'general' | 'notes' | 'letter')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#18181B] text-[#FAF8F5]'
                  : 'text-[#686662] hover:bg-black/[0.05]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'general' && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#3F3D3A] mb-1.5">
                    Her Name or Pet Name
                  </label>
                  <input
                    type="text"
                    value={config.recipientName}
                    onChange={(e) => updateField('recipientName', e.target.value)}
                    placeholder="e.g., Sofia, My Love, Sunshine"
                    className="w-full rounded-xl bg-white border border-black/12 px-3.5 py-2.5 text-sm text-[#18181B] focus:outline-none focus:border-[#D45863]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#3F3D3A] mb-1.5">
                    Your Name / Signature
                  </label>
                  <input
                    type="text"
                    value={config.senderName}
                    onChange={(e) => updateField('senderName', e.target.value)}
                    placeholder="e.g., Yours always, Alex"
                    className="w-full rounded-xl bg-white border border-black/12 px-3.5 py-2.5 text-sm text-[#18181B] focus:outline-none focus:border-[#D45863]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#3F3D3A] mb-1.5">
                    Intro Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={config.introSubtitle}
                    onChange={(e) => updateField('introSubtitle', e.target.value)}
                    className="w-full rounded-xl bg-white border border-black/12 px-3.5 py-2.5 text-sm text-[#18181B] focus:outline-none focus:border-[#D45863]"
                  />
                </div>
              </div>

              {/* Quick Tone Presets */}
              <div className="rounded-2xl bg-white border border-black/[0.07] p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#18181B]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D45863]" />
                  <span>Quick Message Starters</span>
                </div>
                <p className="text-[11px] text-[#7A7771]">
                  Load a writing tone across all 6 notes & the final letter (keeps your names intact):
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onChangeConfig(preset.apply(config))}
                      className="rounded-full bg-[#F4F1EB] hover:bg-[#EAE5DC] px-3 py-1.5 text-xs font-medium text-[#3F3D3A] transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Testing Utilities */}
              <div className="rounded-2xl bg-white border border-black/[0.07] p-4 space-y-3">
                <div className="text-xs font-medium text-[#18181B]">Testing & Lock State</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onUnlockAllPreview}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F1EB] hover:bg-[#EAE5DC] px-3.5 py-1.5 text-xs font-medium text-[#18181B] transition cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5 text-[#D45863]" />
                    <span>Unlock All (Inspect)</span>
                  </button>

                  <button
                    type="button"
                    onClick={onResetProgress}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F1EB] hover:bg-[#EAE5DC] px-3.5 py-1.5 text-xs font-medium text-[#18181B] transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-lock All (0/6)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEnterPreviewGiftView();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F1EB] hover:bg-[#EAE5DC] px-3.5 py-1.5 text-xs font-medium text-[#18181B] transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Her View</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {GESTURE_ORDER.map((id) => {
                const def = GESTURE_DEFINITIONS[id];
                const note = config.notes[id];
                return (
                  <div
                    key={id}
                    className="rounded-2xl bg-white border border-black/[0.08] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#18181B]">
                        {def.symbol} {def.gestureName}
                      </span>
                      <span className="font-mono-tech text-[11px] text-[#9A968F]">
                        NOTE {def.order}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={note.title}
                      onChange={(e) => updateNote(id, 'title', e.target.value)}
                      placeholder="Card title"
                      className="w-full rounded-xl bg-[#FAF8F5] border border-black/10 px-3 py-2 text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#D45863]"
                    />

                    <textarea
                      rows={3}
                      value={note.message}
                      onChange={(e) => updateNote(id, 'message', e.target.value)}
                      placeholder="Write your note for this gesture…"
                      className="w-full rounded-xl bg-[#FAF8F5] border border-black/10 px-3 py-2 text-xs leading-relaxed text-[#3F3D3A] focus:outline-none focus:border-[#D45863]"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'letter' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#3F3D3A] mb-1.5">
                  Letter Headline
                </label>
                <input
                  type="text"
                  value={config.finalLetterTitle}
                  onChange={(e) => updateField('finalLetterTitle', e.target.value)}
                  className="w-full rounded-xl bg-white border border-black/12 px-3.5 py-2.5 text-sm text-[#18181B] focus:outline-none focus:border-[#D45863]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3F3D3A] mb-1.5">
                  Greeting
                </label>
                <input
                  type="text"
                  value={config.finalLetterGreeting}
                  onChange={(e) => updateField('finalLetterGreeting', e.target.value)}
                  placeholder="Hey love,"
                  className="w-full rounded-xl bg-white border border-black/12 px-3.5 py-2.5 text-sm text-[#18181B] focus:outline-none focus:border-[#D45863]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3F3D3A] mb-1.5">
                  Secret Letter Message
                </label>
                <textarea
                  rows={8}
                  value={config.finalLetterBody}
                  onChange={(e) => updateField('finalLetterBody', e.target.value)}
                  className="w-full rounded-xl bg-white border border-black/12 px-3.5 py-2.5 text-sm leading-relaxed text-[#18181B] focus:outline-none focus:border-[#D45863]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3F3D3A] mb-1.5">
                  Closing Line
                </label>
                <input
                  type="text"
                  value={config.finalLetterSignoff}
                  onChange={(e) => updateField('finalLetterSignoff', e.target.value)}
                  placeholder="With my whole heart,"
                  className="w-full rounded-xl bg-white border border-black/12 px-3.5 py-2.5 text-sm text-[#18181B] focus:outline-none focus:border-[#D45863]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sticky Share Footer */}
        <div className="p-5 bg-white border-t border-black/[0.08] space-y-2.5">
          <button
            type="button"
            onClick={handleCopyGiftLink}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#D45863] hover:bg-[#c04853] text-white px-5 py-3 text-sm font-medium shadow-sm transition cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4" />
                <span>Personalized Gift Link Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span>Copy Gift Link for Her</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-[#8E8A82] flex items-center justify-center gap-1">
            <Copy className="w-3 h-3" />
            <span>Packs all your custom notes into the link & opens in clean Recipient Mode</span>
          </p>
        </div>
      </div>
    </div>
  );
};
