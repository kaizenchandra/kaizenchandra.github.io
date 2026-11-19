/* Kept separate and synchronous to restore saved preference before first paint. */
(() => {
  "use strict";
  if (document.currentScript?.hasAttribute("data-nav-bootstrap")) {
    const root = document.documentElement;
    root.classList.add("nav-pending");
    // Reveal the fallback if the main script does not initialize the mobile menu.
    setTimeout(() => root.classList.remove("nav-pending"), 1400);
  }
  try {
    const theme = localStorage.getItem("cv-theme");
    if (theme === "light" || theme === "dark")
      document.documentElement.dataset.theme = theme;
  } catch (_) {
    /* System theme remains available when storage is blocked. */
  }
})();
