(() => {
    "use strict";

    const root = document.documentElement;

    function focusAnchor(target) {
        const addedTabIndex = !target.hasAttribute("tabindex");
        if (addedTabIndex) target.setAttribute("tabindex", "-1");
        target.focus({preventScroll: true});
        if (addedTabIndex) target.addEventListener("blur", () => target.removeAttribute("tabindex"), {once: true});
    }

    function initMobileNavigation(nav) {
        const button = document.querySelector(".menu-toggle");
        if (!nav || !button) return;

        const actions = button.closest(".header-actions");
        const mobile = window.matchMedia("(max-width: 1000px)");
        const isOpen = () => button.getAttribute("aria-expanded") === "true";
        const setOpen = (open) => {
            nav.dataset.collapsed = String(mobile.matches && !open);
            button.setAttribute("aria-expanded", String(open));
            button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        };

        function syncLayout() {
            const focused = document.activeElement;
            if (mobile.matches) {
                actions.after(nav);
                if (nav.contains(focused) || actions.querySelector(".header-resume") === focused) button.focus();
            } else {
                actions.before(nav);
                if (focused === button || nav.contains(focused)) {
                    const link = focused.matches(".mobile-resume") ? actions.querySelector(".header-resume") : focused;
                    (link === button ? nav.querySelector("a") : link)?.focus();
                }
            }
            setOpen(false);
        }

        button.hidden = false;
        button.addEventListener("click", () => {
            setOpen(!isOpen());
            if (isOpen()) nav.querySelector("a")?.focus();
        });
        nav.addEventListener("click", (event) => {
            const link = event.target.closest("a");
            if (!mobile.matches || !link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const target = link.getAttribute("href").startsWith("#") && document.getElementById(link.hash.slice(1));
            if (target) focusAnchor(target);
            setOpen(false);
        });
        document.addEventListener("focusin", (event) => {
            if (isOpen() && event.target !== button && !nav.contains(event.target)) setOpen(false);
        });
        document.addEventListener("click", (event) => {
            if (!isOpen() || button.contains(event.target) || nav.contains(event.target)) return;
            if (nav.contains(document.activeElement)) button.focus();
            setOpen(false);
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && isOpen()) {
                setOpen(false);
                button.focus();
            }
        });
        mobile.addEventListener("change", syncLayout);
        syncLayout();
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

        window.addEventListener("scroll", schedule, {passive: true});
        window.addEventListener("resize", schedule);
        if ("ResizeObserver" in window) {
            new ResizeObserver(schedule).observe(document.body);
            new ResizeObserver(() => {
                root.style.setProperty("--anchor-offset", `${header.offsetHeight}px`);
            }).observe(header);
        }
        update();
    }

    function initTopologyTrace() {
        const diagram = document.querySelector(".hero-topology");
        if (!diagram) return;

        const controls = diagram.querySelector(".topology-switch");
        const buttons = [...controls.querySelectorAll("[data-show-trace]")];
        const notes = [...diagram.querySelectorAll("[data-trace-note]")];

        controls.addEventListener("click", (event) => {
            const button = event.target.closest("[data-show-trace]");
            if (!button || button.dataset.showTrace === diagram.dataset.trace) return;

            const trace = button.dataset.showTrace;
            diagram.dataset.trace = trace;
            for (const option of buttons) option.setAttribute("aria-pressed", String(option === button));
            for (const note of notes) note.hidden = note.dataset.traceNote !== trace;
        });
        controls.hidden = false;
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
                status.textContent = "Could not copy the email address. Choose Send an email to open your email app.";
            }
            timeout = setTimeout(() => {
                status.textContent = "";
            }, 3500);
        });
    }

    const nav = document.querySelector("#primary-nav");
    initMobileNavigation(nav);
    initScrollSpy(nav);
    initTopologyTrace();
    initCopyActions();
    document.querySelector(".back-to-top")?.addEventListener("click", () => {
        focusAnchor(document.getElementById("home"));
    });
})();
