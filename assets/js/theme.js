/* Kept separate and synchronous to restore saved preference before first paint. */
(() => {
  "use strict";
  try {
    const theme = localStorage.getItem("cv-theme");
    if (theme === "light" || theme === "dark")
      document.documentElement.dataset.theme = theme;
  } catch (_) {
    /* System theme remains available when storage is blocked. */
  }
})();
