# Coffee Cup AR Experience — Technical Breakdown

Interactive 3D coffee cup controlled by face and hand tracking via the webcam. Built with React Three Fiber and MediaPipe.

---

## 1. Face-Controlled Camera (Parallax Orbit)

**Files:** `useFaceTracking.jsx`, `FaceControlledOrbit.jsx`

### How it works

1. **Face detection** runs on the webcam feed using MediaPipe's `FaceDetector` (BlazeFace short-range model, GPU-delegated). A hidden `<video>` element captures the camera stream at 320×240.

2. **Every other frame** (to save performance), we call `detectForVideo()` and extract the bounding box of the first detected face.

3. **Mapping face position to scene rotation:**
   - The bounding box center is normalized to `[0, 1]` in video space, then remapped to `[-1, 1]`:
     ```
     x = -(centerX - 0.5) * 2    (mirrored so moving left turns scene left)
     y =  (centerY - 0.5) * 2
     ```
   - `z` is derived from `bbox.width / videoWidth` (proxy for distance from camera).

4. **Applying to OrbitControls:** `FaceControlledOrbit` takes the face position and drives the azimuthal (horizontal) and polar (vertical) angles of Three.js `OrbitControls`:
   ```
   targetAzimuth = facePosition.x × π × 0.15
   targetPolar   = (π/2) + (facePosition.y × π × 0.05) - POLAR_OFFSET
   ```
   A damping factor smooths the transition. Zoom and pan are disabled — only rotation responds to face movement.

5. **Initial sync:** On the very first frame, we extract the current camera spherical angles from its position/target to avoid a jump when tracking kicks in.

---

## 2. Hand Tracking & Cursor Position

**File:** `useHandCenterTrigger.jsx`

### How it works

1. **Hand landmark detection** uses MediaPipe's `HandLandmarker` model, configured for up to 2 hands, running in `VIDEO` mode. The webcam stream runs at 640×480.

2. **Every frame**, `detectForVideo()` returns 21 landmarks per detected hand (fingertips, knuckles, wrist).

3. **Cursor position** is taken from **landmark 9** (middle finger MCP — the knuckle at the base of the middle finger). This point sits at the top-center of the palm and stays stable during a pinch gesture, unlike fingertip landmarks which shift as fingers converge.

4. **Y remapping:** The top edge of the webcam frame is hard to reach physically, so we apply a margin remap:
   ```
   remappedY = (rawY - 0.12) / (1 - 0.12)
   ```
   This makes the full `[0, 1]` range reachable without raising your hand to the very top of the frame.

5. **Output:** An array of `{ x, y, pinching }` objects (one per detected hand), plus raw landmark arrays for the debug overlay.

---

## 3. Mapping Hand Position to 3D Screen Space

**File:** `HandFollowShape.jsx`

### How it works

The hand position is in normalized video coordinates `[0, 1]`. To place a 3D cursor in the scene:

1. **Convert to NDC** (Normalized Device Coordinates, `[-1, 1]`):
   ```
   ndcX = 1 - handPosition.x × 2    (mirrored for selfie view)
   ndcY = 1 - handPosition.y × 2
   ```

2. **Unproject** from NDC to world space using `vector.unproject(camera)` at a fixed depth (`DEPTH_NDC = 0.4`). This places the cursor on a plane between the camera and the far plane.

3. **Visual:** Two concentric transparent spheres (a soft halo + bright core) render at that world position, giving a subtle glowing cursor effect.

---

## 4. Pinch Detection

**File:** `useHandCenterTrigger.jsx`

### How it works

1. For each detected hand, we measure the **Euclidean distance** between the thumb tip (landmark 4) and index finger tip (landmark 8) in normalized video space:
   ```
   pinchDist = √((thumb.x - index.x)² + (thumb.y - index.y)²)
   ```

2. If `pinchDist < PINCH_THRESHOLD` (currently `0.12`), the hand is considered **pinching**.

3. The threshold is tuned to be forgiving — fingers don't need to physically touch, just come close together. This avoids frustration from overly strict detection.

---

