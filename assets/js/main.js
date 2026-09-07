(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const themeButton = document.querySelector(".theme-toggle");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const currentTheme = () =>
      root.dataset.theme || (systemTheme.matches ? "dark" : "light");
    const updateThemeLabel = () => {
      if (themeButton)
        themeButton.setAttribute(
          "aria-label",
          `Switch to ${currentTheme() === "dark" ? "light" : "dark"} theme`,
        );
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta)
        meta.content = currentTheme() === "dark" ? "#101a27" : "#f8f9fb";
    };
    if (themeButton) {
      themeButton.hidden = false;
      themeButton.addEventListener("click", () => {
        root.dataset.theme = currentTheme() === "dark" ? "light" : "dark";
        try {
          localStorage.setItem("cv-theme", root.dataset.theme);
        } catch (_) {
          /* Preference works for this visit. */
        }
        updateThemeLabel();
      });
      updateThemeLabel();
      if (systemTheme.addEventListener)
        systemTheme.addEventListener("change", updateThemeLabel);
    }

    const nav = document.querySelector("#primary-nav");
    const menu = document.querySelector(".menu-toggle");
    const mobile = window.matchMedia("(max-width: 1000px)");
    const setMenu = (open) => {
      if (!nav || !menu) return;
      nav.dataset.collapsed = String(mobile.matches && !open);
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute(
        "aria-label",
        open ? "Close navigation" : "Open navigation",
      );
    };
    if (nav && menu) {
      menu.hidden = false;
      setMenu(false);
      menu.addEventListener("click", () =>
        setMenu(menu.getAttribute("aria-expanded") !== "true"),
      );
      nav.addEventListener("click", (event) => {
        const anchor = event.target.closest("a");
        if (!anchor) return;
        const target = document.querySelector(anchor.getAttribute("href"));
        setMenu(false);
        if (mobile.matches && target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          target.addEventListener(
            "blur",
            () => target.removeAttribute("tabindex"),
            { once: true },
          );
        }
      });
      document.addEventListener("keydown", (event) => {
        if (
          event.key === "Escape" &&
          menu.getAttribute("aria-expanded") === "true"
        ) {
          setMenu(false);
          menu.focus();
        }
      });
      if (mobile.addEventListener)
        mobile.addEventListener("change", () => setMenu(false));
    }

    if ("IntersectionObserver" in window) {
      const sections = [...document.querySelectorAll("main section[id]")];
      const links = [...document.querySelectorAll("#primary-nav a")];
      const visible = new Set();
      const spy = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) =>
            entry.isIntersecting
              ? visible.add(entry.target)
              : visible.delete(entry.target),
          );
          const active = sections
            .filter((section) => visible.has(section))
            .pop();
          if (!active) return;
          links.forEach((anchor) => {
            if (anchor.hash === `#${active.id}`)
              anchor.setAttribute("aria-current", "location");
            else anchor.removeAttribute("aria-current");
          });
        },
        { rootMargin: "-80px 0px -55% 0px", threshold: 0 },
      );
      sections.forEach((section) => spy.observe(section));
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const reveal = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("revealed");
              observer.unobserve(entry.target);
            });
          },
          { threshold: 0.1 },
        );
        document
          .querySelectorAll(".section-heading")
          .forEach((heading) => reveal.observe(heading));
      }
    }

    const copy = document.querySelector(".copy-email");
    const address = document.querySelector(".contact-email");
    const status = document.querySelector(".copy-status");
    if (copy && address && status) {
      copy.hidden = false;
      copy.addEventListener("click", async () => {
        try {
          if (!navigator.clipboard || !window.isSecureContext)
            throw new Error("Clipboard unavailable");
          await navigator.clipboard.writeText(
            address.getAttribute("href").replace("mailto:", ""),
          );
          status.textContent = "Email address copied.";
        } catch (_) {
          status.textContent =
            "Select and copy the email address above, or choose Email Me.";
        }
      });
    }
    // Resume links deliberately use the static availability page until the real PDF is supplied.
    // Replace their href values with resume/chandrashekhar-vishwakarma-resume.pdf, then add download.
    // The back-to-top anchor uses native scrolling and remains functional without JavaScript.
  });
})();
