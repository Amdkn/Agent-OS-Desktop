import React, { useState } from 'react';
import type { GenerationAsset } from '../types';

interface Props {
  onBack: () => void;
}

const MOCK_GENERATIONS: GenerationAsset[] = [
  {
    id: 'gen-1',
    title: 'Financial Services AI Advisory Mockup',
    client: 'Australia FinCorp',
    date: '2026-08-28',
    type: 'mockup',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
    prompt: 'Create high-fidelity executive fintech dashboard mockup with AI asset allocator and portfolio simulator.',
    ratio: '16:9',
  },
  {
    id: 'gen-2',
    title: 'Beto Green Sustainability Architecture',
    client: 'Beto Green',
    date: '2026-08-25',
    type: 'mockup',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=60',
    prompt: 'Clean green-tech enterprise portal with carbon tracking metrics and automated compliance pipeline.',
    ratio: '16:9',
  },
  {
    id: 'gen-3',
    title: 'THRO Client Portal & Design Spec',
    client: 'THRO',
    date: '2026-08-05',
    type: 'html',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60',
    prompt: 'Interactive HTML spec generated on 5th Aug for THRO platform multi-tier agent loop.',
    ratio: '16:9',
  },
  {
    id: 'gen-4',
    title: 'Claude 5 YouTube Thumbnail 3D Render',
    client: 'RoboNuggets',
    date: '2026-08-30',
    type: 'image',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
    prompt: 'Futuristic glowing cybernetic sphere with orange and purple energy arcs for YouTube thumbnail.',
    ratio: '16:9',
  },
  {
    id: 'gen-5',
    title: 'ARMS Framework Architecture Diagram',
    client: 'RoboNuggets',
    date: '2026-08-29',
    type: 'image',
    thumbnailUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=60',
    prompt: 'Hand-drawn style digital architecture illustration showing 4 layers of ARMS system on dark desk.',
    ratio: '16:9',
  },
  {
    id: 'gen-6',
    title: 'Amadeus Autonomous Agent Swarm Report',
    client: 'Amadeus',
    date: '2026-08-31',
    type: 'pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60',
    prompt: 'Multi-agent orchestration audit report with throughput benchmarks and latency graphs.',
    ratio: '4:3',
  },
];

export const GenerationsGallery: React.FC<Props> = ({ onBack }) => {
  const [filterClient, setFilterClient] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<GenerationAsset | null>(null);

  const clients = ['ALL', ...Array.from(new Set(MOCK_GENERATIONS.map((g) => g.client)))];
  const filtered = filterClient === 'ALL' ? MOCK_GENERATIONS : MOCK_GENERATIONS.filter((g) => g.client === filterClient);

  return (
    <div className="flex flex-col h-full bg-[#08080b] text-neutral-200 select-none overflow-hidden font-sans">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-base shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            🖼️
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-100 uppercase tracking-wider font-mono">
              MICRO APP • GENERATIONS MASONRY
            </h1>
            <p className="text-[11px] text-neutral-500 font-mono">
              Visual repository of all generated images, video frames, client mockups & interactive HTML assets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[11px] font-mono">
            {clients.map((c) => (
              <button
                key={c}
                onClick={() => setFilterClient(c)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterClient === c
                    ? 'bg-neutral-800 text-orange-400 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <button
            onClick={onBack}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold font-mono text-neutral-300 transition-all hover:border-orange-500/50"
          >
            ← BACK TO THE OS
          </button>
        </div>
      </header>

      {/* Masonry Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="group bg-neutral-900/60 border border-neutral-800/80 hover:border-orange-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-2xl hover:shadow-orange-950/20 cursor-pointer flex flex-col"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-neutral-700 text-[10px] font-mono text-orange-400 font-bold uppercase">
                  {asset.type}
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-neutral-400">
                  {asset.date}
                </div>
              </div>

              {/* Metadata */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[10px] font-mono text-orange-500 uppercase tracking-wider font-semibold">
                    {asset.client}
                  </div>
                  <h3 className="text-xs font-bold text-neutral-100 group-hover:text-orange-300 transition-colors line-clamp-1 mt-0.5">
                    {asset.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                    {asset.prompt}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>Ratio: {asset.ratio}</span>
                  <span className="text-orange-400 group-hover:underline">Inspect Asset →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Asset Inspector */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden text-neutral-200">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <span className="font-mono text-xs text-orange-400 font-bold">{selectedAsset.title}</span>
              <button
                onClick={() => setSelectedAsset(null)}
                className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
                <img src={selectedAsset.thumbnailUrl} alt={selectedAsset.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1.5 text-xs font-mono">
                <div className="text-neutral-400"><strong className="text-neutral-200">Client:</strong> {selectedAsset.client}</div>
                <div className="text-neutral-400"><strong className="text-neutral-200">Date:</strong> {selectedAsset.date}</div>
                <div className="text-neutral-400"><strong className="text-neutral-200">Prompt:</strong> {selectedAsset.prompt}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
