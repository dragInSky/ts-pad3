const PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{', '>': '<' };
const OPENING = new Set(Object.values(PAIRS));

export function isBalanced(str: string): boolean {
  const stack: string[] = [];

  for (const ch of str) {
    if (OPENING.has(ch)) {
      stack.push(ch);
    } else if (ch in PAIRS) {
      if (stack.pop() !== PAIRS[ch]) return false;
    }
  }

  return stack.length === 0;
}
