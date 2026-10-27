import { SuffixNode, SuffixTree, toCodes } from './suffixTree';

// Сколько первых символов совпадает у двух суффиксов текста = глубина их общего предка (LCA).
// Обходим дерево эйлеровым обходом и выписываем глубины узлов: LCA двух листьев —
// самый неглубокий узел между ними. Минимум на отрезке берём из sparse table за O(1).
class CommonPrefix {
  private readonly leafPos: Int32Array; // где в обходе стоит лист суффикса i
  private readonly table: Int32Array[] = []; // table[k][j] — минимум глубин на [j, j + 2^k)

  constructor(tree: SuffixTree) {
    const n = tree.text.length;
    this.leafPos = new Int32Array(n);

    const depths: number[] = [0];
    const stack = [{ depth: 0, children: tree.root.children.values() as Iterator<SuffixNode> }];

    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const next = top.children.next();
      if (next.done) {
        stack.pop();
        if (stack.length > 0) depths.push(stack[stack.length - 1].depth);
        continue;
      }

      const child = next.value;
      const depth = top.depth + tree.edgeLength(child);
      if (child.isLeaf) this.leafPos[n - depth] = depths.length;
      depths.push(depth);
      stack.push({ depth, children: child.children.values() });
    }

    this.table.push(Int32Array.from(depths));
    for (let k = 1; 1 << k <= depths.length; k++) {
      const prev = this.table[k - 1];
      const half = 1 << (k - 1);
      const row = new Int32Array(depths.length - (1 << k) + 1);
      for (let j = 0; j < row.length; j++) row[j] = Math.min(prev[j], prev[j + half]);
      this.table.push(row);
    }
  }

  // Длина общего начала суффиксов, которые начинаются с позиций a и b (a ≠ b).
  get(a: number, b: number): number {
    let l = this.leafPos[a];
    let r = this.leafPos[b];
    if (l > r) [l, r] = [r, l];

    const k = 31 - Math.clz32(r - l + 1);
    return Math.min(this.table[k][l], this.table[k][r - (1 << k) + 1]);
  }
}

// Склеиваем S # R $, где R — перевёрнутая S, и строим одно дерево.
// Палиндром с центром c — это насколько совпадают суффикс S с позиции c
// и суффикс R с зеркальной позиции: S[c + t] = S[c - t].
export function longestPalindrome(s: string): string {
  const chars = Array.from(s);
  const n = chars.length;
  if (n === 0) return '';

  const codes = toCodes(s);
  const tree = new SuffixTree([...codes, -1, ...[...codes].reverse(), -2]);
  const common = new CommonPrefix(tree);

  let bestLength = 0;
  let bestStart = 0;

  for (let c = 0; c < n; c++) {
    // нечётная длина: центр в символе c, его зеркало в склейке — на позиции 2n - c
    const odd = common.get(c, 2 * n - c);
    if (2 * odd - 1 > bestLength) {
      bestLength = 2 * odd - 1;
      bestStart = c - odd + 1;
    }

    // чётная длина: центр между c - 1 и c, зеркало символа c - 1 — на позиции 2n + 1 - c
    if (c > 0) {
      const even = common.get(c, 2 * n + 1 - c);
      if (2 * even > bestLength) {
        bestLength = 2 * even;
        bestStart = c - even;
      }
    }
  }

  return chars.slice(bestStart, bestStart + bestLength).join('');
}
