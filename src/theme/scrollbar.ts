import { SCROLLBAR_SIZE_PX } from '@/constants/layout';
import { LIGHT_COLORS, type ThemeColors } from '@/theme/colors';

export function scrollbarCss(colors: ThemeColors = LIGHT_COLORS): string {
  return `
:root {
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-muted: ${colors.muted};
  --color-primary: ${colors.primary};
  --color-danger: ${colors.danger};
  --color-border: ${colors.border};
  --scrollbar-size: ${SCROLLBAR_SIZE_PX}px;
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) var(--color-background);
}

*::-webkit-scrollbar {
  width: var(--scrollbar-size);
  height: var(--scrollbar-size);
}

*::-webkit-scrollbar-track {
  background: var(--color-background);
}

*::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 999px;
}

*::-webkit-scrollbar-thumb:hover {
  background: var(--color-muted);
}
`;
}

export function applyCssVariables(colors: ThemeColors): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-muted', colors.muted);
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-danger', colors.danger);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--scrollbar-size', `${SCROLLBAR_SIZE_PX}px`);
}
