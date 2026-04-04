/* ============================================
   SORA JAPAN – News Public Page Logic
   Depends on: js/news-config.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page; // 'news-list' or 'news-detail'

  if (page === 'news-list') initNewsList();
  if (page === 'news-detail') initNewsDetail();
});

/* ─── NEWS LIST PAGE ─── */

let currentPage = 1;
let currentCategory = '';
let categoriesData = [];

async function initNewsList() {
  // Load categories for filter
  loadCategories();
  // Load featured post
  loadFeatured();
  // Load posts
  loadPosts();
}

async function loadCategories() {
  try {
    const res = await fetchAPI({ action: 'getCategories' });
    if (res.status === 'success') {
      categoriesData = res.categories;
      renderCategoryFilter(res.categories);
    }
  } catch (e) {
    console.error('Failed to load categories:', e);
  }
}

function renderCategoryFilter(categories) {
  const container = document.getElementById('category-filter');
  if (!container) return;

  let html = '<button class="active" data-category="">Tất cả</button>';
  categories.forEach(cat => {
    html += `<button data-category="${cat.slug}" data-color="${cat.color}">${cat.name}</button>`;
  });
  container.innerHTML = html;

  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      currentPage = 1;
      loadPosts();
    });
  });
}

async function loadFeatured() {
  try {
    const res = await fetchAPI({ action: 'getPosts', featured: 'true', limit: '1', status: 'published' });
    if (res.status === 'success' && res.posts.length > 0) {
      renderFeatured(res.posts[0]);
    }
  } catch (e) {
    console.error('Failed to load featured:', e);
  }
}

function renderFeatured(post) {
  const container = document.getElementById('featured-post');
  if (!container) return;

  const cat = categoriesData.find(c => c.slug === post.category);
  const catColor = cat ? cat.color : 'var(--color-primary)';
  const catName = cat ? cat.name : post.category;
  const thumbnail = post.thumbnail || 'images/hero-bg.png';

  container.innerHTML = `
    <img src="${thumbnail}" alt="${post.title}" class="featured-post-img" loading="lazy"
         onerror="this.src='images/hero-bg.png'">
    <div class="featured-post-body">
      <span class="category-badge" style="background:${catColor}">${catName}</span>
      <h2><a href="tin-tuc-detail.html?slug=${post.slug}">${post.title}</a></h2>
      <p class="excerpt">${post.excerpt || ''}</p>
      <div class="post-meta">
        ${formatDate(post.publishedAt || post.createdAt)} · ${post.author || 'Sora Japan'}
      </div>
    </div>
  `;
}

async function loadPosts() {
  const container = document.getElementById('posts-grid');
  if (!container) return;

  // Show skeletons
  container.innerHTML = Array(6).fill('<div class="skeleton skeleton-card"></div>').join('');

  try {
    const res = await fetchAPI({
      action: 'getPosts',
      page: currentPage,
      limit: NEWS_CONFIG.POSTS_PER_PAGE,
      category: currentCategory,
      status: 'published'
    });

    if (res.status === 'success') {
      if (res.posts.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
            <h3>Chưa có bài viết</h3>
            <p>Chưa có bài viết nào trong danh mục này.</p>
          </div>`;
      } else {
        renderPosts(res.posts);
      }
      renderPagination(res.pagination);
    }
  } catch (e) {
    console.error('Failed to load posts:', e);
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <h3>Không thể tải bài viết</h3>
        <p>Vui lòng thử lại sau.</p>
      </div>`;
  }
}

function renderPosts(posts) {
  const container = document.getElementById('posts-grid');
  if (!container) return;

  container.innerHTML = posts.map(post => {
    const cat = categoriesData.find(c => c.slug === post.category);
    const catColor = cat ? cat.color : 'var(--color-primary)';
    const catName = cat ? cat.name : post.category;
    const thumbnail = post.thumbnail || 'images/hero-bg.png';

    return `
      <article class="post-card">
        <a href="tin-tuc-detail.html?slug=${post.slug}">
          <img src="${thumbnail}" alt="${post.title}" class="post-card-img" loading="lazy"
               onerror="this.src='images/hero-bg.png'">
        </a>
        <div class="post-card-body">
          <span class="category-badge" style="background:${catColor}">${catName}</span>
          <h3><a href="tin-tuc-detail.html?slug=${post.slug}">${post.title}</a></h3>
          <p class="excerpt">${truncate(post.excerpt || '', 120)}</p>
          <div class="post-meta">
            <span>${formatDate(post.publishedAt || post.createdAt)}</span>
            <span class="post-meta-views">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              ${post.viewCount || 0}
            </span>
          </div>
        </div>
      </article>`;
  }).join('');
}

function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (!container || pagination.totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  const { page, totalPages } = pagination;
  let html = '';

  html += `<button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">&laquo;</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += `<button disabled>...</button>`;
    }
  }

  html += `<button ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">&raquo;</button>`;

  container.innerHTML = html;

  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page);
      if (p >= 1 && p <= totalPages) {
        currentPage = p;
        loadPosts();
        window.scrollTo({ top: document.getElementById('posts-grid').offsetTop - 120, behavior: 'smooth' });
      }
    });
  });
}

/* ─── NEWS DETAIL PAGE ─── */

