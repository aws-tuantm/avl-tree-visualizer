import { Node, BinarySearchTree } from "./bst.js";

class AVLTree extends BinarySearchTree {
  constructor() {
    super();
  }

  _getBalance(node) {
    return node ? this._getHeight(node.left) - this._getHeight(node.right) : 0;
  }

  _rightRotate(y) {
    const x = y.left;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    this._updateHeight(y);
    this._updateHeight(x);

    return x;
  }

  _leftRotate(x) {
    const y = x.right;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    this._updateHeight(x);
    this._updateHeight(y);

    return y;
  }

  _insertNode(node, value) {
    if (node === null) {
      return new Node(value);
    }

    if (value < node.value) {
      node.left = this._insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this._insertNode(node.right, value);
    } else {
      return node; // Duplicate values are not allowed
    }

    this._updateHeight(node);

    const balance = this._getBalance(node);

    // Left Left Case
    if (balance > 1 && value < node.left.value) {
      return this._rightRotate(node);
    }

    // Right Right Case
    if (balance < -1 && value > node.right.value) {
      return this._leftRotate(node);
    }

    // Left Right Case
    if (balance > 1 && value > node.left.value) {
      node.left = this._leftRotate(node.left);
      return this._rightRotate(node);
    }

    // Right Left Case
    if (balance < -1 && value < node.right.value) {
      node.right = this._rightRotate(node.right);
      return this._leftRotate(node);
    }

    return node;
  }

  _deleteNode(node, value) {
    if (node === null) {
      return node;
    }

    if (value < node.value) {
      node.left = this._deleteNode(node.left, value);
    } else if (value > node.value) {
      node.right = this._deleteNode(node.right, value);
    } else {
      if (node.left === null || node.right === null) {
        let temp = node.left ? node.left : node.right;
        if (temp === null) {
          temp = node;
          node = null;
        } else {
          node = temp;
        }
      } else {
        let temp = this._findMin(node.right);
        node.value = temp.value;
        node.right = this._deleteNode(node.right, temp.value);
      }
    }

    if (node === null) {
      return node;
    }

    this._updateHeight(node);

    const balance = this._getBalance(node);

    // Left Left Case
    if (balance > 1 && this._getBalance(node.left) >= 0) {
      return this._rightRotate(node);
    }

    // Left Right Case
    if (balance > 1 && this._getBalance(node.left) < 0) {
      node.left = this._leftRotate(node.left);
      return this._rightRotate(node);
    }

    // Right Right Case
    if (balance < -1 && this._getBalance(node.right) <= 0) {
      return this._leftRotate(node);
    }

    // Right Left Case
    if (balance < -1 && this._getBalance(node.right) > 0) {
      node.right = this._rightRotate(node.right);
      return this._leftRotate(node);
    }

    return node;
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
    const newTree = new AVLTree();
    newTree.root = cloneNode(this.root);
    return newTree;
  }

  getInsertionDetails(value) {
    const treeAfterBstInsert = this.clone();
    let bstPathNodes = []; // Store actual node references from the clone

    // 1. Perform BST-style insertion and get the path
    treeAfterBstInsert.root = (function insert(node, val) {
      if (node === null) {
        const newNode = new Node(val);
        bstPathNodes.push(newNode);
        return newNode;
      }
      bstPathNodes.push(node);
      if (val < node.value) {
        node.left = insert(node.left, val);
      } else if (val > node.value) {
        node.right = insert(node.right, val);
      }
      treeAfterBstInsert._updateHeight(node);
      return node;
    })(treeAfterBstInsert.root, value);

    // 2. Find the first unbalanced node
    let unbalancedNode = null;
    let caseType = null;
    let unbalancedNodePathIndex = -1;

    for (let i = bstPathNodes.length - 2; i >= 0; i--) {
      const node = bstPathNodes[i];
      const balance = treeAfterBstInsert._getBalance(node);

      if (balance > 1 || balance < -1) {
        unbalancedNode = node;
        unbalancedNodePathIndex = i;
        if (balance > 1) {
          caseType = value < node.left.value ? "Left-Left" : "Left-Right";
        } else {
          caseType = value > node.right.value ? "Right-Right" : "Right-Left";
        }
        break;
      }
    }

    let treeAfterFirstRotation = null;
    let firstRotationDescription = "";

    if (caseType === "Left-Right" || caseType === "Right-Left") {
      treeAfterFirstRotation = treeAfterBstInsert.clone();

      // Find the unbalanced node in the *clone*
      let nodeToUpdate = treeAfterFirstRotation.root;
      for (let i = 1; i <= unbalancedNodePathIndex; i++) {
        if (bstPathNodes[i].value < nodeToUpdate.value) {
          nodeToUpdate = nodeToUpdate.left;
        } else if (bstPathNodes[i].value > nodeToUpdate.value) {
          nodeToUpdate = nodeToUpdate.right;
        }
      }

      if (caseType === "Left-Right") {
        firstRotationDescription = `Xoay trái tại ${nodeToUpdate.left.value}`;
        nodeToUpdate.left = treeAfterFirstRotation._leftRotate(nodeToUpdate.left);
      } else {
        // Right-Left
        firstRotationDescription = `Xoay phải tại ${nodeToUpdate.right.value}`;
        nodeToUpdate.right = treeAfterFirstRotation._rightRotate(nodeToUpdate.right);
      }
      treeAfterFirstRotation._updateHeight(nodeToUpdate);
    }

    return { treeAfterBstInsert, unbalancedNode, caseType, bstPathNodes, treeAfterFirstRotation, firstRotationDescription };
  }

