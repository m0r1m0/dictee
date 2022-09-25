import 'jest';
import { isSymbol } from './symbol';

test("isSymbol()", () => {
  const symbols = [",", ".", "?", "\"", "-", "'", "!"];
  symbols.forEach(symbol => {
    const result = isSymbol(symbol);
    expect(result).toBe(true);
  });
})