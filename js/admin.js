/* ============================================
   SORA JAPAN – Admin CMS Logic
   Depends on: js/news-config.js
   ============================================ */

let adminPassword = '';
let quillEditor = null;
let categoriesCache = [];
let editingPostId = null;

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('admin_pw');
  if (saved) {
    adminPassword = saved;
    showAdmin();
  } else {
    showLogin();
  }
});

/* ─── AUTH ─── */
function showLogin() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('admin-app').style.display = 'none';
}

function showAdmin() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('admin-app').style.display = 'flex';
  navigateTo('dashboard');
  loadCategoriesCache();
}

async function doLogin() {
  const pw = document.getElementById('login-password').value.trim();
  const errEl = document.getElementById('login-error');

  if (!pw) { errEl.textContent = 'Vui lòng nhập mật khẩu'; errEl.style.display = 'block'; return; }

  errEl.style.display = 'none';
  try {
    const res = await postAPI({ action: 'login', password: pw });
    if (res.status === 'success') {
      adminPassword = pw;
      sessionStorage.setItem('admin_pw', pw);
      showAdmin();
    } else {
      errEl.textContent = res.error || 'Sai mật khẩu';
      errEl.style.display = 'block';
    }
  } catch (e) {
    console.error('Login error:', e);
    errEl.textContent = 'Lỗi kết nối server: ' + e.message;
    errEl.style.display = 'block';
  }
}

function doLogout() {
  adminPassword = '';
  sessionStorage.removeItem('admin_pw');
  showLogin();
}

