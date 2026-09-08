import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onBack: () => void;
}

const DEFAULT_SCRIPT = `# The NEW Agentic OS standard for Claude 5 Models is here

Claude has evolved with today's generation of Claude 5 models being a lot more powerful than everything that came before. 

But the way most people set up their agents and their operating systems have not caught up.

Today I'll teach you this different framework of setting up your Agentic OS so you can get the full power from these new models to make your systems faster, have your setup cost less, and ultimately be more productive than you ever thought possible.

## The ARMS Framework
- A: Applications (Connectors, MCP, Custom Micro Apps)
- R: Routines (Local cron + Cloud Hermes 24/7 scheduled tasks)
- M: Memory (Router files, CLAUDE.md nucleus, Second Brain)
- S: Skills (SOPs, Multi-file router skills, Headless triggers)

Let's break this down from the bottom up.`;

export const TeleprompterApp: React.FC<Props> = ({ onBack }) => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [fontSize, setFontSize] = useState(28);
  const [mirror, setMirror] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;
    if (isPlaying && scrollRef.current) {
      interval = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += speed;
        }
      }, 40);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  return (
    <div className="flex flex-col h-full bg-black text-neutral-100 select-none overflow-hidden font-sans">
      {/* Control Bar */}
      <header className="px-6 py-3 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">📜</span>
          <div>
            <h1 className="text-sm font-bold tracking-wider font-mono text-neutral-200 uppercase">
              MICRO APP • TELEPROMPTER
            </h1>
            <p className="text-[11px] text-neutral-500 font-mono">Script reader for camera & video recordings</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-950'
            }`}
          >
            <span>{isPlaying ? '⏸ PAUSE' : '▶ PLAY'}</span>
          </button>

          <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800">
            <span className="text-neutral-400">VITESSE:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-20 accent-orange-500 cursor-pointer"
            />
            <span className="text-orange-400 w-4 font-bold">{speed}x</span>
          </div>

          <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800">
            <span className="text-neutral-400">TAILLE:</span>
            <button
              onClick={() => setFontSize(Math.max(18, fontSize - 4))}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700"
            >
              -
            </button>
            <span className="text-neutral-200">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(54, fontSize + 4))}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setMirror(!mirror)}
            className={`px-3 py-1.5 rounded-xl border transition-colors ${
              mirror
                ? 'bg-orange-950 border-orange-700 text-orange-400 font-bold'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            MIROIR
          </button>

          <button
            onClick={onBack}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 transition-all hover:border-orange-500/50"
          >
            ← BACK TO OS
          </button>
        </div>
      </header>

      {/* Prompter Scrolling Screen */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full transition-transform ${
          mirror ? 'scale-x-[-1]' : ''
        }`}
        style={{ scrollBehavior: 'smooth' }}
      >
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => setScript(e.currentTarget.innerText)}
          className="outline-none font-semibold text-neutral-200 leading-relaxed space-y-6 focus:ring-0 whitespace-pre-wrap"
          style={{ fontSize: `${fontSize}px` }}
        >
          {script}
        </div>
      </div>
    </div>
  );
};
