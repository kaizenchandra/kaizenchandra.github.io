/* Resolve the theme before stylesheets paint. */
(() => {
    "use strict";

    const root = document.documentElement;
    const system = matchMedia("(prefers-color-scheme: dark)");
    const key = "cv-theme";
    const explicitTheme = (value) => value === "light" || value === "dark" ? value : null;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>';
    const moon = '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.802a6.5 6.5 0 0 0 8.27 8.27c.342-.215.824-.004.801.4Z"/>';
    let preference = null;
    let button;

    function restorePreference() {
        try {
            preference = explicitTheme(localStorage.getItem(key));
        } catch {
            // Keep the current preference when storage is blocked.
        }
        applyTheme();
    }

    function applyTheme() {
        const dark = (preference ?? (system.matches ? "dark" : "light")) === "dark";
        root.dataset.theme = dark ? "dark" : "light";
        if (themeColor) themeColor.content = dark ? "#0f172a" : "#f8fafc";
        if (button) {
            const label = dark ? "Switch to light mode" : "Switch to dark mode";
            button.setAttribute("aria-label", label);
            button.title = label;
            button.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                (dark ? sun : moon) + "</svg>";
        }
    }

    restorePreference();

    if (document.currentScript?.hasAttribute("data-nav-bootstrap")) {
        root.classList.add("nav-pending");
        setTimeout(() => root.classList.remove("nav-pending"), 1400);
    }

    document.addEventListener("DOMContentLoaded", () => {
        button = document.querySelector("[data-theme-toggle]");
        if (button) {
            applyTheme();
            button.hidden = false;
            button.addEventListener("click", () => {
                preference = root.dataset.theme === "dark" ? "light" : "dark";
                applyTheme();
                try {
                    localStorage.setItem(key, preference);
                } catch {
                    // Keep the theme on the current page.
                }
            });
        }
        system.addEventListener("change", () => {
            if (!preference) applyTheme();
        });
        addEventListener("storage", (event) => {
            if (event.storageArea !== localStorage || (event.key !== key && event.key !== null)) return;
            preference = explicitTheme(event.newValue);
            applyTheme();
        });
        addEventListener("pageshow", (event) => {
            if (event.persisted) restorePreference();
        });
    }, {once: true});
})();