/* ─── NAVIGATION ─── */
function navigateTo(page, data) {
  // Update sidebar active
  document.querySelectorAll('.admin-sidebar a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  const main = document.getElementById('admin-content');

  switch (page) {
    case 'dashboard': renderDashboard(main); break;
    case 'posts': renderPostsList(main); break;
    case 'post-form': renderPostForm(main, data); break;
    case 'categories': renderCategories(main); break;
    case 'media': renderMedia(main); break;
    case 'settings': renderSettings(main); break;
  }
}

/* ─── DASHBOARD ─── */
async function renderDashboard(el) {
  el.innerHTML = `
    <div class="admin-page-header"><h2>Dashboard</h2></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="label">Tổng bài viết</div><div class="value" id="stat-total">-</div></div>
      <div class="stat-card"><div class="label">Đã xuất bản</div><div class="value" id="stat-published" style="color:#10b981">-</div></div>
      <div class="stat-card"><div class="label">Bản nháp</div><div class="value" id="stat-draft" style="color:#f59e0b">-</div></div>
      <div class="stat-card"><div class="label">Tổng lượt xem</div><div class="value" id="stat-views" style="color:#0ea5e9">-</div></div>
    </div>
    <div class="admin-card">
      <div class="admin-card-header"><h3>Bài viết gần nhất</h3></div>
      <div id="recent-posts-table">Đang tải...</div>
    </div>`;

  try {
    const res = await fetchAPI({ action: 'getStats', password: adminPassword });
    if (res.status === 'success') {
      const s = res.stats;
      document.getElementById('stat-total').textContent = s.totalPosts;
      document.getElementById('stat-published').textContent = s.published;
      document.getElementById('stat-draft').textContent = s.draft;
      document.getElementById('stat-views').textContent = s.totalViews.toLocaleString();

      let tableHtml = '<table class="admin-table"><thead><tr><th>Tiêu đề</th><th>Trạng thái</th><th>Ngày tạo</th><th>Lượt xem</th></tr></thead><tbody>';
      (s.recentPosts || []).forEach(p => {
        tableHtml += `<tr>
          <td>${p.title}</td>
          <td><span class="status-badge status-${p.status}">${p.status}</span></td>
          <td>${formatDate(p.createdAt)}</td>
          <td>${p.viewCount || 0}</td>
        </tr>`;
      });
      tableHtml += '</tbody></table>';
      document.getElementById('recent-posts-table').innerHTML = tableHtml;
    }
  } catch (e) {
    console.error(e);
  }
}

/* ─── POSTS LIST ─── */
async function renderPostsList(el) {
  el.innerHTML = `
    <div class="admin-page-header">
      <h2>Quản lý bài viết</h2>
      <button class="admin-btn admin-btn-primary" onclick="navigateTo('post-form')">+ Thêm bài viết</button>
    </div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div style="display:flex;gap:10px;align-items:center;">
          <select id="filter-status" class="admin-search" style="width:140px;" onchange="filterPosts()">
            <option value="all">Tất cả</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
            <option value="archived">Đã xóa</option>
          </select>
          <select id="filter-category" class="admin-search" style="width:160px;" onchange="filterPosts()">
            <option value="">Tất cả danh mục</option>
          </select>
        </div>
        <input type="text" class="admin-search" placeholder="Tìm kiếm tiêu đề..." id="search-posts" oninput="filterPosts()">
      </div>
      <div id="posts-table-container">Đang tải...</div>
    </div>`;

  // Populate category filter
  const catSelect = document.getElementById('filter-category');
  categoriesCache.forEach(c => {
    catSelect.innerHTML += `<option value="${c.slug}">${c.name}</option>`;
  });

  filterPosts();
}

async function filterPosts() {
  const status = document.getElementById('filter-status')?.value || 'all';
  const category = document.getElementById('filter-category')?.value || '';
  const search = document.getElementById('search-posts')?.value || '';

  try {
    const res = await fetchAPI({
      action: 'getPosts', status, category, search, limit: '50', page: '1'
    });

    if (res.status === 'success') {
      let html = '<table class="admin-table"><thead><tr><th>Tiêu đề</th><th>Danh mục</th><th>Trạng thái</th><th>Ngày</th><th>Lượt xem</th><th>Thao tác</th></tr></thead><tbody>';
      if (res.posts.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px;">Không có bài viết nào</td></tr>';
      }
      res.posts.forEach(p => {
        const cat = categoriesCache.find(c => c.slug === p.category);
        const catName = cat ? cat.name : p.category;
        html += `<tr>
          <td style="max-width:300px;"><strong>${p.title}</strong></td>
          <td>${catName}</td>
          <td><span class="status-badge status-${p.status}">${p.status}</span></td>
          <td>${formatDate(p.publishedAt || p.createdAt)}</td>
          <td>${p.viewCount || 0}</td>
          <td class="actions-cell">
            <button class="admin-btn admin-btn-sm" onclick="editPost('${p.id}','${p.slug}')">Sửa</button>
            ${p.status !== 'archived' ? `<button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deletePost('${p.id}')">Xóa</button>` : ''}
          </td>
        </tr>`;
      });
      html += '</tbody></table>';
      document.getElementById('posts-table-container').innerHTML = html;
    }
  } catch (e) {
    document.getElementById('posts-table-container').innerHTML = '<p style="padding:20px;color:#ef4444;">Lỗi tải dữ liệu</p>';
  }
}

async function editPost(id, slug) {
  try {
    const res = await fetchAPI({ action: 'getPost', slug });
    if (res.status === 'success') {
      navigateTo('post-form', res.post);
    }
  } catch (e) {
    toast('Lỗi tải bài viết', 'error');
  }
}

async function deletePost(id) {
  if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
  try {
    const res = await postAPI({ action: 'deletePost', id, password: adminPassword });
    if (res.status === 'success') {
      toast('Đã xóa bài viết');
      filterPosts();
    } else {
      toast(res.error || 'Lỗi xóa bài', 'error');
    }
  } catch (e) {
    toast('Lỗi kết nối', 'error');
  }
}

/* ─── POST FORM ─── */
function renderPostForm(el, post) {
  editingPostId = post ? post.id : null;
  const isEdit = !!post;

  el.innerHTML = `
    <div class="admin-page-header">
      <h2>${isEdit ? 'Sửa bài viết' : 'Thêm bài viết mới'}</h2>
      <button class="admin-btn" onclick="navigateTo('posts')">← Quay lại</button>
    </div>
    <div class="admin-form">
      <div class="form-group">
        <label>Tiêu đề *</label>
        <input type="text" id="post-title" value="${post ? escHtml(post.title) : ''}" placeholder="Nhập tiêu đề bài viết...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Danh mục *</label>
          <select id="post-category">
            <option value="">Chọn danh mục</option>
            ${categoriesCache.map(c => `<option value="${c.slug}" ${post && post.category === c.slug ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Tags (phân cách bằng dấu phẩy)</label>
          <input type="text" id="post-tags" value="${post ? escHtml(post.tags || '') : ''}" placeholder="vd: du học, visa, nhật bản">
        </div>
      </div>
      <div class="form-group">
        <label>Ảnh đại diện</label>
        <div class="upload-area ${post && post.thumbnail ? 'has-image' : ''}" id="thumbnail-area" onclick="document.getElementById('thumbnail-input').click()">
          ${post && post.thumbnail
            ? `<img src="${post.thumbnail}" id="thumbnail-preview">`
            : '<p style="color:#94a3b8;">Nhấn để chọn ảnh hoặc kéo thả vào đây</p><p class="upload-hint">JPG, PNG < 2MB</p>'}
        </div>
        <input type="file" id="thumbnail-input" accept="image/*" style="display:none" onchange="handleThumbnailUpload(this)">
        <input type="hidden" id="post-thumbnail" value="${post ? (post.thumbnail || '') : ''}">
      </div>
      <div class="form-group">
        <label>Tóm tắt</label>
        <textarea id="post-excerpt" rows="3" placeholder="Tóm tắt ngắn gọn nội dung bài viết (150-200 ký tự)...">${post ? escHtml(post.excerpt || '') : ''}</textarea>
      </div>
      <div class="form-group">
        <label>Nội dung bài viết *</label>
        <div id="quill-editor"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Trạng thái</label>
          <select id="post-status">
            <option value="draft" ${post && post.status === 'draft' ? 'selected' : ''}>Bản nháp</option>
            <option value="published" ${post && post.status === 'published' ? 'selected' : ''}>Xuất bản</option>
          </select>
        </div>
        <div class="form-group">
          <label>Bài nổi bật</label>
          <div class="toggle-group">
            <div class="toggle ${post && (post.featured === true || post.featured === 'TRUE') ? 'active' : ''}" id="post-featured" onclick="this.classList.toggle('active')"></div>
            <span style="font-size:0.85rem;color:#64748b;">Hiển thị ở vị trí nổi bật</span>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="admin-btn admin-btn-primary" onclick="savePost()" id="save-btn">${isEdit ? 'Cập nhật' : 'Lưu bài viết'}</button>
        <button class="admin-btn" onclick="navigateTo('posts')">Hủy</button>
      </div>
    </div>`;

  // Init Quill
  setTimeout(() => {
    quillEditor = new Quill('#quill-editor', {
      theme: 'snow',
      placeholder: 'Viết nội dung bài viết tại đây...',
      modules: {
        toolbar: {
          container: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'link', 'image'],
            ['clean']
          ],
          handlers: {
            image: function () {
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'image/*');
              input.click();
              input.onchange = async () => {
                const file = input.files[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) { toast('Ảnh phải nhỏ hơn 2MB', 'error'); return; }
                const reader = new FileReader();
                reader.onload = async () => {
                  const base64 = reader.result.split(',')[1];
                  try {
                    const res = await postAPI({
                      action: 'uploadImage', password: adminPassword,
                      base64, filename: file.name, mimeType: file.type
                    });
                    if (res.status === 'success') {
                      const range = quillEditor.getSelection(true);
                      quillEditor.insertEmbed(range.index, 'image', res.url);
                      quillEditor.setSelection(range.index + 1);
                      toast('Chèn ảnh thành công');
                    } else {
                      toast(res.error || 'Upload thất bại', 'error');
                    }
                  } catch (e) { toast('Lỗi upload ảnh', 'error'); }
                };
                reader.readAsDataURL(file);
              };
            }
          }
        }
      }
    });

    // Allow paste/drop HTML tables into Quill — preserve table markup
    quillEditor.root.addEventListener('paste', (e) => {
      const html = e.clipboardData.getData('text/html');
      if (html && html.includes('<table')) {
        e.preventDefault();
        const range = quillEditor.getSelection(true);
        quillEditor.clipboard.dangerouslyPasteHTML(range.index, html);
      }
    });

    if (post && post.content) {
      quillEditor.root.innerHTML = post.content;
    }
  }, 100);

  // Drag & drop for thumbnail area
  setTimeout(() => {
    const area = document.getElementById('thumbnail-area');
    if (!area) return;

    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      area.classList.add('dragover');
    });
    area.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      area.classList.remove('dragover');
    });
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      area.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) {
        toast('Vui lòng kéo thả file ảnh', 'error');
        return;
      }
      // Reuse handleThumbnailUpload by creating a fake input
      const dt = new DataTransfer();
      dt.items.add(file);
      const fakeInput = document.createElement('input');
      fakeInput.type = 'file';
      fakeInput.files = dt.files;
      handleThumbnailUpload(fakeInput);
    });
  }, 150);
}

