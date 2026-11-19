(() => {
    "use strict";

    function initFilter(panel) {
        const key = panel.dataset.filterItem;
        const items = [...panel.querySelectorAll(`[data-${key}]`)];
        const controls = panel.querySelector(".filter-controls");
        const tagList = controls.querySelector(".filter-tags");
        const input = controls.querySelector("input");
        const status = controls.querySelector(".filter-status");
        const noun = panel.dataset.noun;
        const allLabel = key === "project" ? "All projects" : "All";
        const itemData = items.map((item) => ({
            item,
            tags: item.dataset[key].split("|"),
            text: (item.textContent + " " + item.dataset[key]).toLowerCase(),
        }));
        let active = allLabel;

        function update() {
            const query = input.value.trim().toLowerCase();
            panel.toggleAttribute("data-filtered", active !== allLabel || Boolean(query));
            let matches = 0;
            for (const {item, tags, text} of itemData) {
                const visible = text.includes(query) && (active === allLabel || tags.includes(active));
                item.hidden = !visible;
                if (visible) matches++;
            }
            for (const button of tagList.children) {
                button.setAttribute("aria-pressed", String(button.textContent === active));
            }
            status.textContent = matches
                ? `Showing ${matches} of ${items.length} ${noun}.`
                : `No ${noun} match. Change the tag or clear the search.`;
            clear.hidden = active === allLabel && input.value === "";
        }

        const tags = [...new Set(itemData.flatMap(({tags}) => tags))].sort();
        for (const tag of [allLabel, ...tags]) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "filter-chip";
            button.textContent = tag;
            button.addEventListener("click", () => {
                active = tag;
                if (tag === allLabel) input.value = "";
                update();
            });
            tagList.append(button);
        }
        const clear = document.createElement("button");
        clear.type = "button";
        clear.className = "filter-clear text-link";
        clear.textContent = "Clear filters";
        clear.addEventListener("click", () => {
            active = allLabel;
            input.value = "";
            input.focus();
            update();
        });
        controls.append(clear);
        input.addEventListener("input", update);
        controls.hidden = false;
        update();
    }

    function initCareerAccordion() {
        const career = document.querySelector(".career");
        if (!career || !("ResizeObserver" in window)) return;

        const header = document.querySelector(".site-header");
        const disclosures = [...career.querySelectorAll(".career-disclosure")];
        const hasContentHeight = (disclosure) =>
            disclosure.getBoundingClientRect().bottom - disclosure.firstElementChild.getBoundingClientRect().bottom > 1;
        let stopFollowing;

        career.addEventListener("click", (event) => {
            const summary = event.target.closest(".career-disclosure > summary");
            if (!summary) return;
            stopFollowing?.();

            const disclosure = summary.parentElement;
            if (disclosure.open) return;
            const closingAbove = disclosures.slice(0, disclosures.indexOf(disclosure)).filter(
                (earlier) => earlier.open || hasContentHeight(earlier),
            );
            if (!closingAbove.length) return;

            const card = disclosure.closest(".career-row");
            const input = new AbortController();
            const observer = new ResizeObserver(() => {
                if (disclosure.open) {
                    const visibleTop = (header?.getBoundingClientRect().bottom ?? 0) + 12;
                    const offset = card.getBoundingClientRect().top - visibleTop;
                    // Correct only when the collapsing cards would pull this one behind the header.
                    if (offset < -1) scrollBy({top: offset, behavior: "instant"});
                    if (closingAbove.some(hasContentHeight)) return;
                }
                stop();
            });

            function stop() {
                observer.disconnect();
                input.abort();
                stopFollowing = undefined;
            }

            stopFollowing = stop;
            closingAbove.forEach((earlier) => observer.observe(earlier));
            const options = {passive: true, signal: input.signal};
            addEventListener("wheel", stop, options);
            addEventListener("touchmove", stop, options);
            addEventListener("keydown", stop, options);
        });
    }

    function initScrollEffects() {
        const progress = document.querySelector("[data-reading-progress]");
        const article = document.querySelector("[data-reading-article]");
        if (!progress || !article) return;

        let frame;

        function update() {
            frame = undefined;
            const headerHeight = progress.parentElement.offsetHeight;
            const rect = article.getBoundingClientRect();
            const distance = Math.max(1, rect.height - innerHeight + headerHeight);
            const fraction = Math.min(1, Math.max(0, (headerHeight - rect.top) / distance));
            progress.style.setProperty("--read-progress", fraction);
        }

        function schedule() {
            if (frame === undefined) frame = requestAnimationFrame(update);
        }

        progress.hidden = false;
        addEventListener("scroll", schedule, {passive: true});
        addEventListener("resize", schedule);
        update();
    }

    const DAY = 86_400_000;
    const WEEK = 7 * DAY;
    const dayKey = (date) => date.toISOString().slice(0, 10);

    async function loadGithubActivity() {
        const now = new Date();
        const utcToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const start = new Date(utcToday - ((now.getUTCDay() + 6) % 7) * DAY - 15 * WEEK);
        const url = new URL("https://api.github.com/repos/kaizenchandra/kaizenchandra.github.io/commits");
        const signal = AbortSignal.timeout(7000);
        const commits = [];
        url.search = new URLSearchParams({
            author: "kaizenchandra", since: start.toISOString(), until: now.toISOString(), per_page: "100",
        });
        for (let page = 1; page <= 10; page++) {
            url.searchParams.set("page", page);
            const response = await fetch(url, {signal});
            if (!response.ok) throw new Error("GitHub feed unavailable");
            const results = await response.json();
            if (!Array.isArray(results)) throw new Error("Invalid GitHub feed");
            commits.push(...results.map(({commit}) => commit.committer.date.slice(0, 10)));
            if (!/rel="next"/.test(response.headers.get("link") || "") && results.length < 100) {
                return {start: dayKey(start), asOf: dayKey(now), commits};
            }
        }
        throw new Error("GitHub feed exceeded the pagination limit");
    }

    function showActivity(root, data) {
        const start = Date.parse(data.start);
        const end = Date.parse(data.asOf);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || !Array.isArray(data.commits)) {
            throw new Error("Invalid activity data");
        }
        const counts = Array(16).fill(0);
        for (const value of data.commits) {
            const date = Date.parse(value);
            const week = Math.floor((date - start) / WEEK);
            if (week >= 0 && week < counts.length && date <= end) counts[week]++;
        }

        const chart = root.querySelector(".activity-graph");
        chart.replaceChildren();
        const table = document.createElement("table");
        const header = table.createTHead().insertRow();
        for (const label of ["Week starting (UTC)", "Commits"]) {
            const heading = document.createElement("th");
            heading.scope = "col";
            heading.textContent = label;
            header.append(heading);
        }
        const body = table.createTBody();
        const max = Math.max(1, ...counts);
        counts.forEach((count, index) => {
            const week = dayKey(new Date(start + index * WEEK));
            const bar = document.createElement("span");
            bar.style.setProperty("--count", count / max);
            bar.title = `Week of ${week}: ${count} ${count === 1 ? "commit" : "commits"}`;
            chart.append(bar);

            const row = body.insertRow();
            const label = document.createElement("th");
            label.scope = "row";
            label.textContent = week;
            row.append(label);
            row.insertCell().textContent = String(count);
        });
        const tablePanel = root.querySelector(".activity-table");
        tablePanel.querySelector("div").replaceChildren(table);
        tablePanel.hidden = false;
        const axis = root.querySelector(".activity-axis");
        axis.replaceChildren(...[data.start, data.asOf].map((date) => {
            const label = document.createElement("span");
            label.textContent = date;
            return label;
        }));

        return counts.reduce((sum, count) => sum + count, 0);
    }

    function initActivity(root) {
        const content = root.querySelector(".activity-content");
        const skeleton = root.querySelector(".activity-skeleton");
        const chart = root.querySelector(".activity-graph");
        const axis = root.querySelector(".activity-axis");
        const message = root.querySelector(".activity-status");
        const retry = root.querySelector(".activity-retry");
        let requested = false;

        async function refresh() {
            if (content.getAttribute("aria-busy") === "true") return;
            content.setAttribute("aria-busy", "true");
            retry.hidden = true;
            skeleton.hidden = false;
            chart.hidden = true;
            axis.hidden = true;
            message.textContent = "Loading public commit activity.";
            try {
                const data = await loadGithubActivity();
                const count = showActivity(root, data);
                message.textContent = `${count} ${count === 1 ? "commit" : "commits"} from ${data.start} through ${data.asOf} (UTC). Updated from GitHub.`;
            } catch {
                retry.hidden = false;
                try {
                    const response = await fetch("assets/data/github-activity.json", {signal: AbortSignal.timeout(2500)});
                    if (!response.ok) throw new Error("Snapshot unavailable");
                    const data = await response.json();
                    const count = showActivity(root, data);
                    message.textContent = `Live GitHub data is unavailable. Saved snapshot has ${count} commits from ${data.start} through ${data.asOf} (UTC).`;
                } catch {
                    message.textContent = "Commit activity is temporarily unavailable. You can view the source repository.";
                }
            } finally {
                chart.hidden = chart.children.length === 0;
                axis.hidden = chart.hidden;
                skeleton.hidden = true;
                content.setAttribute("aria-busy", "false");
            }
        }

        root.hidden = false;
        root.addEventListener("toggle", () => {
            if (!root.open || requested) return;
            requested = true;
            refresh();
        });
        retry.addEventListener("click", refresh);
    }

    function initContact(form) {
        const feedback = form.querySelector(".contact-feedback");
        const mode = form.querySelector(".contact-mode");
        const button = form.querySelector("button[type=submit]");
        const fields = [...form.querySelectorAll("[required]")];
        const endpoint = form.dataset.endpoint;
        form.hidden = false;
        form.noValidate = true;
        if (!endpoint) {
            button.textContent = "Open email draft";
            mode.textContent = "Your message opens in your email app for you to send.";
        }

        for (const field of fields) {
            field.addEventListener("input", () => {
                if (field.hasAttribute("aria-invalid")) feedback.textContent = "";
                field.removeAttribute("aria-invalid");
                field.removeAttribute("aria-describedby");
            });
        }

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (button.disabled) return;

            const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]));
            const problems = {
                name: values.name ? "" : "Enter your name.",
                email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ? "" : "Enter a valid email address.",
                message: values.message.length >= 10 ? "" : "Enter a message of at least 10 characters.",
            };
            const invalid = fields.find((field) => problems[field.name] || !field.validity.valid);
            for (const field of fields) {
                field.removeAttribute("aria-invalid");
                field.removeAttribute("aria-describedby");
            }
            if (invalid) {
                feedback.textContent = problems[invalid.name] || invalid.validationMessage;
                invalid.setAttribute("aria-invalid", "true");
                invalid.setAttribute("aria-describedby", feedback.id);
                invalid.focus();
                return;
            }

            if (!endpoint) {
                const address = document.querySelector(".contact-email").getAttribute("href");
                const subject = encodeURIComponent("Portfolio inquiry");
                const body = encodeURIComponent(`${values.message}\n\nFrom: ${values.name} <${values.email}>`);
                location.href = `${address}?subject=${subject}&body=${body}`;
                feedback.textContent = "Email draft prepared. Send it from your email app.";
                return;
            }

            button.disabled = true;
            feedback.textContent = "Sending message…";
            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(values),
                    signal: AbortSignal.timeout(8000),
                });
                if (response.status === 429) throw new Error("rate");
                if (!response.ok || (await response.json()).accepted !== true) throw new Error("delivery");
                form.reset();
                feedback.textContent = "Message accepted. Thank you for reaching out.";
            } catch (error) {
                feedback.textContent = error.message === "rate"
                    ? "Too many attempts. Wait a moment and try again."
                    : "The message could not be sent. Try again or use the email link.";
            } finally {
                button.disabled = false;
            }
        });
    }

    document.querySelectorAll("[data-filter]").forEach(initFilter);
    document.querySelectorAll("[data-activity]").forEach(initActivity);
    const contact = document.querySelector(".contact-form");
    if (contact) initContact(contact);
    initCareerAccordion();
    initScrollEffects();
})();
