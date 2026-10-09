const NODE_RADIUS = 26;
const VERTICAL_SPACING = 84;

function getNodeBF(node) {
  if (!node) return 0;
  const leftH = node.left ? node.left.height : 0;
  const rightH = node.right ? node.right.height : 0;
  return leftH - rightH;
}

function drawTree(svg, tree, onNodeClick) {
  let viewportLayer = svg.querySelector("#viewport-layer");
  if (!viewportLayer) {
    svg.innerHTML = '<g id="viewport-layer"><g id="links-layer"></g><g id="nodes-layer"></g></g>';
    viewportLayer = svg.querySelector("#viewport-layer");
  }

  let linksLayer = viewportLayer.querySelector("#links-layer");
  let nodesLayer = viewportLayer.querySelector("#nodes-layer");

  if (!linksLayer || !nodesLayer) {
    viewportLayer.innerHTML = '<g id="links-layer"></g><g id="nodes-layer"></g>';
    linksLayer = viewportLayer.querySelector("#links-layer");
    nodesLayer = viewportLayer.querySelector("#nodes-layer");
  }

  if (!tree.root) {
    linksLayer.innerHTML = "";
    nodesLayer.innerHTML = "";
    return;
  }

  const containerW = svg.parentElement?.clientWidth || svg.clientWidth || 800;
  const treeHeight = tree.root.height;
  const leavesCount = Math.pow(2, Math.max(treeHeight - 1, 0));
  const calcWidth = Math.max(containerW, leavesCount * 70);
  const neededHeight = Math.max(460, VERTICAL_SPACING * (treeHeight - 1) + NODE_RADIUS * 2 + 80);

  svg.setAttribute("viewBox", `0 0 ${calcWidth} ${neededHeight}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  assignCoordinates(tree.root, calcWidth / 2, NODE_RADIUS + 36, calcWidth / 4);

  // Collect all active nodes and edges
  const currentNodes = [];
  const currentEdges = [];

  function traverse(node) {
    if (!node) return;
    currentNodes.push(node);
    if (node.left) {
      currentEdges.push({ from: node, to: node.left, id: `link-${node.value}-${node.left.value}` });
      traverse(node.left);
    }
    if (node.right) {
      currentEdges.push({ from: node, to: node.right, id: `link-${node.value}-${node.right.value}` });
      traverse(node.right);
    }
  }
  traverse(tree.root);

  // 1. Sync Links / Branches (Giữ nguyên thẻ link cũ, cập nhật tọa độ trượt)
  const activeEdgeIds = new Set(currentEdges.map((e) => e.id));
  linksLayer.querySelectorAll(".link").forEach((line) => {
    if (!activeEdgeIds.has(line.id)) {
      line.remove();
    }
  });

  currentEdges.forEach(({ from, to, id }) => {
    let line = linksLayer.querySelector(`#${id}`);
    if (!line) {
      line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "link link-entering");
      line.setAttribute("id", id);
      linksLayer.appendChild(line);
    }
    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);
  });

  // 2. Sync Nodes (Giữ nguyên thẻ nút cũ, trượt mượt mà tọa độ khi xoay cây)
  const activeValues = new Set(currentNodes.map((n) => String(n.value)));
  nodesLayer.querySelectorAll(".node").forEach((nodeEl) => {
    if (!activeValues.has(nodeEl.dataset.value)) {
      nodeEl.remove();
    }
  });

  currentNodes.forEach((node) => {
    const bf = getNodeBF(node);
    const isImbalanced = Math.abs(bf) >= 2;
    let group = nodesLayer.querySelector(`#node-${node.value}`);
    const isNew = !group;

    if (isNew) {
      group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", `node node-entering ${isImbalanced ? "node-imbalanced" : ""}`);
      group.setAttribute("id", `node-${node.value}`);
      group.dataset.value = node.value;

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "node-circle");
      circle.setAttribute("r", NODE_RADIUS);

      const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valueText.setAttribute("class", "value-text");
      valueText.textContent = node.value;

      const badgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      badgeGroup.setAttribute("class", "node-stats-badge");

      const badgeRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      badgeRect.setAttribute("width", 82);
      badgeRect.setAttribute("height", 22);
      badgeRect.setAttribute("rx", "6");
      badgeRect.setAttribute("ry", "6");

      const badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      badgeText.setAttribute("text-anchor", "middle");
      badgeText.setAttribute("dominant-baseline", "central");
      badgeText.setAttribute("alignment-baseline", "central");

      badgeGroup.append(badgeRect, badgeText);

      const calloutGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      calloutGroup.setAttribute("class", "comparison-callout hidden");
      calloutGroup.setAttribute("id", `callout-${node.value}`);

      group.append(circle, valueText, badgeGroup, calloutGroup);
      nodesLayer.appendChild(group);

      if (onNodeClick) {
        group.style.cursor = "pointer";
        group.addEventListener("click", (e) => {
          e.stopPropagation();
          onNodeClick(node, group, e);
        });
      }
    } else {
      group.classList.remove("node-entering");
      if (isImbalanced) {
        group.classList.add("node-imbalanced");
      } else {
        group.classList.remove("node-imbalanced");
      }
    }

    // Cập nhật tọa độ và dữ liệu (CSS Transition sẽ tự động trượt mượt mà)
    group.dataset.height = node.height;
    group.dataset.bf = bf;

    const circle = group.querySelector(".node-circle");
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);

    const valueText = group.querySelector(".value-text");
    valueText.setAttribute("x", node.x);
    valueText.setAttribute("y", node.y);

    const badgeW = 82;
    const badgeH = 22;
    const badgeX = node.x - badgeW / 2;
    const badgeY = node.y + NODE_RADIUS + 8;

    const badgeRect = group.querySelector("rect");
    badgeRect.setAttribute("x", badgeX);
    badgeRect.setAttribute("y", badgeY);
    badgeRect.setAttribute("class", isImbalanced ? "badge-rect-imbalanced" : "badge-rect-normal");

    const badgeText = group.querySelector(".node-stats-badge text");
    badgeText.setAttribute("x", node.x);
    badgeText.setAttribute("y", badgeY + badgeH / 2);
    badgeText.setAttribute("class", isImbalanced ? "badge-text-imbalanced" : "badge-text-normal");
    const bfSign = bf > 0 ? `+${bf}` : `${bf}`;
    badgeText.textContent = `h=${node.height} · BF=${bfSign}`;
  });
}

