// Native pagination(almost))

function pagination() {
  const pag = document.querySelector(".pagination-numbers");
  if (!pag) return;

  const current = parseInt(pag.dataset.current);
  const total = parseInt(pag.dataset.total);
  const baseUrl = pag.dataset.url.replace(/\/page\/1\/?$/, "/"); // Get base blog URL

  const getPageUrl = (num) => (num === 1 ? baseUrl : `${baseUrl}page/${num}/`);

  let html = "";
  const range = 2;

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - range && i <= current + range)
    ) {
      html += `<a href="${getPageUrl(i)}" class="${
        i === current ? "current" : ""
      }">${i}</a>`;
    } else if (i === current - range - 1 || i === current + range + 1) {
      html += `<span class="extra">...</span>`;
    }
  }
  pag.innerHTML = html;
}

// Index Load More & URL Sync with pagination

document.addEventListener("DOMContentLoaded", function () {
  if (!document.body.classList.contains("home-template")) return;

  const loadMoreButton = document.querySelector(".load-more");
  const postFeed = document.querySelector(".posts-list-load");
  if (!loadMoreButton || !postFeed) return;

  loadMoreButton.addEventListener("click", async function (e) {
    const nextPageUrl = loadMoreButton.getAttribute("data-next-page");
    if (!nextPageUrl || nextPageUrl === "null") {
      loadMoreButton.remove();
      return;
    }

    loadMoreButton.disabled = true;

    try {
      const response = await fetch(nextPageUrl);
      if (!response.ok) throw new Error("Помилка мережі");

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const newPosts = doc.querySelectorAll(".posts-list-load > *");
      const nextButtonFromDoc = doc.querySelector("[data-next-page]");
      const newUrl = nextButtonFromDoc
        ? nextButtonFromDoc.getAttribute("data-next-page")
        : null;

      if (newPosts.length > 0) {
        newPosts.forEach((post, index) => {
          post.classList.add("post-fade-in");
          post.style.animationDelay = index * 0.1 + "s";
          postFeed.appendChild(post);
        });
      }

      if (newUrl && newUrl !== nextPageUrl) {
        loadMoreButton.setAttribute("data-next-page", newUrl);
        loadMoreButton.disabled = false;
      } else {
        loadMoreButton.remove();
      }
    } catch (error) {
      console.error("Помилка завантаження постів:", error);
      loadMoreButton.disabled = false;
    }
  });
});

// Pagination load more on tag page

document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains("tag-template")) return;

  const feed = document.querySelector(
    ".list-load-more, .gh-topic-list .post-list"
  );
  const btn = document.querySelector(".load-more-button");
  if (!feed || !btn) return;

  const LIMIT = parseInt(btn.dataset.limit) || 6;
  const base = btn.getAttribute("data-base-url") || window.location.pathname;
  let nextPage = parseInt(btn.getAttribute("data-next-page")) || 2;
  let buffer = [];

  // 1. Первинна обробка: забираємо надлишки в буфер
  Array.from(feed.children).forEach((post, i) => {
    if (i >= LIMIT) {
      buffer.push(post);
      post.remove();
    }
  });

  // 2. Функція відображення РІВНО по LIMIT (6)
  function flush() {
    const toShow = buffer.splice(0, LIMIT);
    toShow.forEach((post, i) => {
      post.classList.add("post-fade-in");
      post.style.animationDelay = `${i * 0.1}s`;
      feed.appendChild(post);
    });

    btn.classList.remove("loading");
    btn.textContent = "Показати більше";

    if (buffer.length === 0 && !nextPage) btn.remove();
  }

  // 3. Функція завантаження, яка ДОДАЄ пости в буфер
  async function fetchAndFill() {
    btn.classList.add("loading");

    const url = `${base.replace(/\/$/, "")}/page/${nextPage}/`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No more pages");

      const doc = new DOMParser().parseFromString(
        await res.text(),
        "text/html"
      );
      const posts = Array.from(
        doc.querySelectorAll(
          ".gh-topic-list .post-list > *, .list-load-more > *"
        )
      );

      if (posts.length) {
        buffer = buffer.concat(posts); // Додаємо нові до залишків
        nextPage++;
        btn.setAttribute("data-next-page", nextPage);
      } else {
        nextPage = null;
      }

      // ПЕРЕВІРКА: якщо після завантаження в буфері все ще мало постів, а сторінки є - качаємо ще
      if (buffer.length < LIMIT && nextPage) {
        await fetchAndFill();
      } else {
        flush();
      }
    } catch (err) {
      nextPage = null;
      buffer.length ? flush() : btn.remove();
    }
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (btn.classList.contains("loading")) return;

    // ГОЛОВНА УМОВА: якщо в буфері менше 6, але є наступна сторінка — йдемо за дозаправкою
    if (buffer.length < LIMIT && nextPage) {
      fetchAndFill();
    } else {
      flush();
    }
  });
});