async function initNewsDetail() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    showDetailError('Bài viết không tồn tại');
    return;
  }

  // Show loading
  const mainEl = document.getElementById('article-main');
  if (mainEl) mainEl.innerHTML = '<div class="news-loading"><div class="spinner"></div></div>';

  try {
    const [postRes, catRes] = await Promise.all([
      fetchAPI({ action: 'getPost', slug }),
      fetchAPI({ action: 'getCategories' })
    ]);

    if (catRes.status === 'success') categoriesData = catRes.categories;

    if (postRes.status === 'success' && postRes.post) {
      renderDetail(postRes.post);
      renderRelated(postRes.related || []);
      loadSidebar(postRes.post);

      // Update page title
      document.title = postRes.post.title + ' | Sora Japan';
      // Update meta
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', postRes.post.excerpt || '');
    } else {
      showDetailError('Bài viết không tồn tại hoặc đã bị xóa');
    }
  } catch (e) {
    console.error('Failed to load post:', e);
    showDetailError('Không thể tải bài viết. Vui lòng thử lại sau.');
  }
}

function renderDetail(post) {
  const mainEl = document.getElementById('article-main');
  if (!mainEl) return;

  const cat = categoriesData.find(c => c.slug === post.category);
  const catColor = cat ? cat.color : 'var(--color-primary)';
  const catName = cat ? cat.name : post.category;

  const tags = (post.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const tagsHtml = tags.length > 0
    ? `<div class="article-tags">${tags.map(t =>
        `<a href="tin-tuc.html?tag=${encodeURIComponent(t)}" class="tag">#${t}</a>`
      ).join('')}</div>`
    : '';

  const thumbnailHtml = post.thumbnail
    ? `<img src="${post.thumbnail}" alt="${post.title}" class="article-thumbnail" loading="lazy">`
    : '';

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(post.title);

  mainEl.innerHTML = `
    <span class="category-badge" style="background:${catColor}">${catName}</span>
    <h1>${post.title}</h1>
    <div class="article-meta">
      <span class="article-meta-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${formatDate(post.publishedAt || post.createdAt)}
      </span>
      <span class="article-meta-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ${post.author || 'Sora Japan'}
      </span>
      <span class="article-meta-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        ${post.viewCount || 0} lượt xem
      </span>
    </div>
    ${thumbnailHtml}
    <div class="article-content">${post.content || ''}</div>
    ${tagsHtml}
    <div class="share-buttons">
      <span>Chia sẻ:</span>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" class="share-btn fb" title="Chia sẻ Facebook">f</a>
      <a href="https://zalo.me/share?url=${shareUrl}&title=${shareTitle}" target="_blank" class="share-btn zalo" title="Chia sẻ Zalo">Z</a>
      <button class="share-btn copy" title="Copy link" onclick="copyLink()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
    </div>
  `;

  // Update breadcrumb
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  if (breadcrumbTitle) breadcrumbTitle.textContent = truncate(post.title, 50);
}

function renderRelated(posts) {
  const container = document.getElementById('related-posts');
  if (!container || posts.length === 0) return;

  const section = container.closest('.related-section');
  if (section) section.style.display = '';

  container.innerHTML = posts.map(post => {
    const cat = categoriesData.find(c => c.slug === post.category);
    const catColor = cat ? cat.color : 'var(--color-primary)';
    const catName = cat ? cat.name : post.category;
    const thumbnail = post.thumbnail || 'images/hero-bg.png';

    return `
      <article class="post-card">
        <a href="tin-tuc-detail.html?slug=${post.slug}">
          <img src="${thumbnail}" alt="${post.title}" class="post-card-img" loading="lazy"
               onerror="this.src='images/hero-bg.png'">
        </a>
        <div class="post-card-body">
          <span class="category-badge" style="background:${catColor}">${catName}</span>
          <h3><a href="tin-tuc-detail.html?slug=${post.slug}">${post.title}</a></h3>
          <div class="post-meta">
            <span>${formatDate(post.publishedAt || post.createdAt)}</span>
          </div>
        </div>
      </article>`;
  }).join('');
}

async function loadSidebar(currentPost) {
  // Recent posts
  try {
    const res = await fetchAPI({ action: 'getPosts', limit: '5', status: 'published' });
    if (res.status === 'success') {
      const recent = res.posts.filter(p => p.slug !== currentPost.slug).slice(0, 4);
      const container = document.getElementById('sidebar-recent');
      if (container) {
        container.innerHTML = recent.map(p => {
          const thumbnail = p.thumbnail || 'images/hero-bg.png';
          return `
            <a href="tin-tuc-detail.html?slug=${p.slug}" class="sidebar-post">
              <img src="${thumbnail}" alt="" class="sidebar-post-img" loading="lazy"
                   onerror="this.src='images/hero-bg.png'">
              <div class="sidebar-post-info">
                <h4>${truncate(p.title, 60)}</h4>
                <span class="date">${formatDate(p.publishedAt || p.createdAt)}</span>
              </div>
            </a>`;
        }).join('');
      }
    }
  } catch (e) {
    console.error('Sidebar recent posts error:', e);
  }

  // Categories
  const catContainer = document.getElementById('sidebar-categories');
  if (catContainer && categoriesData.length > 0) {
    catContainer.innerHTML = categoriesData.map(cat =>
      `<li><a href="tin-tuc.html?category=${cat.slug}">${cat.name}</a></li>`
    ).join('');
  }
}

function showDetailError(msg) {
  const mainEl = document.getElementById('article-main');
  if (mainEl) {
    mainEl.innerHTML = `
      <div class="empty-state">
        <h3>${msg}</h3>
        <p style="margin-top:12px;"><a href="tin-tuc.html" style="color:var(--color-primary);">Quay lại trang tin tức</a></p>
      </div>`;
  }
}

/* Copy link */
function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.querySelector('.share-btn.copy');
    if (btn) {
      btn.title = 'Copied!';
      setTimeout(() => btn.title = 'Copy link', 2000);
    }
  });
}
