import assert from 'node:assert/strict';
import { test } from 'node:test';

import { centavosToPesos, formatPeso, pesosToCentavos } from './money';

test('converts pesos to integer centavos', () => {
  assert.equal(pesosToCentavos(420), 42000);
  assert.equal(pesosToCentavos(14_910), 1_491_000);
});

test('converts centavos back to pesos', () => {
  assert.equal(centavosToPesos(42000), 420);
});

test('formats peso amounts with two decimal places', () => {
  const formatted = formatPeso(1_491_000);
  assert.match(formatted, /14,910\.00/);
});
