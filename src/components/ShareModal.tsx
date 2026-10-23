import React, { useRef, useEffect, useState } from 'react';
import { Download, Copy, Check, X, Share2 } from 'lucide-react';

interface ShareModalProps {
  levelNumber: number;
  chapterName: string;
  stars: number;
  timeSec: number;
  mistakes: number;
  isDaily?: boolean;
  dateKey?: string;
  streak: number;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  levelNumber,
  chapterName,
  stars,
  timeSec,
  mistakes,
  isDaily,
  dateKey,
  streak,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-resolution canvas
    const dpr = window.devicePixelRatio || 2;
    const w = 480;
    const h = 280;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Background: elegant minimalist gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative subtle border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Header Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.fillText('ARROW OUT · ZEN PUZZLE', 36, 52);

    // Level & Chapter
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    const mainTitle = isDaily ? `Daily Challenge · ${dateKey}` : `Level ${levelNumber} · Chapter: ${chapterName}`;
    ctx.fillText(mainTitle, 36, 88);

    // Star rating
    const starY = 135;
    for (let i = 1; i <= 3; i++) {
      const active = i <= stars;
      ctx.fillStyle = active ? '#fbbf24' : '#334155';
      ctx.beginPath();
      // Draw 5-pointed star
      const cx = 48 + (i - 1) * 36;
      const cy = starY;
      const spikes = 5;
      const outerRadius = 14;
      const innerRadius = 7;
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerRadius);
      for (let s = 0; s < spikes; s++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    }

    // Performance statement
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 14px system-ui, sans-serif';
    const perfText = mistakes === 0 ? 'No mistakes · Perfect run' : `${mistakes} mistake${mistakes > 1 ? 's' : ''}`;
    ctx.fillText(perfText, 160, 140);

    // Divider line
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(36, 175);
    ctx.lineTo(w - 36, 175);
    ctx.stroke();

    // Bottom Stats: Time & Streak
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px system-ui, sans-serif';
    ctx.fillText('Time taken', 36, 206);
    ctx.fillText('Daily Streak', 180, 206);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(formatTime(timeSec), 36, 230);
    ctx.fillText(`${streak} days 🔥`, 180, 230);

    // Subtle Brand Watermark
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px system-ui, sans-serif';
    ctx.fillText('Play at aistudio.google.com', w - 185, 230);
  }, [levelNumber, chapterName, stars, timeSec, mistakes, isDaily, dateKey, streak]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ArrowOut-Level-${levelNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      // Fallback to text copy
      navigator.clipboard.writeText(
        `I cleared ${isDaily ? 'Daily Challenge' : `Level ${levelNumber}`} in Arrow Out: Zen Puzzle with ${stars} stars in ${formatTime(timeSec)}!`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 text-white shadow-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-slate-100">Share Victory Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Display */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-800 mb-5 bg-slate-950 flex justify-center">
          <canvas
            ref={canvasRef}
            className="w-full max-w-md h-auto block"
            style={{ aspectRatio: '480 / 280' }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleCopy}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-2 active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Card'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
