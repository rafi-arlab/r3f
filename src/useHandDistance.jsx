import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const HAND_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

/** MediaPipe hand landmark indices */
const WRIST_INDEX = 0;
const THUMB_TIP_INDEX = 4;
const INDEX_TIP_INDEX = 8;

/** Horizontal movement (normalized 0–1) to Y rotation in radians */
const SWIPE_SENSITIVITY = 4;

function distance2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Hook that runs hand detection and exposes pinch (thumb–index distance) for scale
 * and horizontal swipe for cup rotation.
 * @param {{ enabled?: boolean }} options - Set enabled to false to pause detection.
 * @returns {{ pinchSize: number | null, rotationY: number }} pinchSize from 1 or 2 hands (persists when hands leave); rotationY in radians.
 */
export function useHandDistance(options = {}) {
  const { enabled = true } = options;
  const [pinchSize, setPinchSize] = useState(null);
  const [rotationY, setRotationY] = useState(0);
  const videoRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastHandCenterXRef = useRef(null);

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

        // Pinch: thumb–index distance per hand; average if two hands (drives scale, no conflict with swipe)
        if (landmarks.length >= 1) {
          const pinches = landmarks.slice(0, 2).map((lm) => {
            const thumb = lm[THUMB_TIP_INDEX];
            const index = lm[INDEX_TIP_INDEX];
            return thumb && index ? distance2(thumb, index) : null;
          }).filter((p) => p != null);
          if (pinches.length > 0) {
            const avg = pinches.reduce((a, b) => a + b, 0) / pinches.length;
            setPinchSize(avg);
          }
        }

        // Swipe: horizontal hand center drives Y rotation (works with 1 or 2 hands)
        if (landmarks.length >= 1) {
          const wrists = landmarks.slice(0, 2).map((lm) => lm[WRIST_INDEX]).filter(Boolean);
          if (wrists.length > 0) {
            const centerX = wrists.reduce((s, w) => s + w.x, 0) / wrists.length;
            const prev = lastHandCenterXRef.current;
            if (prev !== null) {
              const deltaX = centerX - prev;
              setRotationY((r) => r + deltaX * SWIPE_SENSITIVITY);
            }
            lastHandCenterXRef.current = centerX;
          }
        } else {
          lastHandCenterXRef.current = null;
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

  return { pinchSize, rotationY };
}
