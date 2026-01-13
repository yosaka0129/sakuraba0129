document.addEventListener("DOMContentLoaded", () => {
  console.log("選択ページが読み込まれました");

  // 追加機能例：ボタンにアニメーションをつける
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.add("clicked");
      setTimeout(() => btn.classList.remove("clicked"), 300);
    });
  });
});