async function savePost() {
  const title = document.getElementById('post-title').value.trim();
  const category = document.getElementById('post-category').value;
  const tags = document.getElementById('post-tags').value.trim();
  const excerpt = document.getElementById('post-excerpt').value.trim();
  const content = quillEditor ? quillEditor.root.innerHTML : '';
  const thumbnail = document.getElementById('post-thumbnail').value;
  const status = document.getElementById('post-status').value;
  const featured = document.getElementById('post-featured').classList.contains('active');

  if (!title) { toast('Vui lòng nhập tiêu đề', 'error'); return; }
  if (!category) { toast('Vui lòng chọn danh mục', 'error'); return; }

  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = 'Đang lưu...';

  const payload = {
    action: editingPostId ? 'updatePost' : 'createPost',
    password: adminPassword,
    title, category, tags, excerpt, content, thumbnail, status, featured
  };
  if (editingPostId) payload.id = editingPostId;

  try {
    const res = await postAPI(payload);
    if (res.status === 'success') {
      toast(editingPostId ? 'Bài viết đã cập nhật' : 'Bài viết đã tạo thành công');
      navigateTo('posts');
    } else {
      toast(res.error || 'Lỗi lưu bài viết', 'error');
    }
  } catch (e) {
    toast('Lỗi kết nối server', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = editingPostId ? 'Cập nhật' : 'Lưu bài viết';
  }
}

async function handleThumbnailUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Ảnh phải nhỏ hơn 2MB', 'error'); return; }

  const area = document.getElementById('thumbnail-area');
  area.innerHTML = '<p style="color:#0ea5e9;">Đang upload...</p>';

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1];
    try {
      const res = await postAPI({
        action: 'uploadImage',
        password: adminPassword,
        base64,
        filename: file.name,
        mimeType: file.type
      });
      if (res.status === 'success') {
        document.getElementById('post-thumbnail').value = res.url;
        area.classList.add('has-image');
        area.innerHTML = `<img src="${res.url}" id="thumbnail-preview">`;
        toast('Upload thành công');
      } else {
        area.innerHTML = '<p style="color:#ef4444;">Upload thất bại. Thử lại.</p>';
        toast(res.error || 'Upload thất bại', 'error');
      }
    } catch (e) {
      area.innerHTML = '<p style="color:#ef4444;">Lỗi kết nối</p>';
      toast('Lỗi kết nối', 'error');
    }
  };
  reader.readAsDataURL(file);
}

