import { createTestClient } from '@dolphy-app/extension-sdk/testing';
import { describe, expect, it } from 'vitest';
import { client } from '../src/index.ts';
import { night } from '../src/theme.ts';

const colorOf = (key: string): string => {
  const color = night.colors[key];
  if (color === undefined) throw new Error(`the theme has no color '${key}'`);
  return color;
};

// WCAG relative luminance of a #rrggbb color
const luminance = (hex: string): number => {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (foreground: string, background: string): number => {
  const [light = 0, dark = 0] = [
    luminance(foreground),
    luminance(background),
  ].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
};

describe('acme.night-theme', () => {
  it('the client adds the theme', async () => {
    const running = await createTestClient(client, {
      extensionId: 'acme.night-theme',
    });
    expect(running.themes).toEqual([night]);
    await running.dispose();
  });

  it.each([
    ['on-surface', 'surface'],
    ['on-surface-variant', 'surface-variant'],
    ['on-background', 'background'],
    ['on-primary', 'primary'],
    ['on-secondary', 'secondary'],
    ['on-error', 'error'],
  ])('%s on %s has a contrast of at least 4.5:1', (foreground, background) => {
    expect(
      contrast(colorOf(foreground), colorOf(background)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('a dark theme has a dark background and a light text', () => {
    const background = luminance(colorOf('background'));
    const text = luminance(colorOf('on-background'));
    expect(night.dark ? background < text : background > text).toBe(true);
  });
});
