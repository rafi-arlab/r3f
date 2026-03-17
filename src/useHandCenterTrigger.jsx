import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const HAND_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const WRIST_INDEX = 0;
// Remap Y so physical top (where detection often fails) isn't required: physical [Y_TOP_MARGIN, 1] -> [0, 1]
const Y_TOP_MARGIN = 0.12;

/**
 * Hand tracking: returns handPositions (wrist { x, y } per hand, normalized 0-1). Y remapped so top is reachable without hand at frame top.
 */
export function useHandCenterTrigger(options = {}) {
  const { enabled = true } = options;
  const [handPositions, setHandPositions] = useState([]);
  const videoRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);

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
          const positions = landmarks.map((hand) => {
            const rawY = hand[WRIST_INDEX].y;
            const remappedY = (rawY - Y_TOP_MARGIN) / (1 - Y_TOP_MARGIN);
            return {
              x: hand[WRIST_INDEX].x,
              y: Math.max(0, Math.min(1, remappedY))
            };
          });
          setHandPositions(positions);
        } else {
          setHandPositions([]);
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

  return { handPositions };
}