  getDeletionDetails(value) {
    const balancingSteps = [];
    const tree = this.clone(); // The tree that will be modified
    const path = tree.findPath(value);
    const found = path.length > 0 && path[path.length - 1].value === value;

    if (!found) {
      return { found: false, path, balancingSteps };
    }

    // This internal, instrumented function will record balancing steps
    function _instrumentedDelete(node, val) {
      if (node === null) return node;

      // Recurse down the tree
      if (val < node.value) {
        node.left = _instrumentedDelete(node.left, val);
      } else if (val > node.value) {
        node.right = _instrumentedDelete(node.right, val);
      } else {
        // Node to be deleted found
        if (node.left === null || node.right === null) {
          node = node.left ? node.left : node.right;
        } else {
          const temp = tree._findMin(node.right);
          node.value = temp.value;
          node.right = _instrumentedDelete(node.right, temp.value);
        }
      }

      if (node === null) return node;

      tree._updateHeight(node);
      const balance = tree._getBalance(node);

      // --- Check for imbalance and record rotations ---
      const treeStateBeforeRotation = tree.clone();
      
      // Left Left Case
      if (balance > 1 && tree._getBalance(node.left) >= 0) {
        balancingSteps.push({
          description: `Mất cân bằng Left-Left tại nút ${node.value}. Thực hiện xoay phải.`,
          treeState: treeStateBeforeRotation,
        });
        return tree._rightRotate(node);
      }

      // Left Right Case
      if (balance > 1 && tree._getBalance(node.left) < 0) {
        balancingSteps.push({
          description: `Mất cân bằng Left-Right tại nút ${node.value}. Bắt đầu bằng xoay trái tại ${node.left.value}.`,
          treeState: treeStateBeforeRotation,
        });
        node.left = tree._leftRotate(node.left);
        balancingSteps.push({
          description: `Tiếp theo, xoay phải tại ${node.value}.`,
          treeState: tree.clone(),
        });
        return tree._rightRotate(node);
      }

      // Right Right Case
      if (balance < -1 && tree._getBalance(node.right) <= 0) {
        balancingSteps.push({
          description: `Mất cân bằng Right-Right tại nút ${node.value}. Thực hiện xoay trái.`,
          treeState: treeStateBeforeRotation,
        });
        return tree._leftRotate(node);
      }

      // Right Left Case
      if (balance < -1 && tree._getBalance(node.right) > 0) {
        balancingSteps.push({
          description: `Mất cân bằng Right-Left tại nút ${node.value}. Bắt đầu bằng xoay phải tại ${node.right.value}.`,
          treeState: treeStateBeforeRotation,
        });
        node.right = tree._rightRotate(node.right);
        balancingSteps.push({
          description: `Tiếp theo, xoay trái tại ${node.value}.`,
          treeState: tree.clone(),
        });
        return tree._leftRotate(node);
      }

      return node;
    }

    tree.root = _instrumentedDelete(tree.root, value);
    return { found: true, path, balancingSteps, finalTree: tree };
  }
}

export { AVLTree };
