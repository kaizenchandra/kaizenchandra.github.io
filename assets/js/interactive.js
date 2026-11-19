(() => {
  "use strict";

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

  function initFilter(panel) {
    const key = panel.dataset.filterItem;
    const items = [...panel.querySelectorAll(`[data-${key}]`)];
    const controls = panel.querySelector(".filter-controls");
    const tagList = controls.querySelector(".filter-tags");
    const input = controls.querySelector("input");
    const status = controls.querySelector(".filter-status");
    const meter = controls.querySelector(".filter-meter");
    const noun = panel.dataset.noun;
    const itemData = items.map((item) => ({
      item,
      tags: item.dataset[key].split("|"),
      text: item.textContent.toLowerCase(),
    }));
    let active = "All";

    function update() {
      const query = input.value.trim().toLowerCase();
      let matches = 0;
      for (const { item, tags, text } of itemData) {
        const visible = text.includes(query) && (active === "All" || tags.includes(active));
        item.hidden = !visible;
        if (visible) matches++;
      }
      for (const button of tagList.children) {
        button.setAttribute("aria-pressed", String(button.textContent === active));
      }
      status.textContent = matches
        ? `Showing ${matches} of ${items.length} ${noun}.`
        : `No ${noun} match. Change the tag or clear the search.`;
      meter?.style.setProperty("--match-share", matches / items.length);
    }

    const tags = [...new Set(itemData.flatMap(({ tags }) => tags))].sort();
    for (const tag of ["All", ...tags]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter-chip";
      button.textContent = tag;
      button.addEventListener("click", () => {
        active = tag;
        if (tag === "All") input.value = "";
        update();
      });
      tagList.append(button);
    }
    input.addEventListener("input", update);
    controls.hidden = false;
    update();
  }

  function initMotion() {
    if (!("IntersectionObserver" in window) || reducedMotion.matches) return;

    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.classList.add("in-view");
        observer.unobserve(target);
      }
    }, { threshold: 0.12 });
    const groups = document.querySelectorAll(".work-showcase, .skill-grid, .engineering-grid, .career");
    for (const group of groups) {
      [...group.children].forEach((child, index) => {
        child.style.setProperty("--reveal-delay", `${(index % 3) * 55}ms`);
        observer.observe(child);
      });
    }

    for (const target of document.querySelectorAll(".tilt-card, .magnetic-button")) {
      target.addEventListener("pointermove", (event) => {
        if (!finePointer.matches || reducedMotion.matches || event.pointerType !== "mouse") return;
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--pointer-x", (event.clientX - rect.left) / rect.width * 2 - 1);
        target.style.setProperty("--pointer-y", (event.clientY - rect.top) / rect.height * 2 - 1);
      });
      target.addEventListener("pointerleave", () => {
        target.style.removeProperty("--pointer-x");
        target.style.removeProperty("--pointer-y");
      });
    }
  }

  function initScrollEffects() {
    const panel = document.querySelector(".parallax-panel");
    const progress = document.querySelector("[data-reading-progress]");
    const article = document.querySelector("[data-reading-article]");
    if (!panel && !progress) return;

    let frame;
    function update() {
      frame = undefined;
      const headerHeight = progress?.parentElement.offsetHeight || 0;
      if (progress && article) {
        const rect = article.getBoundingClientRect();
        const distance = Math.max(1, rect.height - innerHeight + headerHeight);
        const fraction = Math.min(1, Math.max(0, (headerHeight - rect.top) / distance));
        progress.style.setProperty("--read-progress", fraction);
      }
      if (panel) {
        const offset = finePointer.matches && !reducedMotion.matches ? Math.min(14, scrollY * 0.045) : 0;
        panel.style.setProperty("--parallax-offset", `${offset}px`);
      }
    }
    function schedule() {
      if (frame === undefined) frame = requestAnimationFrame(update);
    }

    if (progress && article) progress.hidden = false;
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
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
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error("GitHub feed unavailable");
      const results = await response.json();
      if (!Array.isArray(results)) throw new Error("Invalid GitHub feed");
      commits.push(...results.map(({ commit }) => commit.committer.date.slice(0, 10)));
      if (!/rel="next"/.test(response.headers.get("link") || "") && results.length < 100) {
        return { start: dayKey(start), asOf: dayKey(now), commits };
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
          const response = await fetch("assets/data/github-activity.json", { signal: AbortSignal.timeout(2500) });
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
          headers: { "Content-Type": "application/json" },
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
  initMotion();
  initScrollEffects();
})();