/* ─── CATEGORIES ─── */
async function renderCategories(el) {
  el.innerHTML = `
    <div class="admin-page-header">
      <h2>Quản lý danh mục</h2>
      <button class="admin-btn admin-btn-primary" onclick="showCategoryForm()">+ Thêm danh mục</button>
    </div>
    <div id="category-form-area"></div>
    <div class="admin-card" id="categories-list">Đang tải...</div>`;

  await refreshCategories();
}

async function refreshCategories() {
  await loadCategoriesCache();
  const container = document.getElementById('categories-list');
  if (!container) return;

  if (categoriesCache.length === 0) {
    container.innerHTML = '<p style="padding:40px;text-align:center;color:#94a3b8;">Chưa có danh mục nào</p>';
    return;
  }

  container.innerHTML = categoriesCache.map(c => `
    <div class="category-list-item">
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="category-color-dot" style="background:${c.color}"></span>
        <strong>${c.name}</strong>
        <span style="color:#94a3b8;font-size:0.85rem;">(${c.slug})</span>
      </div>
      <div class="actions-cell">
        <button class="admin-btn admin-btn-sm" onclick="showCategoryForm('${c.id}','${escHtml(c.name)}','${c.slug}','${escHtml(c.description || '')}','${c.color}',${c.order})">Sửa</button>
        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteCategory('${c.id}')">Xóa</button>
      </div>
    </div>`).join('');
}

