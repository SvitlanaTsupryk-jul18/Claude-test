
(function () {
    var input = document.getElementById('search-input');
    var resultsContainer = document.getElementById('search-results');
    var paginationContainer = document.getElementById('search-pagination');
    var form = document.getElementById('search-form');
   
    if (!input || !resultsContainer || !form) return;
   
    var config = window.GhostSearch || {};
    var siteUrl = (config.siteUrl || window.location.origin).replace(/\/$/, '');
    var apiKey = config.apiKey || '';
    var debounceTimer;
    var POSTS_PER_PAGE = 9;
    var allPosts = [];
    var filteredPosts = [];
    var currentPage = 1;
    var currentTag = '';
   
    var ARROW_L = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6.52341 9.16689L10.9934 4.69689L9.81508 3.51855L3.33342 10.0002L9.81508 16.4819L10.9934 15.3036L6.52341 10.8336H16.6667V9.16689H6.52341Z" fill="#161B25"/></svg>';
    var ARROW_R = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13.4766 9.16689L9.00658 4.69689L10.1849 3.51855L16.6666 10.0002L10.1849 16.4819L9.00658 15.3036L13.4766 10.8336H3.33325V9.16689H13.4766Z" fill="#161B25"/></svg>';
   
    /* ---- Helpers ---- */
   
    function escapeHtml(str) {
      if (!str) return '';
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(String(str)));
      return div.innerHTML;
    }
   
    function safeUrl(url) {
      if (!url) return '#';
      try {
        var parsed = new URL(url);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url;
      } catch (_) {}
      return '#';
    }
   
    function formatDate(dateStr) {
      if (!dateStr) return '';
      var d = new Date(dateStr);
      return d.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });
    }
   
    function debounce(fn, delay) {
      return function () {
        var args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () { fn.apply(null, args); }, delay);
      };
    }
   
    /* ---- Render post cards ---- */
   
    function renderPostCards(posts) {
      var list = document.createElement('div');
      list.className = 'search-result-list';
   
      posts.forEach(function (post) {
        var article = document.createElement('article');
        article.className = 'search-result-item';
   
        var postUrl = safeUrl(post.url);
   
        var imgHtml = '';
        if (post.feature_image) {
          imgHtml =
            '<a href="' + escapeHtml(postUrl) + '" class="search-result-img" tabindex="-1" aria-hidden="true">' +
              '<img src="' + escapeHtml(post.feature_image) + '" alt="' + escapeHtml(post.title) + '" loading="lazy">' +
            '</a>';
        }
   
        var tagHtml = '';
        if (post.primary_tag) {
          tagHtml =
            '<a class="post-tag" href="' + escapeHtml(safeUrl(post.primary_tag.url)) + '">' +
              escapeHtml(post.primary_tag.name) +
            '</a>';
        }
   
        var excerptText = post.custom_excerpt || post.excerpt || '';
        var excerptHtml = '';
        if (excerptText) {
          var trimmed = excerptText.length > 160 ? excerptText.substring(0, 160) + '\u2026' : excerptText;
          excerptHtml = '<p class="search-result-excerpt">' + escapeHtml(trimmed) + '</p>';
        }
   
        var authorHtml = '';
        if (post.primary_author) {
          authorHtml =
            '<a href="' + escapeHtml(safeUrl(post.primary_author.url)) + '" class="post-card-author">' +
              escapeHtml(post.primary_author.name) +
            '</a>';
        }
   
        var dateHtml = post.published_at
          ? '<span class="post-card-date">' + escapeHtml(formatDate(post.published_at)) + '</span>'
          : '';
   
        article.innerHTML =
          imgHtml +
          '<div class="search-result-info">' +
            tagHtml +
            '<h3 class="search-result-title">' +
              '<a href="' + escapeHtml(postUrl) + '">' + escapeHtml(post.title) + '</a>' +
            '</h3>' +
            excerptHtml +
            '<div class="post-card-meta">' + authorHtml + dateHtml + '</div>' +
          '</div>';
   
        list.appendChild(article);
      });
   
      return list;
    }
   
    /* ---- Render pagination ---- */
   
    function renderPagination(totalPages, page) {
      if (!paginationContainer) return;
      paginationContainer.innerHTML = '';
      if (totalPages <= 1) return;
   
      var prevBtn = document.createElement('button');
      prevBtn.className = 'prev-next';
      prevBtn.innerHTML = ARROW_L + '<span>\u041f\u043e\u043f\u0435\u0440\u0435\u0434\u043d\u044f</span>';
      if (page === 1) {
        prevBtn.disabled = true;
      } else {
        prevBtn.onclick = function () { goToPage(page - 1, true); };
      }
      paginationContainer.appendChild(prevBtn);
   
      var numbersContainer = document.createElement('div');
      numbersContainer.className = 'pagination-numbers';
   
      for (var i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
          (function (num) {
            var btn = document.createElement('button');
            btn.textContent = num;
            if (num === page) {
              btn.classList.add('current');
            } else {
              btn.onclick = function () { goToPage(num, true); };
            }
            numbersContainer.appendChild(btn);
          })(i);
        } else if (i === page - 2 || i === page + 2) {
          var dots = document.createElement('span');
          dots.className = 'extra';
          dots.textContent = '...';
          numbersContainer.appendChild(dots);
        }
      }
   
      paginationContainer.appendChild(numbersContainer);
   
      var nextBtn = document.createElement('button');
      nextBtn.className = 'prev-next';
      nextBtn.innerHTML = '<span>\u041d\u0430\u0441\u0442\u0443\u043f\u043d\u0430</span>' + ARROW_R;
      if (page === totalPages) {
        nextBtn.disabled = true;
      } else {
        nextBtn.onclick = function () { goToPage(page + 1, true); };
      }
      paginationContainer.appendChild(nextBtn);
    }
   
    /* ---- Go to page ---- */
   
    function goToPage(page, scroll) {
      currentPage = page;
      var start = (page - 1) * POSTS_PER_PAGE;
      var pagePosts = filteredPosts.slice(start, start + POSTS_PER_PAGE);
      var totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
      var query = input.value.trim();
   
      resultsContainer.innerHTML = '';
   
      if (!filteredPosts.length) {
        resultsContainer.innerHTML =
          '<p class="search-no-results">No posts found for \u201c<strong>' + escapeHtml(query) + '</strong>\u201d.</p>';
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
      }
   
      var count = document.createElement('p');
      count.className = 'search-count';
      if (query) {
        count.innerHTML =
          filteredPosts.length + ' post' + (filteredPosts.length !== 1 ? 's' : '') +
          ' found for \u201c<strong>' + escapeHtml(query) + '</strong>\u201d';
      } else {
        count.textContent = 'All posts (' + filteredPosts.length + ')';
      }
   
      resultsContainer.appendChild(count);
      resultsContainer.appendChild(renderPostCards(pagePosts));
      renderPagination(totalPages, page);
   
      if (scroll) {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
   
    /* ---- Load all posts on init ---- */
   
    function loadAllPosts() {
      if (!apiKey) {
        resultsContainer.innerHTML =
          '<p class="search-error">Search is not configured. ' +
          'Add your Ghost Content API key in Ghost Admin \u2192 Design \u2192 Customize \u2192 <em>content_api_key</em>.</p>';
        return;
      }
   
      resultsContainer.innerHTML = '<p class="search-loading">Loading\u2026</p>';
   
      var url =
        siteUrl + '/ghost/api/content/posts/' +
        '?key=' + encodeURIComponent(apiKey) +
        '&fields=title,url,feature_image,published_at,excerpt,custom_excerpt' +
        '&include=primary_author,primary_tag,tags' +
        '&limit=all' +
        '&order=published_at%20desc';
   
      fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error('API error ' + res.status);
          return res.json();
        })
        .then(function (data) {
          allPosts = data.posts || [];
          buildTagFilters(allPosts);
          var qParam = new URLSearchParams(window.location.search).get('q') || '';
          if (qParam) {
            input.value = qParam;
            filterPosts(qParam);
          } else {
            filteredPosts = allPosts;
            goToPage(1, false);
          }
        })
        .catch(function () {
          resultsContainer.innerHTML = '<p class="search-error">Something went wrong. Please try again.</p>';
        });
    }
   
    /* ---- Tag filters ---- */
   
    function buildTagFilters(posts) {
      var seen = {};
      var tags = [];
      posts.forEach(function (post) {
        (post.tags || []).forEach(function (tag) {
          if (tag.visibility === 'internal' && !seen[tag.slug]) {
            seen[tag.slug] = true;
            tags.push(tag);
          }
        });
      });
      renderTagFilters(tags, posts);
    }
   
    function renderTagFilters(tags, basePosts) {
      var container = document.getElementById('search-tag-filters');
      if (!container) return;
      container.innerHTML = '';
      if (!tags.length) return;
   
      var allLi = document.createElement('li');
      allLi.className = 'tag-filter-item';
      var allBtn = document.createElement('button');
      allBtn.className = 'filter-btn' + (!currentTag ? ' active' : '');
      allBtn.dataset.filter = '';
      allBtn.innerHTML = '\u0412\u0441\u0456 <span class="posts-count">' + basePosts.length + '</span>';
      allBtn.onclick = function () { setTagFilter(''); };
      allLi.appendChild(allBtn);
      container.appendChild(allLi);
   
      tags.forEach(function (tag) {
        var count = basePosts.filter(function (p) {
          return (p.tags || []).some(function (t) { return t.slug === tag.slug; });
        }).length;
        var li = document.createElement('li');
        li.className = 'tag-filter-item';
        li.style.display = count ? '' : 'none';
        var btn = document.createElement('button');
        btn.className = 'filter-btn' + (currentTag === tag.slug ? ' active' : '');
        btn.dataset.filter = tag.slug;
        btn.innerHTML = escapeHtml(tag.name) + ' <span class="posts-count">' + count + '</span>';
        btn.onclick = function () { setTagFilter(tag.slug); };
        li.appendChild(btn);
        container.appendChild(li);
      });
    }
   
    function updateTagCounts(basePosts) {
      var container = document.getElementById('search-tag-filters');
      if (!container) return;
   
      container.querySelectorAll('.filter-btn').forEach(function (btn) {
        var slug = btn.dataset.filter;
        var count = slug
          ? basePosts.filter(function (p) {
              return (p.tags || []).some(function (t) { return t.slug === slug; });
            }).length
          : basePosts.length;
   
        var countEl = btn.querySelector('.posts-count');
        if (countEl) countEl.textContent = count;
        btn.parentElement.style.display = (slug && count === 0) ? 'none' : '';
      });
    }
   
    function setTagFilter(slug) {
      currentTag = slug;
      document.querySelectorAll('#search-tag-filters .filter-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.filter === slug);
      });
      filterPosts(input.value.trim());
    }
   
    /* ---- Filter ---- */
   
    function filterPosts(query) {
      var q = query.toLowerCase();
   
      // Posts matching search query only (used for tag counts)
      var searchFiltered = !q ? allPosts : allPosts.filter(function (post) {
        return (post.title && post.title.toLowerCase().indexOf(q) !== -1) ||
               (post.excerpt && post.excerpt.toLowerCase().indexOf(q) !== -1) ||
               (post.custom_excerpt && post.custom_excerpt.toLowerCase().indexOf(q) !== -1);
      });
   
      // Update tag counts based on search-filtered posts
      updateTagCounts(searchFiltered);
   
      // Apply tag filter on top of search filter
      filteredPosts = !currentTag ? searchFiltered : searchFiltered.filter(function (post) {
        return (post.tags || []).some(function (t) { return t.slug === currentTag; });
      });
   
      goToPage(1, false);
    }
   
    var debouncedFilter = debounce(function (query) { filterPosts(query); }, 400);
   
    /* ---- Events ---- */
   
    input.addEventListener('input', function () {
      debouncedFilter(this.value.trim());
    });
   
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearTimeout(debounceTimer);
      filterPosts(input.value.trim());
    });
   
    /* ---- Init ---- */
   
    loadAllPosts();
  })();