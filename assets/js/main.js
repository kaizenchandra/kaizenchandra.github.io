(() => {
  "use strict";
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function initTheme() {
    const button = document.querySelector(".theme-toggle");
    if (!button) return;
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const current = () => root.dataset.theme || (system.matches ? "dark" : "light");
    const update = () => {
      button.setAttribute("aria-label", `Switch to ${current() === "dark" ? "light" : "dark"} theme`);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = current() === "dark" ? "#0b1421" : "#fafaf8";
    };
    button.hidden = false;
    button.addEventListener("click", () => {
      root.dataset.theme = current() === "dark" ? "light" : "dark";
      try { localStorage.setItem("cv-theme", root.dataset.theme); } catch (_) { /* Session preference still works. */ }
      update();
    });
    system.addEventListener("change", update);
    update();
  }

  function initMobileNavigation() {
    const nav = document.querySelector("#primary-nav");
    const button = document.querySelector(".menu-toggle");
    if (!nav || !button) return;
    const mobile = window.matchMedia("(max-width: 1000px)");
    const setOpen = (open) => {
      nav.dataset.collapsed = String(mobile.matches && !open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    };
    button.hidden = false;
    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link) return;
      setOpen(false);
      const target = document.getElementById(link.hash.slice(1));
      if (mobile.matches && target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        button.focus();
      }
    });
    mobile.addEventListener("change", () => {
      if (mobile.matches && nav.contains(document.activeElement)) button.focus();
      setOpen(false);
    });
    setOpen(false);
  }

  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) return;
    const sections = [...document.querySelectorAll("main section[id]")];
    const links = [...document.querySelectorAll("#primary-nav a")];
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => isIntersecting ? visible.add(target) : visible.delete(target));
      const active = sections.filter((section) => visible.has(section)).pop();
      if (!active) return;
      links.forEach((link) => {
        if (link.hash === `#${active.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-80px 0px -55% 0px", threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }

  function initMotion() {
    if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
    const hero = [...document.querySelectorAll("[data-hero] > *")];
    hero.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${Math.min(index * 45, 315)}ms`);
      element.classList.add("motion-ready", "is-visible");
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add("is-visible");
        observer.unobserve(target);
      });
    }, { threshold: 0.06 });
    document.querySelectorAll("[data-reveal]").forEach((element) => {
      const siblings = [...element.parentElement.children].filter((child) => child.matches("[data-reveal]"));
      const delay = Math.min(siblings.indexOf(element) % 3 * 60, 120);
      element.style.setProperty("--reveal-delay", `${delay}ms`);
      element.classList.add("motion-ready");
      observer.observe(element);
    });
    reducedMotion.addEventListener("change", (event) => {
      if (!event.matches) return;
      observer.disconnect();
      document.querySelectorAll(".motion-ready").forEach((element) => element.classList.remove("motion-ready"));
    });
  }

  function initScrollState() {
    const header = document.querySelector(".site-header");
    const progress = document.querySelector(".scroll-progress");
    const top = document.querySelector(".back-to-top");
    top?.classList.add("is-enhanced");
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const y = window.scrollY;
      const range = root.scrollHeight - window.innerHeight;
      header?.classList.toggle("is-scrolled", y > 24);
      top?.classList.toggle("is-visible", y > 600 || top === document.activeElement);
      if (progress) progress.style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, y / range)) : 0})`;
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    top?.addEventListener("click", () => {
      const home = document.querySelector("#home");
      if (!home) return;
      home.setAttribute("tabindex", "-1");
      home.focus({ preventScroll: true });
      home.addEventListener("blur", () => home.removeAttribute("tabindex"), { once: true });
    });
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
        await navigator.clipboard.writeText(address.getAttribute("href").replace("mailto:", ""));
        status.textContent = "Email address copied.";
        button.textContent = "Copied";
      } catch (_) {
        status.textContent = "Select and copy the email address above, or choose Email Me.";
      }
      timeout = setTimeout(() => { button.textContent = "Copy email address"; status.textContent = ""; }, 2000);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initMobileNavigation();
    initScrollSpy();
    initMotion();
    initScrollState();
    initCopyActions();
  });
})();