## 5. Bean Collection (Hand-Over-Object Detection)

**File:** `CoffeeBeans.jsx`

### How it works

1. **Beans spawn** on a randomized circle around the cup at intervals (`SPAWN_INTERVAL_SEC = 0.9s`), up to 5 on screen at once. Each bean has a lifetime of 9 seconds before despawning.

2. **Hit testing** happens every frame in NDC space:
   - Each bean's 3D world position is computed from its angle on the circle.
   - That position is **projected** to NDC via `vector.project(camera)`, giving a 2D screen-space coordinate.
   - Each hand's position (also in NDC) is compared to the bean's NDC position.
   - If the distance is less than `COLLECT_NDC_RADIUS` (currently `0.18`), the bean is **hovered**.

3. **Collection:** If a hand is both hovering over a bean AND pinching, the bean is collected:
   ```
   if (distance < COLLECT_NDC_RADIUS && hand.pinching) → collect
   ```

4. **Hover feedback:** Hovered beans get an emissive gold glow (`0xffaa00`) so the user knows they're in range before pinching.

5. **Progress gating:** The pour button is disabled until all 10 beans are collected.

---

## 6. Pour Button (Hand Hover + Pinch Activation)

**File:** `FillCupButton.jsx`

### How it works

1. The button is a 3D box mesh positioned in the scene. Its world position is projected to NDC each frame, just like beans.

2. **Hand hover detection** uses the same NDC distance check (`HOVER_NDC_RADIUS = 0.09`). When a hand is over the button, it gets a warm emissive highlight.

3. **Pinch activation:** If the hand is hovering AND pinching AND the button isn't disabled, it triggers `startFill()`. A `didPinchRef` guard prevents repeated triggers from a single held pinch.

4. **Progress fill:** The button surface fills left-to-right proportional to beans collected. A secondary mesh scales horizontally to show the fill, changing color when pouring.

5. Also supports mouse click as a fallback input.

---

## 7. Liquid Pour Animation

**Files:** `useFillCup.js`, `LiquidPour.jsx`

### How it works

1. **`useFillCup`** is a simple state hook: `startFill()` sets `isPouring = true`, then after 4 seconds sets it back to `false` and calls `onPourComplete`.

2. **Visual:** `LiquidPour` renders a tube geometry (CatmullRom curve path) and an inner cylinder with custom GLSL shaders that simulate flowing liquid:
   - Vertex shader adds ripples and lumps based on time.
   - Fragment shader creates flowing streaks, bubbles, turbulence, and fresnel edge glow.
   - A `uTime` uniform drives all animation.

3. **Disc mechanism:** Two brown discs (like a coffee machine spout) start raised and lerp downward when pouring begins. The liquid stream activates after a 0.9s delay for visual timing.

---

## 8. Cup Jump Animation

**File:** `Cup.jsx`

### How it works

When pouring completes, `onPourComplete` increments a `swipeTrigger` counter, which triggers a celebration animation:

1. **Delay** (0.45s) — brief pause.
2. **Shrink** (0.2s) — cup scale compresses slightly (anticipation).
3. **Jump** (0.55s) — cup moves up by `JUMP_HEIGHT`, scales back up, and rotates 360° with ease-out.
4. **Land** (0.45s) — cup descends back to its original position.

All driven by a `useFrame` loop tracking elapsed time since trigger.

---

## 9. Debug Overlay

**File:** `HandDebugOverlay.jsx`

A fixed-position canvas (240×150) in the corner showing:
- The mirrored webcam feed drawn via `ctx.drawImage`.
- Hand skeletons drawn on top: 21 joints as green circles connected by bone lines, using the raw landmark data from MediaPipe.

Runs on its own `requestAnimationFrame` loop independent of the Three.js render loop.

---

## Tech Stack

| Layer | Technology |
|---|---|
| 3D rendering | React Three Fiber + Three.js |
| Face detection | MediaPipe FaceDetector (BlazeFace) |
| Hand tracking | MediaPipe HandLandmarker |
| UI framework | React |
| Build tool | Vite |
