// Узел префиксного дерева. Детей храним в Map только по тем буквам, которые реально есть,
// а у листьев Map не создаём вовсе.
class TrieNode {
  children?: Map<string, TrieNode>;
  isWord = false; // здесь заканчивается какое-то слово
}

// Словарь на префиксном дереве: слово — это путь от корня по буквам.
// Общие начала слов («кот», «кошка», «код») хранятся один раз.
export class Trie {
  private readonly root = new TrieNode();
  private words = 0;
  private nodes = 1;

  // Сколько разных слов в словаре.
  get size(): number {
    return this.words;
  }

  // Сколько узлов в дереве — по сути, столько памяти оно и занимает.
  get nodeCount(): number {
    return this.nodes;
  }

  add(word: string): void {
    let node = this.root;

    for (const ch of word) {
      node.children ??= new Map();
      let next = node.children.get(ch);
      if (!next) {
        next = new TrieNode();
        node.children.set(ch, next);
        this.nodes++;
      }
      node = next;
    }

    if (!node.isWord) {
      node.isWord = true;
      this.words++;
    }
  }

  addAll(words: Iterable<string>): void {
    for (const word of words) this.add(word);
  }

  has(word: string): boolean {
    let node: TrieNode | undefined = this.root;

    for (const ch of word) {
      node = node.children?.get(ch);
      if (!node) return false;
    }

    return node.isWord;
  }
}
