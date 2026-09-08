import React, { useState, useRef } from 'react';

interface Props {
  onBack: () => void;
}

export const ExcalidrawCanvas: React.FC<Props> = ({ onBack }) => {
  const [tool, setTool] = useState<'select' | 'rect' | 'circle' | 'arrow' | 'text' | 'pencil'>('pencil');
  const [color, setColor] = useState('#f97316');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] text-neutral-200 select-none overflow-hidden font-sans">
      {/* Top Header & Toolbar */}
      <header className="px-6 py-3 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">📐</span>
          <div>
            <h1 className="text-sm font-bold tracking-wider font-mono text-neutral-200 uppercase">
              MICRO APP • EXCALIDRAW LANDING PAD
            </h1>
            <p className="text-[11px] text-neutral-500 font-mono">
              Hand-drawn diagram whiteboard & visual artifact landing pad
            </p>
          </div>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
            {(['pencil', 'rect', 'circle', 'arrow', 'text'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  tool === t ? 'bg-neutral-800 text-orange-400 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">
            {['#f97316', '#38bdf8', '#a855f7', '#10b981', '#ffffff'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border transition-all ${
                  color === c ? 'scale-125 border-white ring-2 ring-orange-500/30' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <button
            onClick={clearCanvas}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-400 hover:text-red-400 transition-colors"
          >
            Effacer
          </button>

          <button
            onClick={onBack}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 font-mono transition-all hover:border-orange-500/50"
          >
            ← BACK TO OS
          </button>
        </div>
      </header>

      {/* Canvas Area */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={1200}
          height={750}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="bg-[#18181b] border border-neutral-800 rounded-2xl shadow-2xl cursor-crosshair max-w-full max-h-full"
        />
      </div>
    </div>
  );
};
