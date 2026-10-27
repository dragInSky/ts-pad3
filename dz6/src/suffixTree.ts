// Узел суффиксного дерева. Ребро в узел — это кусок текста text[start, end):
// храним только два индекса, а не саму подстроку.
export class SuffixNode {
  readonly children = new Map<number, SuffixNode>();
  link: SuffixNode | null = null; // суффиксная ссылка, есть только у внутренних узлов

  constructor(
    public start: number,
    public end: number, // у листа Infinity: лист всегда тянется до конца прочитанного текста
  ) {}

  get isLeaf(): boolean {
    return this.children.size === 0;
  }
}

export const toCodes = (s: string) => Array.from(s, (ch) => ch.codePointAt(0)!);

// Суффиксное дерево — это trie из всех суффиксов текста, в котором цепочки
// без развилок сжаты в одно ребро. Строим алгоритмом Укконена за O(n).
export class SuffixTree {
  readonly root = new SuffixNode(0, 0);
  readonly text: number[];
  private read = 0; // сколько символов текста уже добавлено
  private nodes = 1;

  // Последний символ текста должен быть уникальным — тогда каждый суффикс кончается в листе.
  constructor(text: number[]) {
    this.text = text;
    this.build();
  }

  static fromString(s: string): SuffixTree {
    return new SuffixTree([...toCodes(s), -1]);
  }

  get nodeCount(): number {
    return this.nodes;
  }

  edgeLength(node: SuffixNode): number {
    return Math.min(node.end, this.read) - node.start;
  }

  // Есть ли pattern среди подстрок: просто идём от корня по рёбрам, O(m).
  includes(pattern: string): boolean {
    const p = toCodes(pattern);
    let node = this.root;
    let i = 0;

    while (i < p.length) {
      const child = node.children.get(p[i]);
      if (!child) return false;

      const len = this.edgeLength(child);
      for (let k = 0; k < len && i < p.length; k++, i++) {
        if (this.text[child.start + k] !== p[i]) return false;
      }
      node = child;
    }

    return true;
  }

  private build(): void {
    const text = this.text;
    let activeNode = this.root;
    let activeEdge = 0; // индекс символа, с которого начинается ребро из activeNode
    let activeLength = 0; // сколько символов по этому ребру уже пройдено
    let remainder = 0; // сколько суффиксов ещё ждут вставки

    for (let i = 0; i < text.length; i++) {
      this.read = i + 1; // все листья разом удлинились на символ
      remainder++;
      let lastInternal: SuffixNode | null = null;

      while (remainder > 0) {
        if (activeLength === 0) activeEdge = i;
        const next = activeNode.children.get(text[activeEdge]);

        if (!next) {
          // такого ребра нет — вешаем новый лист
          activeNode.children.set(text[activeEdge], this.newNode(i, Infinity));
          if (lastInternal) {
            lastInternal.link = activeNode;
            lastInternal = null;
          }
        } else {
          const len = this.edgeLength(next);
          if (activeLength >= len) {
            // ребро пройдено целиком — спускаемся в следующий узел
            activeEdge += len;
            activeLength -= len;
            activeNode = next;
            continue;
          }

          if (text[next.start + activeLength] === text[i]) {
            // символ уже есть в дереве — остальные суффиксы тоже есть, ждём следующий символ
            if (lastInternal && activeNode !== this.root) {
              lastInternal.link = activeNode;
              lastInternal = null;
            }
            activeLength++;
            break;
          }

          // разрезаем ребро и вешаем новый лист на место разреза
          const split = this.newNode(next.start, next.start + activeLength);
          activeNode.children.set(text[activeEdge], split);
          split.children.set(text[i], this.newNode(i, Infinity));
          next.start += activeLength;
          split.children.set(text[next.start], next);

          if (lastInternal) lastInternal.link = split;
          lastInternal = split;
        }

        // переходим к следующему, более короткому суффиксу
        remainder--;
        if (activeNode === this.root && activeLength > 0) {
          activeLength--;
          activeEdge = i - remainder + 1;
        } else if (activeNode !== this.root) {
          activeNode = activeNode.link ?? this.root;
        }
      }
    }
  }

  private newNode(start: number, end: number): SuffixNode {
    this.nodes++;
    return new SuffixNode(start, end);
  }
}
