// === CONFIG ===
const API_URL = 'https://script.google.com/macros/s/AKfycbwE1UrOdpMcRdMPN1kPGPjFacHHOBcgSHkhKCn0SqQfjIvWPZ2NvLZKdX5z8rBQSLyihg/exec';

let allData = [];

// ── Persistent cache (sessionStorage + memory) with stale-while-revalidate ──
const _jobMem = {};
const JOB_CACHE_TTL = 5 * 60 * 1000;   // 5 min fresh
const JOB_STALE_TTL = 30 * 60 * 1000;  // 30 min stale-but-usable

function _jobStoreKey(url) {
    return 'sj_job_' + url.replace(/[^a-zA-Z0-9]/g, '').slice(-80);
}

function _jobGetCache(url) {
    if (_jobMem[url]) return _jobMem[url];
    try {
        const raw = sessionStorage.getItem(_jobStoreKey(url));
        if (raw) { const p = JSON.parse(raw); _jobMem[url] = p; return p; }
    } catch (e) {}
    return null;
}

function _jobSetCache(url, data) {
    const entry = { data, time: Date.now() };
    _jobMem[url] = entry;
    try { sessionStorage.setItem(_jobStoreKey(url), JSON.stringify(entry)); } catch (e) {}
}

async function fetchJobAPI(params, onUpdate) {
    const url = new URL(API_URL);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });

    const cacheKey = url.toString();
    const cached = _jobGetCache(cacheKey);
    const now = Date.now();

    // FRESH — return immediately
    if (cached && (now - cached.time < JOB_CACHE_TTL)) {
        return cached.data;
    }

    // STALE — return immediately + revalidate in background
    if (cached && (now - cached.time < JOB_STALE_TTL)) {
        fetch(url.toString()).then(r => r.json()).then(fresh => {
            _jobSetCache(cacheKey, fresh);
            if (onUpdate) onUpdate(fresh);
        }).catch(() => {});
        return cached.data;
    }

    // EXPIRED — must wait
    const res = await fetch(url.toString());
    const data = await res.json();
    _jobSetCache(cacheKey, data);
    return data;
}

