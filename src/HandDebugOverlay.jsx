import { useRef, useEffect, useCallback } from 'react';

const OVERLAY_W = 240;
const OVERLAY_H = 150;

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],       // thumb
  [0,5],[5,6],[6,7],[7,8],       // index
  [0,9],[9,10],[10,11],[11,12],  // middle
  [0,13],[13,14],[14,15],[15,16],// ring
  [0,17],[17,18],[18,19],[19,20],// pinky
  [5,9],[9,13],[13,17],          // palm
];

const JOINT_COLOR = '#00ff88';
const BONE_COLOR = 'rgba(0, 255, 136, 0.6)';
const JOINT_RADIUS = 3;
const BONE_WIDTH = 2;

export function HandDebugOverlay({ videoRef, rawLandmarks = [] }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, OVERLAY_W, OVERLAY_H);

    if (video && video.readyState >= 2) {
      ctx.save();
      ctx.translate(OVERLAY_W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, OVERLAY_W, OVERLAY_H);
      ctx.restore();
    }

    for (const hand of rawLandmarks) {
      for (const [a, b] of HAND_CONNECTIONS) {
        const pa = hand[a];
        const pb = hand[b];
        if (!pa || !pb) continue;
        const ax = (1 - pa.x) * OVERLAY_W;
        const ay = pa.y * OVERLAY_H;
        const bx = (1 - pb.x) * OVERLAY_W;
        const by = pb.y * OVERLAY_H;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = BONE_COLOR;
        ctx.lineWidth = BONE_WIDTH;
        ctx.stroke();
      }

      for (const pt of hand) {
        const x = (1 - pt.x) * OVERLAY_W;
        const y = pt.y * OVERLAY_H;
        ctx.beginPath();
        ctx.arc(x, y, JOINT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = JOINT_COLOR;
        ctx.fill();
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [videoRef, rawLandmarks]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={OVERLAY_W}
      height={OVERLAY_H}
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        width: OVERLAY_W,
        height: OVERLAY_H,
        borderRadius: 12,
        border: '2px solid rgba(255,255,255,0.15)',
        zIndex: 100,
        pointerEvents: 'none',
        background: '#000',
      }}
    />
  );
}
