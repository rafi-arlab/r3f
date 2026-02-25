import { useEffect, useRef, useState } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export function useFaceTracking() {
  const [facePosition, setFacePosition] = useState({ x: 0, y: 0, z: 0 });
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    let video;
    let stream;

    async function setupFaceDetection() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU'
          },
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
        console.log(`Video ready: ${video.videoWidth}x${video.videoHeight}`);
        setIsReady(true);
        setTimeout(() => detectFace(), 100);
      } catch (error) {
        console.error('Error setting up face detection:', error);
      }
    }

    function detectFace() {
      if (!videoRef.current || !faceDetectorRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameRef.current = requestAnimationFrame(detectFace);
        return;
      }

      const startTimeMs = performance.now();
      try {
        const detections = faceDetectorRef.current.detectForVideo(video, startTimeMs);

        if (detections.detections && detections.detections.length > 0) {
          const detection = detections.detections[0];
          const bbox = detection.boundingBox;

          const centerX = (bbox.originX + bbox.width / 2) / video.videoWidth;
          const centerY = (bbox.originY + bbox.height / 2) / video.videoHeight;

          const x = -(centerX - 0.5) * 2; 
          const y = (centerY - 0.5) * 2;
          const z = bbox.width / video.videoWidth; 

          setFacePosition({ x, y, z });
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
      animationFrameRef.current = requestAnimationFrame(detectFace);
    }
    setupFaceDetection();

    return () => {
      if (animationFrameRef.current) 
        cancelAnimationFrame(animationFrameRef.current);
      if (stream) 
        stream.getTracks().forEach(track => track.stop());
      if (videoRef.current) 
        document.body.removeChild(videoRef.current);
    };
  }, []);
  return { facePosition, isReady };
}