function assignCoordinates(node, x, y, offset) {
  if (!node) return;
  node.x = x;
  node.y = y;
  assignCoordinates(node.left, x - offset, y + VERTICAL_SPACING, offset / 2);
  assignCoordinates(node.right, x + offset, y + VERTICAL_SPACING, offset / 2);
}

/**
 * Tạo cây mô phỏng từng bước (Mini Tree) to rõ ràng, dễ nhìn
 */
function createMiniTreeVis(sourceTree, highlightedPath = []) {
  const miniSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  miniSvg.setAttribute("class", "mini-tree-svg");

  if (!sourceTree.root) return miniSvg;

  const tree = sourceTree.clone();

  // Kích thước to rõ ràng, cân đối và thoáng mắt
  const svgWidth = 480;
  const nodeRadius = 22;
  const verticalSpacing = 72;
  const fontSize = "14px";

  const treeHeight = tree.root.height;
  const neededHeight = verticalSpacing * (treeHeight - 1) + nodeRadius * 2 + 48;
  miniSvg.setAttribute("viewBox", `0 0 ${svgWidth} ${neededHeight}`);
  miniSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  function assignMiniCoordinates(node, x, y, offset) {
    if (!node) return;
    node.x = x;
    node.y = y;
    assignMiniCoordinates(node.left, x - offset, y + verticalSpacing, offset / 2);
    assignMiniCoordinates(node.right, x + offset, y + verticalSpacing, offset / 2);
  }

  assignMiniCoordinates(tree.root, svgWidth / 2, nodeRadius + 16, svgWidth / 4);

  function drawMiniElements(node) {
    if (!node) return;
    if (node.left) drawMiniLine(node, node.left);
    if (node.right) drawMiniLine(node, node.right);
    drawMiniElements(node.left);
    drawMiniElements(node.right);
    drawMiniNode(node);
  }

  function drawMiniLine(from, to) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "mini-link");
    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);
    miniSvg.prepend(line);
  }

  const highlightedValues = new Set(highlightedPath.map((p) => p.value));

  function drawMiniNode(node) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "node");

    if (highlightedValues.has(node.value)) {
      group.classList.add("traversed");
    }

    const bf = getNodeBF(node);
    const isImbalanced = Math.abs(bf) >= 2;
    if (isImbalanced) {
      group.classList.add("node-imbalanced");
    }

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "node-circle");
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("r", nodeRadius);

    const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    valueText.setAttribute("class", "value-text");
    valueText.setAttribute("x", node.x);
    valueText.setAttribute("y", node.y);
    valueText.style.fontSize = fontSize;
    valueText.style.fontWeight = "800";
    valueText.textContent = node.value;

    // Mini Badge Pill (h and BF)
    const badgeW = 74;
    const badgeH = 19;
    const badgeX = node.x - badgeW / 2;
    const badgeY = node.y + nodeRadius + 6;

    const badgeRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    badgeRect.setAttribute("x", badgeX);
    badgeRect.setAttribute("y", badgeY);
    badgeRect.setAttribute("width", badgeW);
    badgeRect.setAttribute("height", badgeH);
    badgeRect.setAttribute("rx", "6");
    badgeRect.setAttribute("ry", "6");
    badgeRect.setAttribute("class", isImbalanced ? "badge-rect-imbalanced" : "badge-rect-normal");

    const badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    badgeText.setAttribute("x", node.x);
    badgeText.setAttribute("y", badgeY + badgeH / 2);
    badgeText.setAttribute("text-anchor", "middle");
    badgeText.setAttribute("dominant-baseline", "central");
    badgeText.setAttribute("alignment-baseline", "central");
    badgeText.setAttribute("class", isImbalanced ? "badge-text-imbalanced" : "badge-text-normal");
    badgeText.style.fontSize = "9.5px";
    badgeText.style.fontWeight = "700";
    const bfSign = bf > 0 ? `+${bf}` : `${bf}`;
    badgeText.textContent = `h=${node.height} · BF=${bfSign}`;

    group.append(circle, valueText, badgeRect, badgeText);
    miniSvg.appendChild(group);
  }

  drawMiniElements(tree.root);
  return miniSvg;
}

