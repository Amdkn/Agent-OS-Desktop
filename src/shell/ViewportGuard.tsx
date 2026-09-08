import { useEffect } from 'react';
import React from 'react';
import { useShell, borner } from '../shell/store';
import { cadreBureau } from '../shell/Window';

export function ViewportGuard({ children }: { children: React.ReactNode }): React.ReactNode {
  const windows = useShell((s) => s.windows);
  const moveWindow = useShell((s) => s.moveWindow);
  const resizeWindow = useShell((s) => s.resizeWindow);

  useEffect(() => {
    const checkBoundaries = () => {
      const cadre = cadreBureau();
      const winList = Object.values(windows);

      winList.forEach((win) => {
        if (win.minimized || win.maximized) return;
        const bounded = borner(
          { x: win.x, y: win.y, w: win.w, h: win.h },
          cadre,
          320,
          200,
        );

        if (bounded.x !== win.x || bounded.y !== win.y) {
          moveWindow(win.id, bounded.x, bounded.y);
        }
        if (bounded.w !== win.w || bounded.h !== win.h) {
          resizeWindow(win.id, bounded.w, bounded.h);
        }
      });
    };

    window.addEventListener('resize', checkBoundaries);
    const interval = setInterval(checkBoundaries, 3000);
    return () => {
      window.removeEventListener('resize', checkBoundaries);
      clearInterval(interval);
    };
  }, [windows, moveWindow, resizeWindow]);

  return <>{children}</>;
}
