/* Mobile menu burger toggle */
(function () {
  const nav = document.querySelector(".gh-navigation");
  const burger = nav?.querySelector(".gh-burger");
  if (!burger) return;

  burger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.documentElement.style.overflowY = isOpen ? "hidden" : "";
  });
})();

/* Responsive video in post content */
(function () {
  const sources = [
    '.post-content iframe[src*="youtube.com"]',
    '.post-content iframe[src*="youtube-nocookie.com"]',
    '.post-content iframe[src*="player.vimeo.com"]',
    '.post-content iframe[src*="kickstarter.com"][src*="video.html"]',
    ".post-content object",
    ".post-content embed",
  ];
  reframe(document.querySelectorAll(sources.join(",")));
})();

/* Turn the main nav into dropdown menu when there are more than 5 menu items */
(function () {
  dropdown();
})();

/* Infinite scroll pagination */
(function () {
  if (
    !document.body.classList.contains("home-template") &&
    !document.body.classList.contains("post-template")
  ) {
    pagination();
  }
})();

/* Responsive HTML table */
(function () {
  const tables = document.querySelectorAll(
    ".gh-content > table:not(.gist table)"
  );

  tables.forEach(function (table) {
    const wrapper = document.createElement("div");
    wrapper.className = "gh-table";
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
})();

////Tag page filter

document.addEventListener("DOMContentLoaded", function () {
  if (!document.body.classList.contains("tag-template")) return;

  const postsPerPage = 12;
  const customTags = window.customTags || [];
  const postFeed = document.getElementById("post-feed");
  const posts = Array.from(document.querySelectorAll(".post-card-wrapper"));
  const paginationContainer = document.getElementById("pagination-numbers");
  const filterList = document.querySelector(".all-tags-list");
  const filterName = document.querySelector("#current-filter");

  // Визначаємо сторінку з URL (/page/2/)
  const pathParts = window.location.pathname.split("/");
  const pageIndex = pathParts.indexOf("page");
  let currentPage =
    pageIndex !== -1 && pathParts[pageIndex + 1]
      ? parseInt(pathParts[pageIndex + 1])
      : 1;

  function initFilters() {
    const countAll = document.querySelector('[data-count="all"]');
    if (countAll) countAll.innerText = `${posts.length}`;

    // Створюємо кнопки для кожного тегу з масиву
    customTags.forEach((tag) => {
      const count = posts.filter((post) => {
        const postTags = (post.getAttribute("data-tags") || "")
          .trim()
          .split(/\s+/);
        return postTags.includes(tag.slug);
      }).length;

      if (count > 0) {
        const li = document.createElement("li");
        li.className = "tag-filter-item";
        li.innerHTML = `
                    <button data-filter="${tag.slug}" class="filter-btn tag-link">
                        ${tag.name} <span class="posts-count">${count}</span>
                    </button>
                `;
        filterList.appendChild(li);
      }
    });

    setupClickHandlers();

    if (filterList) filterList.classList.add("is-visible");
  }

  // --- 3. Пагінація ---
  function renderPagination(totalItems) {
    paginationContainer.innerHTML = "";
    const pageCount = Math.ceil(totalItems / postsPerPage);
    if (pageCount <= 1) return;

    const createBtn = (
      content,
      targetPage,
      isCurrent = false,
      isDisabled = false,
      className = ""
    ) => {
      const btn = document.createElement("button");
      btn.innerHTML = content;
      if (className) btn.classList.add(className);
      if (isCurrent) btn.classList.add("current");
      if (isDisabled) btn.disabled = true;
      if (!isDisabled && !isCurrent) btn.onclick = () => goToPage(targetPage);
      return btn;
    };

    const createDots = () => {
      const span = document.createElement("span");
      span.className = "extra";
      span.textContent = "...";
      return span;
    };

    const ARROW_L = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.52341 9.16689L10.9934 4.69689L9.81508 3.51855L3.33342 10.0002L9.81508 16.4819L10.9934 15.3036L6.52341 10.8336H16.6667V9.16689H6.52341Z" fill="#161B25"/></svg>`;
    const ARROW_R = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.4766 9.16689L9.00658 4.69689L10.1849 3.51855L16.6666 10.0002L10.1849 16.4819L9.00658 15.3036L13.4766 10.8336H3.33325V9.16689H13.4766Z" fill="#161B25"/></svg>`;

    paginationContainer.appendChild(
      createBtn(
        `${ARROW_L}<span>Попередня</span>`,
        currentPage - 1,
        false,
        currentPage === 1,
        "prev-next"
      )
    );

    const numbersContainer = document.createElement("div");
    numbersContainer.classList.add("pagination-numbers");
    for (let i = 1; i <= pageCount; i++) {
      if (
        i === 1 ||
        i === pageCount ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        numbersContainer.appendChild(createBtn(i, i, i === currentPage));
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        numbersContainer.appendChild(createDots());
      }
    }

    paginationContainer.appendChild(numbersContainer);

    paginationContainer.appendChild(
      createBtn(
        `<span>Наступна</span>${ARROW_R}`,
        currentPage + 1,
        false,
        currentPage === pageCount,
        "prev-next"
      )
    );
  }

  function goToPage(page) {
    currentPage = page;
    let baseUrl =
      window.location.pathname
        .replace(/\/page\/\d+\/?$/, "")
        .replace(/\/$/, "") + "/";
    let newPath = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;

    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get("filter");
    if (filter) newPath += `?filter=${filter}`;

    window.history.pushState({ page: page }, "", newPath);
    updateDisplay(filter || "all");
    window.scrollTo({ top: postFeed.offsetTop - 100, behavior: "smooth" });
  }

  // --- 4. Відображення ---
  function updateDisplay(filter = "all") {
    if (filter === "all") {
      filterName.innerHTML = "Всі";
      const start = (currentPage - 1) * postsPerPage;
      const end = start + postsPerPage;
      posts.forEach((post, index) => {
        post.style.display = index >= start && index < end ? "block" : "none";
      });
      paginationContainer.style.display = "flex";
      renderPagination(posts.length);
    } else {
      filterName.innerHTML = customTags.find(
        (tag) => tag.slug === filter
      )?.name;
      posts.forEach((post) => {
        const tags = (post.getAttribute("data-tags") || "").trim().split(/\s+/);
        post.style.display = tags.includes(filter) ? "block" : "none";
      });
      paginationContainer.style.display = "none";
    }
  }

  // --- 5. Обробка кліків ---
  function setupClickHandlers() {
    const btns = document.querySelectorAll(".filter-btn");
    btns.forEach((btn) => {
      btn.onclick = function () {
        const filter = this.getAttribute("data-filter");
        const url = new URL(window.location);

        currentPage = 1;
        let baseUrl =
          window.location.pathname
            .replace(/\/page\/\d+\/?$/, "")
            .replace(/\/$/, "") + "/";

        if (filter === "all") url.searchParams.delete("filter");
        else url.searchParams.set("filter", filter);

        window.history.pushState({}, "", baseUrl + url.search);
        btns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        updateDisplay(filter);
      };
    });
  }

  // --- 6. Ініціалізація ---
  initFilters();

  const urlParams = new URLSearchParams(window.location.search);
  const initFilter = urlParams.get("filter");
  if (initFilter) {
    const activeBtn = document.querySelector(
      `.filter-btn[data-filter="${initFilter}"]`
    );
    if (activeBtn) {
      activeBtn.click();
    } else {
      updateDisplay("all");
    }
  } else {
    updateDisplay("all");
  }

  window.addEventListener("popstate", () => location.reload());
});

// FAQ

document.addEventListener("DOMContentLoaded", function () {
  if (!document.body.classList.contains("post-template")) return;
  const faq = document.querySelector(".faq");
  if (!faq) return;

  faq.addEventListener("click", function (e) {
    const question = e.target.closest(".faq-question");
    question?.parentElement.classList.toggle("active");
  });
});

// Youtube video loader on custom video page

document.addEventListener("DOMContentLoaded", function () {
  if (!document.body.classList.contains("post-template")) return;
  const playBtn = document.getElementById("playBtn");
  if (!playBtn) return;

  function getYouTubeID() {
    let videoId = window.postVideoId;

    if (!videoId) {
      const contentLink = document.querySelector(
        '.post-content a[href*="youtube.com"], .post-content a[href*="youtu.be"]'
      );
      if (contentLink) {
        const linkMatch = contentLink.href.match(
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
        );
        if (linkMatch) videoId = linkMatch[1];
      }
    }

    const DEFAULT_VIDEO_ID = "Ohm1JZv_dbM"; // Default Youtube video ID

    return videoId || DEFAULT_VIDEO_ID;
  }

  playBtn.addEventListener(
    "click",
    () => {
      const embed = document.getElementById("youtubeEmbed");
      const wrapper = document.getElementById("videoWrapper");
      const id = getYouTubeID();

      embed.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen
      style="width:100%;aspect-ratio:16/9;display:block;"
      ></iframe>`;

      wrapper.style.display = "none";
      embed.style.display = "block";
    },
    { once: true }
  );
});
