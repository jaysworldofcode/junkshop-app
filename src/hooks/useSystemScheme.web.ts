import { useEffect, useState } from 'react';

export function useSystemScheme(): 'light' | 'dark' {
  const [scheme, setScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyScheme = () => {
      setScheme(media.matches ? 'dark' : 'light');
    };

    applyScheme();
    media.addEventListener('change', applyScheme);

    return () => {
      media.removeEventListener('change', applyScheme);
    };
  }, []);

  return scheme;
}
