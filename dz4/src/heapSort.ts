import { Comparator, heapify, siftDown } from './heap';

// Сортирует массив на месте по возрастанию и возвращает его же.
// Строим max-кучу, затем n-1 раз меняем вершину (максимум) с последним
// элементом неотсортированной части и просеиваем новую вершину вниз.
export function heapSort<T>(arr: T[], compare: Comparator<T>): T[] {
  const reversed: Comparator<T> = (a, b) => compare(b, a);
  heapify(arr, reversed);

  for (let end = arr.length - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    siftDown(arr, 0, end, reversed);
  }

  return arr;
}
