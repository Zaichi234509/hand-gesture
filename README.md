# For You — Hand Gesture Love Quest

A clean, modern-minimal interactive gift website built with React, TypeScript, Tailwind CSS, and on-device MediaPipe 21-point Hand Landmark tracking.

Show six hand gestures to the camera (or explore with the built-in interactive 3D-landmark simulator) to unlock six personal love notes and unseal a final secret letter.

## Recognizable Hand Gestures
1. **👋 Open Palm** — All five fingers relaxed and open
2. **✌️ Peace Sign** — Index & middle fingers extended in a V
3. **🫰 Finger Heart** — Thumb & index fingertips crossed/pinched at the top
4. **🤟 I Love You (ILY)** — Thumb, index & pinky extended outward
5. **👍 Thumbs Up** — Thumb pointing upward, fingers curled in
6. **🫶 Two-Hand Heart** — Both hands curved together forming a heart

## Personalizing & Sharing for Her
- Click **Customize** in the top bar to edit her name, your signature, all 6 gesture cards, and the final secret letter (or pick from built-in tone starters).
- Click **Copy Gift Link for Her** to generate a self-contained `#gift=...` URL that carries your custom notes and opens directly in clean **Recipient Mode** (hiding the editing controls).
- **100% Private**: All hand landmark detection runs locally in WebAssembly inside the browser—no camera frames are ever uploaded anywhere.

## Running Locally
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
npm run preview
```
