import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Check,
  ExternalLink,
  Hand,
  Sparkles,
  SunMedium,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GESTURE_DEFINITIONS, GESTURE_ORDER } from '../data/defaultQuest';
import { CameraFilter, GestureId, Point3D } from '../types';
import {
  downloadKeepsakeSnapshot,
  drawHandsOverlay,
  drawSimulatorBackdrop,
  getFilterCss,
} from '../utils/canvasRenderer';
import { classifyLandmarks, GestureStabilizer } from '../utils/gestureClassifier';
import { createHandsDetector, MediaPipeHandsInstance } from '../utils/mediapipeLoader';
import { ParticleSystem } from '../utils/particles';
import { getTargetSimulatedHands, interpolateHands } from '../utils/simulatedHands';
import { soundEngine } from '../utils/sound';

interface GestureStageProps {
  unlocked: GestureId[];
  recipientName: string;
  senderName: string;
  onUnlockGesture: (gesture: GestureId) => void;
  onActiveHoldChange: (gesture: GestureId | null, progress: number) => void;
  onFocusNote: (gesture: GestureId) => void;
}

type StageMode = 'standby' | 'camera' | 'simulator';

const HOLD_DURATION_MS = 850;
const FILTERS: { id: CameraFilter; label: string }[] = [
  { id: 'natural', label: 'Natural' },
  { id: 'warm_film', label: 'Warm Film' },
  { id: 'mono', label: 'Editorial B&W' },
];

