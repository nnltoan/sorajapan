#!/usr/bin/env python3
"""
Batch-add SEO meta tags to Sora Japan pages.
Idempotent: safe to re-run.
"""
import os, re, json, html, sys
from pathlib import Path

ROOT = Path("/sessions/gifted-great-rubin/mnt/sorajapan")
DOMAIN = "https://sorajapan.edu.vn"

IMG = {
    "du-hoc":     f"{DOMAIN}/images/hero/du-hoc-nhat-ban-sora-japan.jpg",
    "ky-su":      f"{DOMAIN}/images/hero/ky-su-nhat-ban-sora-japan.jpg",
    "don-hang":   f"{DOMAIN}/images/hero/xuat-khau-lao-dong-ky-su-nhat-ban-sora-japan.png",
    "tieng-nhat": f"{DOMAIN}/images/hero/hoc-tieng-nhat.jpg",
    "dieu-duong": f"{DOMAIN}/images/hero/dieu-duong-sora-japan.png",
    "doi-tac":    f"{DOMAIN}/images/hero/doi-tac-trung-tam-du-hoc-sora-japan.jpg",
    "truong":     f"{DOMAIN}/images/hero/hoc-vien-trung-tam-du-hoc-sora-japan.JPG",
    "default":    f"{DOMAIN}/images/hero/du-hoc-nhat-ban-sora-japan.jpg",
}

ORG = {
    "@type": "EducationalOrganization",
    "@id": f"{DOMAIN}/#organization",
    "name": "Cong ty Co phan Quoc te Sora Japan",
    "alternateName": "Sora Japan",
    "url": DOMAIN + "/",
    "logo": f"{DOMAIN}/images/logo_transparent.png",
    "email": "info@sorajapan.edu.vn",
    "telephone": "+84903539537",
    "sameAs": [
        "https://www.facebook.com/61568999725231",
        "https://zalo.me/0903539537"
    ]
}

