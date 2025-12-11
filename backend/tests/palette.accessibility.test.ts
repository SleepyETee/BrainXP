import test from 'node:test';
import assert from 'node:assert';
import { paletteMap } from '../../src/theme/palettes';

test('palettes expose full primary and accent scales', () => {
  (['minimal', 'game', 'study'] as const).forEach((mode) => {
    const palette = paletteMap[mode];
    assert.ok(palette.primary[50], `primary[50] missing for ${mode}`);
    assert.ok(palette.primary[500], `primary[500] missing for ${mode}`);
    assert.ok(palette.primary[900], `primary[900] missing for ${mode}`);
    assert.ok(palette.accent[500], `accent[500] missing for ${mode}`);
  });
});