export const GestureStage: React.FC<GestureStageProps> = ({
  unlocked,
  recipientName,
  senderName,
  onUnlockGesture,
  onActiveHoldChange,
  onFocusNote,
}) => {
  const [mode, setMode] = useState<StageMode>('standby');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [filterIdx, setFilterIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [simTarget, setSimTarget] = useState<GestureId | null>(null);
  const [liveStatus, setLiveStatus] = useState<{
    handsCount: number;
    gesture: GestureId | null;
    progress: number;
  }>({ handsCount: 0, gesture: null, progress: 0 });
  const [snapSavedToast, setSnapSavedToast] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<MediaPipeHandsInstance | null>(null);
  const latestCameraHandsRef = useRef<Point3D[][]>([]);
  const isSendingFrameRef = useRef(false);

  const unlockedRef = useRef<Set<GestureId>>(new Set(unlocked));
  useEffect(() => {
    unlockedRef.current = new Set(unlocked);
  }, [unlocked]);

  const callbacksRef = useRef({ onUnlockGesture, onActiveHoldChange, onFocusNote });
  useEffect(() => {
    callbacksRef.current = { onUnlockGesture, onActiveHoldChange, onFocusNote };
  }, [onUnlockGesture, onActiveHoldChange, onFocusNote]);

  const simTargetRef = useRef<GestureId | null>(null);
  useEffect(() => {
    simTargetRef.current = simTarget;
  }, [simTarget]);

  const particleSystemRef = useRef(new ParticleSystem());
  const stabilizerRef = useRef(new GestureStabilizer());

  // Hold state refs inside animation loop
  const holdStateRef = useRef<{
    gesture: GestureId | null;
    startedAt: number;
    firedForHold: boolean;
  }>({
    gesture: null,
    startedAt: 0,
    firedForHold: false,
  });

  const stopCameraResources = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    latestCameraHandsRef.current = [];
    stabilizerRef.current.reset();
    holdStateRef.current = { gesture: null, startedAt: 0, firedForHold: false };
    callbacksRef.current.onActiveHoldChange(null, 0);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsLoadingModel(true);
    setMode('camera');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser context.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      if (!detectorRef.current) {
        detectorRef.current = await createHandsDetector((results) => {
          const rawHands = results.multiHandLandmarks ?? [];
          // Mirror x so coordinates match mirrored selfie video
          latestCameraHandsRef.current = rawHands.map((hand) =>
            hand.map((pt) => ({ x: 1 - pt.x, y: pt.y, z: pt.z }))
          );
        });
      }

      setIsLoadingModel(false);
    } catch (err) {
      setIsLoadingModel(false);
      stopCameraResources();
      const message =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError')
          ? 'Camera permission was blocked by your browser or embedded preview window.'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'No camera was detected on this device.'
            : err instanceof Error
              ? err.message
              : 'Unable to start camera.';
      setCameraError(message);
      setMode('standby');
    }
  }, [stopCameraResources]);

  const enterSimulator = useCallback(() => {
    stopCameraResources();
    setCameraError(null);
    setIsLoadingModel(false);
    setMode('simulator');
    // Automatically demonstrate the first locked gesture briefly if none selected
    const nextLocked = GESTURE_ORDER.find((g) => !unlockedRef.current.has(g)) ?? null;
    setSimTarget(nextLocked);
  }, [stopCameraResources]);

  useEffect(() => {
    return () => {
      stopCameraResources();
      if (detectorRef.current) {
        detectorRef.current.close().catch(() => {});
        detectorRef.current = null;
      }
    };
  }, [stopCameraResources]);

  // Main render + inference loop for Camera & Simulator modes
  useEffect(() => {
    if (mode === 'standby') return;

    let rafId = 0;
    let currentSimHands = getTargetSimulatedHands(null);
    let lastStatusPush = 0;

    const tick = (nowMs: number) => {
      rafId = requestAnimationFrame(tick);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(1, Math.round(rect.width * dpr));
      const targetH = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      let activeHands: Point3D[][] = [];

      if (mode === 'camera') {
        const video = videoRef.current;
        const detector = detectorRef.current;
        if (
          video &&
          detector &&
          video.readyState >= 2 &&
          !isSendingFrameRef.current
        ) {
          isSendingFrameRef.current = true;
          detector
            .send({ image: video })
            .catch(() => {})
            .finally(() => {
              isSendingFrameRef.current = false;
            });
        }
        activeHands = latestCameraHandsRef.current;
      } else if (mode === 'simulator') {
        drawSimulatorBackdrop(ctx, width, height);
        const desiredHands = getTargetSimulatedHands(simTargetRef.current);
        currentSimHands = interpolateHands(
          currentSimHands,
          desiredHands,
          0.16,
          nowMs / 1000
        );
        activeHands = currentSimHands;
      }

      const rawDetection = classifyLandmarks(activeHands);
      const stableGesture = stabilizerRef.current.push(rawDetection.gesture);

      // Update hold progress
      const hold = holdStateRef.current;
      let progress = 0;

      if (stableGesture) {
        if (hold.gesture !== stableGesture) {
          hold.gesture = stableGesture;
          hold.startedAt = nowMs;
          hold.firedForHold = false;
          if (!unlockedRef.current.has(stableGesture)) {
            soundEngine.playSoftTick();
          }
        } else {
          const elapsed = nowMs - hold.startedAt;
          progress = Math.min(1, elapsed / HOLD_DURATION_MS);

          if (rawDetection.anchor) {
            particleSystemRef.current.emitTrail(
              rawDetection.anchor.x,
              rawDetection.anchor.y,
              width,
              height
            );
          }

          if (progress >= 1 && !hold.firedForHold) {
            hold.firedForHold = true;
            const anchor = rawDetection.anchor ?? { x: 0.5, y: 0.48 };
            particleSystemRef.current.burst(anchor.x, anchor.y, width, height, 28);

            const wasAlreadyUnlocked = unlockedRef.current.has(stableGesture);
            const stepIndex = GESTURE_ORDER.indexOf(stableGesture);
            soundEngine.playUnlockChime(Math.max(0, stepIndex));

            if (!wasAlreadyUnlocked) {
              callbacksRef.current.onUnlockGesture(stableGesture);
            } else {
              callbacksRef.current.onFocusNote(stableGesture);
            }
          }
        }
      } else {
        hold.gesture = null;
        hold.startedAt = 0;
        hold.firedForHold = false;
        progress = 0;
      }

      const isAlreadyUnlocked = stableGesture
        ? unlockedRef.current.has(stableGesture)
        : false;

      drawHandsOverlay(
        ctx,
        activeHands,
        width,
        height,
        stableGesture,
        progress,
        rawDetection.anchor,
        isAlreadyUnlocked
      );

      particleSystemRef.current.updateAndDraw(ctx);
      ctx.restore();

      // Throttle React state updates to ~20fps for crisp smoothness without excess re-renders
      if (nowMs - lastStatusPush > 48) {
        lastStatusPush = nowMs;
        setLiveStatus({
          handsCount: activeHands.length,
          gesture: stableGesture,
          progress,
        });
        callbacksRef.current.onActiveHoldChange(stableGesture, progress);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode]);

  // Auto-relax simulator pose slightly after unlocking so user sees idle -> pose transitions cleanly
  useEffect(() => {
    if (mode !== 'simulator' || !simTarget) return;
    const timer = window.setTimeout(() => {
      setSimTarget((curr) => (curr === simTarget ? null : curr));
    }, 2100);
    return () => window.clearTimeout(timer);
  }, [mode, simTarget]);

  const toggleMute = () => {
    const next = !muted;
    soundEngine.muted = next;
    setMuted(next);
  };

  const currentFilter = FILTERS[filterIdx];
  const nextLockedGesture = GESTURE_ORDER.find((id) => !unlocked.includes(id)) ?? null;
  const isEmbeddedIframe =
    typeof window !== 'undefined' && window.self !== window.top;

  const handleSnapshot = () => {
    const activeDef = liveStatus.gesture
      ? GESTURE_DEFINITIONS[liveStatus.gesture]
      : null;
    const caption = activeDef
      ? `${activeDef.symbol} ${activeDef.gestureName} — ${unlocked.length} of 6 notes unlocked`
      : `${unlocked.length} of 6 gesture notes unlocked`;

    downloadKeepsakeSnapshot({
      videoEl: videoRef.current,
      overlayCanvas: canvasRef.current,
      isSimulator: mode === 'simulator',
      filter: currentFilter.id,
      recipientName,
      senderName,
      caption,
    });

    setSnapSavedToast(true);
    window.setTimeout(() => setSnapSavedToast(false), 2400);
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-[22px] bg-[#161619] border border-black/10 shadow-[0_18px_50px_-18px_rgba(24,24,27,0.22)] aspect-[4/3] sm:aspect-[16/10]">
        {/* Mirrored Webcam Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            filter: getFilterCss(currentFilter.id),
            transform: 'scaleX(-1)',
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            mode === 'camera' && !isLoadingModel ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Subtle vignette over camera */}
        {mode !== 'standby' && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at center, transparent 58%, rgba(16,16,19,0.42) 100%)',
            }}
          />
        )}

        {/* Vector Landmark + Particle Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
            mode === 'standby' ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Top HUD Bar when Active */}
        {mode !== 'standby' && (
          <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/55 backdrop-blur-md px-3 py-1.5 text-[11px] font-mono-tech tracking-wide text-[#FAF8F5] border border-white/12">
              <span
                className={`h-2 w-2 rounded-full ${
                  isLoadingModel
                    ? 'bg-amber-400 animate-pulse'
                    : mode === 'simulator'
                      ? 'bg-[#E0636B]'
                      : liveStatus.handsCount > 0
                        ? 'bg-emerald-400'
                        : 'bg-stone-400'
                }`}
              />
              {isLoadingModel ? (
                <span>LOADING HAND MODEL…</span>
              ) : mode === 'simulator' ? (
                <span>SIMULATOR · INTERACTIVE DEMO</span>
              ) : (
                <span>
                  LIVE · {liveStatus.handsCount === 0 ? 'SHOW HAND' : `${liveStatus.handsCount} HAND${liveStatus.handsCount > 1 ? 'S' : ''}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {mode === 'camera' && (
                <button
                  type="button"
                  onClick={() => setFilterIdx((i) => (i + 1) % FILTERS.length)}
                  title={`Tone: ${currentFilter.label}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md px-2.5 py-1.5 text-[11px] text-[#FAF8F5] border border-white/12 transition cursor-pointer"
                >
                  <SunMedium className="w-3.5 h-3.5 text-[#F3B1B6]" />
                  <span className="hidden sm:inline">{currentFilter.label}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSnapshot}
                title="Save a keepsake card snapshot"
                className="inline-flex items-center gap-1.5 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md px-2.5 py-1.5 text-[11px] text-[#FAF8F5] border border-white/12 transition cursor-pointer"
              >
                {snapSavedToast ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keepsake</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                title={muted ? 'Unmute chimes' : 'Mute chimes'}
                className="inline-flex items-center justify-center rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md p-1.5 text-[#FAF8F5] border border-white/12 transition cursor-pointer"
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {mode === 'camera' ? (
                <button
                  type="button"
                  onClick={enterSimulator}
                  title="Switch to interactive simulator"
                  className="inline-flex items-center gap-1 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md px-2.5 py-1.5 text-[11px] text-[#FAF8F5] border border-white/12 transition cursor-pointer"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Simulator</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  title="Switch to live camera"
                  className="inline-flex items-center gap-1 rounded-full bg-[#D45863] hover:bg-[#c24a55] px-2.5 py-1.5 text-[11px] font-medium text-white transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Use Camera</span>
                </button>
              )}

              {mode === 'camera' && (
                <button
                  type="button"
                  onClick={() => {
                    stopCameraResources();
                    setMode('standby');
                  }}
                  title="Turn off camera"
                  className="inline-flex items-center justify-center rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md p-1.5 text-white/80 hover:text-white border border-white/12 transition cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Standby / Welcome Overlay */}
        {mode === 'standby' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[radial-gradient(circle_at_top,#262429_0%,#151518_75%)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 border border-white/12 text-[#E8838B]">
              <Sparkles className="w-5 h-5" />
            </div>

            <h2 className="font-editorial text-2xl sm:text-3xl text-[#FAF8F5] tracking-tight mb-2">
              {cameraError ? 'Let’s connect your camera' : 'Ready when you are'}
            </h2>

            {cameraError ? (
              <div className="max-w-md space-y-3 mb-5">
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  {cameraError}
                </p>
                {isEmbeddedIframe && (
                  <p className="text-xs text-stone-400">
                    Tip: Embedded preview frames sometimes restrict camera access—opening in a full browser tab enables instant webcam tracking, or you can test everything right here with Simulator Mode.
                  </p>
                )}
              </div>
            ) : (
              <p className="max-w-sm text-xs sm:text-sm text-stone-300/90 leading-relaxed mb-6">
                Show six simple hand signs—from a wave to a finger heart—to unlock each hidden note. Everything runs privately inside your browser.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-2 rounded-full bg-[#FAF8F5] hover:bg-white text-[#18181B] px-5 py-2.5 text-sm font-medium shadow-sm transition cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#D45863]" />
                <span>{cameraError ? 'Retry Camera' : 'Turn On Camera'}</span>
              </button>

              {cameraError && isEmbeddedIframe && (
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/12 hover:bg-white/18 text-[#FAF8F5] border border-white/15 px-4 py-2.5 text-sm font-medium transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </button>
              )}

              <button
                type="button"
                onClick={enterSimulator}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/16 text-stone-200 border border-white/12 px-4 py-2.5 text-sm transition cursor-pointer"
              >
                <Hand className="w-3.5 h-3.5 text-[#E8838B]" />
                <span>Try Without Camera</span>
              </button>
            </div>

            <p className="mt-5 text-[11px] font-mono-tech text-stone-400/80 tracking-wide">
              100% ON-DEVICE VISION · ZERO VIDEO UPLOADED
            </p>
          </div>
        )}

        {/* Loading Model Spinner Overlay */}
        {mode === 'camera' && isLoadingModel && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#151518]/85 backdrop-blur-sm text-center p-6">
            <div className="h-9 w-9 rounded-full border-2 border-white/20 border-t-[#E0636B] animate-spin mb-3" />
            <p className="text-sm text-[#FAF8F5] font-medium">Warming up hand gesture recognition…</p>
            <p className="text-xs text-stone-400 mt-1">Preparing local 21-point landmark tracker</p>
          </div>
        )}

        {/* Bottom Coaching / Simulator Bar */}
        {mode === 'camera' && !isLoadingModel && (
          <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-3 rounded-2xl bg-black/58 backdrop-blur-md px-4 py-2.5 border border-white/12 text-[#FAF8F5]">
            {liveStatus.gesture ? (
              <div className="flex items-center gap-3 w-full">
                <span className="text-lg leading-none">
                  {GESTURE_DEFINITIONS[liveStatus.gesture].symbol}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium truncate">
                      {GESTURE_DEFINITIONS[liveStatus.gesture].gestureName}
                      {unlocked.includes(liveStatus.gesture) ? ' · Unlocked!' : ' · Hold steady…'}
                    </span>
                    <span className="font-mono-tech text-[11px] text-stone-300">
                      {Math.round(liveStatus.progress * 100)}%
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-[#E0636B] transition-all duration-75"
                      style={{ width: `${Math.round(liveStatus.progress * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : nextLockedGesture ? (
              <div className="flex items-center justify-between w-full gap-2 text-xs">
                <span className="text-stone-300 truncate">
                  <strong className="text-[#FAF8F5] font-medium">
                    Try {GESTURE_DEFINITIONS[nextLockedGesture].symbol}{' '}
                    {GESTURE_DEFINITIONS[nextLockedGesture].gestureName}:
                  </strong>{' '}
                  {GESTURE_DEFINITIONS[nextLockedGesture].shortHint}
                </span>
                <span className="hidden sm:inline font-mono-tech text-[11px] text-stone-400 shrink-0">
                  HOLD 0.8s
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full text-xs text-stone-200">
                <span>All 6 gestures discovered — your secret letter is ready below ♥</span>
              </div>
            )}
          </div>
        )}

        {mode === 'simulator' && (
          <div className="absolute bottom-3 left-3 right-3 z-20 rounded-2xl bg-black/68 backdrop-blur-md p-2.5 border border-white/12">
            <div className="flex items-center justify-between px-1.5 mb-2">
              <span className="text-[11px] text-stone-300">
                Tap any gesture below to pose the simulated hand & unlock its note:
              </span>
              {simTarget && (
                <span className="text-[11px] font-mono-tech text-[#F3B1B6]">
                  {Math.round(liveStatus.progress * 100)}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {GESTURE_ORDER.map((gId) => {
                const def = GESTURE_DEFINITIONS[gId];
                const isDone = unlocked.includes(gId);
                const isSelected = simTarget === gId;
                return (
                  <button
                    key={gId}
                    type="button"
                    onClick={() => setSimTarget(gId)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium transition cursor-pointer border ${
                      isSelected
                        ? 'bg-[#D45863] text-white border-[#E47881]'
                        : isDone
                          ? 'bg-white/12 text-white border-white/18 hover:bg-white/18'
                          : 'bg-white/6 text-stone-200 border-white/10 hover:bg-white/14'
                    }`}
                  >
                    <span>{def.symbol}</span>
                    <span className="truncate text-[11px]">
                      {def.gestureName.replace('Two-Hand ', '').replace(' Sign', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
