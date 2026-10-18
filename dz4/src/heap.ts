// Элементы могут быть любого типа, поэтому < > === на них не полагаемся.
// Порядок задаёт функция сравнения: < 0 — a меньше b, 0 — равны, > 0 — a больше b.
export type Comparator<T> = (a: T, b: T) => number;

// Куча лежит в обычном массиве: у элемента i дети 2i+1 и 2i+2, родитель (i-1)/2.
// Вершина (индекс 0) — наименьший элемент по compare.

export function siftUp<T>(heap: T[], i: number, compare: Comparator<T>): void {
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (compare(heap[i], heap[parent]) >= 0) return;

    [heap[i], heap[parent]] = [heap[parent], heap[i]];
    i = parent;
  }
}

export function siftDown<T>(heap: T[], i: number, size: number, compare: Comparator<T>): void {
  while (true) {
    const left = 2 * i + 1;
    const right = left + 1;
    let top = i;

    if (left < size && compare(heap[left], heap[top]) < 0) top = left;
    if (right < size && compare(heap[right], heap[top]) < 0) top = right;
    if (top === i) return;

    [heap[i], heap[top]] = [heap[top], heap[i]];
    i = top;
  }
}

// Превращает произвольный массив в кучу за O(n).
export function heapify<T>(arr: T[], compare: Comparator<T>): void {
  for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
    siftDown(arr, i, arr.length, compare);
  }
}

export class Heap<T> {
  private readonly items: T[];

  constructor(private readonly compare: Comparator<T>, items: T[] = []) {
    this.items = [...items];
    heapify(this.items, compare);
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  push(value: T): void {
    this.items.push(value);
    siftUp(this.items, this.items.length - 1, this.compare);
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined;

    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      siftDown(this.items, 0, this.items.length, this.compare);
    }

    return top;
  }
}

// На вершине наименьший элемент.
export class MinHeap<T> extends Heap<T> {}

// На вершине наибольший: тот же Heap, только сравнение перевёрнуто.
export class MaxHeap<T> extends Heap<T> {
  constructor(compare: Comparator<T>, items: T[] = []) {
    super((a, b) => compare(b, a), items);
  }
}

// Достаёт из кучи все элементы по одному — выходят в порядке кучи.
export function drain<T>(heap: Heap<T>): T[] {
  const result: T[] = [];
  while (!heap.isEmpty()) result.push(heap.pop()!);
  return result;
}