/**
 * Tạo cây hiển thị kích thước lớn (Large Tree Vis) cho Modal phóng to
 */
function createLargeTreeVis(sourceTree, highlightedPath = []) {
  const largeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  largeSvg.setAttribute("class", "w-full h-full min-h-[480px] max-h-[75vh]");

  if (!sourceTree.root) return largeSvg;

  const tree = sourceTree.clone();
  const treeHeight = tree.root.height;
  const leavesCount = Math.pow(2, Math.max(treeHeight - 1, 0));
  const svgWidth = Math.max(920, leavesCount * 125);
  const nodeRadius = 30;
  const verticalSpacing = 98;

  const neededHeight = Math.max(480, verticalSpacing * (treeHeight - 1) + nodeRadius * 2 + 80);
  largeSvg.setAttribute("viewBox", `0 0 ${svgWidth} ${neededHeight}`);
  largeSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  function assignLargeCoordinates(node, x, y, offset) {
    if (!node) return;
    node.x = x;
    node.y = y;
    assignLargeCoordinates(node.left, x - offset, y + verticalSpacing, offset / 2);
    assignLargeCoordinates(node.right, x + offset, y + verticalSpacing, offset / 2);
  }

  assignLargeCoordinates(tree.root, svgWidth / 2, nodeRadius + 38, svgWidth / 4);

  function drawLargeElements(node) {
    if (!node) return;
    if (node.left) drawLargeLine(node, node.left);
    if (node.right) drawLargeLine(node, node.right);
    drawLargeElements(node.left);
    drawLargeElements(node.right);
    drawLargeNode(node);
  }

  function drawLargeLine(from, to) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "link");
    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);
    line.style.strokeWidth = "3px";
    largeSvg.prepend(line);
  }

  const highlightedValues = new Set(highlightedPath.map((p) => p.value));

  function drawLargeNode(node) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "node");

    if (highlightedValues.has(node.value)) {
      group.classList.add("traversed");
    }

    const bf = getNodeBF(node);
    const isImbalanced = Math.abs(bf) >= 2;
    if (isImbalanced) {
      group.classList.add("node-imbalanced");
    }

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "node-circle");
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("r", nodeRadius);

    const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    valueText.setAttribute("class", "value-text");
    valueText.setAttribute("x", node.x);
    valueText.setAttribute("y", node.y);
    valueText.style.fontSize = "17px";
    valueText.style.fontWeight = "800";
    valueText.textContent = node.value;

    // Badge Pill
    const badgeW = 92;
    const badgeH = 25;
    const badgeX = node.x - badgeW / 2;
    const badgeY = node.y + nodeRadius + 9;

    const badgeRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    badgeRect.setAttribute("x", badgeX);
    badgeRect.setAttribute("y", badgeY);
    badgeRect.setAttribute("width", badgeW);
    badgeRect.setAttribute("height", badgeH);
    badgeRect.setAttribute("rx", "6");
    badgeRect.setAttribute("ry", "6");
    badgeRect.setAttribute("class", isImbalanced ? "badge-rect-imbalanced" : "badge-rect-normal");

    const badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    badgeText.setAttribute("x", node.x);
    badgeText.setAttribute("y", badgeY + badgeH / 2);
    badgeText.setAttribute("text-anchor", "middle");
    badgeText.setAttribute("dominant-baseline", "central");
    badgeText.setAttribute("alignment-baseline", "central");
    badgeText.setAttribute("class", isImbalanced ? "badge-text-imbalanced" : "badge-text-normal");
    badgeText.style.fontSize = "11.5px";
    badgeText.style.fontWeight = "700";
    const bfSign = bf > 0 ? `+${bf}` : `${bf}`;
    badgeText.textContent = `h=${node.height} · BF=${bfSign}`;

    group.append(circle, valueText, badgeRect, badgeText);
    largeSvg.appendChild(group);
  }

  drawLargeElements(tree.root);
  return largeSvg;
}

