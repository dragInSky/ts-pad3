import { Children, bfs, inorder, postorder, preorder } from './traversal';

// Сверяем с эталоном на случайных деревьях. Эталон для DFS — обычная рекурсия:
// она здесь только для проверки, в самих обходах её нет.

const RUNS = 1000;

interface TestNode {
  id: number;
  kids: (TestNode | null)[];
}
const kidsOf: Children<TestNode> = (n) => n.kids;

// Случайное дерево: у узла 0–4 места под детей, часть мест пустые (null).
function randomTree(maxNodes: number): TestNode {
  const root: TestNode = { id: 0, kids: [] };
  const all = [root];
  const size = 1 + Math.floor(Math.random() * maxNodes);
  while (all.length < size) {
    const parent = all[Math.floor(Math.random() * all.length)];
    if (parent.kids.length >= 4) continue;
    // пустых мест не больше трёх, иначе узел может забиться одними null и цикл не закончится
    if (parent.kids.length < 3 && Math.random() < 0.2) {
      parent.kids.push(null);
      continue;
    }
    const child: TestNode = { id: all.length, kids: [] };
    parent.kids.push(child);
    all.push(child);
  }
  return root;
}

function recursiveDfs(node: TestNode, out: number[], visitAt: number | 'end'): number[] {
  const at = visitAt === 'end' ? node.kids.length : visitAt === -1 ? Math.floor(node.kids.length / 2) : visitAt;
  node.kids.forEach((kid, i) => {
    if (i === at) out.push(node.id);
    if (kid) recursiveDfs(kid, out, visitAt);
  });
  if (at === node.kids.length) out.push(node.id);
  return out;
}

function levelOrder(root: TestNode): number[] {
  const out: number[] = [];
  let level = [root];
  while (level.length > 0) {
    out.push(...level.map((n) => n.id));
    level = level.flatMap((n) => n.kids.filter((k): k is TestNode => k !== null));
  }
  return out;
}

const ids = (nodes: Iterable<TestNode>) => [...nodes].map((n) => n.id);
const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

function assert(ok: boolean, what: string): void {
  if (!ok) throw new Error(what);
}

function check(name: string, test: () => void): void {
  for (let i = 0; i < RUNS; i++) test();
  console.log(`ок  ${name} — ${RUNS} случайных прогонов`);
}

check('BFS совпадает с обходом по уровням', () => {
  const root = randomTree(40);
  assert(same(ids(bfs(root, kidsOf)), levelOrder(root)), 'bfs');
});

check('preorder / inorder / postorder совпадают с рекурсией', () => {
  const root = randomTree(40);
  assert(same(ids(preorder(root, kidsOf)), recursiveDfs(root, [], 0)), 'preorder');
  assert(same(ids(inorder(root, kidsOf)), recursiveDfs(root, [], -1)), 'inorder');
  assert(same(ids(postorder(root, kidsOf)), recursiveDfs(root, [], 'end')), 'postorder');
});

check('inorder дерева поиска отсортирован', () => {
  interface Bst {
    value: number;
    left?: Bst;
    right?: Bst;
  }
  const values = Array.from({ length: 1 + Math.floor(Math.random() * 50) }, () => Math.random());
  const root: Bst = { value: values[0] };
  for (const value of values.slice(1)) {
    let node = root;
    while (true) {
      const side = value < node.value ? 'left' : 'right';
      const next = node[side];
      if (!next) {
        node[side] = { value };
        break;
      }
      node = next;
    }
  }
  const sorted = [...inorder(root, (n) => [n.left, n.right])].map((n) => n.value);
  assert(sorted.every((v, i) => i === 0 || sorted[i - 1] <= v), 'inorder не по возрастанию');
  assert(sorted.length === values.length, 'потеряли узлы');
});

{
  for (let i = 0; i < 20; i++) {
    const root = randomTree(20_000);
    assert(same(ids(bfs(root, kidsOf)), levelOrder(root)), 'bfs на большом дереве');
  }
  console.log('ок  BFS на деревьях до 20 000 узлов — 20 прогонов');
}

{
  const depth = 300_000;
  const below = (i: number) => (i < depth - 1 ? [i + 1] : []);
  for (const walk of [bfs, preorder, inorder, postorder]) {
    let total = 0;
    for (const _ of walk(0, below)) total++;
    assert(total === depth, `${walk.name}: прошли ${total} из ${depth}`);
  }
  assert(postorder(0, below).next().value === depth - 1, 'postorder начинается с самого глубокого');
  console.log(`ок  цепочка глубиной ${depth} — без переполнения стека`);
}

assert([...bfs(null, kidsOf)].length === 0 && [...postorder(undefined, kidsOf)].length === 0, 'пустое дерево');
console.log('Все проверки пройдены');
