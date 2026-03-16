import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const HAND_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const WRIST_INDEX = 0;
const SWIPE_COOLDOWN_MS = 2000;
const CENTER_X_MIN = 0.2;
const CENTER_X_MAX = 0.8;
const FRAMES_IN_CENTER_REQUIRED = 2;

/**
 * Fires onSwipe when the user's hand is in the center zone (X). Y not used.
 * Returns rotationY and addRotation for cup spin.
 */
export function useHandCenterTrigger(options = {}) {
  const { enabled = true, onSwipe } = options;
  const [rotationY, setRotationY] = useState(0);
  const videoRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastSwipeTimeRef = useRef(0);
  const consecutiveCenterFramesRef = useRef(0);
  const handHasLeftCenterRef = useRef(true);
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
          const wrists = landmarks.slice(0, 2).map((hand) => hand[WRIST_INDEX]).filter(Boolean);
          if (wrists.length > 0) {
            const centerX = wrists.reduce((s, w) => s + w.x, 0) / wrists.length;
            const now = Date.now();
            const inCooldown = now - lastSwipeTimeRef.current < SWIPE_COOLDOWN_MS;
            const inCenterZone = centerX >= CENTER_X_MIN && centerX <= CENTER_X_MAX;
            if (inCenterZone) {
              consecutiveCenterFramesRef.current += 1;
              if (
                handHasLeftCenterRef.current &&
                consecutiveCenterFramesRef.current >= FRAMES_IN_CENTER_REQUIRED &&
                !inCooldown
              ) {
                consecutiveCenterFramesRef.current = 0;
                handHasLeftCenterRef.current = false;
                lastSwipeTimeRef.current = now;
                onSwipeRef.current?.();
              }
            } else {
              consecutiveCenterFramesRef.current = 0;
              handHasLeftCenterRef.current = true;
            }
          } else {
            consecutiveCenterFramesRef.current = 0;
            handHasLeftCenterRef.current = true;
          }
        } else {
          consecutiveCenterFramesRef.current = 0;
          handHasLeftCenterRef.current = true;
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
