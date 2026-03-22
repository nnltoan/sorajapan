import os

# 1. Extract CSS
with open('don-hang-ky-su/assets/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

start = css.find('/* --- Filter Bar --- */')
end = css.find('/* Top Nav Links */')
if start != -1:
    extract = css[start:end] if end != -1 else css[start:]
    
    with open('styles.css', 'a', encoding='utf-8') as f:
        f.write('\n/* ============================================\n   JOB BOARD EMBEDDED STYLES\n   ============================================ */\n')
        f.write(extract)


# 2. Update HTMLs
files = [
    ('ky-su-cntt.html', 'CNTT', 'DANH SÁCH ĐƠN HÀNG CNTT MỚI NHẤT', 
     """Nhật Bản đang khát nhân sự Công nghệ thông tin (IT) chất lượng cao. Tham gia chương trình Kỹ sư CNTT tại Sora Japan, bạn có cơ hội làm việc tại các tập đoàn công nghệ hàng đầu, phát triển các dự án AI, Cloud, phần mềm với mức đãi ngộ hấp dẫn và lộ trình thăng tiến rõ rệt.""",
     """<li>Làm việc trực tiếp với khách hàng Nhật Bản, tiếp cận công nghệ lõi tiên tiến.</li>
      <li>Mức lương khởi điểm từ 20-35 man/tháng (tùy năng lực và kinh nghiệm).</li>
      <li>Hỗ trợ chi phí đi lại, nhà ở ký túc xá, và các chế độ bảo hiểm trọn gói.</li>
      <li>Cơ hội bảo lãnh người thân (vợ/chồng, con cái) sang Nhật sinh sống và học tập dài hạn.</li>"""),
      
    ('ky-su-co-khi.html', 'CơKhi', 'ĐƠN HÀNG CƠ KHÍ / TỰ ĐỘNG HÓA', 
     """Cơ khí và Tự động hóa là ngành thế mạnh và luôn cần nguồn nhân lực khổng lồ tại Nhật Bản. Trở thành Kỹ sư Cơ khí qua Sora Japan mang lại cho bạn cơ hội vận hành và thiết kế các hệ thống máy móc, dây chuyền sản xuất ô tô, linh kiện điện tử hiện đại bậc nhất.""",
     """<li>Vận hành các hệ thống máy công nghiệp CNC, AutoCAD, SolidWorks chuyên nghiệp.</li>
      <li>Mức lương cơ bản vô cùng cạnh tranh, nhiều chế độ OT (làm thêm giờ) nhân hệ số.</li>
      <li>Môi trường an toàn, quy chuẩn lao động khắt khe, rèn luyện tác phong công nghiệp Nhật.</li>
      <li>Tương lai rộng mở với Visa chuyên gia, cơ hội định cư và bảo lãnh gia đình.</li>"""),
      
    ('ky-su-xay-dung.html', 'XayDung', 'ĐƠN HÀNG XÂY DỰNG MỚI NHẤT', 
     """Với sự phát triển hạ tầng và tái thiết liên tục, Kỹ sư Xây dựng tại Nhật Bản đóng vai trò cốt lõi. Sora Japan kết nối bạn với các tập đoàn xây dựng uy tín, tham gia quy hoạch, giám sát công trình đồ sộ từ dân dụng đến hạ tầng quốc gia.""",
     """<li>Sử dụng các công nghệ, vật liệu và phương pháp thi công chống động đất tân tiến.</li>
      <li>Thu nhập cao nhờ đặc thù ngành, phụ cấp thi công, phụ cấp công trường đầy đủ.</li>
      <li>Bảo hiểm lao động, bảo hiểm y tế và chăm sóc sức khỏe toàn diện.</li>
      <li>Tích lũy kinh nghiệm quản lý dự án để trở thành kỹ sư trưởng có giá trị khi về nước.</li>"""),
      
    ('ky-su-dien.html', 'Dien', 'ĐƠN HÀNG ĐIỆN / ĐIỆN TỬ', 
     """Ngành Điện / Điện tử Nhật Bản dẫn đầu thế giới về vi mạch, robot và hệ thống năng lượng số. Tham gia đơn hàng Kỹ sư Điện của Sora Japan, bạn sẽ góp mặt vào những dây chuyền thiết kế, bảo trì thiết bị y tế, viễn thông và thiết bị tự động hóa vô cùng đẳng cấp.""",
     """<li>Làm việc tại các trung tâm R&D, nhà máy vi mạch, thiết bị điện công nghiệp lớn.</li>
      <li>Mức lương khởi điểm cực cao, chế độ đãi ngộ chuẩn kỹ sư bản xứ.</li>
      <li>Được đào tạo định kỳ nâng cao tay nghề, cập nhật công nghệ tự động hóa toàn cầu.</li>
      <li>Bảo lãnh gia đình, xin Visa vĩnh trú dễ dàng sau thời gian lưu trú ổn định.</li>"""),
      
    ('ky-su-kinh-te.html', 'KinhTe', 'ĐƠN HÀNG KINH TẾ / VĂN PHÒNG', 
     """Không chỉ có khối kỹ thuật, các tập đoàn đa quốc gia Nhật Bản ngày càng săn đón nhân lực Kinh tế: Sale, Logistics, Kế toán, Nhân sự, Phiên dịch. Sora Japan cung cấp cánh cửa bước vào môi trường doanh nghiệp trí thức chuyên nghiệp.""",
     """<li>Phát triển kỹ năng đàm phán, quản trị chuỗi cung ứng, thấu hiểu văn hóa doanh nghiệp Nhật.</li>
      <li>Làm việc văn phòng quốc tế, cơ hội thăng tiến lên các vị trí quản lý khu vực.</li>
      <li>Đãi ngộ, thưởng doanh thu cuối năm (Bonus) rất hấp dẫn từ 1.5 - 3 tháng lương.</li>
      <li>Phát triển mạng lưới quan hệ quốc tế (Networking) vững chắc để bứt phá thu nhập.</li>""")
]

target_text_start = '<div class="highlight-box">'
target_text_end = '</div>\n\n    <div style="text-align: center; margin-top: 50px;">'

for fname, nganh, h2_title, p_desc, ul_desc in files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    new_section = f'''<div class="highlight-box">
      {p_desc}
    </div>
    
    <h3>Môi trường làm việc & Quyền lợi</h3>
    <ul>
      {ul_desc}
    </ul>

    <h2 style="margin-top: 50px; text-align: center; margin-bottom: 20px; color: var(--color-primary); border-bottom: none;">{h2_title}</h2>
    <div class="filter-bar">
      <span><i class="fas fa-filter"></i> Lọc JLPT:</span>
      <select id="filter-jlpt">
        <option value="all">Tất cả JPLT</option>
        <option value="N5">N5</option>
        <option value="N4">N4</option>
        <option value="N3">N3</option>
        <option value="N2">N2</option>
        <option value="N1">N1</option>
      </select>
    </div>
    <div id="card-container" class="card-container"></div>

    <div style="text-align: center; margin-top: 50px;">'''

    # Replace descriptive content
    idx_s = content.find(target_text_start)
    idx_e = content.find(target_text_end)
    
    if idx_s != -1 and idx_e != -1:
        content = content[:idx_s] + new_section + content[idx_e + len('</div>\n\n    <div style="text-align: center; margin-top: 50px;">'):]
        
        # Inject script at end just before </body>
        script_inj = f'''
  <script>const NGANH_HIEN_TAI = "{nganh}";</script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
  <script src="don-hang-ky-su/assets/js/donhang.js"></script>
</body>'''
        content = content.replace('</body>', script_inj)
        
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {fname}")
    else:
        print(f"Failed to find target block in {fname}")
