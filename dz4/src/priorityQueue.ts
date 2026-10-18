import { Comparator, Heap } from './heap';

interface Entry<T> {
  value: T;
  order: number; // номер добавления, чтобы равные выходили по очереди
}

// Очередь с приоритетом поверх min-кучи.
// Первым выходит тот элемент, который был бы первым после arr.sort(compare).
// При равном приоритете — кто раньше пришёл, тот раньше и вышел (FIFO).
export class PriorityQueue<T> {
  private readonly heap: Heap<Entry<T>>;
  private counter = 0;

  constructor(compare: Comparator<T>) {
    this.heap = new Heap<Entry<T>>(
      (a, b) => compare(a.value, b.value) || a.order - b.order,
    );
  }

  get size(): number {
    return this.heap.size;
  }

  isEmpty(): boolean {
    return this.heap.isEmpty();
  }

  enqueue(value: T): void {
    this.heap.push({ value, order: this.counter++ });
  }

  dequeue(): T | undefined {
    return this.heap.pop()?.value;
  }

  peek(): T | undefined {
    return this.heap.peek()?.value;
  }
}