CUSTOM_DESC = {
    "du-hoc/bong-bao-yomiuri.html":    "Hoc bong bao Yomiuri - Co hoi du hoc Nhat Ban ban phan ket hop lam them tai bao. Sora Japan tu van dieu kien, ho so, phong van mien phi.",
    "du-hoc/bong-dieu-duong.html":     "Hoc bong Dieu duong Nhat Ban - Mien hoc phi, nhan luong trong qua trinh hoc. Sora Japan dong hanh tu hoc tieng, phong van den sang Nhat lam viec.",
    "du-hoc/bong-nha-hang-zensho.html":"Hoc bong nha hang Zensho - Vua hoc vua lam co luong tai chuoi nha hang lon nhat Nhat Ban. Sora Japan tuyen sinh, dao tao, lam ho so.",
    "du-hoc/tu-tuc.html":              "Du hoc tu tuc Nhat Ban cung Sora Japan - Tu van chon truong, xin visa COE, chuan bi tai chinh va ho tro sinh hoat trong suot khoa hoc.",
    "du-hoc/du-bi.html":               "Khoa du hoc du bi Nhat Ban tai Sora Japan - Dao tao tieng Nhat N5-N3, ky nang thi EJU va dinh huong nganh hoc tai Nhat.",
    "du-hoc/chuyen-doi-visa.html":     "Dich vu chuyen doi visa Nhat Ban - Tu visa du hoc sang lao dong, Tokutei, ky su. Sora Japan lam ho so nhanh, dung luat, ti le dau cao.",
    "ky-su/cntt.html":                 "Tuyen ky su CNTT di Nhat Ban - Luong 25-40 man/thang tai cong ty cong nghe lon o Tokyo, Osaka. Sora Japan ket noi truc tiep nha tuyen dung.",
    "ky-su/co-khi.html":               "Tuyen ky su Co khi di Nhat - Nha may, tap doan oto, dien tu hang dau Nhat Ban. Phuc loi tot, visa ky su dai han. Sora Japan tu van mien phi.",
    "ky-su/xay-dung.html":             "Tuyen ky su Xay dung sang Nhat - Cong trinh lon, luong cao, co hoi dinh cu. Sora Japan dao tao tieng Nhat va chuan bi ho so tron goi.",
    "ky-su/dien.html":                 "Tuyen dung ky su Dien di Nhat Ban - Cac don hang luong 28-38 man/thang tai nha may dien, nha thau M&E. Dang ky tu van tai Sora Japan.",
    "ky-su/kinh-te.html":              "Tuyen ky su Kinh te sang Nhat lam viec - Co hoi cho SV nganh kinh doanh, tai chinh, ke toan. Sora Japan ket noi doanh nghiep Nhat uy tin.",
    "tieng-nhat/basic.html":           "Khoa tieng Nhat Shinjigen Basic N5-N4 tai Sora Japan - Lo trinh 4-6 thang, giao vien ban ngu, cam ket dau ra JLPT N4.",
    "tieng-nhat/intermediate.html":    "Khoa tieng Nhat Shinjigen Intermediate N3 - Luyen thi JLPT N3, giao tiep cong viec, chuan bi phong van don hang tai Sora Japan.",
    "tieng-nhat/master.html":          "Khoa tieng Nhat Shinjigen Master N2-N1 - Luyen thi JLPT N2, N1 chuyen sau, giao vien nguoi Nhat kem 1-1 tai Sora Japan.",
    "don-hang-ky-su/index.html":       "Don hang ky su Nhat Ban cap nhat lien tuc - CNTT, Co khi, Xay dung, Dien, Kinh te. Sora Japan la cau noi ky su Viet va doanh nghiep Nhat.",
    "don-hang-ky-su/cntt.html":        "Don hang ky su CNTT tai Nhat Ban - Luong 25-40 man/thang, visa ky su, cac cong ty cong nghe o Tokyo, Osaka.",
    "don-hang-ky-su/cokhi.html":       "Don hang ky su Co khi tai Nhat - Nha may oto, thiet bi cong nghiep. Luong on dinh, phu cap nha o. Dang ky phong van mien phi.",
    "don-hang-ky-su/xaydung.html":     "Don hang ky su Xay dung tai Nhat Ban - Cong trinh cao oc, ha tang. Muc luong hap dan, ho tro visa ky su dai han.",
    "don-hang-ky-su/dien.html":        "Don hang ky su Dien tai Nhat - Nha may dien, M&E, tu dong hoa. Luong 28-38 man/thang, phuc loi tot.",
    "don-hang-ky-su/kinhte.html":      "Don hang ky su Kinh te tai Nhat Ban - Vi tri tai cac tap doan thuong mai, tai chinh, ke toan.",
    "quotation.html":                   "Bao gia dich vu Sora Japan - Chi phi du hoc, tuyen dung ky su, hoc tieng Nhat minh bach, tron goi, khong phat sinh.",
}

