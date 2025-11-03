
// ========== B-Tree Implementation ========== //
class BTreeNode {
  constructor(t, leaf = true) {
    this.t = t; // Minimum degree
    this.leaf = leaf;
    this.keys = [];
    this.children = [];
  }

  traverse(result = []) {
    let i;
    for (i = 0; i < this.keys.length; i++) {
      if (!this.leaf) {
        this.children[i].traverse(result);
      }
      result.push(this.keys[i]);
    }
    if (!this.leaf) {
      this.children[i].traverse(result);
    }
    return result;
  }

  search(k) {
    let i = 0;
    while (i < this.keys.length && k > this.keys[i]) i++;
    if (i < this.keys.length && this.keys[i] === k) return this;
    if (this.leaf) return null;
    return this.children[i].search(k);
  }

  insertNonFull(k) {
    let i = this.keys.length - 1;
    if (this.leaf) {
      this.keys.push(0);
      while (i >= 0 && this.keys[i] > k) {
        this.keys[i + 1] = this.keys[i];
        i--;
      }
      this.keys[i + 1] = k;
    } else {
      while (i >= 0 && this.keys[i] > k) i--;
      if (this.children[i + 1].keys.length === 2 * this.t - 1) {
        this.splitChild(i + 1);
        if (this.keys[i + 1] < k) i++;
      }
      this.children[i + 1].insertNonFull(k);
    }
  }

  splitChild(i) {
    const y = this.children[i];
    const z = new BTreeNode(this.t, y.leaf);

    // correct median extraction
    const median = y.keys[this.t - 1];

    // right node gets keys/children to the right of median
    z.keys = y.keys.slice(this.t);
    if (!y.leaf) {
      z.children = y.children.slice(this.t);
    }

    // left (y) keeps keys/children to the left of median
    y.keys = y.keys.slice(0, this.t - 1);
    if (!y.leaf) {
      y.children = y.children.slice(0, this.t);
    }

    // insert new child and lift median into current node
    this.children.splice(i + 1, 0, z);
    this.keys.splice(i, 0, median);
  }

  deleteKey(k) {
    let idx = this.findKey(k);

    if (idx < this.keys.length && this.keys[idx] === k) {
      if (this.leaf) {
        this.keys.splice(idx, 1);
      } else {
        this.deleteFromNonLeaf(idx);
      }
    } else {
      if (this.leaf) return;

      let flag = idx === this.keys.length;
      if (this.children[idx].keys.length === this.t - 1) {
        this.fill(idx);
      }

      if (flag && idx > this.keys.length) {
        this.children[idx - 1].deleteKey(k);
      } else {
        this.children[idx].deleteKey(k);
      }
    }
  }

  findKey(k) {
    let idx = 0;
    while (idx < this.keys.length && this.keys[idx] < k) ++idx;
    return idx;
  }

  deleteFromNonLeaf(idx) {
    const k = this.keys[idx];
    if (this.children[idx].keys.length >= this.t) {
      const pred = this.getPredecessor(idx);
      this.keys[idx] = pred;
      this.children[idx].deleteKey(pred);
    } else if (this.children[idx + 1].keys.length >= this.t) {
      const succ = this.getSuccessor(idx);
      this.keys[idx] = succ;
      this.children[idx + 1].deleteKey(succ);
    } else {
      this.merge(idx);
      this.children[idx].deleteKey(k);
    }
  }

  getPredecessor(idx) {
    let cur = this.children[idx];
    while (!cur.leaf) cur = cur.children[cur.keys.length];
    return cur.keys[cur.keys.length - 1];
  }

  getSuccessor(idx) {
    let cur = this.children[idx + 1];
    while (!cur.leaf) cur = cur.children[0];
    return cur.keys[0];
  }

  fill(idx) {
    if (idx !== 0 && this.children[idx - 1].keys.length >= this.t) {
      this.borrowFromPrev(idx);
    } else if (
      idx !== this.keys.length &&
      this.children[idx + 1].keys.length >= this.t
    ) {
      this.borrowFromNext(idx);
    } else {
      if (idx !== this.keys.length) {
        this.merge(idx);
      } else {
        this.merge(idx - 1);
      }
    }
  }

  borrowFromPrev(idx) {
    let child = this.children[idx];
    let sibling = this.children[idx - 1];
    child.keys.unshift(this.keys[idx - 1]);
    if (!child.leaf) {
      child.children.unshift(sibling.children.pop());
    }
    this.keys[idx - 1] = sibling.keys.pop();
  }

  borrowFromNext(idx) {
    let child = this.children[idx];
    let sibling = this.children[idx + 1];
    child.keys.push(this.keys[idx]);
    if (!child.leaf) {
      child.children.push(sibling.children.shift());
    }
    this.keys[idx] = sibling.keys.shift();
  }

