const symbolRegex = /[,.?"\-'!]/;

export const isSymbol = (text: string): boolean => {
  return symbolRegex.test(text);
}