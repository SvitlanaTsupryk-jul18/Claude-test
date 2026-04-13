    // --- i18n ---
    const i18nBy = "by",
            i18nReadingTimeOne = "1 min",
            i18nReadingTimeMany = "% min",
            i18nNothingFound = "Nothing found"

    // --- Global state ---
    const locale = document.documentElement.lang || 'en-US';
    const POSTS_PER_PAGE = 9;
    let shouldScroll = false;
    let isLoading = false;
    let currentPage = 1;
    let currentSearch = '';
    let currentFilter = '';

    // --- Ghost API ---
    const api = new GhostContentAPI({
        key: ghost_key, // local 'd5b8a451d90c57600fa7213f37'
        url: ghost_host, // local 'http://localhost:2370'
        version: 'v5.13'
    });

    // --- URL helpers ---
    function buildUrl(page = 1, search = '') {
        let newPath = '';

        if (currentFilter) {
            newPath = `/blog/tag/${currentFilter}/`;
        } else {
            newPath = '/blog/';
        }

        if (page > 1) {
            newPath += `page/${page}/`;
        }

        const urlObj = new URL(window.location.origin + newPath);
        if (search && search.length > 0) {
            urlObj.searchParams.set('search', search);
        }

        return urlObj.toString();
    }

    function updateUrlAndFetch(page = 1, search = '') {
        currentPage = page;
        const newUrl = buildUrl(page, search);
        history.pushState(null, '', newUrl);
        fetchPosts(page, search);
    }

    function updateTitle() {
        const titleEl = document.getElementById('page-title');
        if (!titleEl) return;

        if (currentFilter) {
            const activeTab = document.querySelector('.posts-tabs .tab.active');
            titleEl.textContent = activeTab ? activeTab.textContent : `The NetHunt Blog`;
        }  else {
            titleEl.textContent = `The NetHunt Blog`;
        }
    }

    // --- Fetch posts ---
    async function fetchPosts(page = 1, search = '') {
        if (isLoading) return;
        isLoading = true;
        const params = { limit: POSTS_PER_PAGE, page, include: 'tags,authors' };
        const filters = [];

        if (search.length >= 2) filters.push(`title:~'${search}'`);
        if (currentFilter) filters.push(`primary_tag:${currentFilter}`);

        if (filters.length) params.filter = filters.join('+');

        try {
            const posts = await api.posts.browse(params);
            renderPosts(posts);
            const totalPages = posts.meta?.pagination?.pages || 1;
            const currentPage = posts.meta?.pagination?.page || 1;
            renderPagination(totalPages, currentPage);
            updateTitle();
        } finally {
            isLoading = false;
        }
    }

    // --- Render posts ---
    function renderPosts(posts) {
        const container = document.getElementById('posts-container');
        container.innerHTML = '';
        if (!posts.length) return container.innerHTML = `<p>${i18nNothingFound}</p>`;

        posts.forEach(post => {
            const publishedDate = new Date(post.published_at);
            post.date_published_iso = publishedDate.toISOString().split('T')[0];
            post.date_published_formatted = publishedDate.toLocaleDateString(locale, {
                month: 'short', day: '2-digit', year: 'numeric'
            });
            const readingTimeText = post.reading_time === 1
                    ? i18nReadingTimeOne
                    : i18nReadingTimeMany.replace('%', post.reading_time);

            const el = document.createElement('article');
            el.classList.add('post-card');

            el.innerHTML = `
            <div class="card${post.class ? ' ' + post.class : ''}${!post.feature_image ? ' no-img' : ''}${post.featured ? ' featured' : ''}">
                ${post.feature_image ? `
                <div class="card__image">
                    <a class="lazyload is-in-view loaded" href="${post.url}" style="background-image: url(${post.feature_image})" title="${post.title}" aria-label="${post.title}"></a>
                </div>` : ''}
                <div class="card__content">
                    <div class="card__content-wrap">
                        <div class="card__meta">
                            ${post.tags && post.primary_tag ? `
                            <a class="tag-${post.primary_tag.slug} card__tag" href="${post.primary_tag.url}" title="${post.primary_tag.name}" aria-label="${post.primary_tag.name}">
                                ${post.primary_tag.name}
                            </a>` : ''}
                            <div class="card__read-time">
                                <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.2 11.6333L11.1333 10.7L8.66665 8.23331V5.16665H7.33331V8.76665L10.2 11.6333ZM7.99998 15.1666C7.07776 15.1666 6.21109 14.9916 5.39998 14.6416C4.58887 14.2916 3.88331 13.8166 3.28331 13.2166C2.68331 12.6166 2.20831 11.9111 1.85831 11.1C1.50831 10.2889 1.33331 9.4222 1.33331 8.49998C1.33331 7.57776 1.50831 6.71109 1.85831 5.89998C2.20831 5.08887 2.68331 4.38331 3.28331 3.78331C3.88331 3.18331 4.58887 2.70831 5.39998 2.35831C6.21109 2.00831 7.07776 1.83331 7.99998 1.83331C8.9222 1.83331 9.78887 2.00831 10.6 2.35831C11.4111 2.70831 12.1166 3.18331 12.7166 3.78331C13.3166 4.38331 13.7916 5.08887 14.1416 5.89998C14.4916 6.71109 14.6666 7.57776 14.6666 8.49998C14.6666 9.4222 14.4916 10.2889 14.1416 11.1C13.7916 11.9111 13.3166 12.6166 12.7166 13.2166C12.1166 13.8166 11.4111 14.2916 10.6 14.6416C9.78887 14.9916 8.9222 15.1666 7.99998 15.1666ZM7.99998 13.8333C9.47776 13.8333 10.7361 13.3139 11.775 12.275C12.8139 11.2361 13.3333 9.97776 13.3333 8.49998C13.3333 7.0222 12.8139 5.76387 11.775 4.72498C10.7361 3.68609 9.47776 3.16665 7.99998 3.16665C6.5222 3.16665 5.26387 3.68609 4.22498 4.72498C3.18609 5.76387 2.66665 7.0222 2.66665 8.49998C2.66665 9.97776 3.18609 11.2361 4.22498 12.275C5.26387 13.3139 6.5222 13.8333 7.99998 13.8333Z" fill="#AAAEB6"/></svg>
                                ${readingTimeText}
                            </div>
                        </div>
                        <${post.useParagraphForTitle ? 'p' : 'h2'} class="card__title">
                            <a href="${post.url}" title="${post.title}" aria-label="${post.title}">${post.title}</a>
                        </${post.useParagraphForTitle ? 'p' : 'h2'}>
                    </div>
                    <div class="card__info">
                        <div class="card__author">
                            ${post.primary_author ? `<img src="${post.primary_author.profile_image}" alt="${post.primary_author.name}" />` : ''}
                            ${post.primary_author ? `<span>${i18nBy}</span>&nbsp;<a href="${post.primary_author.url}">${post.primary_author.name}</a>` : ''}
                        </div>
                        <time datetime="${post.published_at}" class="card__date">${post.date_published_formatted}</time>
                    </div>
                </div>
            </div>
        `;
            container.appendChild(el);
        });

        if (shouldScroll) {
            const articles = document.querySelector('.articles');
            if (articles) {
                articles.scrollIntoView({ behavior: 'smooth' });
            }
            shouldScroll = false;
        }
    }

    // --- Pagination ---
    function createBtn(label, page, disabled = false, current = false) {
        const el = document.createElement(disabled ? 'span' : 'a');
        el.innerHTML = label;
        if (disabled) el.classList.add('disabled');
        if (current) el.classList.add('current');

        if (!disabled && !current) {
            el.href = '#';
            el.addEventListener('click', e => {
                e.preventDefault();
                shouldScroll = true;
                updateUrlAndFetch(page, currentSearch);
            });
        }
        return el;
    }

    function getPagesArray(totalPages, currentPage) {
        const isMobile = window.innerWidth <= 767;
        const pages = [], delta = 2;

        if (isMobile) {
            if (currentPage !== 1) pages.push(1);
            if (currentPage > 2) pages.push('...');
            pages.push(currentPage);
            if (currentPage < totalPages - 1)  pages.push('...');
            if (currentPage !== totalPages) pages.push(totalPages);

            return pages;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                pages.push(i);
            } else if (i === currentPage - delta - 1 || i === currentPage + delta + 1) {
                pages.push('...');
            }
        }
        return pages;
    }

    function renderPagination(totalPages, currentPage) {
        const pagination = document.querySelector('.nh-pagination');
        if (!pagination) return;
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        pagination.innerHTML = '';

        // SVG arrows
        // Create button '<<'
        const svgFirst = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_10878_127" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16"><rect width="16" height="16" fill="#D9D9D9"/></mask><g mask="url(#mask0_10878_127)"><path d="M14.5 13.566L8.92598 7.99706L14.5 2.42815L13.571 1.5L7.06798 7.99706L13.571 14.4941L14.5 13.566ZM8.93187 13.5718L3.35785 8.00294L8.93187 2.43403L8.00302 1.50603L1.5 8.00309L8.00286 14.5L8.93187 13.5718Z" fill="#141F34"/></g></svg>`;
        // Create button '←'
        const svgPrev = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_10878_204" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16"><rect width="16" height="16" fill="#D9D9D9"/></mask><g mask="url(#mask0_10878_204)"><path d="M10.667 14.4359L4.23114 8.00004L10.667 1.56421L11.6131 2.51038L6.12331 8.00004L11.6131 13.4897L10.667 14.4359Z" fill="#141F34"/></g></svg>`;
        // Create button '→'
        const svgNext = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_10878_3" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16"><path d="M0 0H16V16H0V0Z" fill="#D9D9D9"/></mask><g mask="url(#mask0_10878_3)"><path d="M5.33294 14.4359L11.7688 8.00001L5.33294 1.56421L4.38684 2.51041L9.87664 8.00001L4.38684 13.4897L5.33294 14.4359Z" fill="#141F34"/></g></svg>`;
        // Create button '>>'
        const svgLast = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_1953_3115" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16"><rect x="16" y="16" width="16" height="16" transform="rotate(-180 16 16)" fill="#D9D9D9"/></mask><g mask="url(#mask0_1953_3115)"><path d="M1.5 2.43403L7.07402 8.00294L1.5 13.5718L2.429 14.5L8.93202 8.00294L2.429 1.50588L1.5 2.43403ZM7.06813 2.42815L12.6421 7.99706L7.06813 13.566L7.99698 14.494L14.5 7.99691L7.99714 1.5L7.06813 2.42815Z" fill="#141F34"/></g></svg>`;

        pagination.appendChild(createBtn(svgFirst, 1, currentPage === 1));
        pagination.appendChild(createBtn(svgPrev, currentPage - 1, currentPage === 1));

        getPagesArray(totalPages, currentPage).forEach(num => {
            if (num === '...') {
                const span = document.createElement('span');
                span.classList.add('ellipsis'); span.textContent = '...';
                pagination.appendChild(span);
            } else {
                pagination.appendChild(createBtn(num, num, false, num === currentPage));
            }
        });

        pagination.appendChild(createBtn(svgNext, currentPage + 1, currentPage === totalPages));
        pagination.appendChild(createBtn(svgLast, totalPages, currentPage === totalPages));
    }

    // --- Tabs ---
    document.querySelectorAll('.posts-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.dataset.filter || '';

            currentSearch = '';
            document.getElementById('post-search').value = '';

            document.querySelectorAll('.posts-tabs .tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = filter;
            currentPage = 1;

            const newUrl = buildUrl(1, '');
            history.pushState(null, '', newUrl);
            fetchPosts(1, '');
        });
    });

    // Ghost Content API request limit
    function debounce(fn, delay = 400) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    // --- Search ---
    const handleSearch = debounce((value) => {
        currentSearch = value;
        currentPage = 1;

        if (value.length > 0) {
            currentFilter = '';
            document.querySelectorAll('.posts-tabs .tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.filter === '');
            });
        }

        updateUrlAndFetch(1, currentSearch);
    }, 500);

    document.getElementById('post-search').addEventListener('input', e => {
        handleSearch(e.target.value.trim());
    });

    // --- Popstate ---
    window.addEventListener('popstate', () => {
        const pathname = window.location.pathname;
        const tagMatch = pathname.match(/\/tag\/([^/]+)\//);
        const pageMatch = pathname.match(/\/page\/(\d+)\//);

        currentFilter = tagMatch ? tagMatch[1] : '';
        currentPage = pageMatch ? parseInt(pageMatch[1]) : 1;

        const params = new URLSearchParams(window.location.search);
        currentSearch = params.get('search') || '';

        document.getElementById('post-search').value = currentSearch;
        document.querySelectorAll('.posts-tabs .tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === currentFilter);
        });

        fetchPosts(currentPage, currentSearch);
        updateTitle();
    });

    // --- Initial load ---
    document.addEventListener('DOMContentLoaded', () => {
        const pathname = window.location.pathname;
        const tagMatch = pathname.match(/\/tag\/([^/]+)\//);
        const pageMatch = pathname.match(/\/page\/(\d+)\//);

        if (tagMatch) currentFilter = tagMatch[1];
        currentPage = pageMatch ? parseInt(pageMatch[1]) : 1;

        const params = new URLSearchParams(window.location.search);
        currentSearch = params.get('search') || '';

        document.getElementById('post-search').value = currentSearch;

        document.querySelectorAll('.posts-tabs .tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === currentFilter);
        });

        fetchPosts(currentPage, currentSearch);
    });
