/**
 * VetoBand — le bandeau transverse Beth.
 *
 * Présent sur toutes les vues, tous les domaines : il rappelle que Beth a
 * un VETO READY et énumère les portes irréversibles — les actions qu'aucun
 * agent ne franchit sans un humain (Amadou).
 */

import { PORTES_IRREVERSIBLES } from '../types';

export function VetoBand() {
  return (
    <div
      className="shrink-0 px-3 py-1.5 flex items-center gap-3 text-[11px] font-mono border-b"
      style={{
        background: 'rgba(120, 20, 20, 0.35)',
        borderColor: 'rgba(255, 120, 120, 0.25)',
        backdropFilter: 'blur(8px)',
      }}
      title="Beth — bandeau transverse de gouvernance"
    >
      <span
        className="shrink-0 px-2 py-0.5 rounded font-bold tracking-wider"
        style={{
          background: 'rgba(220, 38, 38, 0.85)',
          color: '#fff',
          boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)',
        }}
      >
        VETO READY
      </span>
      <span className="shrink-0 text-red-200/80">Beth · portes irréversibles :</span>
      <span className="text-red-100/90 truncate">
        {PORTES_IRREVERSIBLES.join(' · ')}
      </span>
    </div>
  );
}
