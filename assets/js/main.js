(() => {
  "use strict";

  const root = document.documentElement;

  function initTheme() {
    const button = document.querySelector(".theme-toggle");
    if (!button) return;

    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const current = () => root.dataset.theme || (system.matches ? "dark" : "light");
    const update = () => {
      const isDark = current() === "dark";
      button.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = isDark ? "#101321" : "#f7f8fc";
    };

    button.hidden = false;
    button.addEventListener("click", () => {
      root.dataset.theme = current() === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("cv-theme", root.dataset.theme);
      } catch (_) {
        // The theme still applies to the current page.
      }
      update();
    });
    system.addEventListener("change", update);
    update();
  }

  function focusAnchor(target) {
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
  }

  function initMobileNavigation(nav) {
    const button = document.querySelector(".menu-toggle");
    if (!nav || !button) return;

    const mobile = window.matchMedia("(max-width: 850px)");
    const isOpen = () => button.getAttribute("aria-expanded") === "true";
    const setOpen = (open) => {
      nav.dataset.collapsed = String(mobile.matches && !open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    };

    button.hidden = false;
    button.addEventListener("click", (event) => {
      setOpen(!isOpen());
      if (isOpen() && event.detail === 0) nav.querySelector("a")?.focus();
    });
    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!mobile.matches || !link) return;

      const target = document.getElementById(link.hash.slice(1));
      if (target) focusAnchor(target);
      setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        button.focus();
      }
    });
    mobile.addEventListener("change", () => {
      if (mobile.matches && nav.contains(document.activeElement)) button.focus();
      if (!mobile.matches && document.activeElement === button) nav.querySelector("a")?.focus();
      setOpen(false);
    });
    setOpen(false);
    root.classList.remove("nav-pending");
  }

  function initScrollSpy(nav) {
    if (!nav) return;

    const header = document.querySelector(".site-header");
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sections = links.map((link) => document.getElementById(link.hash.slice(1)));
    let lastActive;
    let scheduled = false;

    const update = () => {
      scheduled = false;
      const marker = header.offsetHeight + 36;
      let active;

      for (const section of sections) {
        if (section && section.getBoundingClientRect().top <= marker) active = section;
      }
      if (active && window.scrollY + window.innerHeight >= root.scrollHeight - 2) {
        active = sections.at(-1);
      }
      if (active === lastActive) return;

      for (const link of links) {
        if (link.hash === `#${active?.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
      lastActive = active;
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(document.body);
    update();
  }

  function initCopyActions() {
    const button = document.querySelector(".copy-email");
    const address = document.querySelector(".contact-email");
    const status = document.querySelector(".copy-status");
    if (!button || !address || !status) return;

    let timeout;
    button.hidden = false;
    button.addEventListener("click", async () => {
      clearTimeout(timeout);
      try {
        await navigator.clipboard.writeText(address.getAttribute("href").slice("mailto:".length));
        status.textContent = "Email address copied.";
      } catch (_) {
        status.textContent = "Select the email address to copy it, or choose Send an email.";
      }
      timeout = setTimeout(() => { status.textContent = ""; }, 3500);
    });
  }

  initTheme();
  const nav = document.querySelector("#primary-nav");
  initMobileNavigation(nav);
  initScrollSpy(nav);
  initCopyActions();
  document.querySelector(".back-to-top")?.addEventListener("click", () => {
    focusAnchor(document.getElementById("home"));
  });
})();
