class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1;
    this.x = 0;
    this.y = 0;
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  insert(value) {
    this.root = this._insertNode(this.root, value);
  }

  delete(value) {
    this.root = this._deleteNode(this.root, value);
  }

  find(value) {
    return this._findNode(this.root, value);
  }

  findPath(value) {
    const path = [];
    let current = this.root;
    while (current) {
      path.push(current);
      if (value < current.value) {
        current = current.left;
      } else if (value > current.value) {
        current = current.right;
      } else {
        break;
      }
    }
    return path;
  }

  _getHeight(node) {
    return node ? node.height : 0;
  }

  _updateHeight(node) {
    if (node) {
      node.height = 1 + Math.max(this._getHeight(node.left), this._getHeight(node.right));
    }
  }

  _insertNode(node, value) {
    if (node === null) {
      return new Node(value);
    }
    if (value < node.value) {
      node.left = this._insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this._insertNode(node.right, value);
    }
    this._updateHeight(node);
    return node;
  }

  _deleteNode(node, value) {
    if (node === null) {
      return null;
    }
    if (value < node.value) {
      node.left = this._deleteNode(node.left, value);
    } else if (value > node.value) {
      node.right = this._deleteNode(node.right, value);
    } else {
      if (!node.left && !node.right) {
        return null;
      }
      if (!node.left) {
        return node.right;
      }
      if (!node.right) {
        return node.left;
      }
      const minRight = this._findMin(node.right);
      node.value = minRight.value;
      node.right = this._deleteNode(node.right, minRight.value);
    }
    this._updateHeight(node);
    return node;
  }

  _findMin(node) {
    while (node.left !== null) {
      node = node.left;
    }
    return node;
  }

  _findNode(node, value) {
    if (node === null || node.value === value) {
      return node;
    }
    return value < node.value ? this._findNode(node.left, value) : this._findNode(node.right, value);
  }

  clone() {
    function cloneNode(node) {
      if (!node) return null;
      const newNode = new Node(node.value);
      newNode.left = cloneNode(node.left);
      newNode.right = cloneNode(node.right);
      newNode.height = node.height;
      return newNode;
    }
    const newTree = new BinarySearchTree();
    newTree.root = cloneNode(this.root);
    return newTree;
  }
}

export { Node, BinarySearchTree };
