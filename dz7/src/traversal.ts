// Абстрактное дерево: обходам нужно только одно — уметь получить детей узла.
// Пустые места (null) допустимы: у бинарного дерева это [left, right], где кого-то может не быть.
export type Children<T> = (node: T) => readonly (T | null | undefined)[];

// BFS — по уровням: очередь, сначала все узлы на глубине 1, потом на глубине 2 и т.д.
export function* bfs<T>(root: T | null | undefined, children: Children<T>): Generator<T> {
  if (root == null) return;

  let queue: T[] = [root];
  let head = 0; // вместо shift() двигаем указатель — shift стоил бы O(n)

  while (head < queue.length) {
    const node = queue[head++];
    yield node;

    for (const child of children(node)) {
      if (child != null) queue.push(child);
    }

    // выкидываем уже пройденное начало, чтобы очередь не росла до размера всего дерева
    if (head > 1024 && head * 2 > queue.length) {
      queue = queue.slice(head);
      head = 0;
    }
  }
}

// Кадр ручного стека — то, что рекурсия хранила бы в своём кадре.
interface Frame<T> {
  node: T;
  kids: readonly (T | null | undefined)[];
  next: number; // в какого ребёнка спускаемся следующим
}

// DFS без рекурсии: свой стек вместо стека вызовов. Все три порядка устроены одинаково
// и отличаются только моментом, когда отдаём узел, — до какого по счёту ребёнка (visitAt).
function* dfs<T>(
  root: T | null | undefined,
  children: Children<T>,
  visitAt: (kidsCount: number) => number,
): Generator<T> {
  if (root == null) return;

  const frame = (node: T): Frame<T> => ({ node, kids: children(node), next: 0 });
  const stack = [frame(root)];

  while (stack.length > 0) {
    const top = stack[stack.length - 1];

    // каждое значение next проверяется ровно один раз, так что узел отдаётся один раз
    if (top.next === visitAt(top.kids.length)) yield top.node;

    if (top.next < top.kids.length) {
      const child = top.kids[top.next++];
      if (child != null) stack.push(frame(child));
    } else {
      stack.pop(); // все дети пройдены — «возврат из рекурсии»
    }
  }
}

// Preorder: узел, потом дети.
export const preorder = <T>(root: T | null | undefined, children: Children<T>) =>
  dfs(root, children, () => 0);

// Inorder: левая половина детей, узел, правая половина. Для бинарного дерева — left, узел, right.
export const inorder = <T>(root: T | null | undefined, children: Children<T>) =>
  dfs(root, children, (k) => Math.floor(k / 2));

// Postorder: сначала все дети, потом узел.
export const postorder = <T>(root: T | null | undefined, children: Children<T>) =>
  dfs(root, children, (k) => k);
