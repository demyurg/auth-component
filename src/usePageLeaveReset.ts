// hooks/usePageLeaveReset.js
import { useEffect } from 'react';

export const usePageLeaveReset = (resetCallback: () => void) => {

  useEffect(() => {
    const events = [
      { target: window, type: 'beforeunload', handler: resetCallback },
      { target: document, type: 'visibilitychange', handler: () => {
        if (document.hidden) resetCallback();
      }},
      { target: window, type: 'blur', handler: resetCallback },
      { target: window, type: 'pagehide', handler: resetCallback }
    ];

    events.forEach(({ target, type, handler }) => {
      target.addEventListener(type, handler);
    });

    return () => {
      events.forEach(({ target, type, handler }) => {
        target.removeEventListener(type, handler);
      });
    };
  }, [resetCallback]);
};