// ── Skeleton loading ──
function showSkeletons(container, count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
      <div class="job-card skeleton-card">
        <div class="skeleton-img skeleton-pulse"></div>
        <div class="skeleton-body">
          <div class="skeleton-line skeleton-pulse" style="width:70%;height:20px;margin-bottom:12px"></div>
          <div class="skeleton-line skeleton-pulse" style="width:50%;height:14px;margin-bottom:20px"></div>
          <div class="skeleton-grid">
            <div class="skeleton-line skeleton-pulse" style="width:100%;height:14px"></div>
            <div class="skeleton-line skeleton-pulse" style="width:100%;height:14px"></div>
            <div class="skeleton-line skeleton-pulse" style="width:100%;height:14px"></div>
            <div class="skeleton-line skeleton-pulse" style="width:100%;height:14px"></div>
          </div>
          <div class="skeleton-line skeleton-pulse" style="width:40%;height:36px;margin-top:16px;border-radius:8px"></div>
        </div>
      </div>`;
    }
    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById("card-container");
    showSkeletons(container, 4);

    const apiParams = {
        action: 'getJobsPage',
        nganh: NGANH_HIEN_TAI,
        status: 'Active',
        limit: '100'
    };

    // onUpdate callback: re-render if background revalidation gets newer data
    const onUpdate = (freshResult) => {
        if (freshResult.status === 'success') {
            allData = freshResult.jobs || [];
            renderCards(allData);
        }
    };

    try {
        const result = await fetchJobAPI(apiParams, onUpdate);

        if (result.status === 'success') {
            allData = result.jobs || [];
            renderCards(allData);
            initFilters();
        } else {
            container.innerHTML = `<div class="error" style="color:red; padding:20px; text-align:center;"><strong>Lỗi:</strong> ${result.error || 'Không thể tải dữ liệu'}</div>`;
        }
    } catch (err) {
        let msg = "Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.";
        if (window.location.protocol === "file:") {
            msg = "Trình duyệt đang chặn lấy dữ liệu vì bạn đang mở dưới dạng file local (file:///). Vui lòng sử dụng Live Server hoặc xem trên link thực tế (http://...) để test!";
        }
        container.innerHTML = `<div class="error" style="color:red; padding:20px; text-align:center;"><strong>Lỗi:</strong> ${msg}</div>`;
        console.error("Fetch Error:", err);
    }
});

function renderCards(data) {
    const container = document.getElementById("card-container");
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Hiện tại chưa có đơn hàng nào cho ngành này.</div>';
        return;
    }

    let html = "";
    data.forEach(item => {
        const yeuCau = item.YeuCau ? item.YeuCau.replace(/\n/g, '<br>').replace(/\\n/g, '<br>') : '';
        let hinhAnh = item.HinhAnh || 'https://images.unsplash.com/photo-1542051842813-c3561a07dfd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';

        // Chuyển đổi link share Google Drive thành link ảnh trực tiếp
        let driveId = null;
        if (hinhAnh.includes('drive.google.com/file/d/')) {
            const match = hinhAnh.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) driveId = match[1];
        } else if (hinhAnh.includes('drive.google.com/uc?') || hinhAnh.includes('drive.google.com/open?')) {
            const match = hinhAnh.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) driveId = match[1];
        } else if (hinhAnh.includes('drive.google.com/thumbnail?id=')) {
            driveId = null;
        }

        if (driveId) {
            hinhAnh = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
        }

        html += `
      <div class="job-card">
        <div class="job-card-image" style="background-image: url('${hinhAnh}')" loading="lazy">
            <div class="job-card-badge">${item.MaDon || ''}</div>
        </div>
        <div class="job-card-content">
            <h3 class="job-title">${item.TieuDe || ''}</h3>
            <div class="job-company"><i class="fas fa-building"></i> ${item.CongTy || ''}</div>

            <div class="job-details-grid">
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-money-bill-wave"></i> Lương</span>
                    <span class="detail-value highlight">${item.Luong || 0} man/tháng</span>
                </div>
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-map-marker-alt"></i> Nơi làm việc</span>
                    <span class="detail-value">${item.DiaDiem || ''}</span>
                </div>
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-user-graduate"></i> Bằng cấp (JLPT)</span>
                    <span class="detail-value">${item.JLPT || ''}</span>
                </div>
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-users"></i> Số lượng</span>
                    <span class="detail-value">${item.SoLuong || 0} người (${item.GioiTinh || ''})</span>
                </div>
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-birthday-cake"></i> Độ tuổi</span>
                    <span class="detail-value">${item.TuoiTu || ''} - ${item.TuoiDen || ''} tuổi</span>
                </div>
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-briefcase"></i> Kinh nghiệm</span>
                    <span class="detail-value">${item.KinhNghiem || 0} năm</span>
                </div>
            </div>

            <button class="btn job-btn" onclick="showDetail('${item.ID}')">Xem chi tiết <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>`;
    });
    container.innerHTML = html;
}

function showDetail(id) {
    const item = allData.find(d => String(d.ID) === String(id));
    if (!item) return;

    let modal = document.getElementById('jobModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'jobModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    const yeuCau = item.YeuCau ? item.YeuCau.replace(/\n/g, '<br>').replace(/\\n/g, '<br>') : 'Theo yêu cầu công ty';

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn" onclick="document.getElementById('jobModal').style.display='none'">&times;</span>
            <h2>${item.TieuDe || ''} (${item.MaDon || ''})</h2>
            <p><strong>Công ty:</strong> ${item.CongTy || ''}</p>
            <p><strong>Địa điểm:</strong> ${item.DiaDiem || ''}</p>
            <p><strong>Lương:</strong> <span class="highlight">${item.Luong || 0} man/tháng</span></p>
            <hr>
            <h3>Yêu cầu công việc</h3>
            <p>${yeuCau}</p>
            <hr>
            <p><strong>Hạn nộp hồ sơ:</strong> ${item.HanNop || 'Liên hệ'}</p>
            <div style="margin-top: 20px; text-align: center;">
                <a href="tel:0903539537" class="btn btn-call-now"><i class="fas fa-phone"></i> Gọi ngay tư vấn</a>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function initFilters() {
    const jlptFilter = document.getElementById('filter-jlpt');
    if (jlptFilter) {
        jlptFilter.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'all') {
                renderCards(allData);
            } else {
                renderCards(allData.filter(item => item.JLPT === val));
            }
        });
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('jobModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
