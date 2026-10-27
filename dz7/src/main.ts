import { bfs, inorder, postorder, preorder } from './traversal';

interface BinaryNode {
  value: number;
  left?: BinaryNode;
  right?: BinaryNode;
}

//        8
//      /   \
//     3     10
//    / \      \
//   1   6      14
//      / \    /
//     4   7  13
const bst: BinaryNode = {
  value: 8,
  left: { value: 3, left: { value: 1 }, right: { value: 6, left: { value: 4 }, right: { value: 7 } } },
  right: { value: 10, right: { value: 14, left: { value: 13 } } },
};
const sides = (n: BinaryNode) => [n.left, n.right];
const values = (nodes: Iterable<BinaryNode>) => [...nodes].map((n) => n.value).join(' ');

console.log('BFS:      ', values(bfs(bst, sides)));
console.log('Preorder: ', values(preorder(bst, sides)));
console.log('Inorder:  ', values(inorder(bst, sides)));
console.log('Postorder:', values(postorder(bst, sides)));
console.log();

// Те же функции на дереве, которое задано только связью «начальник — подчинённый».
const staff = [
  { name: 'Директор', boss: null },
  { name: 'Техдир', boss: 'Директор' },
  { name: 'Финдир', boss: 'Директор' },
  { name: 'Бэк', boss: 'Техдир' },
  { name: 'Фронт', boss: 'Техдир' },
  { name: 'QA', boss: 'Техдир' },
  { name: 'Бухгалтерия', boss: 'Финдир' },
];
const team = new Map<string, string[]>();
for (const { name, boss } of staff) {
  if (boss) team.set(boss, [...(team.get(boss) ?? []), name]);
}
const reports = (name: string) => team.get(name) ?? [];

console.log('BFS:      ', [...bfs('Директор', reports)].join(' '));
console.log('Preorder: ', [...preorder('Директор', reports)].join(' '));
console.log('Inorder:  ', [...inorder('Директор', reports)].join(' '));
console.log('Postorder:', [...postorder('Директор', reports)].join(' '));
console.log();

// Цепочка из миллиона узлов: рекурсия на такой глубине упала бы с переполнением стека.
const DEPTH = 1_000_000;
const below = (i: number) => (i < DEPTH - 1 ? [i + 1] : []);
const count = (nodes: Iterable<number>) => {
  let total = 0;
  for (const _ of nodes) total++;
  return total;
};

console.log(`Глубина ${DEPTH}:`);
console.log('BFS:      ', count(bfs(0, below)));
console.log('Preorder: ', count(preorder(0, below)));
console.log('Inorder:  ', count(inorder(0, below)));
console.log('Postorder:', count(postorder(0, below)));
