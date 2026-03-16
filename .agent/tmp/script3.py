import re

file1 = r'c:\Users\PC\OneDrive\Documents\WORKSPACE\sorajapan\index.html'

with open(file1, 'r', encoding='utf-8') as f:
    content = f.read()

# For V1
content = re.sub(
    r'(<div class="service-highlight">Học bổng toàn phần</div>)',
    r'\1\n          <a href="service-du-hoc.html" style="display: block; margin-top: 15px; font-weight: bold; color: var(--color-primary); text-decoration: none;">Khám phá chi tiết &rarr;</a>',
    content
)

content = re.sub(
    r'(<div class="service-highlight" style="color: var\(--color-cta\); background: rgba\((.*?)\);">Lương từ 200.000 Yên/Tháng</div>)',
    r'\1\n          <a href="service-ky-su.html" style="display: block; margin-top: 15px; font-weight: bold; color: var(--color-cta); text-decoration: none;">Khám phá chi tiết &rarr;</a>',
    content
)

content = re.sub(
    r'(<div class="service-highlight" style="color: var\(--color-success\); background: rgba\((.*?)\);">Thu nhập 30-45 Triệu/Tháng</div>)',
    r'\1\n          <a href="service-dieu-duong.html" style="display: block; margin-top: 15px; font-weight: bold; color: var(--color-success); text-decoration: none;">Khám phá chi tiết &rarr;</a>',
    content
)

content = re.sub(
    r'(<div class="service-highlight" style="color: var\(--color-gold\); background: rgba\((.*?)\);">Hoạt động ngoại khóa văn hóa</div>)',
    r'\1\n          <a href="service-tieng-nhat.html" style="display: block; margin-top: 15px; font-weight: bold; color: var(--color-gold); text-decoration: none;">Khám phá chi tiết &rarr;</a>',
    content
)

with open(file1, 'w', encoding='utf-8') as f:
    f.write(content)

# For V2
file2 = r'c:\Users\PC\OneDrive\Documents\WORKSPACE\sorajapan_v2\index.html'
try:
    with open(file2, 'r', encoding='utf-8') as f:
        content2 = f.read()
    
    # We replace href="#contact" with links
    content2 = content2.replace('<h3>Tư vấn du học</h3>\n          <p>Miễn phí tư vấn chương trình vừa học vừa làm. Hỗ trợ 100% hồ sơ xin visa và chọn các trường Nhật ngữ uy tín có học bổng.</p>\n          <a href="#contact"', 
                                '<h3>Tư vấn du học</h3>\n          <p>Miễn phí tư vấn chương trình vừa học vừa làm. Hỗ trợ 100% hồ sơ xin visa và chọn các trường Nhật ngữ uy tín có học bổng.</p>\n          <a href="../sorajapan/service-du-hoc.html"')
                                
    content2 = content2.replace('<h3>Tuyển dụng kỹ sư</h3>\n          <p>Tuyển kỹ sư CNTT, cơ khí, điện tử sang Nhật làm việc tại trường và công ty uy tín. Hỗ trợ đào tạo chuyên môn, lương từ 200.000 ¥/tháng.</p>\n          <a href="#contact"',
                                '<h3>Tuyển dụng kỹ sư</h3>\n          <p>Tuyển kỹ sư CNTT, cơ khí, điện tử sang Nhật làm việc tại trường và công ty uy tín. Hỗ trợ đào tạo chuyên môn, lương từ 200.000 ¥/tháng.</p>\n          <a href="../sorajapan/service-ky-su.html"')
                                
    content2 = content2.replace('<h3>Tuyển dụng điều dưỡng</h3>\n          <p>Tuyển điều dưỡng, hộ lý viên cho bệnh viện và viện dưỡng lão Nhật Bản (CT EPA). Lương 30-45 triệu VNĐ, hỗ trợ lấy N4-N2.</p>\n          <a href="#contact"',
                                '<h3>Tuyển dụng điều dưỡng</h3>\n          <p>Tuyển điều dưỡng, hộ lý viên cho bệnh viện và viện dưỡng lão Nhật Bản (CT EPA). Lương 30-45 triệu VNĐ, hỗ trợ lấy N4-N2.</p>\n          <a href="../sorajapan/service-dieu-duong.html"')
                                
    content2 = content2.replace('<h3>Dạy tiếng Nhật</h3>\n          <p>Các khóa học từ N5 - N2 (trực tiếp & online). Tập trung hoàn thiện giao tiếp, ngữ pháp, từ vựng và văn hóa Nhật cùng GV bản xứ.</p>\n          <a href="#contact"',
                                '<h3>Dạy tiếng Nhật</h3>\n          <p>Các khóa học từ N5 - N2 (trực tiếp & online). Tập trung hoàn thiện giao tiếp, ngữ pháp, từ vựng và văn hóa Nhật cùng GV bản xứ.</p>\n          <a href="../sorajapan/service-tieng-nhat.html"')
                                
    with open(file2, 'w', encoding='utf-8') as f:
        f.write(content2)
except Exception as e:
    print(e)

print("All links updated")