# Expand Vietnamese versions (with diacritics) via a replacement table so we preserve accents
VN_ACCENTS = {
    "Hoc bong bao Yomiuri": "Học bổng báo Yomiuri",
    "Co hoi du hoc Nhat Ban ban phan": "Cơ hội du học Nhật Bản bán phần",
    "ket hop lam them tai bao": "kết hợp làm thêm tại báo",
    "Sora Japan tu van dieu kien": "Sora Japan tư vấn điều kiện",
    "ho so": "hồ sơ",
    "phong van mien phi": "phỏng vấn miễn phí",
    "Hoc bong Dieu duong Nhat Ban": "Học bổng Điều dưỡng Nhật Bản",
    "Mien hoc phi": "Miễn học phí",
    "nhan luong trong qua trinh hoc": "nhận lương trong quá trình học",
    "dong hanh tu hoc tieng": "đồng hành từ học tiếng",
    "den sang Nhat lam viec": "đến sang Nhật làm việc",
    "Hoc bong nha hang Zensho": "Học bổng nhà hàng Zensho",
    "Vua hoc vua lam co luong": "Vừa học vừa làm có lương",
    "chuoi nha hang lon nhat Nhat Ban": "chuỗi nhà hàng lớn nhất Nhật Bản",
    "tuyen sinh, dao tao": "tuyển sinh, đào tạo",
    "lam ho so": "làm hồ sơ",
    "Du hoc tu tuc Nhat Ban": "Du học tự túc Nhật Bản",
    "cung Sora Japan": "cùng Sora Japan",
    "tu van chon truong": "tư vấn chọn trường",
    "xin visa COE": "xin visa COE",
    "chuan bi tai chinh": "chuẩn bị tài chính",
    "ho tro sinh hoat trong suot khoa hoc": "hỗ trợ sinh hoạt trong suốt khoá học",
    "Khoa du hoc du bi Nhat Ban": "Khoá du học dự bị Nhật Bản",
    "tai Sora Japan": "tại Sora Japan",
    "Dao tao tieng Nhat N5-N3": "Đào tạo tiếng Nhật N5-N3",
    "ky nang thi EJU": "kỹ năng thi EJU",
    "dinh huong nganh hoc tai Nhat": "định hướng ngành học tại Nhật",
    "Dich vu chuyen doi visa Nhat Ban": "Dịch vụ chuyển đổi visa Nhật Bản",
    "Tu visa du hoc sang lao dong, Tokutei, ky su": "Từ visa du học sang lao động, Tokutei, kỹ sư",
    "Sora Japan lam ho so nhanh, dung luat, ti le dau cao": "Sora Japan làm hồ sơ nhanh, đúng luật, tỉ lệ đậu cao",
    "Tuyen ky su CNTT di Nhat Ban": "Tuyển kỹ sư CNTT đi Nhật Bản",
    "Luong 25-40 man/thang": "Lương 25-40 man/tháng",
    "tai cong ty cong nghe lon o Tokyo, Osaka": "tại công ty công nghệ lớn ở Tokyo, Osaka",
    "Sora Japan ket noi truc tiep nha tuyen dung": "Sora Japan kết nối trực tiếp nhà tuyển dụng",
    "Tuyen ky su Co khi di Nhat": "Tuyển kỹ sư Cơ khí đi Nhật",
    "Nha may, tap doan oto, dien tu hang dau Nhat Ban": "Nhà máy, tập đoàn ôtô, điện tử hàng đầu Nhật Bản",
    "Phuc loi tot, visa ky su dai han": "Phúc lợi tốt, visa kỹ sư dài hạn",
    "Sora Japan tu van mien phi": "Sora Japan tư vấn miễn phí",
    "Tuyen ky su Xay dung sang Nhat": "Tuyển kỹ sư Xây dựng sang Nhật",
    "Cong trinh lon, luong cao, co hoi dinh cu": "Công trình lớn, lương cao, cơ hội định cư",
    "Sora Japan dao tao tieng Nhat va chuan bi ho so tron goi": "Sora Japan đào tạo tiếng Nhật và chuẩn bị hồ sơ trọn gói",
    "Tuyen dung ky su Dien di Nhat Ban": "Tuyển dụng kỹ sư Điện đi Nhật Bản",
    "Cac don hang luong 28-38 man/thang tai nha may dien, nha thau M&E": "Các đơn hàng lương 28-38 man/tháng tại nhà máy điện, nhà thầu M&E",
    "Dang ky tu van tai Sora Japan": "Đăng ký tư vấn tại Sora Japan",
    "Tuyen ky su Kinh te sang Nhat lam viec": "Tuyển kỹ sư Kinh tế sang Nhật làm việc",
    "Co hoi cho SV nganh kinh doanh, tai chinh, ke toan": "Cơ hội cho SV ngành kinh doanh, tài chính, kế toán",
    "Sora Japan ket noi doanh nghiep Nhat uy tin": "Sora Japan kết nối doanh nghiệp Nhật uy tín",
    "Khoa tieng Nhat Shinjigen Basic N5-N4": "Khoá tiếng Nhật Shinjigen Basic N5-N4",
    "Lo trinh 4-6 thang, giao vien ban ngu, cam ket dau ra JLPT N4": "Lộ trình 4-6 tháng, giáo viên bản ngữ, cam kết đầu ra JLPT N4",
    "Khoa tieng Nhat Shinjigen Intermediate N3": "Khoá tiếng Nhật Shinjigen Intermediate N3",
    "Luyen thi JLPT N3, giao tiep cong viec, chuan bi phong van don hang": "Luyện thi JLPT N3, giao tiếp công việc, chuẩn bị phỏng vấn đơn hàng",
    "Khoa tieng Nhat Shinjigen Master N2-N1": "Khoá tiếng Nhật Shinjigen Master N2-N1",
    "Luyen thi JLPT N2, N1 chuyen sau": "Luyện thi JLPT N2, N1 chuyên sâu",
    "giao vien nguoi Nhat kem 1-1": "giáo viên người Nhật kèm 1-1",
    "Don hang ky su Nhat Ban cap nhat lien tuc": "Đơn hàng kỹ sư Nhật Bản cập nhật liên tục",
    "CNTT, Co khi, Xay dung, Dien, Kinh te": "CNTT, Cơ khí, Xây dựng, Điện, Kinh tế",
    "Sora Japan la cau noi ky su Viet va doanh nghiep Nhat": "Sora Japan là cầu nối kỹ sư Việt và doanh nghiệp Nhật",
    "Don hang ky su CNTT tai Nhat Ban": "Đơn hàng kỹ sư CNTT tại Nhật Bản",
    "visa ky su": "visa kỹ sư",
    "cac cong ty cong nghe o Tokyo, Osaka": "các công ty công nghệ ở Tokyo, Osaka",
    "Don hang ky su Co khi tai Nhat": "Đơn hàng kỹ sư Cơ khí tại Nhật",
    "Nha may oto, thiet bi cong nghiep": "Nhà máy ôtô, thiết bị công nghiệp",
    "Luong on dinh, phu cap nha o": "Lương ổn định, phụ cấp nhà ở",
    "Dang ky phong van mien phi": "Đăng ký phỏng vấn miễn phí",
    "Don hang ky su Xay dung tai Nhat Ban": "Đơn hàng kỹ sư Xây dựng tại Nhật Bản",
    "Cong trinh cao oc, ha tang": "Công trình cao ốc, hạ tầng",
    "Muc luong hap dan, ho tro visa ky su dai han": "Mức lương hấp dẫn, hỗ trợ visa kỹ sư dài hạn",
    "Don hang ky su Dien tai Nhat": "Đơn hàng kỹ sư Điện tại Nhật",
    "Nha may dien, M&E, tu dong hoa": "Nhà máy điện, M&E, tự động hoá",
    "Luong 28-38 man/thang, phuc loi tot": "Lương 28-38 man/tháng, phúc lợi tốt",
    "Don hang ky su Kinh te tai Nhat Ban": "Đơn hàng kỹ sư Kinh tế tại Nhật Bản",
    "Vi tri tai cac tap doan thuong mai, tai chinh, ke toan": "Vị trí tại các tập đoàn thương mại, tài chính, kế toán",
    "Bao gia dich vu Sora Japan": "Báo giá dịch vụ Sora Japan",
    "Chi phi du hoc, tuyen dung ky su, hoc tieng Nhat": "Chi phí du học, tuyển dụng kỹ sư, học tiếng Nhật",
    "minh bach, tron goi, khong phat sinh": "minh bạch, trọn gói, không phát sinh",
    "Cong ty Co phan Quoc te Sora Japan": "Công ty Cổ phần Quốc tế Sora Japan",
    "phong van": "phỏng vấn",
    "tai bao": "tại báo",
    "Trang chu": "Trang chủ",
    "Du hoc": "Du học",
    "Ky su": "Kỹ sư",
    "Tieng Nhat": "Tiếng Nhật",
    "Dieu duong": "Điều dưỡng",
    "Doi tac": "Đối tác",
    "Truong": "Trường",
    "Don hang ky su": "Đơn hàng kỹ sư",
}

