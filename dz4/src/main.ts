import { MinHeap, MaxHeap, drain } from './heap';

const byNumber = (a: number, b: number) => a - b;
const nums = [5, 3, 8, 1, 9, 2, 7];

console.log('Массив:         ', nums.join(' '));
console.log('MinHeap, peek:  ', new MinHeap(byNumber, nums).peek());
console.log('MaxHeap, peek:  ', new MaxHeap(byNumber, nums).peek());
console.log('MinHeap, pop×n: ', drain(new MinHeap(byNumber, nums)).join(' '));
console.log('MaxHeap, pop×n: ', drain(new MaxHeap(byNumber, nums)).join(' '));
console.log();

interface Person {
  name: string;
  age: number;
}

const people: Person[] = [
  { name: 'Аня', age: 31 },
  { name: 'Борис', age: 25 },
  { name: 'Вика', age: 42 },
  { name: 'Гоша', age: 19 },
  { name: 'Дима', age: 37 },
];
const byAge = (a: Person, b: Person) => a.age - b.age;
const show = (list: Person[]) => list.map((p) => `${p.name} ${p.age}`).join(', ');

console.log('Самый младший:', new MinHeap(byAge, people).peek()?.name);
console.log('Самый старший:', new MaxHeap(byAge, people).peek()?.name);
console.log();

import { heapSort } from './heapSort';

const data = [38, 27, 43, 3, 9, 82, 10];
console.log('Было:  ', data.join(' '));
console.log('Стало: ', heapSort([...data], byNumber).join(' '));

const fruits = ['груша', 'яблоко', 'арбуз', 'вишня', 'банан'];
console.log('Строки:', heapSort([...fruits], (a, b) => a.localeCompare(b)).join(' '));
console.log('Объекты:', show(heapSort([...people], byAge)));
console.log();

import { topKLargest, topKSmallest } from './topK';

const scores = [70, 95, 12, 88, 43, 100, 61, 5, 77];
console.log('Массив:      ', scores.join(' '));
console.log('Топ-3 сверху:', topKLargest(scores, 3, byNumber).join(' '));
console.log('Двое старших:', show(topKLargest(people, 2, byAge)));
console.log('Топ-3 снизу: ', topKSmallest(scores, 3, byNumber).join(' '));
console.log('Двое младших:', show(topKSmallest(people, 2, byAge)));
console.log();

import { PriorityQueue } from './priorityQueue';

interface Task {
  title: string;
  priority: number; // 1 — самое срочное
}

const queue = new PriorityQueue<Task>((a, b) => a.priority - b.priority);
queue.enqueue({ title: 'Ответить на письмо', priority: 3 });
queue.enqueue({ title: 'Починить прод', priority: 1 });
queue.enqueue({ title: 'Сделать code review', priority: 2 });
queue.enqueue({ title: 'Обновить зависимости', priority: 3 });
queue.enqueue({ title: 'Созвон с командой', priority: 2 });

console.log(`В очереди ${queue.size}, первой пойдёт: ${queue.peek()?.title}`);
while (!queue.isEmpty()) {
  const task = queue.dequeue()!;
  console.log(`${task.priority} — ${task.title}`);
}
