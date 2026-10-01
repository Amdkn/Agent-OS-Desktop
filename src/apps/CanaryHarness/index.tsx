import React, { useState } from 'react';
import type { AppManifest } from '../../types';
import { canaryFixtures } from './fixtures';
import { resolveDisplayStatus } from '../../hooks/useRuntimePresence';
import type { RuntimePresence } from '../../contracts/truth';

export const manifest: AppManifest = {
  id: 'canary-harness',
  name: 'Canary Harness',
  kind: 'singleton',
  description: 'Deterministic E2E Canary Harness for P5 CERT (Aspace_OS_V3 #238)',
  icon: '🐦',
  domaine: 'l0-tech',
  dockSlot: 4
};

export function App() {
  const [selectedFixtureIndex, setSelectedFixtureIndex] = useState<number>(0);

  const currentFixture = canaryFixtures[selectedFixtureIndex];
  
  // Resolve the UI display status derived from the projected truth
  const displayStatus = resolveDisplayStatus(
    currentFixture, 
    currentFixture.data?.presence as RuntimePresence | undefined
  );

  return (
    <div className="p-4 bg-gray-900 text-white h-full overflow-y-auto font-mono text-sm flex flex-col gap-6">
      <header className="border-b border-gray-700 pb-4">
        <h1 className="text-xl font-bold mb-2 flex items-center gap-2">
          <span>🐦</span> Canary Harness - P5 CERT
        </h1>
        <p className="text-gray-400">Deterministic E2E Validation of Runtime Presence Projection</p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-200">1. Select Golden Canary State</h2>
        <div className="flex flex-wrap gap-2">
          {[
            '1: Live + Fresh',
            '2: Live + Stale Cloud',
            '3: Dead + False Live',
            '4: Repo Drift',
            '5: No Supabase',
            '6: No Local',
            '7: New Fencing'
          ].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedFixtureIndex(idx)}
              className={`px-3 py-1 rounded border ${
                selectedFixtureIndex === idx 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg shadow-sm flex flex-col gap-3">
           <h3 className="text-md font-semibold text-blue-400 border-b border-gray-700 pb-2">API Projection (Truth)</h3>
           <div className="grid grid-cols-[140px_1fr] gap-2">
             <span className="text-gray-400">Status:</span>
             <span className={currentFixture.status === 'ERROR' ? 'text-red-400' : 'text-green-400'}>
               {currentFixture.status}
             </span>
             
             <span className="text-gray-400">System Status:</span>
             <span className="text-yellow-400">{currentFixture.systemStatus}</span>
             
             <span className="text-gray-400">Reconciliation:</span>
             <span className="text-purple-400">{currentFixture.reconciliationState}</span>
             
             <span className="text-gray-400">Evidence Refs:</span>
             <span className="text-gray-300">{currentFixture.evidenceRefs.join(', ')}</span>
           </div>
           
           <div className="mt-2">
             <span className="text-gray-400 block mb-1">Raw Projection Data:</span>
             <pre className="bg-black p-2 rounded text-xs text-green-300 overflow-x-auto">
               {JSON.stringify(currentFixture.data || { error: currentFixture.error }, null, 2)}
             </pre>
           </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg shadow-sm flex flex-col gap-3">
           <h3 className="text-md font-semibold text-green-400 border-b border-gray-700 pb-2">UI Match (Display)</h3>
           
           <div className="flex items-center gap-4 p-3 bg-black rounded border border-gray-700">
             <div className="text-gray-400">Derived Status:</div>
             <div className={`px-3 py-1 rounded font-bold text-sm ${
               displayStatus === 'AVAILABLE' ? 'bg-green-900 text-green-300' :
               displayStatus === 'EXECUTING' ? 'bg-blue-900 text-blue-300' :
               displayStatus === 'BOUND' ? 'bg-purple-900 text-purple-300' :
               displayStatus === 'OFFLINE' ? 'bg-red-900 text-red-300' :
               displayStatus === 'STALE' ? 'bg-orange-900 text-orange-300' :
               displayStatus === 'DEGRADED' ? 'bg-yellow-900 text-yellow-300' :
               'bg-gray-700 text-gray-300'
             }`}>
               {displayStatus}
             </div>
           </div>

           <div className="mt-2 text-sm text-gray-400">
             <p className="mb-2"><strong>Invariant Check (No False LIVE):</strong></p>
             <p className="flex items-center gap-2">
                {displayStatus !== 'UNKNOWN' && displayStatus !== 'OFFLINE' ? (
                  currentFixture.data?.presence ? <span className="text-green-500">✅ Presence Validated</span> : <span className="text-red-500">❌ Error: Live without presence</span>
                ) : (
                  <span className="text-green-500">✅ Safely Offline/Unknown</span>
                )}
             </p>
           </div>
           
           <div className="mt-4">
             <span className="text-gray-400 block mb-1">Reconciliation Receipt:</span>
             <pre className="bg-black p-2 rounded text-xs text-blue-300 overflow-x-auto">
               {JSON.stringify(currentFixture.fingerprint, null, 2)}
             </pre>
           </div>
        </div>
      </section>

      <section className="bg-blue-900/30 border border-blue-800 p-4 rounded-lg mt-4">
        <h3 className="text-md font-semibold text-blue-300 mb-2 flex items-center gap-2">
          <span>⚠️</span> Real Integration Canary Instructions
        </h3>
        <p className="text-gray-300 text-sm mb-2">
          To run the true E2E local canary, you must run this harness with actual local credentials (unavailable to Jules).
          See <code>LOCAL_CANARY_REQUIRED.md</code> in the project root for execution instructions.
        </p>
      </section>
    </div>
  );
}