  merge(idx) {
    let child = this.children[idx];
    let sibling = this.children[idx + 1];
    child.keys.push(this.keys[idx]);
    child.keys = child.keys.concat(sibling.keys);
    if (!child.leaf) {
      child.children = child.children.concat(sibling.children);
    }
    this.keys.splice(idx, 1);
    this.children.splice(idx + 1, 1);
  }
}

class BTree {
  constructor(t) {
    this.t = t;
    this.root = null;
  }

  traverse() {
    return this.root ? this.root.traverse() : [];
  }

  search(k) {
    return this.root ? this.root.search(k) : null;
  }

  insert(k) {
    if (!this.root) {
      this.root = new BTreeNode(this.t, true);
      this.root.keys.push(k);
    } else {
      if (this.root.keys.length === 2 * this.t - 1) {
        const s = new BTreeNode(this.t, false);
        s.children.push(this.root);
        s.splitChild(0);
        let i = 0;
        if (s.keys[0] < k) i++;
        s.children[i].insertNonFull(k);
        this.root = s;
      } else {
        this.root.insertNonFull(k);
      }
    }
  }

  delete(k) {
    if (!this.root) return;

    this.root.deleteKey(k);

    if (this.root.keys.length === 0) {
      this.root = this.root.leaf ? null : this.root.children[0];
    }
  }
}

// ========== Visualization ========== //
const canvas = document.getElementById("treeCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const tree = new BTree(3); // minimum degree 3

let highlightNodes = new Set();       // red blink for delete
let insertHighlightNodes = new Set(); // green blink for insert

function drawTree() {
  // Soft gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#ffecd2");
  gradient.addColorStop(1, "#fcb69f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (tree.root) {
    drawNode(tree.root, canvas.width / 2, 50, canvas.width / 4);
  }
}

function drawNode(node, x, y, spacing) {
  const nodeWidth = node.keys.length * 50 + 20;
  const nodeHeight = 45;

  // Draw white node box with shadow
  ctx.fillStyle = "white";
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(x - nodeWidth / 2, y, nodeWidth, nodeHeight, 12);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  // Draw keys inside node
  node.keys.forEach((key, idx) => {
    const keyX = x - nodeWidth / 2 + 25 + idx * 50;
    const keyY = y + nodeHeight / 2 + 5;

    if (highlightNodes.has(key)) {
      ctx.fillStyle = blinkColor("red");    // red blink for deletion
    } else if (insertHighlightNodes.has(key)) {
      ctx.fillStyle = blinkColor("green");  // green blink for insertion
    } else {
      ctx.fillStyle = "#a882dd";            // lavender
    }

    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(key, keyX, keyY);
  });

  // Draw edges and children
  if (!node.leaf) {
    node.children.forEach((child, idx) => {
      const count = node.children.length;
      const childX = count === 1 ? x : x - spacing + (idx * (2 * spacing)) / (count - 1);
      const childY = y + 100;

      // Smooth curved edge
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + nodeHeight);
      ctx.bezierCurveTo(x, y + nodeHeight + 20, childX, childY - 20, childX, childY);
      ctx.stroke();

      drawNode(child, childX, childY, spacing / 2);
    });
  }
}

// Blink helper
let blinkToggle = false;
function blinkColor(color) {
  blinkToggle = !blinkToggle;
  return blinkToggle ? color : "#E6E6FA"; // default lavender when blinking off
}

// ========== Controls ========== //
const insertBtn = document.getElementById("insertBtn");
if (insertBtn) {
  insertBtn.addEventListener("click", () => {
    const val = parseInt(document.getElementById("insertInput").value);
    if (!isNaN(val)) {
      tree.insert(val);
      insertHighlightNodes.add(val);

      let blinkCount = 0;
      const blinkInterval = setInterval(() => {
        drawTree();
        blinkCount++;
        if (blinkCount > 6) {
          clearInterval(blinkInterval);
          insertHighlightNodes.delete(val);
          drawTree();
        }
      }, 200);
    }
  });
}

const deleteBtn = document.getElementById("deleteBtn");
if (deleteBtn) {
  deleteBtn.addEventListener("click", () => {
    const val = parseInt(document.getElementById("deleteInput").value);
    if (!isNaN(val)) {
      highlightNodes.add(val);
      let blinkCount = 0;

      const blinkInterval = setInterval(() => {
        drawTree();
        blinkCount++;
        if (blinkCount > 6) {
          clearInterval(blinkInterval);
          highlightNodes.delete(val);
          tree.delete(val);
          drawTree();
        }
      }, 200);
    }
  });
}

drawTree();

