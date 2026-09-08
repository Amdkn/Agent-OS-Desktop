/**
 * Poignee — separateur vertical glissable entre deux panneaux.
 *
 * POURQUOI
 * Des panneaux a largeur fixe rendent une app inutilisable des que le contenu
 * ne rentre pas : on ne peut ni elargir l'arborescence pour lire un nom long,
 * ni retrecir le plan pour donner de la place au texte.
 *
 * COMMENT
 * Le parent detient la largeur ; la poignee ne fait que la modifier. Les
 * ecouteurs sont poses sur `window` pendant le glissement, pas sur la poignee :
 * une souris qui sort de l'element pendant un drag cesserait sinon d'emettre,
 * et le panneau resterait bloque a mi-course.
 *
 * La largeur est bornee : sans minimum, un double-clic maladroit reduit un
 * panneau a zero et il devient impossible de le rattraper a la souris.
 */

import { useCallback, useEffect, useRef } from 'react';

export interface PoigneeProps {
  /** Largeur courante du panneau situe a GAUCHE de la poignee. */
  largeur: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}

export function Poignee({ largeur, onChange, min = 140, max = 900 }: PoigneeProps) {
  const drag = useRef<{ x0: number; l0: number } | null>(null);

  const bouger = useCallback((e: MouseEvent) => {
    if (!drag.current) return;
    const n = drag.current.l0 + (e.clientX - drag.current.x0);
    onChange(Math.max(min, Math.min(max, n)));
  }, [onChange, min, max]);

  const relacher = useCallback(() => {
    drag.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', bouger);
    window.addEventListener('mouseup', relacher);
    return () => {
      window.removeEventListener('mousemove', bouger);
      window.removeEventListener('mouseup', relacher);
    };
  }, [bouger, relacher]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={largeur}
      tabIndex={0}
      title="Glisser pour redimensionner · double-clic pour réinitialiser"
      onMouseDown={(e) => {
        drag.current = { x0: e.clientX, l0: largeur };
        // Pendant un glissement, le curseur et la selection de texte doivent
        // etre neutralises sur TOUTE la page, sinon on selectionne le contenu
        // des panneaux en les redimensionnant.
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }}
      onDoubleClick={() => onChange(Math.round((min + Math.min(max, 420)) / 2))}
      onKeyDown={(e) => {
        // Accessible au clavier : une poignee qui n'obeit qu'a la souris exclut
        // la navigation au clavier que ce bureau encourage par ailleurs.
        if (e.key === 'ArrowLeft') onChange(Math.max(min, largeur - 16));
        if (e.key === 'ArrowRight') onChange(Math.min(max, largeur + 16));
      }}
      className="w-1 shrink-0 cursor-col-resize bg-white/5 hover:bg-[var(--color-accent)]/60
                 focus:bg-[var(--color-accent)] focus:outline-none transition-colors"
    />
  );
}
