import { GestureDefinition, GestureId, QuestConfig } from '../types';

export const GESTURE_ORDER: GestureId[] = [
  'open_palm',
  'peace',
  'finger_heart',
  'ily',
  'thumbs_up',
  'two_hand_heart',
];

export const GESTURE_DEFINITIONS: Record<GestureId, GestureDefinition> = {
  open_palm: {
    id: 'open_palm',
    order: '01',
    symbol: '👋',
    gestureName: 'Open Palm',
    shortHint: 'Raise one open hand like a gentle wave',
    detailGuide: 'Hold your palm facing the camera with all five fingers relaxed and spread.',
  },
  peace: {
    id: 'peace',
    order: '02',
    symbol: '✌️',
    gestureName: 'Peace Sign',
    shortHint: 'Index & middle fingers up in a V',
    detailGuide: 'Extend your index and middle fingers in a clean V while curling your ring and pinky fingers.',
  },
  finger_heart: {
    id: 'finger_heart',
    order: '03',
    symbol: '🫰',
    gestureName: 'Finger Heart',
    shortHint: 'Cross thumb & index fingertips together',
    detailGuide: 'Curl your middle, ring, and pinky fingers down, then pinch or cross your thumb and index tips at the top.',
  },
  ily: {
    id: 'ily',
    order: '04',
    symbol: '🤟',
    gestureName: 'I Love You Sign',
    shortHint: 'Thumb, index & pinky extended out',
    detailGuide: 'Extend your thumb, index finger, and pinky while folding your middle and ring fingers into your palm.',
  },
  thumbs_up: {
    id: 'thumbs_up',
    order: '05',
    symbol: '👍',
    gestureName: 'Thumbs Up',
    shortHint: 'Thumb pointing up, fingers curled in',
    detailGuide: 'Curl four fingers gently into your palm and point your thumb straight upward.',
  },
  two_hand_heart: {
    id: 'two_hand_heart',
    order: '06',
    symbol: '🫶',
    gestureName: 'Two-Hand Heart',
    shortHint: 'Bring both hands together in a heart',
    detailGuide: 'Curve the fingers of both hands to meet at the top and touch your thumbs together at the bottom.',
  },
};

export const DEFAULT_QUEST_CONFIG: QuestConfig = {
  recipientName: 'My Favorite Person',
  senderName: 'Yours, always',
  headerTagline: 'Six little signs · Six hidden notes',
  introSubtitle:
    'Show each hand gesture to the camera and hold for a moment to unlock the little reminders I tucked inside for you.',
  notes: {
    open_palm: {
      title: 'My Favorite Hello',
      message:
        'No matter how busy or loud my day gets, seeing your face—or even just a quick message from you—instantly makes everything feel lighter.',
    },
    peace: {
      title: 'Better Together',
      message:
        'You have a quiet magic of turning ordinary errands, late talks, and random afternoons into the moments I end up replaying with a smile.',
    },
    finger_heart: {
      title: 'The Little Things',
      message:
        'A tiny heart for all the small details about you—the way your eyes light up when you laugh, your kindness, and the expressions only I get to notice.',
    },
    ily: {
      title: 'In Every Language',
      message:
        'Saying it out loud never feels quite big enough, so here is one more way to tell you: I adore you more than you probably realize.',
    },
    thumbs_up: {
      title: 'Always in Your Corner',
      message:
        'On your best days and especially on the exhausting ones, remember you have someone cheering for you, proud of you, and choosing you every single time.',
    },
    two_hand_heart: {
      title: 'Wholeheartedly Yours',
      message:
        'Out of everywhere I could be and everyone in this world, right here with you is—without question—my favorite place to belong.',
    },
  },
  finalLetterTitle: 'One Last Note for You',
  finalLetterGreeting: 'Hey love,',
  finalLetterBody: `I built this little corner of the internet just because I wanted to put a smile on your face today.\n\nSometimes life moves fast and we forget to pause and say the simple things out loud. So here it is in plain sight: thank you for being my safe place, my favorite laugh, and the person I look forward to telling everything to.\n\nWhenever you need a small reminder of how deeply you are loved, come back here—every single note still stands.`,
  finalLetterSignoff: 'With my whole heart,',
};

const STORAGE_KEY = 'gesture_love_quest_config_v1';
const UNLOCKED_STORAGE_KEY = 'gesture_love_quest_unlocked_v1';

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url: string): string {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(padLen));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function parseGiftFromUrl(): { config: QuestConfig | null; isGiftMode: boolean } {
  if (typeof window === 'undefined') {
    return { config: null, isGiftMode: false };
  }

  const hash = window.location.hash || '';
  const searchParams = new URLSearchParams(window.location.search);
  const isGiftQuery = searchParams.get('view') === 'gift';

  if (hash.startsWith('#gift=')) {
    try {
      const encoded = hash.slice('#gift='.length);
      const parsed = JSON.parse(fromBase64Url(encoded)) as Partial<QuestConfig>;
      return {
        config: mergeWithDefaults(parsed),
        isGiftMode: true,
      };
    } catch (err) {
      console.warn('Could not decode gift link payload:', err);
    }
  }

  return { config: null, isGiftMode: isGiftQuery };
}

function mergeWithDefaults(partial: Partial<QuestConfig>): QuestConfig {
  const mergedNotes = { ...DEFAULT_QUEST_CONFIG.notes };
  if (partial.notes) {
    for (const id of GESTURE_ORDER) {
      if (partial.notes[id]) {
        mergedNotes[id] = {
          title: partial.notes[id].title ?? DEFAULT_QUEST_CONFIG.notes[id].title,
          message: partial.notes[id].message ?? DEFAULT_QUEST_CONFIG.notes[id].message,
        };
      }
    }
  }

  return {
    recipientName: partial.recipientName ?? DEFAULT_QUEST_CONFIG.recipientName,
    senderName: partial.senderName ?? DEFAULT_QUEST_CONFIG.senderName,
    headerTagline: partial.headerTagline ?? DEFAULT_QUEST_CONFIG.headerTagline,
    introSubtitle: partial.introSubtitle ?? DEFAULT_QUEST_CONFIG.introSubtitle,
    notes: mergedNotes,
    finalLetterTitle: partial.finalLetterTitle ?? DEFAULT_QUEST_CONFIG.finalLetterTitle,
    finalLetterGreeting: partial.finalLetterGreeting ?? DEFAULT_QUEST_CONFIG.finalLetterGreeting,
    finalLetterBody: partial.finalLetterBody ?? DEFAULT_QUEST_CONFIG.finalLetterBody,
    finalLetterSignoff: partial.finalLetterSignoff ?? DEFAULT_QUEST_CONFIG.finalLetterSignoff,
  };
}

export function loadQuestConfig(): QuestConfig {
  const fromUrl = parseGiftFromUrl();
  if (fromUrl.config) {
    return fromUrl.config;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return mergeWithDefaults(JSON.parse(raw));
    }
  } catch {
    // ignore storage errors
  }

  return DEFAULT_QUEST_CONFIG;
}

export function saveQuestConfig(config: QuestConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

export function buildShareableGiftUrl(config: QuestConfig): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  const encoded = toBase64Url(JSON.stringify(config));
  return `${base}#gift=${encoded}`;
}

export function loadUnlockedGestures(): GestureId[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      return arr.filter((id): id is GestureId => GESTURE_ORDER.includes(id as GestureId));
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveUnlockedGestures(unlocked: GestureId[]): void {
  try {
    localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(unlocked));
  } catch {
    // ignore
  }
}
