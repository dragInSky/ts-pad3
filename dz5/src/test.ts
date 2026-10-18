import { Trie } from './trie';

// Сверяем Trie с обычным Set на случайных словах. Алфавит маленький,
// чтобы у слов было много общих начал — как в настоящем языке.

const RUNS = 1000;
const ALPHABET = 'абвг';

function randomWord(maxLength: number): string {
  const length = Math.floor(Math.random() * (maxLength + 1));
  let word = '';
  for (let i = 0; i < length; i++) word += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return word;
}

function randomWords(count: number): string[] {
  return Array.from({ length: Math.floor(Math.random() * count) }, () => randomWord(6));
}

function assert(ok: boolean, what: string): void {
  if (!ok) throw new Error(what);
}

function check(name: string, test: () => void): void {
  for (let i = 0; i < RUNS; i++) test();
  console.log(`ок  ${name} — ${RUNS} случайных прогонов`);
}

check('has совпадает с Set', () => {
  const words = randomWords(40);
  const trie = new Trie();
  trie.addAll(words.slice(0, 20));
  for (const word of words.slice(20)) trie.add(word);

  const set = new Set(words);
  for (let i = 0; i < 50; i++) {
    const query = randomWord(7);
    assert(trie.has(query) === set.has(query), `has(${query})`);
  }
  for (const word of words) assert(trie.has(word), `добавленное слово ${word}`);
  assert(trie.size === set.size, 'size');
});

check('узлов столько, сколько разных префиксов', () => {
  const words = randomWords(40);
  const trie = new Trie();
  trie.addAll(words);

  const prefixes = new Set(['']);
  for (const word of words) {
    for (let i = 1; i <= word.length; i++) prefixes.add(word.slice(0, i));
  }
  const letters = words.reduce((sum, w) => sum + w.length, 0);

  assert(trie.nodeCount === prefixes.size, 'nodeCount');
  assert(trie.nodeCount <= letters + 1, 'узлов не больше, чем букв');
});

console.log('Все проверки пройдены');
