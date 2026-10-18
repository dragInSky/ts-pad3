import { MinHeap, MaxHeap, drain } from './heap';
import { heapSort } from './heapSort';
import { topKLargest, topKSmallest } from './topK';
import { PriorityQueue } from './priorityQueue';

// Сверяем свои реализации со встроенной Array.prototype.sort на случайных данных.

const RUNS = 1000;
const byNumber = (a: number, b: number) => a - b;

function randomArray(maxLength: number, maxValue: number): number[] {
  const length = Math.floor(Math.random() * (maxLength + 1));
  return Array.from({ length }, () => Math.floor(Math.random() * maxValue));
}

function assertSame<T>(actual: T[], expected: T[], what: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${what}: ждали ${JSON.stringify(expected)}, получили ${JSON.stringify(actual)}`);
  }
}

function check(name: string, test: () => void): void {
  for (let i = 0; i < RUNS; i++) test();
  console.log(`ок  ${name} — ${RUNS} случайных прогонов`);
}

check('MinHeap / MaxHeap', () => {
  const arr = randomArray(50, 100);
  const asc = [...arr].sort(byNumber);
  assertSame(drain(new MinHeap(byNumber, arr)), asc, 'MinHeap');
  assertSame(drain(new MaxHeap(byNumber, arr)), [...asc].reverse(), 'MaxHeap');
});

check('heapSort, числа', () => {
  const arr = randomArray(100, 1000);
  assertSame(heapSort([...arr], byNumber), [...arr].sort(byNumber), 'heapSort');
});

check('heapSort, объекты', () => {
  const arr = randomArray(50, 10).map((key, id) => ({ key, id }));
  const sorted = heapSort([...arr], (a, b) => a.key - b.key);
  assertSame(sorted.map((x) => x.key), arr.map((x) => x.key).sort(byNumber), 'ключи');
  assertSame(sorted.map((x) => x.id).sort(byNumber), arr.map((x) => x.id), 'тот же набор объектов');
});

check('топ-k сверху и снизу', () => {
  const arr = randomArray(60, 100);
  const k = Math.floor(Math.random() * (arr.length + 3));
  const asc = [...arr].sort(byNumber);
  assertSame(topKLargest(arr, k, byNumber), [...asc].reverse().slice(0, k), 'топ-k сверху');
  assertSame(topKSmallest(arr, k, byNumber), asc.slice(0, k), 'топ-k снизу');
});

check('PriorityQueue (с FIFO при равных)', () => {
  // Модель — обычный массив: берём первый элемент с наименьшим приоритетом.
  const queue = new PriorityQueue<{ priority: number; id: number }>((a, b) => a.priority - b.priority);
  const model: { priority: number; id: number }[] = [];

  for (let id = 0; id < 60; id++) {
    if (Math.random() < 0.6) {
      const item = { priority: Math.floor(Math.random() * 5), id };
      queue.enqueue(item);
      model.push(item);
    } else {
      let best = 0;
      for (let i = 1; i < model.length; i++) if (model[i].priority < model[best].priority) best = i;
      const expected = model.length > 0 ? model.splice(best, 1)[0] : undefined;
      assertSame([queue.dequeue()], [expected], 'dequeue');
    }
    assertSame([queue.size], [model.length], 'size');
  }
});

console.log('Все проверки пройдены');
