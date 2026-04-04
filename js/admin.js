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
    case 'jobs': renderJobsList(main); break;
    case 'job-form': renderJobForm(main, data); break;
    case 'contacts': renderContactsList(main); break;
    case 'contact-detail': renderContactDetail(main, data); break;
    case 'media': renderMedia(main); break;
    case 'settings': renderSettings(main); break;
  }
}

/* ─── DASHBOARD ─── */
async function renderDashboard(el) {
  el.innerHTML = `
    <div class="admin-page-header"><h2>Dashboard</h2></div>

    <h3 style="margin:0 0 10px;font-size:1rem;color:#64748b;">Bài viết</h3>
    <div class="stats-grid">
      <div class="stat-card"><div class="label">Tổng bài viết</div><div class="value" id="stat-total">-</div></div>
      <div class="stat-card"><div class="label">Đã xuất bản</div><div class="value" id="stat-published" style="color:#10b981">-</div></div>
      <div class="stat-card"><div class="label">Bản nháp</div><div class="value" id="stat-draft" style="color:#f59e0b">-</div></div>
      <div class="stat-card"><div class="label">Tổng lượt xem</div><div class="value" id="stat-views" style="color:#0ea5e9">-</div></div>
    </div>

    <h3 style="margin:20px 0 10px;font-size:1rem;color:#64748b;">Tuyển dụng</h3>
    <div class="stats-grid">
      <div class="stat-card"><div class="label">Tổng đơn hàng</div><div class="value" id="stat-jobs-total">-</div></div>
      <div class="stat-card"><div class="label">Đang tuyển</div><div class="value" id="stat-jobs-active" style="color:#10b981">-</div></div>
    </div>
    <div id="jobs-by-nganh" style="margin-top:12px;"></div>

    <h3 style="margin:20px 0 10px;font-size:1rem;color:#64748b;">Tư vấn (CRM)</h3>
    <div class="stats-grid">
      <div class="stat-card"><div class="label">Tổng lượt gửi</div><div class="value" id="stat-contacts-total" style="color:#8b5cf6">-</div></div>
      <div id="contact-monthly" class="stat-card" style="grid-column:span 3;padding:0;"></div>
    </div>
    <div id="dashboard-pipeline" style="margin-top:12px;"></div>

    <div class="admin-card" style="margin-top:20px;">
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
      document.getElementById('stat-jobs-total').textContent = s.totalJobs || 0;
      document.getElementById('stat-jobs-active').textContent = s.activeJobs || 0;
      document.getElementById('stat-contacts-total').textContent = s.totalContacts || 0;

      // Jobs by Nganh breakdown
      const nganhLabels = { CNTT: 'CNTT', 'CơKhi': 'Cơ khí', Dien: 'Điện', KinhTe: 'Kinh tế', XayDung: 'Xây dựng', NongNghiep: 'Nông nghiệp', ThucPham: 'Thực phẩm', Khac: 'Khác' };
      const jbn = s.jobsByNganh || {};
      if (Object.keys(jbn).length > 0) {
        let nganhHtml = '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
        Object.entries(jbn).forEach(([k, v]) => {
          nganhHtml += `<span style="background:#f1f5f9;padding:6px 14px;border-radius:8px;font-size:0.85rem;"><strong>${nganhLabels[k] || k}</strong>: ${v}</span>`;
        });
        nganhHtml += '</div>';
        document.getElementById('jobs-by-nganh').innerHTML = nganhHtml;
      }

      // Contact monthly chart (last 3 months)
      const cs = s.contactStats || [];
      if (cs.length > 0) {
        const maxCount = Math.max(...cs.map(c => c.count), 1);
        let chartHtml = '<div style="padding:16px;"><div style="font-weight:600;margin-bottom:12px;font-size:0.9rem;">Lượt tư vấn 3 tháng gần nhất</div>';
        chartHtml += '<div style="display:flex;align-items:flex-end;gap:16px;height:100px;">';
        cs.forEach(c => {
          const h = Math.max(8, (c.count / maxCount) * 80);
          chartHtml += `<div style="flex:1;text-align:center;">
            <div style="font-weight:700;font-size:1.1rem;margin-bottom:4px;">${c.count}</div>
            <div style="height:${h}px;background:linear-gradient(180deg,#8b5cf6,#a78bfa);border-radius:6px 6px 0 0;"></div>
            <div style="font-size:0.75rem;color:#64748b;margin-top:4px;">${c.label}</div>
          </div>`;
        });
        chartHtml += '</div></div>';
        document.getElementById('contact-monthly').innerHTML = chartHtml;
      }

      // CRM pipeline on dashboard
      const cp = s.contactPipeline || {};
      if (Object.keys(cp).length > 0) {
        const pipelineColors = { 'Mới': '#3b82f6', 'Đã liên hệ': '#f59e0b', 'Đang tư vấn': '#8b5cf6', 'Đã chốt đơn': '#10b981', 'Không tiềm năng': '#94a3b8' };
        const totalC = Object.values(cp).reduce((a, b) => a + b, 0) || 1;
        let pHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
        ['Mới', 'Đã liên hệ', 'Đang tư vấn', 'Đã chốt đơn', 'Không tiềm năng'].forEach(status => {
          const cnt = cp[status] || 0;
          const clr = pipelineColors[status];
          pHtml += `<span style="background:white;border-left:3px solid ${clr};padding:8px 14px;border-radius:8px;font-size:0.85rem;box-shadow:0 1px 2px rgba(0,0,0,0.05);"><strong style="color:${clr};">${cnt}</strong> ${status}</span>`;
        });
        pHtml += '</div>';
        document.getElementById('dashboard-pipeline').innerHTML = pHtml;
      }

      // Recent posts table
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

/* ─── JOBS LIST ─── */
let jobsCache = [];

const JOB_NGANH_OPTIONS = ['CNTT', 'CơKhi', 'Dien', 'KinhTe', 'XayDung', 'NongNghiep', 'ThucPham', 'Khac'];
const JOB_NGANH_LABELS = { CNTT: 'Công nghệ thông tin', 'CơKhi': 'Cơ khí', Dien: 'Điện / Điện tử', KinhTe: 'Kinh tế', XayDung: 'Xây dựng', NongNghiep: 'Nông nghiệp', ThucPham: 'Thực phẩm', Khac: 'Khác' };
const JOB_GIOITINH = ['Nam', 'Nữ', 'Nam/Nữ'];
const JOB_JLPT = ['N1', 'N2', 'N3', 'N4', 'N5', 'Không yêu cầu'];
const JOB_DIADIEM = ['Tokyo', 'Osaka', 'Aichi', 'Gunma', 'Saitama', 'Chiba', 'Kanagawa', 'Fukuoka', 'Hokkaido', 'Khác'];
const JOB_STATUS = ['Active', 'Draft', 'Closed'];

async function renderJobsList(el) {
  el.innerHTML = `
    <div class="admin-page-header">
      <h2>Quản lý Tuyển dụng</h2>
      <button class="admin-btn admin-btn-primary" onclick="navigateTo('job-form')">+ Thêm đơn hàng</button>
    </div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <select id="filter-job-nganh" class="admin-search" style="width:160px;" onchange="filterJobs()">
            <option value="">Tất cả ngành</option>
            ${JOB_NGANH_OPTIONS.map(n => `<option value="${n}">${JOB_NGANH_LABELS[n] || n}</option>`).join('')}
          </select>
          <select id="filter-job-status" class="admin-search" style="width:130px;" onchange="filterJobs()">
            <option value="">Tất cả</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <input type="text" class="admin-search" placeholder="Tìm tiêu đề, mã đơn..." id="search-jobs" oninput="filterJobs()">
      </div>
      <div id="jobs-table-container">Đang tải...</div>
    </div>`;

  await loadJobsList();
}

async function loadJobsList() {
  try {
    const res = await fetchAPI({ action: 'getJobs', password: adminPassword });
    if (res.status === 'success') {
      jobsCache = res.jobs || [];
      filterJobs();
    } else {
      document.getElementById('jobs-table-container').innerHTML = '<p style="padding:20px;color:#ef4444;">Lỗi: ' + (res.error || 'Không tải được') + '</p>';
    }
  } catch (e) {
    document.getElementById('jobs-table-container').innerHTML = '<p style="padding:20px;color:#ef4444;">Lỗi kết nối server</p>';
  }
}

function filterJobs() {
  const nganh = document.getElementById('filter-job-nganh')?.value || '';
  const status = document.getElementById('filter-job-status')?.value || '';
  const search = (document.getElementById('search-jobs')?.value || '').toLowerCase();

  let filtered = jobsCache;
  if (nganh) filtered = filtered.filter(j => j.Nganh === nganh);
  if (status) filtered = filtered.filter(j => j.Status === status);
  if (search) filtered = filtered.filter(j =>
    (j.TieuDe || '').toLowerCase().includes(search) ||
    (j.MaDon || '').toLowerCase().includes(search) ||
    (j.CongTy || '').toLowerCase().includes(search)
  );

  const container = document.getElementById('jobs-table-container');
  if (!container) return;

  let html = `<table class="admin-table"><thead><tr>
    <th>Mã đơn</th><th>Tiêu đề</th><th>Ngành</th><th>Công ty</th><th>SL</th><th>Hạn nộp</th><th>Trạng thái</th><th>Thao tác</th>
  </tr></thead><tbody>`;

  if (filtered.length === 0) {
    html += '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:40px;">Không có đơn hàng nào</td></tr>';
  }

  filtered.forEach(j => {
    const statusClass = j.Status === 'Active' ? 'status-published' : j.Status === 'Draft' ? 'status-draft' : 'status-archived';
    html += `<tr>
      <td><strong>${escHtml(j.MaDon)}</strong></td>
      <td style="max-width:220px;">${escHtml(j.TieuDe)}</td>
      <td>${JOB_NGANH_LABELS[j.Nganh] || j.Nganh}</td>
      <td>${escHtml(j.CongTy)}</td>
      <td>${j.SoLuong || '-'}</td>
      <td>${escHtml(j.HanNop)}</td>
      <td><span class="status-badge ${statusClass}">${j.Status}</span></td>
      <td class="actions-cell">
        <button class="admin-btn admin-btn-sm" onclick="editJob('${j.ID}')">Sửa</button>
        ${j.Status !== 'Closed' ? `<button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteJob('${j.ID}')">Xóa</button>` : ''}
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function editJob(id) {
  const job = jobsCache.find(j => j.ID === id);
  if (job) {
    navigateTo('job-form', job);
  } else {
    toast('Không tìm thấy đơn hàng', 'error');
  }
}

async function deleteJob(id) {
  if (!confirm('Bạn có chắc muốn xóa đơn hàng này?')) return;
  try {
    const res = await postAPI({ action: 'deleteJob', id, password: adminPassword });
    if (res.status === 'success') {
      toast('Đã xóa đơn hàng');
      jobsCache = jobsCache.filter(j => j.ID !== id);
      filterJobs();
    } else {
      toast(res.error || 'Lỗi xóa', 'error');
    }
  } catch (e) {
    toast('Lỗi kết nối', 'error');
  }
}

/* ─── JOB FORM ─── */
let editingJobId = null;

function renderJobForm(el, job) {
  editingJobId = job ? job.ID : null;
  const isEdit = !!job;

  el.innerHTML = `
    <div class="admin-page-header">
      <h2>${isEdit ? 'Sửa đơn hàng' : 'Thêm đơn hàng mới'}</h2>
      <button class="admin-btn" onclick="navigateTo('jobs')">← Quay lại</button>
    </div>
    <div class="admin-form">
      <div class="form-row">
        <div class="form-group">
          <label>Mã đơn hàng</label>
          <input type="text" id="job-madon" value="${job ? escHtml(job.MaDon) : ''}" placeholder="Tự động tạo nếu để trống" ${isEdit ? 'readonly style="background:#f1f5f9;"' : ''}>
        </div>
        <div class="form-group">
          <label>Trạng thái</label>
          <select id="job-status">
            ${JOB_STATUS.map(s => `<option value="${s}" ${job && job.Status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Tiêu đề đơn hàng *</label>
        <input type="text" id="job-tieude" value="${job ? escHtml(job.TieuDe) : ''}" placeholder="VD: Kỹ sư cơ khí làm việc tại Aichi">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Ngành nghề *</label>
          <select id="job-nganh">
            <option value="">Chọn ngành</option>
            ${JOB_NGANH_OPTIONS.map(n => `<option value="${n}" ${job && job.Nganh === n ? 'selected' : ''}>${JOB_NGANH_LABELS[n] || n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Công ty</label>
          <input type="text" id="job-congty" value="${job ? escHtml(job.CongTy) : ''}" placeholder="Tên công ty Nhật">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Số lượng</label>
          <input type="number" id="job-soluong" value="${job ? job.SoLuong || '' : ''}" min="1" placeholder="VD: 10">
        </div>
        <div class="form-group">
          <label>Giới tính</label>
          <select id="job-gioitinh">
            <option value="">Chọn</option>
            ${JOB_GIOITINH.map(g => `<option value="${g}" ${job && job.GioiTinh === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Tuổi từ</label>
          <input type="number" id="job-tuoitu" value="${job ? job.TuoiTu || '' : ''}" min="18" max="55" placeholder="18">
        </div>
        <div class="form-group">
          <label>Tuổi đến</label>
          <input type="number" id="job-tuoiden" value="${job ? job.TuoiDen || '' : ''}" min="18" max="55" placeholder="35">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Trình độ JLPT</label>
          <select id="job-jlpt">
            <option value="">Chọn</option>
            ${JOB_JLPT.map(j => `<option value="${j}" ${job && job.JLPT === j ? 'selected' : ''}>${j}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Kinh nghiệm</label>
          <input type="text" id="job-kinhnghiem" value="${job ? escHtml(job.KinhNghiem) : ''}" placeholder="VD: 1 năm, Không yêu cầu">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Lương (¥/tháng)</label>
          <input type="text" id="job-luong" value="${job ? escHtml(job.Luong) : ''}" placeholder="VD: 180,000 ~ 250,000">
        </div>
        <div class="form-group">
          <label>Địa điểm làm việc</label>
          <select id="job-diadiem">
            <option value="">Chọn</option>
            ${JOB_DIADIEM.map(d => `<option value="${d}" ${job && job.DiaDiem === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Hạn nộp hồ sơ</label>
        <input type="date" id="job-hannop" value="${job && job.HanNop ? formatDateForInput(job.HanNop) : ''}">
      </div>

      <div class="form-group">
        <label>Yêu cầu chi tiết</label>
        <textarea id="job-yeucau" rows="5" placeholder="Mô tả chi tiết yêu cầu công việc, điều kiện...">${job ? escHtml(job.YeuCau) : ''}</textarea>
      </div>

      <div class="form-group">
        <label>Hình ảnh đơn hàng</label>
        <div class="upload-area ${job && job.HinhAnh ? 'has-image' : ''}" id="job-thumb-area" onclick="document.getElementById('job-thumb-input').click()">
          ${job && job.HinhAnh
            ? `<img src="${job.HinhAnh}" id="job-thumb-preview">`
            : '<p style="color:#94a3b8;">Nhấn để chọn ảnh hoặc kéo thả vào đây</p><p class="upload-hint">JPG, PNG < 2MB</p>'}
        </div>
        <input type="file" id="job-thumb-input" accept="image/*" style="display:none" onchange="handleJobImageUpload(this)">
        <input type="hidden" id="job-hinhanh" value="${job ? (job.HinhAnh || '') : ''}">
      </div>

      <div class="form-actions">
        <button class="admin-btn admin-btn-primary" onclick="saveJob()" id="save-job-btn">${isEdit ? 'Cập nhật' : 'Lưu đơn hàng'}</button>
        <button class="admin-btn" onclick="navigateTo('jobs')">Hủy</button>
      </div>
    </div>`;

  // Drag & drop for job thumbnail
  setTimeout(() => {
    const area = document.getElementById('job-thumb-area');
    if (!area) return;
    area.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); area.classList.remove('dragover'); });
    area.addEventListener('drop', (e) => {
      e.preventDefault(); e.stopPropagation(); area.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) { toast('Vui lòng kéo thả file ảnh', 'error'); return; }
      const dt = new DataTransfer(); dt.items.add(file);
      const fakeInput = document.createElement('input'); fakeInput.type = 'file'; fakeInput.files = dt.files;
      handleJobImageUpload(fakeInput);
    });
  }, 150);
}

async function handleJobImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Ảnh phải nhỏ hơn 2MB', 'error'); return; }

  const area = document.getElementById('job-thumb-area');
  area.innerHTML = '<p style="color:#0ea5e9;">Đang upload...</p>';

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1];
    try {
      const res = await postAPI({
        action: 'uploadImage', password: adminPassword,
        base64, filename: file.name, mimeType: file.type
      });
      if (res.status === 'success') {
        document.getElementById('job-hinhanh').value = res.url;
        area.classList.add('has-image');
        area.innerHTML = `<img src="${res.url}" id="job-thumb-preview">`;
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

function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  // Handle dd/mm/yyyy format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  }
  // Handle yyyy-mm-dd format
  if (dateStr.includes('-')) return dateStr.substring(0, 10);
  return '';
}

function formatInputToVN(dateStr) {
  if (!dateStr) return '';
  // Convert yyyy-mm-dd to dd/mm/yyyy
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

async function saveJob() {
  const tieude = document.getElementById('job-tieude').value.trim();
  const nganh = document.getElementById('job-nganh').value;

  if (!tieude) { toast('Vui lòng nhập tiêu đề đơn hàng', 'error'); return; }
  if (!nganh) { toast('Vui lòng chọn ngành nghề', 'error'); return; }

  const btn = document.getElementById('save-job-btn');
  btn.disabled = true;
  btn.textContent = 'Đang lưu...';

  const hannopInput = document.getElementById('job-hannop').value;

  const payload = {
    action: editingJobId ? 'updateJob' : 'createJob',
    password: adminPassword,
    MaDon: document.getElementById('job-madon').value.trim(),
    TieuDe: tieude,
    Nganh: nganh,
    CongTy: document.getElementById('job-congty').value.trim(),
    SoLuong: document.getElementById('job-soluong').value || '',
    GioiTinh: document.getElementById('job-gioitinh').value,
    TuoiTu: document.getElementById('job-tuoitu').value || '',
    TuoiDen: document.getElementById('job-tuoiden').value || '',
    JLPT: document.getElementById('job-jlpt').value,
    KinhNghiem: document.getElementById('job-kinhnghiem').value.trim(),
    Luong: document.getElementById('job-luong').value.trim(),
    DiaDiem: document.getElementById('job-diadiem').value,
    HanNop: hannopInput ? formatInputToVN(hannopInput) : '',
    YeuCau: document.getElementById('job-yeucau').value.trim(),
    HinhAnh: document.getElementById('job-hinhanh').value,
    Status: document.getElementById('job-status').value
  };
  if (editingJobId) payload.id = editingJobId;

  try {
    const res = await postAPI(payload);
    if (res.status === 'success') {
      toast(editingJobId ? 'Đã cập nhật đơn hàng' : 'Đã tạo đơn hàng mới');
      navigateTo('jobs');
    } else {
      toast(res.error || 'Lỗi lưu đơn hàng', 'error');
    }
  } catch (e) {
    toast('Lỗi kết nối server', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = editingJobId ? 'Cập nhật' : 'Lưu đơn hàng';
  }
}

/* ─── CONTACTS CRM ─── */
const CONTACT_STATUSES = ['Mới', 'Đã liên hệ', 'Đang tư vấn', 'Đã chốt đơn', 'Không tiềm năng'];
const CONTACT_STATUS_COLORS = {
  'Mới': '#3b82f6',
  'Đã liên hệ': '#f59e0b',
  'Đang tư vấn': '#8b5cf6',
  'Đã chốt đơn': '#10b981',
  'Không tiềm năng': '#94a3b8'
};

const CHUONG_TRINH_OPTIONS = ['Du học Nhật Bản', 'Kỹ sư', 'Tokutei (KNĐĐ)', 'Thực tập sinh', 'Điều dưỡng', 'Tiếng Nhật', 'Khác'];

let contactsCurrentPage = 1;

async function renderContactsList(el) {
  el.innerHTML = `
    <div class="admin-page-header">
      <h2>Quản lý Tư vấn (CRM)</h2>
    </div>
    <div id="crm-pipeline" style="margin-bottom:20px;"></div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <select id="filter-contact-status" class="admin-search" style="width:150px;" onchange="filterContacts()">
            <option value="">Tất cả trạng thái</option>
            ${CONTACT_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
          <select id="filter-contact-program" class="admin-search" style="width:170px;" onchange="filterContacts()">
            <option value="">Tất cả chương trình</option>
            ${CHUONG_TRINH_OPTIONS.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <input type="text" class="admin-search" placeholder="Tìm tên, SĐT, email..." id="search-contacts" oninput="filterContacts()">
      </div>
      <div id="contacts-table-container">Đang tải...</div>
      <div id="contacts-pagination" style="padding:12px 16px;text-align:center;"></div>
    </div>`;

  filterContacts();
}

async function filterContacts() {
  const status = document.getElementById('filter-contact-status')?.value || '';
  const chuongTrinh = document.getElementById('filter-contact-program')?.value || '';
  const search = document.getElementById('search-contacts')?.value || '';

  try {
    const res = await fetchAPI({
      action: 'getContacts', password: adminPassword,
      page: contactsCurrentPage, limit: 20,
      status, chuongTrinh, search
    });
    if (res.status === 'success') {
      loadContactsTable(res.contacts, res.pagination);
      renderCRMPipeline(res.pipeline);
    }
  } catch (e) {
    document.getElementById('contacts-table-container').innerHTML = '<p style="padding:20px;color:#ef4444;">Lỗi tải dữ liệu</p>';
  }
}

function renderCRMPipeline(pipeline) {
  const el = document.getElementById('crm-pipeline');
  if (!el || !pipeline) return;
  const total = Object.values(pipeline).reduce((s, v) => s + v, 0) || 1;
  let html = '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
  CONTACT_STATUSES.forEach(s => {
    const count = pipeline[s] || 0;
    const color = CONTACT_STATUS_COLORS[s];
    const pct = Math.round(count / total * 100);
    html += `<div style="flex:1;min-width:140px;background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05);border-left:4px solid ${color};">
      <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px;">${s}</div>
      <div style="font-size:1.5rem;font-weight:700;color:${color};">${count}</div>
      <div style="font-size:0.75rem;color:#94a3b8;">${pct}%</div>
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

function loadContactsTable(contacts, pagination) {
  const container = document.getElementById('contacts-table-container');
  if (!contacts || contacts.length === 0) {
    container.innerHTML = '<p style="padding:20px;text-align:center;color:#94a3b8;">Chưa có liên hệ nào</p>';
    return;
  }

  let html = `<table class="admin-table"><thead><tr>
    <th>Thời gian</th><th>Họ tên</th><th>SĐT</th><th>Chương trình</th>
    <th>Trạng thái</th><th>Ghi chú</th><th>Thao tác</th>
  </tr></thead><tbody>`;

  contacts.forEach(c => {
    const color = CONTACT_STATUS_COLORS[c.Status] || '#94a3b8';
    const ts = c.Timestamp ? new Date(c.Timestamp) : null;
    const timeStr = ts ? ts.toLocaleDateString('vi-VN') + ' ' + ts.toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'}) : '';
    const note = c.Note ? (c.Note.length > 40 ? c.Note.substring(0,40) + '...' : c.Note) : '<span style="color:#cbd5e1;">—</span>';

    html += `<tr>
      <td style="font-size:0.8rem;white-space:nowrap;">${timeStr}</td>
      <td><strong>${escHtml(c.HoTen || '')}</strong>${c.Email ? '<br><span style="font-size:0.8rem;color:#64748b;">' + escHtml(c.Email) + '</span>' : ''}</td>
      <td><a href="tel:${c.SDT}" style="color:#0ea5e9;">${escHtml(c.SDT || '')}</a></td>
      <td><span style="font-size:0.85rem;">${escHtml(c.ChuongTrinh || '')}</span></td>
      <td>
        <select onchange="updateContactStatus('${c.ID}', this.value)" style="padding:4px 8px;border-radius:6px;border:2px solid ${color};background:white;font-size:0.8rem;font-weight:600;color:${color};cursor:pointer;">
          ${CONTACT_STATUSES.map(s => `<option value="${s}" ${c.Status === s ? 'selected' : ''} style="color:${CONTACT_STATUS_COLORS[s]}">${s}</option>`).join('')}
        </select>
      </td>
      <td style="font-size:0.85rem;">${note}</td>
      <td style="white-space:nowrap;">
        <button class="admin-btn admin-btn-sm admin-btn-primary" onclick="navigateTo('contact-detail','${c.ID}')" title="Xem/Sửa">✏️ Chi tiết</button>
        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteContactItem('${c.ID}')" title="Xóa">🗑️</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;

  // Pagination
  const pagEl = document.getElementById('contacts-pagination');
  if (pagination && pagination.totalPages > 1) {
    let pagHtml = '';
    for (let i = 1; i <= pagination.totalPages; i++) {
      pagHtml += `<button class="admin-btn admin-btn-sm${i === pagination.page ? ' admin-btn-primary' : ''}" style="margin:0 2px;" onclick="contactsCurrentPage=${i};filterContacts();">${i}</button>`;
    }
    pagEl.innerHTML = pagHtml;
  } else {
    pagEl.innerHTML = '';
  }
}

async function updateContactStatus(id, newStatus) {
  try {
    await postAPI({ action: 'updateContact', password: adminPassword, ID: id, Status: newStatus });
    toast('Cập nhật trạng thái: ' + newStatus);
    filterContacts();
  } catch (e) { toast('Lỗi cập nhật', 'error'); }
}

let editingContactId = null;

async function renderContactDetail(el, contactId) {
  editingContactId = contactId || null;
  el.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;">Đang tải...</div>';

  if (!editingContactId) {
    el.innerHTML = '<p style="padding:20px;color:#ef4444;">Thiếu ID liên hệ</p>';
    return;
  }

  try {
    const res = await fetchAPI({ action: 'getContact', password: adminPassword, id: editingContactId });
    if (res.status !== 'success' || !res.contact) {
      el.innerHTML = `<p style="padding:20px;color:#ef4444;">${res.error || 'Không tìm thấy liên hệ'}</p>`;
      return;
    }
    buildContactDetailUI(el, res.contact);
  } catch (e) {
    el.innerHTML = '<p style="padding:20px;color:#ef4444;">Lỗi tải dữ liệu</p>';
  }
}

function buildContactDetailUI(el, c) {
  const color = CONTACT_STATUS_COLORS[c.Status] || '#94a3b8';
  const ts = c.Timestamp ? new Date(c.Timestamp) : null;
  const timeStr = ts ? ts.toLocaleDateString('vi-VN') + ' ' + ts.toLocaleTimeString('vi-VN') : '';
  const updatedAt = c.UpdatedAt ? new Date(c.UpdatedAt).toLocaleDateString('vi-VN') + ' ' + new Date(c.UpdatedAt).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'}) : '';

  el.innerHTML = `
    <div class="admin-page-header">
      <h2>Chi tiết liên hệ</h2>
      <button class="admin-btn" onclick="navigateTo('contacts')">← Quay lại</button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <!-- LEFT: Customer Info -->
      <div class="admin-card" style="padding:0;">
        <div style="padding:20px;border-bottom:1px solid #e2e8f0;">
          <h3 style="margin:0 0 4px;color:#0c4a6e;">Thông tin khách hàng</h3>
          <div style="font-size:0.8rem;color:#94a3b8;">ID: ${c.ID} &bull; Gửi lúc: ${timeStr}</div>
        </div>
        <div style="padding:20px;">
          <div style="display:grid;gap:16px;">
            <div>
              <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px;">Họ và tên</div>
              <div style="font-size:1.15rem;font-weight:700;">${escHtml(c.HoTen || '')}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px;">Số điện thoại</div>
                <a href="tel:${c.SDT}" style="color:#0ea5e9;font-weight:600;font-size:1.05rem;text-decoration:none;">${escHtml(c.SDT || '')}</a>
              </div>
              <div>
                <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px;">Email</div>
                ${c.Email ? `<a href="mailto:${c.Email}" style="color:#0ea5e9;text-decoration:none;">${escHtml(c.Email)}</a>` : '<span style="color:#cbd5e1;">—</span>'}
              </div>
            </div>
            <div>
              <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px;">Chương trình quan tâm</div>
              <span style="background:#eff6ff;color:#1d4ed8;padding:4px 12px;border-radius:6px;font-weight:600;font-size:0.9rem;">${escHtml(c.ChuongTrinh || 'Chưa chọn')}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: CRM Actions -->
      <div class="admin-card" style="padding:0;">
        <div style="padding:20px;border-bottom:1px solid #e2e8f0;">
          <h3 style="margin:0;color:#0c4a6e;">Quản lý tư vấn</h3>
          ${updatedAt ? `<div style="font-size:0.8rem;color:#94a3b8;margin-top:2px;">Cập nhật lần cuối: ${updatedAt}</div>` : ''}
        </div>
        <div style="padding:20px;">
          <div class="form-group" style="margin-bottom:16px;">
            <label style="font-weight:600;font-size:0.85rem;display:block;margin-bottom:6px;">Trạng thái</label>
            <div id="status-buttons" style="display:flex;flex-wrap:wrap;gap:8px;">
              ${CONTACT_STATUSES.map(s => {
                const clr = CONTACT_STATUS_COLORS[s];
                const active = c.Status === s;
                return `<button onclick="selectContactStatus(this, '${s}')"
                  class="crm-status-btn${active ? ' active' : ''}"
                  style="padding:8px 16px;border-radius:8px;border:2px solid ${clr};background:${active ? clr : 'white'};color:${active ? 'white' : clr};font-weight:600;font-size:0.85rem;cursor:pointer;transition:all 0.15s;"
                  data-status="${s}">${s}</button>`;
              }).join('')}
            </div>
            <input type="hidden" id="cd-status" value="${escHtml(c.Status || 'Mới')}">
          </div>

          <div class="form-group" style="margin-bottom:16px;">
            <label style="font-weight:600;font-size:0.85rem;display:block;margin-bottom:6px;">Người phụ trách (Sale)</label>
            <input type="text" id="cd-assigned" value="${escHtml(c.AssignedTo || '')}" placeholder="Tên sale phụ trách khách này"
              style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.95rem;box-sizing:border-box;">
          </div>

          <div class="form-group" style="margin-bottom:20px;">
            <label style="font-weight:600;font-size:0.85rem;display:block;margin-bottom:6px;">Ghi chú / Mong muốn khách hàng</label>
            <textarea id="cd-note" rows="6" placeholder="VD: Khách muốn du học kỳ tháng 4/2027, cần tư vấn học bổng, đã có N4..."
              style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.95rem;resize:vertical;box-sizing:border-box;line-height:1.5;">${escHtml(c.Note || '')}</textarea>
          </div>

          <div style="display:flex;gap:10px;">
            <button class="admin-btn admin-btn-primary" style="flex:1;padding:12px;" onclick="saveContactDetail('${c.ID}')" id="save-contact-btn">Lưu thay đổi</button>
            <button class="admin-btn" style="padding:12px;" onclick="navigateTo('contacts')">Hủy</button>
          </div>
        </div>
      </div>
    </div>`;
}

function selectContactStatus(btn, status) {
  // Update hidden input
  document.getElementById('cd-status').value = status;
  // Update button styles
  document.querySelectorAll('#status-buttons .crm-status-btn').forEach(b => {
    const s = b.dataset.status;
    const clr = CONTACT_STATUS_COLORS[s];
    if (s === status) {
      b.style.background = clr;
      b.style.color = 'white';
      b.classList.add('active');
    } else {
      b.style.background = 'white';
      b.style.color = clr;
      b.classList.remove('active');
    }
  });
}

async function saveContactDetail(id) {
  const btn = document.getElementById('save-contact-btn');
  btn.textContent = 'Đang lưu...';
  btn.disabled = true;
  try {
    const res = await postAPI({
      action: 'updateContact', password: adminPassword,
      ID: id,
      Status: document.getElementById('cd-status').value,
      AssignedTo: document.getElementById('cd-assigned').value,
      Note: document.getElementById('cd-note').value
    });
    if (res.status === 'success') {
      toast('Đã lưu thay đổi');
      navigateTo('contacts');
    } else {
      toast(res.error || 'Lỗi lưu', 'error');
    }
  } catch (e) { toast('Lỗi kết nối', 'error'); }
  btn.textContent = 'Lưu thay đổi';
  btn.disabled = false;
}

async function deleteContactItem(id) {
  if (!confirm('Xóa liên hệ này?')) return;
  try {
    const res = await postAPI({ action: 'deleteContact', password: adminPassword, id });
    if (res.status === 'success') { toast('Đã xóa'); filterContacts(); }
    else toast(res.error || 'Lỗi xóa', 'error');
  } catch (e) { toast('Lỗi kết nối', 'error'); }
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
