import { Comparator, MaxHeap, MinHeap, drain } from './heap';

// Топ-k сверху: в min-куче держим k самых больших.
// На вершине — самый маленький из них, его и выкидываем, когда элементов стало k+1.
export function topKLargest<T>(arr: T[], k: number, compare: Comparator<T>): T[] {
  const heap = new MinHeap(compare);

  for (const x of arr) {
    heap.push(x);
    if (heap.size > k) heap.pop();
  }

  return drain(heap).reverse(); // от большего к меньшему
}

// Топ-k снизу — зеркально: в max-куче держим k самых маленьких.
export function topKSmallest<T>(arr: T[], k: number, compare: Comparator<T>): T[] {
  const heap = new MaxHeap(compare);

  for (const x of arr) {
    heap.push(x);
    if (heap.size > k) heap.pop();
  }

  return drain(heap).reverse(); // от меньшего к большему
}