/**
 * Mở modal phóng to sơ đồ cây
 */
function openTreeZoomModal(sourceTree, highlightedPath = [], title = "Chi Tiết Sơ Đồ Cây", subtitle = "") {
  const modal = document.getElementById("tree-zoom-modal");
  const modalBody = document.getElementById("zoom-modal-body");
  const modalTitle = document.getElementById("zoom-modal-title");
  const modalSubtitle = document.getElementById("zoom-modal-subtitle");

  if (!modal || !modalBody) return;

  if (modalTitle) modalTitle.textContent = title;
  if (modalSubtitle) modalSubtitle.textContent = subtitle || "Trực quan hóa cấu trúc cây kích thước lớn";

  modalBody.innerHTML = "";
  const largeSvg = createLargeTreeVis(sourceTree, highlightedPath);
  modalBody.appendChild(largeSvg);

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

/**
 * Đóng modal phóng to
 */
function closeTreeZoomModal() {
  const modal = document.getElementById("tree-zoom-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

// Gắn sự kiện đóng modal
if (typeof window !== "undefined") {
  const initModalEvents = () => {
    const modal = document.getElementById("tree-zoom-modal");
    const closeBtn = document.getElementById("zoom-modal-close");
    const closeBtn2 = document.getElementById("zoom-modal-close-btn");

    if (closeBtn) closeBtn.onclick = closeTreeZoomModal;
    if (closeBtn2) closeBtn2.onclick = closeTreeZoomModal;

    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) closeTreeZoomModal();
      };
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
        closeTreeZoomModal();
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModalEvents);
  } else {
    initModalEvents();
  }
}

