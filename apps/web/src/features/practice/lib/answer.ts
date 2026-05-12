export function normalizeAnswer(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function answerMatches(typed: string, expected: string): boolean {
  return normalizeAnswer(typed) === normalizeAnswer(expected);
}