function showCategoryForm(id, name, slug, desc, color, order) {
  const area = document.getElementById('category-form-area');
  area.innerHTML = `
    <div class="admin-form" style="margin-bottom:20px;">
      <div class="form-row">
        <div class="form-group"><label>Tên</label><input id="cat-name" value="${name||''}"></div>
        <div class="form-group"><label>Slug</label><input id="cat-slug" value="${slug||''}" placeholder="Tự động tạo nếu để trống"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Màu</label><input type="color" id="cat-color" value="${color||'#0EA5E9'}" style="height:42px;"></div>
        <div class="form-group"><label>Thứ tự</label><input type="number" id="cat-order" value="${order||0}"></div>
      </div>
      <div class="form-group"><label>Mô tả</label><input id="cat-desc" value="${desc||''}"></div>
      <div class="form-actions">
        <button class="admin-btn admin-btn-primary" onclick="saveCategory('${id||''}')">${id?'Cập nhật':'Thêm'}</button>
        <button class="admin-btn" onclick="document.getElementById('category-form-area').innerHTML=''">Hủy</button>
      </div>
    </div>`;
}

async function saveCategory(id) {
  const data = {
    action: id ? 'updateCategory' : 'createCategory',
    password: adminPassword,
    name: document.getElementById('cat-name').value.trim(),
    slug: document.getElementById('cat-slug').value.trim(),
    color: document.getElementById('cat-color').value,
    order: parseInt(document.getElementById('cat-order').value) || 0,
    description: document.getElementById('cat-desc').value.trim()
  };
  if (id) data.id = id;

  if (!data.name) { toast('Vui lòng nhập tên danh mục', 'error'); return; }

  try {
    const res = await postAPI(data);
    if (res.status === 'success') {
      toast(id ? 'Đã cập nhật' : 'Đã thêm danh mục');
      document.getElementById('category-form-area').innerHTML = '';
      await refreshCategories();
    } else {
      toast(res.error, 'error');
    }
  } catch (e) {
    toast('Lỗi kết nối', 'error');
  }
}

async function deleteCategory(id) {
  if (!confirm('Xóa danh mục này?')) return;
  try {
    const res = await postAPI({ action: 'deleteCategory', id, password: adminPassword });
    if (res.status === 'success') {
      toast('Đã xóa danh mục');
      await refreshCategories();
    }
  } catch (e) {
    toast('Lỗi', 'error');
  }
}