def restore_accents(text):
    for noacc, acc in VN_ACCENTS.items():
        text = text.replace(noacc, acc)
    return text

# Apply accents once at module load
ORG["name"] = restore_accents(ORG["name"])
CUSTOM_DESC = {k: restore_accents(v) for k, v in CUSTOM_DESC.items()}


def classify(rel_path):
    noindex = False
    if rel_path in ("admin.html","tin-tuc-detail.html"):
        return (None, IMG["default"], None, [], True)
    root_maps = {
        "service-du-hoc.html":      "du-hoc/",
        "service-ky-su.html":       "ky-su/",
        "service-tieng-nhat.html":  "tieng-nhat/",
        "service-dieu-duong.html":  "dieu-duong/",
        "doi-tac.html":             "doi-tac/",
    }
    for prefix, folder in [("du-hoc-","du-hoc/"),("ky-su-","ky-su/"),("truong-","truong/"),("doi-tac-","doi-tac/"),("tieng-nhat-","tieng-nhat/")]:
        if rel_path.startswith(prefix) and "/" not in rel_path:
            slug = rel_path[len(prefix):]
            root_maps[rel_path] = folder + slug
    if rel_path in root_maps:
        target = root_maps[rel_path]
        canonical = DOMAIN + "/" + target
        noindex = True
    elif rel_path.endswith("/index.html"):
        canonical = DOMAIN + "/" + rel_path[:-len("index.html")]
    else:
        canonical = DOMAIN + "/" + rel_path
    first = rel_path.split("/",1)[0]
    if first.startswith("du-hoc"):           img_key = "du-hoc"
    elif first.startswith("ky-su"):          img_key = "ky-su"
    elif first.startswith("don-hang-ky-su"): img_key = "don-hang"
    elif first.startswith("tieng-nhat"):     img_key = "tieng-nhat"
    elif first.startswith("dieu-duong"):     img_key = "dieu-duong"
    elif first.startswith("doi-tac"):        img_key = "doi-tac"
    elif first.startswith("truong"):         img_key = "truong"
    else:                                    img_key = "default"
    schema_type = None
    if rel_path.startswith("tieng-nhat/") and rel_path != "tieng-nhat/index.html":
        schema_type = "Course"
    elif rel_path.startswith("truong/") and rel_path != "truong/index.html":
        schema_type = "EducationalOrganization_Partner"
    elif rel_path.startswith("doi-tac/") and rel_path != "doi-tac/index.html":
        schema_type = "Organization_Partner"
    elif rel_path in ("du-hoc/index.html","ky-su/index.html","tieng-nhat/index.html","dieu-duong/index.html","doi-tac/index.html","don-hang-ky-su/index.html"):
        schema_type = "Service"
    crumbs = build_breadcrumbs(rel_path)
    return (canonical, IMG[img_key], schema_type, crumbs, noindex)

