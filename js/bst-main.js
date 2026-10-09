import { BinarySearchTree } from "./bst.js";
import { drawTree, createMiniTreeVis, createZoomableMiniVis } from "./ui.js";

const ANIMATION_DELAY = 400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class BSTHandler {
  constructor(container) {
    this.svg = container.querySelector("#tree-svg");
    this.valueInput = container.querySelector("#node-value");
    this.detailsBtn = container.querySelector("#details-btn");
    this.deleteBtn = container.querySelector("#delete-btn");
    this.searchBtn = container.querySelector("#search-btn");
    this.resetBtn = container.querySelector("#reset-btn");
    this.modalBodyContent = document.getElementById("modal-body-content");
    this.detailsModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("detailsModal"));

    this.tree = new BinarySearchTree();
    this.isAnimating = false;
    this.lastDetails = { values: [], action: "", baseTree: null };

    this.draw();
  }

  parseInput() {
    return this.valueInput.value
      .replace(/,/g, " ")
      .split(/\s+/)
      .filter((s) => s)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));
  }

  highlightNode(node, className) {
    const el = this.svg.querySelector(`#node-${node.value}`);
    if (el) el.classList.add(className);
  }

  clearAllHighlights() {
    this.svg.querySelectorAll(".node.traversed, .node.highlighted").forEach((el) => {
      el.classList.remove("traversed", "highlighted");
    });
  }

  async animatePath(path, finalClassName) {
    this.clearAllHighlights();
    for (const node of path) {
      this.highlightNode(node, "traversed");
      await sleep(ANIMATION_DELAY);
    }
    if (path.length > 0) {
      this.highlightNode(path[path.length - 1], finalClassName);
    }
  }

  draw() {
    drawTree(this.svg, this.tree);
  }

  populateDetailsModal(values, action, baseTree) {
    this.modalBodyContent.innerHTML = "";
    let tempTree = baseTree.clone();

    values.forEach((value) => {
      const header = document.createElement("h5");
      header.className = "operation-header";
      header.textContent = `${action.charAt(0).toUpperCase() + action.slice(1)}: ${value} (Cây BST)`;
      this.modalBodyContent.appendChild(header);

      const path = tempTree.findPath(value);
      const found = path.length > 0 && path[path.length - 1].value === value;

      const stepsContainer = document.createElement("div");
      if (path.length > 0) {
        path.forEach((node, index) => {
          const descDiv = document.createElement("div");
          descDiv.className = "step-description-only";
          let direction = "";
          if (value < node.value) {
            direction = `<b>${value} < ${node.value}</b>, đi sang trái.`;
            if (index === path.length - 1 && action === "insert" && !found) {
              direction += ` <div class="text-primary">→ Chèn vào con trái của ${node.value}.</div>`;
            }
          } else if (value > node.value) {
            direction = `<b>${value} > ${node.value}</b>, đi sang phải.`;
            if (index === path.length - 1 && action === "insert" && !found) {
              direction += ` <div class="text-primary">→ Chèn vào con phải của ${node.value}.</div>`;
            }
          } else {
            if (action === "insert") direction = `<b>${value} == ${node.value}</b>, nút đã tồn tại, không thêm.`;
            else if (action === "search") direction = `<b>${value} == ${node.value}</b>. <div class="text-primary">→ Đã tìm thấy Node ${value}, h = ${node.height}.</div>`;
            else if (action === "delete") direction = `<b>${value} == ${node.value}</b>. <div class="text-primary">→ Đã tìm thấy node ${value}, sẽ xóa nó.</div>`;
          }
          descDiv.innerHTML = `<b>Bước ${index + 1}:</b> So sánh với <b>${node.value}</b>. ${direction}`;
          stepsContainer.appendChild(descDiv);
        });
      } else if (action === "insert") {
        stepsContainer.innerHTML = "<p>Cây rỗng, nút này sẽ trở thành gốc.</p>";
      }

      if ((action === "search" || action === "delete") && !found) {
        const notFoundDiv = document.createElement("div");
        notFoundDiv.className = "step-description-only text-danger mt-2";
        notFoundDiv.innerHTML = `<b>Kết quả:</b> Không tìm thấy nút <b>${value}</b> trong cây.`;
        stepsContainer.appendChild(notFoundDiv);
      }
      this.modalBodyContent.appendChild(stepsContainer);

      const visHeader = document.createElement("h6");
      visHeader.className = "operation-header-child";
      if (action === "delete" && found) {
        visHeader.textContent = "Cây trước khi xóa:";
      } else {
        visHeader.textContent = "Trạng thái cây:";
      }
      this.modalBodyContent.appendChild(visHeader);

      const treeForVis = tempTree.clone();
      if (action === "insert" && !found) {
        treeForVis.insert(value);
      }
      const pathForVis = treeForVis.findPath(value);

      const visDiv = createZoomableMiniVis(
        treeForVis,
        pathForVis,
        action === "delete" ? `Cây trước khi xóa (${value})` : `Trạng thái cây (${value})`
      );
      this.modalBodyContent.appendChild(visDiv);

      if (action === "delete" && found) {
        const postHeader = document.createElement("h6");
        postHeader.className = "operation-header-child";
        postHeader.textContent = "Cây sau khi xóa:";
        this.modalBodyContent.appendChild(postHeader);

        const postTree = tempTree.clone();
        postTree.delete(value);
        const postDiv = createZoomableMiniVis(postTree, [], `Cây sau khi xóa (${value})`);
        this.modalBodyContent.appendChild(postDiv);
      }

      if (action === "insert") tempTree.insert(value);
      else if (action === "delete" && found) tempTree.delete(value);
    });
  }

  async handleInsert() {
    if (this.isAnimating) return;
    const values = this.parseInput();
    if (values.length === 0) return;

    this.lastDetails = { values, action: "insert", baseTree: this.tree.clone() };
    this.detailsBtn.disabled = false;
    this.deleteBtn.disabled = false;
    this.searchBtn.disabled = false;
    this.resetBtn.disabled = false;
    this.isAnimating = true;

    for (const v of values) {
      const path = this.tree.findPath(v);
      await this.animatePath(path, "highlighted");
      this.tree.insert(v);
      this.draw();
      await sleep(ANIMATION_DELAY);
    }

    this.clearAllHighlights();
    this.isAnimating = false;
    this.valueInput.value = "";
  }

  async handleDelete() {
    if (this.isAnimating) return;
    const values = this.parseInput();
    if (values.length !== 1) return;
    const value = values[0];

    this.lastDetails = { values: [value], action: "delete", baseTree: this.tree.clone() };
    this.detailsBtn.disabled = false;
    this.isAnimating = true;

    const path = this.tree.findPath(value);
    const exists = path.length > 0 && path[path.length - 1].value === value;
    await this.animatePath(path, exists ? "highlighted" : "traversed");

    if (exists) this.tree.delete(value);

    await sleep(ANIMATION_DELAY);
    this.draw();
    this.valueInput.value = "";
    await sleep(1000);
    this.clearAllHighlights();
    this.isAnimating = false;
  }

  async handleSearch() {
    if (this.isAnimating) return;
    const values = this.parseInput();
    if (values.length !== 1) return;
    const value = values[0];

    this.lastDetails = { values: [value], action: "search", baseTree: this.tree.clone() };
    this.detailsBtn.disabled = false;
    this.isAnimating = true;

    const path = this.tree.findPath(value);
    await this.animatePath(path, "highlighted");

    this.valueInput.value = "";
    await sleep(1000);
    this.clearAllHighlights();
    this.isAnimating = false;
  }

  showDetails() {
    if (this.lastDetails.baseTree) {
      this.populateDetailsModal(this.lastDetails.values, this.lastDetails.action, this.lastDetails.baseTree);
      this.detailsModal.show();
    }
  }

  reset() {
    this.tree = new BinarySearchTree();
    this.lastDetails = { values: [], action: "", baseTree: null };
    this.valueInput.value = "";
    this.clearAllHighlights();
    this.draw();
  }
}

export { BSTHandler };
