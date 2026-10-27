import { SuffixTree } from './suffixTree';

const tree = SuffixTree.fromString('banana');
for (const p of ['ana', 'nan', 'banana', 'nab', 'ab']) {
  console.log(`banana содержит «${p}» — ${tree.includes(p) ? 'да' : 'нет'}`);
}
console.log(`Узлов: ${tree.nodeCount}, а длина с терминатором — 7`);
console.log();

import { longestPalindrome } from './palindrome';

for (const s of ['abacdfgdcaba', 'cbbd', 'забавный шалаш у казака', 'потоп и ротор']) {
  console.log(`${s} → «${longestPalindrome(s)}»`);
}
console.log();

// Замер: 100 тыс. случайных символов, а в середине спрятан палиндром длины 1001.
const random = (length: number) =>
  Array.from({ length }, () => (Math.random() < 0.5 ? 'a' : 'b')).join('');
const half = random(500);
const text = random(50_000) + half + 'x' + [...half].reverse().join('') + random(50_000);

let start = performance.now();
const big = SuffixTree.fromString(text);
console.log(`Дерево для ${text.length} символов: ${big.nodeCount} узлов, ${(performance.now() - start).toFixed(0)} мс`);

start = performance.now();
const found = longestPalindrome(text);
console.log(`Самый длинный палиндром: ${found.length} символов, ${(performance.now() - start).toFixed(0)} мс`);