def build_breadcrumbs(rel_path):
    parts = rel_path.split("/")
    items = [{"@type":"ListItem","position":1,"name":"Trang chu","item":DOMAIN+"/"}]
    folder_names = {"du-hoc":"Du hoc","ky-su":"Ky su","tieng-nhat":"Tieng Nhat","dieu-duong":"Dieu duong","doi-tac":"Doi tac","truong":"Truong","don-hang-ky-su":"Don hang ky su"}
    if len(parts) >= 2:
        folder = parts[0]
        fname = folder_names.get(folder, folder.title())
        items.append({"@type":"ListItem","position":2,"name":fname,"item":f"{DOMAIN}/{folder}/"})
        if parts[1] != "index.html":
            items.append({"@type":"ListItem","position":3,"name":"CURRENT_PAGE_TITLE","item":DOMAIN+"/"+rel_path})
    else:
        if rel_path != "index.html":
            items.append({"@type":"ListItem","position":2,"name":"CURRENT_PAGE_TITLE","item":DOMAIN+"/"+rel_path})
    # Restore Vietnamese accents in all crumb names
    for it in items:
        it["name"] = restore_accents(it["name"])
    return items

def extract_title(html_text):
    m = re.search(r'<title[^>]*>(.*?)</title>', html_text, re.DOTALL|re.IGNORECASE)
    return html.unescape(m.group(1).strip()) if m else "Sora Japan"

def extract_description(html_text, rel_path=None):
    if rel_path and rel_path in CUSTOM_DESC:
        return CUSTOM_DESC[rel_path]
    m = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', html_text, re.DOTALL|re.IGNORECASE)
    if m: return html.unescape(m.group(1).strip())
    m = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']description["\']', html_text, re.DOTALL|re.IGNORECASE)
    if m: return html.unescape(m.group(1).strip())
    return "Sora Japan - Tu van du hoc Nhat Ban, tuyen dung ky su, Tokutei, dao tao tieng Nhat."

