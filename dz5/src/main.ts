import { Trie } from './trie';

const dict = new Trie();
dict.addAll(['кот', 'кошка', 'котёнок', 'код', 'кодекс', 'дом', 'домик']);
dict.add('мышь');

for (const word of ['кот', 'кошка', 'ко', 'мышь', 'мыш', 'собака']) {
  console.log(`${word} — ${dict.has(word) ? 'есть' : 'нет'}`);
}
console.log();

import { existsSync, readFileSync } from 'fs';

// Замер на настоящем словаре: в macOS есть список из 235 тыс. английских слов.
const FILE = '/usr/share/dict/words';

if (existsSync(FILE)) {
  const words = readFileSync(FILE, 'utf8').split('\n').filter(Boolean);
  const letters = words.reduce((sum, w) => sum + w.length, 0);

  const big = new Trie();
  let start = performance.now();
  big.addAll(words);
  const buildMs = performance.now() - start;

  start = performance.now();
  for (const word of words) big.has(word);
  const hasUs = ((performance.now() - start) * 1000) / words.length;

  const share = ((100 * big.nodeCount) / letters).toFixed(0);
  console.log(`Слов:              ${big.size}`);
  console.log(`Букв всего, N:     ${letters}`);
  console.log(`Узлов в дереве, T: ${big.nodeCount} (${share}% от N)`);
  console.log(`Ссылок на детей:   ${big.nodeCount - 1} (массив на 26 букв — ${26 * big.nodeCount})`);
  console.log(`Добавить все:      ${buildMs.toFixed(0)} мс`);
  console.log(`Проверить слово:   ${hasUs.toFixed(2)} мкс`);
} else {
  console.log(`Нет файла ${FILE} — замер на большом словаре пропущен`);
}
