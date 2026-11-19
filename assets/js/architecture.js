(() => {
    "use strict";

    const explorer = document.querySelector("[data-explorer]");
    const nav = explorer.querySelector(".explorer-nav");
    const tabs = [...nav.querySelectorAll("a")];
    const panels = tabs.map((tab) => document.getElementById(tab.hash.slice(1)));
    const dialog = explorer.querySelector("dialog");
    const dialogTitle = dialog.querySelector("h2");
    const expanded = dialog.querySelector("[data-expanded-diagram]");
    let opener;

    function showView(index) {
        tabs.forEach((tab, position) => {
            const isSelected = position === index;
            tab.tabIndex = isSelected ? 0 : -1;
            tab.setAttribute("aria-selected", String(isSelected));
            panels[position].hidden = !isSelected;
        });
    }

    function applyHash() {
        showView(Math.max(0, tabs.findIndex((tab) => tab.hash === location.hash)));
    }

    nav.setAttribute("role", "tablist");
    tabs.forEach((tab, index) => {
        const panel = panels[index];
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", panel.id);
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        panel.tabIndex = 0;

        tab.addEventListener("click", (event) => {
            if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
            event.preventDefault();
            showView(index);
            if (location.hash !== tab.hash) history.pushState(null, "", tab.hash);
        });

        const button = panel.querySelector("[data-enlarge]");
        if (typeof dialog.showModal === "function") {
            button.disabled = false;
            button.addEventListener("click", () => {
                opener = button;
                dialogTitle.textContent = panel.querySelector("h2").textContent;
                expanded.replaceChildren(panel.querySelector(".flow-canvas").cloneNode(true));
                dialog.showModal();
            });
        }
    });

    nav.addEventListener("keydown", (event) => {
        const index = tabs.indexOf(event.target);
        if (index === -1) return;
        const previous = (index + tabs.length - 1) % tabs.length;
        const next = (index + 1) % tabs.length;
        const destination = {ArrowLeft: previous, ArrowRight: next, Home: 0, End: tabs.length - 1}[event.key];
        if (destination === undefined) return;
        event.preventDefault();
        tabs[destination].focus();
        tabs[destination].click();
    });

    dialog.addEventListener("close", () => opener?.focus({preventScroll: true}));
    addEventListener("hashchange", applyHash);
    addEventListener("popstate", applyHash);
    applyHash();
    explorer.dataset.tabsReady = "";
})();
