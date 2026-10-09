import { AVLHandler } from "./avl-main.js";

document.addEventListener("DOMContentLoaded", () => {
  // Lấy các element trên UI
  const insertBtn = document.getElementById("insert-btn");
  const deleteBtn = document.getElementById("delete-btn");
  const searchBtn = document.getElementById("search-btn");
  const resetBtn = document.getElementById("reset-btn");
  const nodeInput = document.getElementById("node-value");
  const presetButtons = document.querySelectorAll(".preset-btn");

  // Khởi tạo AVLHandler cho toàn bộ trang
  const avlHandler = new AVLHandler(document.body);

  // Gán sự kiện thao tác
  if (insertBtn) {
    insertBtn.addEventListener("click", () => avlHandler.handleInsert());
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => avlHandler.handleDelete());
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", () => avlHandler.handleSearch());
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => avlHandler.reset());
  }

  // Nhấn Enter ở ô input để Thêm nhanh
  if (nodeInput) {
    nodeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        avlHandler.handleInsert();
      }
    });
  }

  // Gán sự kiện chọn mẫu nhanh (Xoay LL, RR, LR, RL)
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const presetValues = btn.getAttribute("data-preset");
      if (presetValues && nodeInput) {
        avlHandler.reset();
        nodeInput.value = presetValues;
        avlHandler.handleInsert();
      }
    });
  });

  // Tự động vẽ lại khi resize cửa sổ
  window.addEventListener("resize", () => {
    if (avlHandler && !avlHandler.isAnimating) {
      avlHandler.draw();
    }
  });
});