/* ─── MEDIA ─── */
async function renderMedia(el) {
  el.innerHTML = `
    <div class="admin-page-header">
      <h2>Quản lý Media</h2>
      <button class="admin-btn admin-btn-primary" onclick="document.getElementById('media-upload-input').click()">+ Upload ảnh</button>
      <input type="file" id="media-upload-input" accept="image/*" style="display:none" onchange="uploadMediaFile(this)" multiple>
    </div>
    <div class="admin-card">
      <div class="media-grid" id="media-grid">Đang tải...</div>
    </div>`;

  try {
    const res = await fetchAPI({ action: 'getStats', password: adminPassword });
    // Fetch actual media via getPosts or custom — for now show from stats
    // We'll use a simple approach: fetch from the Media sheet via a custom endpoint
    // Since getMedia isn't in doGet router yet, we show a placeholder
    const mediaRes = await fetchAPI({ action: 'getPosts', limit: '50', status: 'all' });
    const grid = document.getElementById('media-grid');

    if (res.status === 'success' && res.stats.mediaCount > 0) {
      grid.innerHTML = '<p style="padding:20px;color:#64748b;text-align:center;">Media được quản lý tự động khi upload ảnh cho bài viết. Số ảnh hiện có: ' + res.stats.mediaCount + '</p>';
    } else {
      grid.innerHTML = '<p style="padding:40px;text-align:center;color:#94a3b8;">Chưa có ảnh nào. Upload ảnh qua form bài viết.</p>';
    }
  } catch (e) {
    document.getElementById('media-grid').innerHTML = '<p style="padding:20px;color:#ef4444;">Lỗi tải media</p>';
  }
}

async function uploadMediaFile(input) {
  const files = input.files;
  for (const file of files) {
    if (file.size > 2 * 1024 * 1024) { toast(`${file.name} quá lớn (>2MB)`, 'error'); continue; }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await postAPI({
          action: 'uploadImage', password: adminPassword,
          base64, filename: file.name, mimeType: file.type
        });
        if (res.status === 'success') toast(`Upload ${file.name} thành công`);
        else toast(`Lỗi upload ${file.name}`, 'error');
      } catch (e) { toast('Lỗi kết nối', 'error'); }
    };
    reader.readAsDataURL(file);
  }
}

/* ─── SETTINGS ─── */
function renderSettings(el) {
  el.innerHTML = `
    <div class="admin-page-header"><h2>Cài đặt</h2></div>
    <div class="admin-form">
      <div class="form-group">
        <label>Đổi mật khẩu admin</label>
        <input type="password" id="new-password" placeholder="Mật khẩu mới">
      </div>
      <div class="form-group">
        <input type="password" id="confirm-password" placeholder="Xác nhận mật khẩu mới">
      </div>
      <button class="admin-btn admin-btn-primary" onclick="changePassword()">Đổi mật khẩu</button>
    </div>`;
}

async function changePassword() {
  const newPw = document.getElementById('new-password').value.trim();
  const confirmPw = document.getElementById('confirm-password').value.trim();
  if (!newPw) { toast('Nhập mật khẩu mới', 'error'); return; }
  if (newPw !== confirmPw) { toast('Mật khẩu không khớp', 'error'); return; }

  try {
    const res = await postAPI({
      action: 'updateConfig', password: adminPassword,
      key: 'admin_password', value: newPw
    });
    if (res.status === 'success') {
      adminPassword = newPw;
      sessionStorage.setItem('admin_pw', newPw);
      toast('Đã đổi mật khẩu');
    } else {
      toast(res.error, 'error');
    }
  } catch (e) {
    toast('Lỗi kết nối', 'error');
  }
}

/* ─── HELPERS ─── */
async function loadCategoriesCache() {
  try {
    const res = await fetchAPI({ action: 'getCategories' });
    if (res.status === 'success') categoriesCache = res.categories;
  } catch (e) { console.error(e); }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
