import { SuffixTree } from './suffixTree';
import { longestPalindrome } from './palindrome';

// Сверяем с простыми медленными решениями на случайных строках из маленького алфавита,
// чтобы было много повторов и палиндромов.

const RUNS = 1000;

function randomString(maxLength: number, alphabet: string): string {
  const length = Math.floor(Math.random() * (maxLength + 1));
  let s = '';
  for (let i = 0; i < length; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function assert(ok: boolean, what: string): void {
  if (!ok) throw new Error(what);
}

function check(name: string, test: () => void): void {
  for (let i = 0; i < RUNS; i++) test();
  console.log(`ок  ${name} — ${RUNS} случайных прогонов`);
}

const isPalindrome = (s: string) => s === [...s].reverse().join('');

// Медленно, но наверняка: расширяемся от каждого центра, O(n²).
function slowLongestPalindrome(s: string): number {
  let best = 0;
  for (let center = 0; center < 2 * s.length - 1; center++) {
    let l = Math.floor(center / 2);
    let r = l + (center % 2);
    while (l >= 0 && r < s.length && s[l] === s[r]) {
      l--;
      r++;
    }
    best = Math.max(best, r - l - 1);
  }
  return best;
}

check('includes совпадает с String.includes', () => {
  const text = randomString(30, 'abc');
  const tree = SuffixTree.fromString(text);

  for (let i = 0; i < 30; i++) {
    const pattern = randomString(5, 'abc');
    assert(tree.includes(pattern) === text.includes(pattern), `«${text}».includes(«${pattern}»)`);
  }
  for (let i = 0; i < text.length; i++) assert(tree.includes(text.slice(i)), `суффикс ${i} в «${text}»`);
  assert(tree.nodeCount <= 2 * (text.length + 1), 'узлов не больше 2n');
});

check('longestPalindrome совпадает с перебором', () => {
  const s = randomString(40, Math.random() < 0.5 ? 'ab' : 'abc');
  const found = longestPalindrome(s);

  assert(isPalindrome(found), `«${found}» не палиндром`);
  assert(s.includes(found), `«${found}» нет в «${s}»`);
  assert(found.length === slowLongestPalindrome(s), `«${s}»: нашли «${found}»`);
});

console.log('Все проверки пройдены');
