import { useEffect, useRef, useState } from 'react';

export function useNow() {
  const [now, setNow] = useState(Date.now);
  const timer = useRef(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    timer.current = setInterval(update, 1000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(timer.current);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return now;
}