def build_block(rel_path, title, description):
    canonical, image, schema_type, crumbs, noindex = classify(rel_path)
    for c in crumbs:
        if c.get("name") == "CURRENT_PAGE_TITLE":
            c["name"] = title[:90]
    og_desc = description[:200]
    jsonld = [{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":crumbs}]
    if schema_type == "Course":
        jsonld.append({"@context":"https://schema.org","@type":"Course","name":title,"description":description,"provider":ORG,"inLanguage":"vi","url":canonical})
    elif schema_type == "Service":
        jsonld.append({"@context":"https://schema.org","@type":"Service","name":title,"description":description,"provider":ORG,"areaServed":{"@type":"Country","name":"Vietnam"},"url":canonical})
    elif schema_type in ("EducationalOrganization_Partner","Organization_Partner"):
        t = "EducationalOrganization" if "Educational" in schema_type else "Organization"
        jsonld.append({"@context":"https://schema.org","@type":t,"name":title.split("|")[0].strip(),"description":description,"url":canonical})
        jsonld.append({"@context":"https://schema.org","@type":"WebPage","name":title,"description":description,"url":canonical,"isPartOf":{"@id":f"{DOMAIN}/#organization"},"publisher":ORG})
    jsonld_str = "\n".join(f'<script type="application/ld+json">\n{json.dumps(d, ensure_ascii=False, indent=2)}\n</script>' for d in jsonld)
    robots_meta = '<meta name="robots" content="noindex, nofollow">' if noindex else '<meta name="robots" content="index, follow, max-image-preview:large">'
    canonical_tag = f'<link rel="canonical" href="{canonical}">' if canonical else ''
    block = f"""<!-- SORA_SEO_BLOCK_START -->
  {canonical_tag}
  {robots_meta}
  <meta name="author" content="Sora Japan">
  <meta http-equiv="content-language" content="vi-VN">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Sora Japan">
  <meta property="og:locale" content="vi_VN">
  <meta property="og:title" content="{html.escape(title, quote=True)}">
  <meta property="og:description" content="{html.escape(og_desc, quote=True)}">
  <meta property="og:url" content="{canonical or DOMAIN+'/'+rel_path}">
  <meta property="og:image" content="{image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{html.escape(title, quote=True)}">
  <meta name="twitter:description" content="{html.escape(og_desc, quote=True)}">
  <meta name="twitter:image" content="{image}">

  <!-- PWA -->
  <link rel="apple-touch-icon" sizes="180x180" href="/images/logo_transparent.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#d32f2f">

  <!-- JSON-LD Schema -->
  {jsonld_str}
  <!-- SORA_SEO_BLOCK_END -->"""
    return block, noindex

def process_file(path, rel):
    raw = path.read_bytes()
    text = raw.decode("utf-8", errors="strict")
    text_noblock = re.sub(r'\s*<!-- SORA_SEO_BLOCK_START -->.*?<!-- SORA_SEO_BLOCK_END -->', '', text, flags=re.DOTALL)
    for pattern in [
        r'\s*<link[^>]+rel=["\']canonical["\'][^>]*>',
        r'\s*<meta[^>]+property=["\']og:[^"\']+["\'][^>]*>',
        r'\s*<meta[^>]+name=["\']twitter:[^"\']+["\'][^>]*>',
        r'\s*<meta[^>]+name=["\']robots["\'][^>]*>',
        r'\s*<link[^>]+rel=["\']apple-touch-icon["\'][^>]*>',
        r'\s*<link[^>]+rel=["\']manifest["\'][^>]*>',
        r'\s*<meta[^>]+name=["\']theme-color["\'][^>]*>',
    ]:
        text_noblock = re.sub(pattern, '', text_noblock, flags=re.IGNORECASE)
    title = extract_title(text_noblock)
    description = extract_description(text_noblock, rel_path=rel)
    block, noindex = build_block(rel, title, description)
    if '</head>' not in text_noblock:
        return (False, "no </head>", 0)
    new_text = text_noblock.replace('</head>', f'\n  {block}\n</head>', 1)
    if new_text == text:
        return (False, "unchanged", len(new_text))
    path.write_bytes(new_text.encode("utf-8"))
    return (True, ("noindex" if noindex else "index"), len(new_text))

def main():
    pages = []
    for p in sorted(ROOT.rglob("*.html")):
        rel = p.relative_to(ROOT).as_posix()
        if rel == "index.html": continue
        if any(rel.startswith(x) for x in (".venv/",".claude/",".agent/",".git/","node_modules/")): continue
        pages.append((p, rel))
    print(f"Processing {len(pages)} pages...\n")
    ok = skipped = 0
    failures = []
    for p, rel in pages:
        try:
            changed, status, size = process_file(p, rel)
            if changed:
                ok += 1
                print(f"  [{status:8s}] {rel}")
            else:
                skipped += 1
        except Exception as e:
            failures.append((rel, str(e)))
            print(f"  [FAIL] {rel}: {e}")
    print(f"\n=== Summary ===")
    print(f"  Updated: {ok}")
    print(f"  Unchanged: {skipped}")
    print(f"  Failed: {len(failures)}")
    for f, err in failures:
        print(f"    - {f}: {err}")

if __name__ == "__main__":
    main()
