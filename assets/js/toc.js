document.addEventListener("DOMContentLoaded", () => {
  const content = document.querySelector(".post-content");
  const headings = content?.querySelectorAll("h2") || [];
  const mobContainer = document.querySelector(".toc-placeholder");
  const deskContainer = document.querySelector(".post-sidebar");

  if (!document.body.classList.contains("post-template") || headings.length < 2)
    return;

  const isMobile = window.innerWidth < 1024;
  const tocContainer = document.createElement("div");
  tocContainer.className = "toc-wrapper";

  const listItems = Array.from(headings)
    .map((h, i) => {
      const customId = `section-${i}`;
      h.id = customId;
      return `<li><a href="#${customId}" class="toc-link" data-target="${customId}">${h.textContent}</a></li>`;
    })
    .join("");

  tocContainer.innerHTML = `
      <div class="toc ${isMobile ? "is-collapsible" : ""}">
          <p class="title-small toc-header">
              <span>Зміст</span>
              ${
                isMobile
                  ? '<svg class="toc-icon" viewBox="0 0 20 20" width="20" height="20"><path d="M15 7.5L10 12.5L5 7.5" stroke="currentColor" stroke-width="2" fill="none"/></svg>'
                  : ""
              }
          </p>
          <div class="progress-container"><div class="progress-bar"></div></div>
          <ul class="toc-list">${listItems}</ul>
      </div>`;

  if (isMobile && mobContainer) {
    mobContainer.append(tocContainer);
    tocContainer.querySelector(".toc-header").onclick = () =>
      tocContainer.querySelector(".toc").classList.toggle("is-active");
  } else if (deskContainer) {
    deskContainer.prepend(tocContainer);
  }

  const tocLinks = tocContainer.querySelectorAll(".toc-link");
  const progBar = tocContainer.querySelector(".progress-bar");

  tocLinks.forEach((link) => {
    link.onclick = (e) => {
      e.preventDefault();
      const targetId = link.dataset.target;
      const target = document.getElementById(targetId);
      if (!target) return;

      const offset =
        (isMobile ? mobContainer?.offsetHeight || 0 : 0) + (isMobile ? 15 : 40);
      window.scrollTo({ top: target.offsetTop - offset, behavior: "smooth" });

      if (isMobile)
        tocContainer.querySelector(".toc").classList.remove("is-active");
      history.pushState(null, null, `#${targetId}`);
    };
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        tocLinks.forEach((l) =>
          l.classList.toggle(
            "is-active",
            l.dataset.target === visibleEntry.target.id
          )
        );
      }
    },
    { rootMargin: "-10% 0px -70% 0px", threshold: 0.1 }
  );

  headings.forEach((h) => observer.observe(h));

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = content.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const contentHeight = rect.height;
          let progress = 0;

          if (rect.top > 0) {
            progress = 0;
          } else {
            const scrollableHeight = contentHeight - windowHeight;
            if (scrollableHeight > 0) {
              progress = (Math.abs(rect.top) / scrollableHeight) * 100;
            } else {
              progress = rect.bottom < windowHeight ? 100 : 0;
            }
          }

          progBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
});
