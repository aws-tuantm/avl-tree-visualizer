import { AVLTree } from "./avl.js";
import { drawTree, createMiniTreeVis, createZoomableMiniVis, showComparisonCallout, clearAllCallouts } from "./ui.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class AVLHandler {
  constructor(container) {
    this.svg = container.querySelector("#tree-svg");
    this.valueInput = container.querySelector("#node-value");
    this.deleteBtn = container.querySelector("#delete-btn");
    this.searchBtn = container.querySelector("#search-btn");
    this.resetBtn = container.querySelector("#reset-btn");
    this.logContainer = document.getElementById("modal-body-content");
    this.logStatusBadge = document.getElementById("log-status-badge");

    // Teaching & Control elements
    this.speedSlider = document.getElementById("speed-slider");
    this.speedLabel = document.getElementById("speed-label");
    this.stepModeToggle = document.getElementById("step-mode-toggle");
    this.stepModeIcon = document.getElementById("step-mode-icon");
    this.stepModeText = document.getElementById("step-mode-text");
    this.stepNextBtn = document.getElementById("step-next-btn");
    this.replayBtn = document.getElementById("replay-btn");

    // Pan & Zoom Controls & Container
    this.treeContainer = document.getElementById("tree-container");
    this.zoomInBtn = document.getElementById("zoom-in-btn");
    this.zoomOutBtn = document.getElementById("zoom-out-btn");
    this.zoomResetBtn = document.getElementById("zoom-reset-btn");
    this.zoomLevelText = document.getElementById("zoom-level-text");

    this.zoomScale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;

    // Presets Dropdown Menu
    this.presetsBtn = document.getElementById("presets-btn");
    this.presetsDropdown = document.getElementById("presets-dropdown-menu");
    this.presetRandomBtn = document.getElementById("preset-random-btn");

    // Floating Node Action Dropdown Menu
    this.nodeDropdown = document.getElementById("node-dropdown-menu");
    this.menuNodeVal = document.getElementById("menu-node-val");
    this.menuNodeInfo = document.getElementById("menu-node-info");
    this.menuBtnSearch = document.getElementById("menu-btn-search");
    this.menuBtnDelete = document.getElementById("menu-btn-delete");
    this.menuBtnSelect = document.getElementById("menu-btn-select");
    this.activeMenuNode = null;

    // Validation elements
    this.errorContainer = document.getElementById("input-error");
    this.errorText = document.getElementById("input-error-text");

    // Stats elements
    this.statNodes = document.getElementById("stat-nodes");
    this.statHeight = document.getElementById("stat-height");
    this.statRoot = document.getElementById("stat-root");

    this.tree = new AVLTree();
    this.isAnimating = false;
    this.animationSpeed = 450;
    this.isStepMode = false;
    this.stepResolver = null;
    this.lastDetails = { values: [], action: "", baseTree: null };

    // Clear error on input typing
    if (this.valueInput) {
      this.valueInput.addEventListener("input", () => this.clearError());
    }

    // Speed slider listener
    if (this.speedSlider) {
      this.speedSlider.addEventListener("input", (e) => {
        this.animationSpeed = parseInt(e.target.value, 10);
        if (this.speedLabel) {
          this.speedLabel.textContent = `${(this.animationSpeed / 1000).toFixed(2)}s`;
        }
      });
    }

    // Step mode toggle listener
    if (this.stepModeToggle) {
      this.stepModeToggle.addEventListener("click", () => this.toggleStepMode());
    }

    // Step next button listener
    if (this.stepNextBtn) {
      this.stepNextBtn.addEventListener("click", () => {
        if (this.stepResolver) {
          const resolve = this.stepResolver;
          this.stepResolver = null;
          this.stepNextBtn.disabled = true;
          resolve();
        }
      });
    }

    // Replay button listener
    if (this.replayBtn) {
      this.replayBtn.addEventListener("click", () => this.handleReplay());
    }

    // Dropdown Action: Tìm kiếm nút
    if (this.menuBtnSearch) {
      this.menuBtnSearch.addEventListener("click", () => {
        if (this.activeMenuNode !== null && !this.isAnimating) {
          const val = this.activeMenuNode.value;
          this.hideNodeMenu();
          if (this.valueInput) this.valueInput.value = val;
          this.handleSearch();
        }
      });
    }

    // Dropdown Action: Xóa nút
    if (this.menuBtnDelete) {
      this.menuBtnDelete.addEventListener("click", () => {
        if (this.activeMenuNode !== null && !this.isAnimating) {
          const val = this.activeMenuNode.value;
          this.hideNodeMenu();
          if (this.valueInput) this.valueInput.value = val;
          this.handleDelete();
        }
      });
    }

    // Dropdown Action: Điền vào ô nhập
    if (this.menuBtnSelect) {
      this.menuBtnSelect.addEventListener("click", () => {
        if (this.activeMenuNode !== null) {
          const val = this.activeMenuNode.value;
          this.hideNodeMenu();
          if (this.valueInput) {
            this.valueInput.value = val;
            this.valueInput.focus();
          }
        }
      });
    }

    // Toggle Presets Dropdown
    if (this.presetsBtn && this.presetsDropdown) {
      this.presetsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.hideNodeMenu();
        this.presetsDropdown.classList.toggle("hidden");
      });
    }

    // Click on Preset Items
    const presetItems = document.querySelectorAll(".preset-item");
    presetItems.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const val = btn.getAttribute("data-preset");
        if (val) {
          this.applyPreset(val);
        }
      });
    });

    // Click on Random Preset
    if (this.presetRandomBtn) {
      this.presetRandomBtn.addEventListener("click", () => {
        const nums = [];
        while (nums.length < 6) {
          const r = Math.floor(Math.random() * 90) + 10;
          if (!nums.includes(r)) nums.push(r);
        }
        this.applyPreset(nums.join(", "));
      });
    }

    // Close menus when clicking outside or pressing Escape
    document.addEventListener("click", (e) => {
      if (this.nodeDropdown && !this.nodeDropdown.contains(e.target)) {
        this.hideNodeMenu();
      }
      if (this.presetsDropdown && !this.presetsDropdown.contains(e.target) && e.target !== this.presetsBtn && !this.presetsBtn?.contains(e.target)) {
        this.presetsDropdown.classList.add("hidden");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideNodeMenu();
        if (this.presetsDropdown) this.presetsDropdown.classList.add("hidden");
      }
    });

    this.setupPanZoom();
    this.draw();
    this.updateStats();
  }

  setupPanZoom() {
    this.rafPanZoom = null;

    if (this.zoomInBtn) {
      this.zoomInBtn.addEventListener("click", () => {
        this.enableSmoothTransition();
        this.zoomRelative(1.25);
      });
    }
    if (this.zoomOutBtn) {
      this.zoomOutBtn.addEventListener("click", () => {
        this.enableSmoothTransition();
        this.zoomRelative(1 / 1.25);
      });
    }
    if (this.zoomResetBtn) {
      this.zoomResetBtn.addEventListener("click", () => {
        this.enableSmoothTransition();
        this.resetPanZoom();
      });
    }

    if (this.treeContainer) {
      // Mouse Wheel Zoom (Phóng to/thu nhỏ tức thì, tâm tại con trỏ)
      this.treeContainer.addEventListener("wheel", (e) => {
        e.preventDefault();
        this.disableSmoothTransition();
        const rect = this.treeContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        this.zoomAtPoint(factor, mouseX, mouseY);
      }, { passive: false });

      // Drag to Pan (Chuột)
      this.treeContainer.addEventListener("mousedown", (e) => {
        if (e.target.closest("#node-dropdown-menu") || e.target.closest(".node") || e.target.closest("button")) {
          return;
        }
        this.disableSmoothTransition();
        this.isPanning = true;
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
        this.treeContainer.classList.add("cursor-grabbing");
        this.treeContainer.classList.remove("cursor-grab");
      });

      window.addEventListener("mousemove", (e) => {
        if (!this.isPanning) return;
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this.requestPanZoomRender();
      }, { passive: true });

      window.addEventListener("mouseup", () => {
        if (this.isPanning) {
          this.isPanning = false;
          if (this.treeContainer) {
            this.treeContainer.classList.remove("cursor-grabbing");
            this.treeContainer.classList.add("cursor-grab");
          }
        }
      });

      // Vuốt cảm ứng & Chụm 2 ngón (Touch & Pinch)
      let touchStartX = 0;
      let touchStartY = 0;
      let initialTouchDist = 0;
      let initialTouchScale = 1;
      let touchCenter = { x: 0, y: 0 };

      this.treeContainer.addEventListener("touchstart", (e) => {
        this.disableSmoothTransition();
        if (e.touches.length === 1) {
          if (!e.target.closest(".node") && !e.target.closest("button") && !e.target.closest("#node-dropdown-menu")) {
            this.isPanning = true;
            touchStartX = e.touches[0].clientX - this.panX;
            touchStartY = e.touches[0].clientY - this.panY;
          }
        } else if (e.touches.length === 2) {
          this.isPanning = false;
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          initialTouchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
          initialTouchScale = this.zoomScale;
          const rect = this.treeContainer.getBoundingClientRect();
          touchCenter = {
            x: (t1.clientX + t2.clientX) / 2 - rect.left,
            y: (t1.clientY + t2.clientY) / 2 - rect.top,
          };
        }
      }, { passive: false });

      this.treeContainer.addEventListener("touchmove", (e) => {
        if (e.touches.length === 1 && this.isPanning) {
          e.preventDefault();
          this.panX = e.touches[0].clientX - touchStartX;
          this.panY = e.touches[0].clientY - touchStartY;
          this.requestPanZoomRender();
        } else if (e.touches.length === 2 && initialTouchDist > 0) {
          e.preventDefault();
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
          const factor = currentDist / initialTouchDist;
          const targetScale = Math.min(Math.max(initialTouchScale * factor, 0.25), 3.5);
          
          // Zoom hướng về tâm 2 ngón tay
          const oldScale = this.zoomScale;
          this.panX = touchCenter.x - (touchCenter.x - this.panX) * (targetScale / oldScale);
          this.panY = touchCenter.y - (touchCenter.y - this.panY) * (targetScale / oldScale);
          this.zoomScale = targetScale;
          this.requestPanZoomRender();
        }
      }, { passive: false });

      this.treeContainer.addEventListener("touchend", () => {
        this.isPanning = false;
        initialTouchDist = 0;
      }, { passive: true });
    }
  }

  enableSmoothTransition() {
    const viewportLayer = this.svg?.querySelector("#viewport-layer");
    if (viewportLayer) {
      viewportLayer.classList.add("smooth-transition");
      clearTimeout(this.smoothTransitionTimeout);
      this.smoothTransitionTimeout = setTimeout(() => {
        viewportLayer.classList.remove("smooth-transition");
      }, 300);
    }
  }

  disableSmoothTransition() {
    const viewportLayer = this.svg?.querySelector("#viewport-layer");
    if (viewportLayer) {
      viewportLayer.classList.remove("smooth-transition");
    }
  }

  requestPanZoomRender() {
    if (this.rafPanZoom) return;
    this.rafPanZoom = requestAnimationFrame(() => {
      this.applyPanZoom();
      this.rafPanZoom = null;
    });
  }

  applyPanZoom() {
    const viewportLayer = this.svg?.querySelector("#viewport-layer");
    if (viewportLayer) {
      viewportLayer.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.zoomScale})`);
    }
    if (this.zoomLevelText) {
      this.zoomLevelText.textContent = `${Math.round(this.zoomScale * 100)}%`;
    }
  }

  zoomRelative(factor) {
    if (!this.treeContainer) return;
    const rect = this.treeContainer.getBoundingClientRect();
    this.zoomAtPoint(factor, rect.width / 2, rect.height / 2);
  }

  zoomAtPoint(factor, clientX, clientY) {
    const oldScale = this.zoomScale;
    const newScale = Math.min(Math.max(oldScale * factor, 0.25), 3.5);
    if (newScale === oldScale) return;

    // Zoom hướng về tâm con trỏ chuột
    this.panX = clientX - (clientX - this.panX) * (newScale / oldScale);
    this.panY = clientY - (clientY - this.panY) * (newScale / oldScale);
    this.zoomScale = newScale;
    this.applyPanZoom();
  }

  resetPanZoom() {
    this.zoomScale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.applyPanZoom();
  }

  applyPreset(valueString) {
    if (this.isAnimating) return;
    if (this.presetsDropdown) {
      this.presetsDropdown.classList.add("hidden");
    }
    if (this.valueInput) {
      this.valueInput.value = valueString;
    }
    // Nếu cây đã có nút, reset trước để thêm mẫu từ đầu một cách trực quan
    if (this.tree.root) {
      this.tree = new AVLTree();
      this.draw();
      this.updateStats();
    }
    this.handleInsert();
  }

  toggleStepMode() {
    this.isStepMode = !this.isStepMode;
    if (this.isStepMode) {
      if (this.stepModeText) this.stepModeText.textContent = "Từng bước";
      if (this.stepModeIcon) this.stepModeIcon.className = "ri-pause-circle-line text-sm text-amber-600";
      if (this.stepModeToggle) this.stepModeToggle.className = "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold transition-all cursor-pointer whitespace-nowrap";
      if (this.stepNextBtn) this.stepNextBtn.classList.remove("hidden");
    } else {
      if (this.stepModeText) this.stepModeText.textContent = "Tự động";
      if (this.stepModeIcon) this.stepModeIcon.className = "ri-play-circle-line text-sm text-teal-600";
      if (this.stepModeToggle) this.stepModeToggle.className = "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold transition-all cursor-pointer whitespace-nowrap";
      if (this.stepNextBtn) this.stepNextBtn.classList.add("hidden");
      if (this.stepResolver) {
        const resolve = this.stepResolver;
        this.stepResolver = null;
        resolve();
      }
    }
  }

  async waitStepOrDelay(multiplier = 1) {
    if (this.isStepMode) {
      if (this.stepNextBtn) {
        this.stepNextBtn.disabled = false;
        this.stepNextBtn.classList.add("ring-2", "ring-teal-500/50");
      }
      return new Promise((resolve) => {
        this.stepResolver = () => {
          if (this.stepNextBtn) {
            this.stepNextBtn.classList.remove("ring-2", "ring-teal-500/50");
          }
          resolve();
        };
      });
    } else {
      await sleep(this.animationSpeed * multiplier);
    }
  }

  showError(message) {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    if (this.errorContainer && this.errorText) {
      this.errorText.textContent = message;
      this.errorContainer.classList.remove("hidden");
    }
    if (this.valueInput) {
      this.valueInput.classList.add("border-rose-500", "focus:border-rose-500", "focus:ring-rose-500/20");
      this.valueInput.classList.remove("border-slate-200", "focus:border-teal-600");
      this.valueInput.focus();
    }
    this.errorTimeout = setTimeout(() => {
      this.clearError();
    }, 4000);
  }

  clearError() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
    if (this.errorContainer) {
      this.errorContainer.classList.add("hidden");
    }
    if (this.valueInput) {
      this.valueInput.classList.remove("border-rose-500", "focus:border-rose-500", "focus:ring-rose-500/20");
      this.valueInput.classList.add("border-slate-200", "focus:border-teal-600");
    }
  }

  countNodes(node = this.tree.root) {
    if (!node) return 0;
    return 1 + this.countNodes(node.left) + this.countNodes(node.right);
  }

  updateStats() {
    const nodeCount = this.countNodes();
    const height = this.tree.root ? this.tree.root.height : 0;
    const rootVal = this.tree.root ? this.tree.root.value : "Trống";

    if (this.statNodes) this.statNodes.textContent = nodeCount;
    if (this.statHeight) this.statHeight.textContent = height;
    if (this.statRoot) this.statRoot.textContent = rootVal;
  }

  parseInput() {
    const raw = this.valueInput.value.trim();
    if (!raw) return { valid: false, error: "Vui lòng nhập giá trị số nguyên." };

    const tokens = raw.replace(/,/g, " ").split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      return { valid: false, error: "Vui lòng nhập ít nhất một giá trị số." };
    }

    const numbers = [];
    for (const token of tokens) {
      if (!/^-?\d+$/.test(token)) {
        return { valid: false, error: `Giá trị "${token}" không phải là số nguyên hợp lệ.` };
      }
      const num = parseInt(token, 10);
      if (isNaN(num)) {
        return { valid: false, error: `Giá trị "${token}" không hợp lệ.` };
      }
      numbers.push(num);
    }

    return { valid: true, values: numbers };
  }

  highlightNode(node, className) {
    const el = this.svg.querySelector(`#node-${node.value}`);
    if (el) el.classList.add(className);
  }

  clearAllHighlights() {
    this.svg.querySelectorAll(".node.traversed, .node.highlighted").forEach((el) => {
      el.classList.remove("traversed", "highlighted");
    });
    clearAllCallouts(this.svg);
  }

  async animatePath(path, compareValue, finalClassName, action = "insert") {
    this.clearAllHighlights();
    for (const node of path) {
      this.highlightNode(node, "traversed");
      showComparisonCallout(this.svg, node, compareValue, action);
      await this.waitStepOrDelay(1);
    }
    if (path.length > 0) {
      this.highlightNode(path[path.length - 1], finalClassName);
    }
  }

  showNodeContextMenu(node, nodeGroupEl, event) {
    if (this.isAnimating) return;
    this.activeMenuNode = node;
    if (!this.nodeDropdown) return;

    const leftH = node.left ? node.left.height : 0;
    const rightH = node.right ? node.right.height : 0;
    const bf = leftH - rightH;
    const bfSign = bf > 0 ? `+${bf}` : `${bf}`;

    if (this.menuNodeVal) this.menuNodeVal.textContent = node.value;
    if (this.menuNodeInfo) this.menuNodeInfo.textContent = `h=${node.height}, BF=${bfSign}`;

    const container = this.svg.parentElement;
    const containerRect = container.getBoundingClientRect();
    const nodeRect = nodeGroupEl.getBoundingClientRect();

    let left = nodeRect.left - containerRect.left + nodeRect.width / 2 - 84 + container.scrollLeft;
    let top = nodeRect.bottom - containerRect.top + 6 + container.scrollTop;

    // Keep dropdown inside container bounds
    if (left < 10) left = 10;
    if (left + 175 > container.clientWidth) left = container.clientWidth - 180;

    this.nodeDropdown.style.left = `${left}px`;
    this.nodeDropdown.style.top = `${top}px`;
    this.nodeDropdown.classList.remove("hidden");
  }

  hideNodeMenu() {
    this.activeMenuNode = null;
    if (this.nodeDropdown) {
      this.nodeDropdown.classList.add("hidden");
    }
  }

  draw() {
    this.hideNodeMenu();
    drawTree(this.svg, this.tree, (node, groupEl, e) => this.showNodeContextMenu(node, groupEl, e));
    this.applyPanZoom();
    this.updateStats();
  }

  /**
   * Hiển thị trực tiếp phân tích từng bước xuống khung bên dưới
   */
  renderDetailsInline(values, action, baseTree) {
    if (!this.logContainer) return;
    this.logContainer.innerHTML = "";
    let tempTree = baseTree.clone();

    if (this.logStatusBadge) {
      this.logStatusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200";
      const actionText = action === "insert" ? "Vừa thêm" : action === "delete" ? "Vừa xóa" : "Vừa tìm kiếm";
      this.logStatusBadge.innerHTML = `<i class="ri-checkbox-circle-line text-xs text-teal-600"></i> ${actionText}: ${values.join(", ")}`;
    }

    values.forEach((value) => {
      const card = document.createElement("div");
      card.className = "p-3.5 rounded-[6px] bg-white border border-slate-200 space-y-2.5";

      const header = document.createElement("div");
      header.className = "operation-header flex items-center justify-between";
      const actionLabel = action === "insert" ? "Thao tác Chèn Nút" : action === "delete" ? "Thao tác Xóa Nút" : "Thao tác Tìm Kiếm";
      const actionIcon = action === "insert" ? "ri-add-circle-line text-teal-600" : action === "delete" ? "ri-delete-bin-line text-rose-600" : "ri-search-line text-indigo-600";
      
      header.innerHTML = `
        <div class="flex items-center gap-2">
          <i class="${actionIcon} text-base"></i>
          <span class="text-slate-900 font-bold">${actionLabel}: <b class="font-mono text-teal-700 font-extrabold">${value}</b></span>
        </div>
        <span class="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-[6px] border border-slate-200">Cây AVL</span>
      `;
      card.appendChild(header);

      const path = tempTree.findPath(value);
      const found = path.length > 0 && path[path.length - 1].value === value;

      const stepsContainer = document.createElement("div");
      stepsContainer.className = "space-y-1";

      if (path.length > 0) {
        path.forEach((node, index) => {
          const descDiv = document.createElement("div");
          descDiv.className = "step-description-only";
          let direction = "";
          if (value < node.value) {
            direction = `<b>${value} < ${node.value}</b>, rẽ sang trái.`;
            if (index === path.length - 1 && action === "insert" && !found) {
              direction += ` <span class="text-primary font-bold"><i class="ri-corner-down-right-line"></i> Chèn vào con trái của nút ${node.value}.</span>`;
            }
          } else if (value > node.value) {
            direction = `<b>${value} > ${node.value}</b>, rẽ sang phải.`;
            if (index === path.length - 1 && action === "insert" && !found) {
              direction += ` <span class="text-primary font-bold"><i class="ri-corner-down-right-line"></i> Chèn vào con phải của nút ${node.value}.</span>`;
            }
          } else {
            if (action === "insert") direction = `<b>${value} == ${node.value}</b>, nút đã tồn tại trong cây (không chèn trùng).`;
            else if (action === "search") direction = `<b>${value} == ${node.value}</b>. <span class="text-success font-bold"><i class="ri-check-line"></i> Đã tìm thấy nút ${value} (chiều cao h = ${node.height}).</span>`;
            else if (action === "delete") direction = `<b>${value} == ${node.value}</b>. <span class="text-danger font-bold"><i class="ri-delete-bin-line"></i> Đã tìm thấy nút ${value}, tiến hành loại bỏ.</span>`;
          }
          descDiv.innerHTML = `<span class="text-slate-400 font-mono">Bước ${index + 1}:</span> So sánh với nút <b>${node.value}</b> &rarr; ${direction}`;
          stepsContainer.appendChild(descDiv);
        });
      } else if (action === "insert") {
        stepsContainer.innerHTML = "<p class=\"text-slate-600 font-mono text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-[6px]\"><i class=\"ri-information-line text-teal-600\"></i> Cây rỗng, nút này được thiết lập làm Gốc (Root) của cây.</p>";
      }

      if ((action === "search" || action === "delete") && !found) {
        const notFoundDiv = document.createElement("div");
        notFoundDiv.className = "step-description-only text-danger mt-1.5 flex items-center gap-1.5";
        notFoundDiv.innerHTML = `<i class="ri-close-circle-line text-base"></i> <span><b>Kết quả:</b> Không tìm thấy nút <b>${value}</b> trong cây AVL.</span>`;
        stepsContainer.appendChild(notFoundDiv);
      }
      card.appendChild(stepsContainer);

      if (action === "insert" && !found) {
        const { treeAfterBstInsert, unbalancedNode, caseType, bstPathNodes, treeAfterFirstRotation, firstRotationDescription } = tempTree.getInsertionDetails(value);
        
        const preHeader = document.createElement("div");
        preHeader.className = "operation-header-child flex items-center gap-1.5";
        preHeader.innerHTML = `<i class="ri-git-commit-line text-slate-500"></i> <span>1. Trạng thái cây sau khi chèn (theo quy tắc BST):</span>`;
        card.appendChild(preHeader);

        const preDiv = createZoomableMiniVis(
          treeAfterBstInsert,
          bstPathNodes,
          `1. Cây sau khi chèn BST (${value})`,
          "Trạng thái cây nhị phân tìm kiếm trước khi kiểm tra hệ số cân bằng"
        );
        card.appendChild(preDiv);

        if (unbalancedNode) {
          const balanceInfo = document.createElement("div");
          balanceInfo.className = "p-2.5 rounded-[6px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono font-semibold flex items-center gap-1.5";
          balanceInfo.innerHTML = `<i class="ri-alert-line text-rose-600 text-sm"></i> <span>Phát hiện mất cân bằng <b class="text-rose-600 font-extrabold">${caseType}</b> tại nút <b>${unbalancedNode.value}</b>. Cần thực hiện phép xoay để cân bằng lại cây!</span>`;
          card.appendChild(balanceInfo);

          if (treeAfterFirstRotation) {
            const firstRotHeader = document.createElement("div");
            firstRotHeader.className = "operation-header-child flex items-center gap-1.5";
            firstRotHeader.innerHTML = `<i class="ri-loop-right-line text-slate-500"></i> <span>2. ${firstRotationDescription}:</span>`;
            card.appendChild(firstRotHeader);

            const firstRotDiv = createZoomableMiniVis(
              treeAfterFirstRotation,
              [],
              `2. ${firstRotationDescription}`,
              `Bước xoay phụ để chuyển về dạng xoay đơn (${caseType})`
            );
            card.appendChild(firstRotDiv);

            const secondRotHeader = document.createElement("div");
            secondRotHeader.className = "operation-header-child flex items-center gap-1.5";
            const secondRotationType = caseType === "Left-Right" ? "phải" : "trái";
            secondRotHeader.innerHTML = `<i class="ri-loop-left-line text-slate-500"></i> <span>3. Xoay ${secondRotationType} tại nút ${unbalancedNode.value} để hoàn tất cân bằng:</span>`;
            card.appendChild(secondRotHeader);
          } else {
            const rotHeader = document.createElement("div");
            rotHeader.className = "operation-header-child flex items-center gap-1.5";
            rotHeader.innerHTML = `<i class="ri-checkbox-circle-line text-teal-600"></i> <span>2. Cây sau khi xoay và cân bằng hoàn tất:</span>`;
            card.appendChild(rotHeader);
          }

          const finalTree = tempTree.clone();
          finalTree.insert(value);
          const finalDiv = createZoomableMiniVis(
            finalTree,
            [],
            `Cây AVL sau khi xoay & cân bằng (${value})`,
            "Trạng thái cây AVL hoàn tất sau phép xoay"
          );
          card.appendChild(finalDiv);
        } else {
          const balanceInfo = document.createElement("div");
          balanceInfo.className = "p-2.5 rounded-[6px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-1.5";
          balanceInfo.innerHTML = `<i class="ri-check-line text-emerald-600 text-sm"></i> <span>Cây vẫn thỏa mãn hệ số cân bằng BF &isin; {-1, 0, +1}, không cần thực hiện xoay.</span>`;
          card.appendChild(balanceInfo);
        }
      } else if (action === "delete" && found) {
        const preDeleteHeader = document.createElement("div");
        preDeleteHeader.className = "operation-header-child flex items-center gap-1.5";
        preDeleteHeader.innerHTML = `<i class="ri-git-commit-line text-slate-500"></i> <span>1. Trạng thái cây trước khi xóa:</span>`;
        card.appendChild(preDeleteHeader);

        const preDeleteDiv = createZoomableMiniVis(
          tempTree,
          path,
          `1. Cây trước khi xóa nút ${value}`,
          "Đường dẫn tìm kiếm nút cần xóa"
        );
        card.appendChild(preDeleteDiv);

        const { balancingSteps, finalTree } = tempTree.getDeletionDetails(value);

        if (balancingSteps.length > 0) {
          balancingSteps.forEach((step, index) => {
            const stepHeader = document.createElement("div");
            stepHeader.className = "operation-header-child flex items-center gap-1.5";
            stepHeader.innerHTML = `<i class="ri-loop-right-line text-slate-500"></i> <span>${index + 2}. ${step.description}</span>`;
            card.appendChild(stepHeader);

            const stepDiv = createZoomableMiniVis(
              step.treeState,
              [],
              `${index + 2}. ${step.description}`,
              "Quá trình xoay để tái cân bằng sau khi xóa"
            );
            card.appendChild(stepDiv);
          });
          const finalHeader = document.createElement("div");
          finalHeader.className = "operation-header-child flex items-center gap-1.5";
          finalHeader.innerHTML = `<i class="ri-checkbox-circle-line text-teal-600"></i> <span>${balancingSteps.length + 2}. Cây sau khi cân bằng hoàn tất:</span>`;
          card.appendChild(finalHeader);
        } else {
          const finalHeader = document.createElement("div");
          finalHeader.className = "operation-header-child flex items-center gap-1.5";
          finalHeader.innerHTML = `<i class="ri-check-line text-emerald-600"></i> <span>2. Cây sau khi xóa (vẫn đảm bảo cân bằng):</span>`;
          card.appendChild(finalHeader);
        }

        const finalDiv = createZoomableMiniVis(
          finalTree,
          [],
          `Cây AVL sau khi xóa nút ${value}`,
          "Trạng thái cây AVL sau khi hoàn tất loại bỏ nút"
        );
        card.appendChild(finalDiv);
      } else if (action === "search") {
        const visHeader = document.createElement("div");
        visHeader.className = "operation-header-child flex items-center gap-1.5";
        visHeader.innerHTML = `<i class="ri-route-line text-slate-500"></i> <span>Trực quan hóa đường đi tìm kiếm:</span>`;
        card.appendChild(visHeader);

        const visDiv = createZoomableMiniVis(
          tempTree,
          path,
          `Đường đi tìm kiếm nút ${value}`,
          found ? `Tìm thấy nút ${value}` : `Không tìm thấy nút ${value}`
        );
        card.appendChild(visDiv);
      }

      if (action === "insert") tempTree.insert(value);
      else if (action === "delete" && found) tempTree.delete(value);

      this.logContainer.appendChild(card);
    });
  }

  async handleInsert() {
    if (this.isAnimating) return;
    this.clearError();

    const parsed = this.parseInput();
    if (!parsed.valid) {
      this.showError(parsed.error);
      return;
    }

    const values = parsed.values;
    this.lastDetails = { values, action: "insert", baseTree: this.tree.clone() };
    this.updateButtonsState();
    this.renderDetailsInline(values, "insert", this.tree);
    this.isAnimating = true;

    for (const v of values) {
      const path = this.tree.findPath(v);
      await this.animatePath(path, v, "highlighted", "insert");
      await this.waitStepOrDelay(1.2);
      this.tree.insert(v);
      this.draw();
      await this.waitStepOrDelay(1.5);
    }

    this.clearAllHighlights();
    this.isAnimating = false;
    this.valueInput.value = "";
    this.updateButtonsState();
  }

  async handleDelete() {
    if (this.isAnimating) return;
    this.clearError();

    if (!this.tree.root) {
      this.showError("Cây hiện đang rỗng, không thể thực hiện xóa.");
      return;
    }

    const parsed = this.parseInput();
    if (!parsed.valid) {
      this.showError(parsed.error);
      return;
    }

    if (parsed.values.length !== 1) {
      this.showError("Thao tác Xóa chỉ nhận 1 giá trị số nguyên.");
      return;
    }

    const value = parsed.values[0];
    this.lastDetails = { values: [value], action: "delete", baseTree: this.tree.clone() };
    this.renderDetailsInline([value], "delete", this.tree);
    this.isAnimating = true;

    const path = this.tree.findPath(value);
    await this.animatePath(path, value, "highlighted", "delete");
    await this.waitStepOrDelay(1.2);

    this.tree.delete(value);
    this.draw();
    await this.waitStepOrDelay(1.5);

    this.clearAllHighlights();
    this.isAnimating = false;
    this.valueInput.value = "";
    this.updateButtonsState();
  }

  async handleSearch() {
    if (this.isAnimating) return;
    this.clearError();

    if (!this.tree.root) {
      this.showError("Cây hiện đang rỗng, không có nút để tìm kiếm.");
      return;
    }

    const parsed = this.parseInput();
    if (!parsed.valid) {
      this.showError(parsed.error);
      return;
    }

    if (parsed.values.length !== 1) {
      this.showError("Thao tác Tìm Kiếm chỉ nhận 1 giá trị số nguyên.");
      return;
    }

    const value = parsed.values[0];
    this.lastDetails = { values: [value], action: "search", baseTree: this.tree.clone() };
    this.renderDetailsInline([value], "search", this.tree);
    this.isAnimating = true;

    const path = this.tree.findPath(value);
    await this.animatePath(path, value, "highlighted", "search");
    await this.waitStepOrDelay(2);

    this.clearAllHighlights();
    this.isAnimating = false;
    this.valueInput.value = "";
    this.updateButtonsState();
  }

  async handleReplay() {
    if (this.isAnimating) return;
    if (!this.lastDetails || !this.lastDetails.baseTree || this.lastDetails.values.length === 0) return;

    this.clearError();
    const { values, action, baseTree } = this.lastDetails;

    // Khôi phục lại trạng thái cây ngay trước khi thực hiện thao tác
    this.tree = baseTree.clone();
    this.clearAllHighlights();
    this.draw();
    this.updateButtonsState();

    this.renderDetailsInline(values, action, baseTree);
    this.isAnimating = true;

    if (action === "insert") {
      for (const v of values) {
        const path = this.tree.findPath(v);
        await this.animatePath(path, v, "highlighted", "insert");
        await this.waitStepOrDelay(1.2);
        this.tree.insert(v);
        this.draw();
        await this.waitStepOrDelay(1.5);
      }
    } else if (action === "delete") {
      const value = values[0];
      const path = this.tree.findPath(value);
      await this.animatePath(path, value, "highlighted", "delete");
      await this.waitStepOrDelay(1.2);
      this.tree.delete(value);
      this.draw();
      await this.waitStepOrDelay(1.5);
    } else if (action === "search") {
      const value = values[0];
      const path = this.tree.findPath(value);
      await this.animatePath(path, value, "highlighted", "search");
      await this.waitStepOrDelay(2);
    }

    this.clearAllHighlights();
    this.isAnimating = false;
    this.updateButtonsState();
  }

  updateButtonsState() {
    const hasRoot = Boolean(this.tree && this.tree.root);
    const hasLastDetails = Boolean(
      this.lastDetails && this.lastDetails.baseTree && this.lastDetails.values && this.lastDetails.values.length > 0
    );
    if (this.deleteBtn) this.deleteBtn.disabled = !hasRoot;
    if (this.searchBtn) this.searchBtn.disabled = !hasRoot;
    if (this.resetBtn) this.resetBtn.disabled = !hasRoot;
    if (this.replayBtn) this.replayBtn.disabled = !hasLastDetails;
  }

  reset() {
    this.clearError();
    this.tree = new AVLTree();
    this.lastDetails = { values: [], action: "", baseTree: null };
    if (this.valueInput) this.valueInput.value = "";
    this.clearAllHighlights();
    this.draw();
    this.updateButtonsState();

    if (this.logContainer) {
      this.logContainer.innerHTML = `
        <div class="text-center py-16 space-y-3">
          <div class="w-14 h-14 rounded-[6px] bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto">
            <i class="ri-node-tree text-3xl leading-none"></i>
          </div>
          <p class="text-sm sm:text-base font-bold text-slate-800">Cây đã được làm mới (Rỗng)</p>
          <p class="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Nhập số hoặc chọn một <b>Mẫu thử</b> để bắt đầu theo dõi phân tích.
          </p>
        </div>
      `;
    }

    if (this.logStatusBadge) {
      this.logStatusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200";
      this.logStatusBadge.innerHTML = `<i class="ri-checkbox-circle-line text-xs text-teal-600"></i> Sẵn sàng`;
    }
  }
}

export { AVLHandler };
