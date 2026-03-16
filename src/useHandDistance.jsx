import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const HAND_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const WRIST_INDEX = 0;
const SWIPE_THRESHOLD = 0.05;
const SWIPE_COOLDOWN_MS = 400;

/**
 * Hook that runs hand detection and fires onSwipe when a swipe is detected.
 * Returns rotationY (persistent) and addRotation so the jump animation can add 360° when it completes.
 */
export function useHandDistance(options = {}) {
  const { enabled = true, onSwipe } = options;
  const [rotationY, setRotationY] = useState(0);
  const videoRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastCenterXRef = useRef(null);
  const accumulatedRef = useRef(0);
  const lastSwipeTimeRef = useRef(0);
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  const addRotation = (delta) => setRotationY((r) => r + delta);

  useEffect(() => {
    if (!enabled) return;

    let video;
    let stream;

    async function setupHandDetection() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: HAND_LANDMARKER_MODEL
          },
          numHands: 2,
          runningMode: 'VIDEO'
        });

        video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.style.display = 'none';
        videoRef.current = video;
        document.body.appendChild(video);

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        video.srcObject = stream;
        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve();
        });
        await video.play();
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (video.videoWidth === 0 || video.videoHeight === 0) {
          throw new Error('Video dimensions are invalid');
        }

        detectHands();
      } catch (error) {
        console.error('Error setting up hand detection:', error);
      }
    }

    function detectHands() {
      if (!enabled || !videoRef.current || !handLandmarkerRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameRef.current = requestAnimationFrame(detectHands);
        return;
      }

      const timestamp = performance.now();
      try {
        const result = handLandmarkerRef.current.detectForVideo(video, timestamp);
        const landmarks = result.landmarks ?? [];

        if (landmarks.length >= 1) {
          const wrists = landmarks.slice(0, 2).map((lm) => lm[WRIST_INDEX]).filter(Boolean);
          if (wrists.length > 0) {
            const centerX = wrists.reduce((s, w) => s + w.x, 0) / wrists.length;
            const prevX = lastCenterXRef.current;
            const now = Date.now();
            const inCooldown = now - lastSwipeTimeRef.current < SWIPE_COOLDOWN_MS;

            if (prevX !== null && !inCooldown) {
              const deltaX = centerX - prevX;
              accumulatedRef.current += deltaX;

              if (accumulatedRef.current >= SWIPE_THRESHOLD) {
                accumulatedRef.current = 0;
                lastSwipeTimeRef.current = now;
                onSwipeRef.current?.();
              } else if (accumulatedRef.current <= -SWIPE_THRESHOLD) {
                accumulatedRef.current = 0;
                lastSwipeTimeRef.current = now;
                onSwipeRef.current?.();
              }
            } else if (inCooldown) {
              accumulatedRef.current = 0;
            }

            lastCenterXRef.current = centerX;
          }
        } else {
          lastCenterXRef.current = null;
          accumulatedRef.current = 0;
        }
      } catch (error) {
        console.error('Hand detection error:', error);
      }

      animationFrameRef.current = requestAnimationFrame(detectHands);
    }

    setupHandDetection();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current && document.body.contains(videoRef.current)) {
        document.body.removeChild(videoRef.current);
      }
      videoRef.current = null;
    };
  }, [enabled]);

  return { rotationY, addRotation };
}