/**
 * Tạo khung hình cây mini kèm nút phóng to ở góc trái khi hover
 */
function createZoomableMiniVis(sourceTree, highlightedPath = [], title = "Chi Tiết Sơ Đồ Cây", subtitle = "") {
  const container = document.createElement("div");
  container.className = "mini-vis";

  // Nút icon phóng to ở góc trái
  const zoomBtn = document.createElement("button");
  zoomBtn.type = "button";
  zoomBtn.className = "mini-vis-zoom-btn";
  zoomBtn.title = "Phóng to sơ đồ cây này";
  zoomBtn.innerHTML = `
    <i class="ri-zoom-in-line text-sm text-teal-600"></i>
    <span>Phóng to</span>
  `;
  zoomBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openTreeZoomModal(sourceTree, highlightedPath, title, subtitle);
  });

  const miniSvg = createMiniTreeVis(sourceTree, highlightedPath);
  container.appendChild(zoomBtn);
  container.appendChild(miniSvg);

  return container;
}

/**
 * Hiển thị tooltip so sánh trực quan phía trên nút trong SVG
 */
function showComparisonCallout(svg, node, compareValue, action = "insert") {
  const nodeEl = svg.querySelector(`#node-${node.value}`);
  if (!nodeEl) return;

  const callout = nodeEl.querySelector(`.comparison-callout`);
  if (!callout) return;

  callout.innerHTML = "";
  callout.classList.remove("hidden");

  let text = "";
  let directionIcon = "";
  let bgColor = "#0f172a"; // Slate 900
  let textColor = "#f8fafc";

  if (compareValue < node.value) {
    text = `${compareValue} < ${node.value} ➜ Trái`;
  } else if (compareValue > node.value) {
    text = `${compareValue} > ${node.value} ➜ Phải`;
  } else {
    text = `${compareValue} == ${node.value} (Khớp)`;
    bgColor = "#047857"; // Emerald 700
  }

  const calloutW = 128;
  const calloutH = 24;
  const calloutX = node.x - calloutW / 2;
  const calloutY = node.y - NODE_RADIUS - 30;

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", calloutX);
  rect.setAttribute("y", calloutY);
  rect.setAttribute("width", calloutW);
  rect.setAttribute("height", calloutH);
  rect.setAttribute("rx", "6");
  rect.setAttribute("ry", "6");
  rect.setAttribute("fill", bgColor);
  rect.setAttribute("stroke", "#ffffff");
  rect.setAttribute("stroke-width", "1");
  rect.setAttribute("class", "callout-rect");

  // Pointer Triangle pointing down to node
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute(
    "points",
    `${node.x - 5},${calloutY + calloutH} ${node.x + 5},${calloutY + calloutH} ${node.x},${calloutY + calloutH + 5}`
  );
  polygon.setAttribute("fill", bgColor);

  const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  textEl.setAttribute("x", node.x);
  textEl.setAttribute("y", calloutY + calloutH / 2);
  textEl.setAttribute("text-anchor", "middle");
  textEl.setAttribute("dominant-baseline", "central");
  textEl.setAttribute("alignment-baseline", "central");
  textEl.setAttribute("fill", textColor);
  textEl.setAttribute("font-family", "Mulish, sans-serif");
  textEl.setAttribute("font-size", "11px");
  textEl.setAttribute("font-weight", "800");
  textEl.textContent = text;

  callout.append(rect, polygon, textEl);
}

function clearAllCallouts(svg) {
  svg.querySelectorAll(".comparison-callout").forEach((el) => {
    el.innerHTML = "";
    el.classList.add("hidden");
  });
}

export {
  drawTree,
  createMiniTreeVis,
  createZoomableMiniVis,
  createLargeTreeVis,
  openTreeZoomModal,
  closeTreeZoomModal,
  showComparisonCallout,
  clearAllCallouts
};

