import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('aleatoriedad', () => {
  it('src/engine no usa Math.random', () => {
    const directory = new URL('../../src/engine/', import.meta.url);
    const files = readdirSync(directory).filter((file) => file.endsWith('.ts'));

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(new URL(file, directory), 'utf8')).not.toContain('Math.random');
    }
  });
});
