// === CONFIG ===
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2Rok7HSTasR0vVuLfCndCGp14ULHDCpCQ59ZCLwLFHKnfpmYzftwVfI_-m1hogCeiYVLfOu36fzwt/pub?output=csv";

let allData = [];

document.addEventListener('DOMContentLoaded', () => {
    // Show loading state
    document.getElementById("card-container").innerHTML = '<div class="loading">Đang tải dữ liệu đơn hàng...</div>';

    // Sử dụng link chính xác người dùng cung cấp
    const urlToFetch = SHEET_CSV_URL;

    Papa.parse(urlToFetch, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            // Robust filtering: handle cases with accidental spaces in target cells
            allData = results.data.filter(row =>
                row.Status && row.Status.trim() === "Active" &&
                row.Nganh && row.Nganh.trim() === NGANH_HIEN_TAI
            );
            renderCards(allData);
            initFilters();
        },
        error: function (err, file) {
            let msg = "Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.";
            if (window.location.protocol === "file:") {
                msg = "Trình duyệt đang chặn lấy dữ liệu từ Google Sheet vì bạn đang mở dưới dạng file local (file:///). Vui lòng sử dụng Live Server hoặc xem trên link thực tế (http://...) để test!";
            }
            document.getElementById("card-container").innerHTML = `<div class="error" style="color:red; padding:20px; text-align:center;"><strong>Lỗi:</strong> ${msg}</div>`;
            console.error("Parse Error:", err);
        }
    });
});

function renderCards(data) {
    const container = document.getElementById("card-container");
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">Hiện tại chưa có đơn hàng nào cho ngành này.</div>';
        return;
    }

    let html = "";
    data.forEach(item => {
        // Format description text
        const quyenLoi = item.QuyenLoi ? item.QuyenLoi.replace(/\\n/g, '<br>') : 'Theo quy định của Nhật Bản';
        let hinhAnh = item.HinhAnh || 'https://images.unsplash.com/photo-1542051842813-c3561a07dfd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';

        // Chuyển đổi link share Google Drive thành link ảnh trực tiếp
        if (hinhAnh.includes('drive.google.com/file/d/')) {
            const match = hinhAnh.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                hinhAnh = `https://lh3.googleusercontent.com/d/${match[1]}`;
            }
        } else if (hinhAnh.includes('drive.google.com/uc?')) {
            const match = hinhAnh.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                hinhAnh = `https://lh3.googleusercontent.com/d/${match[1]}`;
            }
        }

        html += `
      <div class="job-card">
        <div class="job-card-image" style="background-image: url('${hinhAnh}')">
            <div class="job-card-badge">${item.MaDon}</div>
        </div>
        <div class="job-card-content">
            <h3 class="job-title">${item.TieuDe}</h3>
            <div class="job-company"><i class="fas fa-building"></i> ${item.CongTy}</div>
            
            <div class="job-details-grid">
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-money-bill-wave"></i> Lương</span>
                    <span class="detail-value highlight">${item.Luong} man/tháng</span>
                </div>
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-map-marker-alt"></i> Nơi làm việc</span>
                    <span class="detail-value">${item.DiaDiem}</span>
                </div>
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-user-graduate"></i> Bằng cấp (JLPT)</span>
                    <span class="detail-value">${item.JLPT}</span>
                </div>
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-users"></i> Số lượng</span>
                    <span class="detail-value">${item.SoLuong} người (${item.GioiTinh})</span>
                </div>
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-birthday-cake"></i> Độ tuổi</span>
                    <span class="detail-value">${item.TuoiTu} - ${item.TuoiDen} tuổi</span>
                </div>
                <div class="job-detail-item">
                    <span class="detail-label"><i class="fas fa-briefcase"></i> Kinh nghiệm</span>
                    <span class="detail-value">${item.KinhNghiem} năm</span>
                </div>
            </div>

            <button class="btn job-btn" onclick="showDetail('${item.ID}')">Xem chi tiết <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>`;
    });
    container.innerHTML = html;
}

function showDetail(id) {
    const item = allData.find(d => d.ID === id);
    if (!item) return;

    // We can show a modal or alert. We will create a simple modal.
    let modal = document.getElementById('jobModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'jobModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    const quyenLoi = item.QuyenLoi ? item.QuyenLoi.replace(/\\n/g, '<br>') : '';

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn" onclick="document.getElementById('jobModal').style.display='none'">&times;</span>
            <h2>${item.TieuDe} (${item.MaDon})</h2>
            <p><strong>Công ty:</strong> ${item.CongTy}</p>
            <p><strong>Địa điểm:</strong> ${item.DiaDiem}</p>
            <p><strong>Lương:</strong> <span class="highlight">${item.Luong} man/tháng</span></p>
            <hr>
            <h3>Yêu cầu công việc</h3>
            <p>${item.YeuCau}</p>
            <h3>Quyền lợi</h3>
            <p>${quyenLoi}</p>
            <hr>
            <p><strong>Hạn nộp hồ sơ:</strong> ${item.HanNop}</p>
            <div style="margin-top: 20px; text-align: center;">
                <a href="tel:0903539537" class="btn btn-call-now"><i class="fas fa-phone"></i> Gọi ngay tư vấn</a>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function initFilters() {
    // Add event listeners to filter inputs if they exist
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
