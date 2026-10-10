import { mergeSort } from './mergeSort';

const data = [38, 27, 43, 3, 9, 82, 10];
const sorted = mergeSort(data);
console.log('Было:  ', data.join(' '));
console.log('Стало: ', sorted.join(' '));
console.log();

import { binarySearch } from './binarySearch';

for (const x of [43, 3, 100]) {
  const i = binarySearch(sorted, x);
  console.log(i === -1 ? `${x} — нет в массиве` : `${x} — нашёлся на месте ${i}`);
}
console.log();

import { isBalanced } from './brackets';

for (const s of ['({})', '({)}', '<[()]>{}', '(()', ')(']) {
  console.log(`${s} — ${isBalanced(s) ? 'ок' : 'не ок'}`);
}
