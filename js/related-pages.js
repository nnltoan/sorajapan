/* ============================================================================
   SORA JAPAN — Related Pages Module
   Auto-injects a "Related pages" section at bottom of detail pages.
   Detects category from URL path, lists OTHER pages in same category.
   New detail pages auto-show as long as added to RELATED_PAGES manifest.
   ============================================================================ */
(function () {
  'use strict';

  // -------------- MANIFEST --------------
  // Path slug → category config
  const RELATED_PAGES = {
    'du-hoc': {
      label: 'Du học',
      title: 'Khám phá thêm về Du học Nhật Bản',
      subtitle: 'Chọn lộ trình du học phù hợp với mục tiêu của bạn',
      items: [
        { url: 'tu-tuc.html',           title: 'Du học tự túc',                     desc: 'Vừa học vừa làm tại Nhật, phù hợp với người chủ động tài chính.',          icon: '✈️' },
        { url: 'du-bi.html',            title: 'Du học dự bị Đại học',              desc: 'Lộ trình chuẩn bị vào đại học Nhật Bản với chương trình dự bị bài bản.',  icon: '🎓' },
        { url: 'chuyen-doi-visa.html',  title: 'Chuyển đổi visa',                   desc: 'Hỗ trợ chuyển đổi visa từ Tokutei/TTS sang du học hoặc làm việc.',        icon: '🛂' },
        { url: 'bong-bao-yomiuri.html', title: 'Học bổng báo Yomiuri',              desc: 'Học bổng toàn phần kết hợp làm việc tại tờ báo lớn nhất Nhật Bản.',       icon: '📰' },
        { url: 'bong-dieu-duong.html',  title: 'Học bổng Điều dưỡng',               desc: 'Đào tạo miễn phí ngành Điều dưỡng + cam kết việc làm sau tốt nghiệp.',    icon: '🏥' },
        { url: 'bong-nha-hang-zensho.html', title: 'Học bổng nhà hàng Zensho',      desc: 'Học bổng kết hợp việc làm tại tập đoàn nhà hàng số 1 Nhật Bản.',          icon: '🍱' }
      ]
    },
    'ky-su': {
      label: 'Kỹ sư',
      title: 'Các ngành Kỹ sư đang tuyển dụng',
      subtitle: 'Cơ hội việc làm tại các Nhà máy AI và tập đoàn lớn của Nhật',
      items: [
        { url: 'cntt.html',     title: 'Kỹ sư Công nghệ thông tin',  desc: 'Phát triển phần mềm, quản trị mạng, AI và hệ thống Cloud.',               icon: '💻' },
        { url: 'co-khi.html',   title: 'Kỹ sư Cơ khí / Tự động hóa', desc: 'Vận hành máy CNC, ô tô, chế tạo và thiết kế CAD/CAM.',                    icon: '⚙️' },
        { url: 'dien.html',     title: 'Kỹ sư Điện / Điện tử',       desc: 'Hệ thống điện công nghiệp, mạch điện tử, IoT và năng lượng tái tạo.',     icon: '⚡' },
        { url: 'kinh-te.html',  title: 'Kỹ sư Kinh tế',              desc: 'Quản lý sản xuất, logistics, kế toán và tài chính doanh nghiệp Nhật.',    icon: '📈' },
        { url: 'xay-dung.html', title: 'Kỹ sư Xây dựng',             desc: 'Thiết kế kết cấu, thi công công trình dân dụng và cơ sở hạ tầng.',        icon: '🏗️' }
      ]
    },
    'tieng-nhat': {
      label: 'Tiếng Nhật',
      title: 'Lộ trình đào tạo tiếng Nhật',
      subtitle: 'Chinh phục từng cấp độ JLPT theo phương pháp Shinjigen',
      items: [
        { url: 'basic.html',        title: 'Shinjigen Basic (N5–N4)',     desc: 'Khóa học nền tảng dành cho người mới bắt đầu, cam kết đậu N4.',           icon: '🌱' },
        { url: 'intermediate.html', title: 'Shinjigen Intermediate (N3)', desc: 'Bứt phá lên trung cấp, làm chủ ngữ pháp và giao tiếp tự nhiên.',          icon: '🌿' },
        { url: 'master.html',       title: 'Shinjigen Master (N2–N1)',    desc: 'Nâng cao toàn diện, chinh phục các kỳ thi cao cấp + giao tiếp business.', icon: '🌸' }
      ]
    },
    'truong': {
      label: 'Trường liên kết',
      title: 'Khám phá các trường Nhật ngữ liên kết',
      subtitle: 'Mạng lưới hơn 24 trường uy tín tại Tokyo, Osaka, Saitama, Kyoto…',
      items: [
        { url: 'asahi.html',          title: 'Học viện Quốc tế Asahi',        desc: 'Saitama — môi trường thân thiện, lâu năm.' },
        { url: 'central-japan.html',  title: 'Central Japan',                  desc: 'Tỉnh Aichi — gần khu công nghiệp Nagoya.' },
        { url: 'eikou.html',          title: 'Học viện ngôn ngữ Eikou',        desc: 'Tokyo — chuyên sâu kỹ năng giao tiếp.' },
        { url: 'ica.html',            title: 'ICA School',                     desc: 'Học bổng phong phú, hỗ trợ làm thêm.' },
        { url: 'jin-tokyo.html',      title: 'Nhật ngữ Jin Tokyo',             desc: 'Trung tâm Tokyo — luyện thi JLPT mạnh.' },
        { url: 'jvc.html',            title: 'JVC Osaka',                      desc: 'Osaka — đào tạo chuyên ngành y tế.' },
        { url: 'kuraku.html',         title: 'Học viện Kuraku',                desc: 'Đại học Tokyo — chương trình dự bị.' },
        { url: 'kyorin.html',         title: 'Học viện Kyorin',                desc: 'Tokyo — y khoa và điều dưỡng.' },
        { url: 'kyoritsu.html',       title: 'Học viện Nhật ngữ Kyoritsu',     desc: 'Tokyo — lịch sử lâu đời từ 1986.' },
        { url: 'loop.html',           title: 'Trường Nhật ngữ Quốc tế Loop',   desc: 'Osaka — môi trường đa văn hóa.' },
        { url: 'meric.html',          title: 'Học viện MERIC',                 desc: 'Kobe — đào tạo song ngữ.' },
        { url: 'musashi-ura.html',    title: 'Nhật ngữ Musashi Urawa',         desc: 'Saitama — gần ga lớn, tiện đi lại.' },
        { url: 'nichigo.html',        title: 'Học viện Nichigo',               desc: 'Tokyo — nhỏ gọn, học sát sao.' },
        { url: 'oji.html',            title: 'Ngôn ngữ Quốc tế Oji',           desc: 'Saitama — gần ga Warabi 10 phút.' },
        { url: 'osafune.html',        title: 'Học viện Osafune',               desc: 'Vùng quê yên tĩnh, học phí thấp.' },
        { url: 'osaka-kokusai.html',  title: 'Osaka Kokusai',                  desc: 'Trung tâm Osaka — học bổng cao.' },
        { url: 'sophia.html',         title: 'Học viện Quốc tế Sophia',        desc: 'Yokohama — gần Tokyo, học bổng khủng.' },
        { url: 'suna-oedo.html',      title: 'Suna Oedo',                      desc: 'Tokyo — chuyên đào tạo doanh nhân.' },
        { url: 'syonan.html',         title: 'Học viện Syonan Hamamatsu',      desc: 'Shizuoka — gần thiên nhiên, thanh bình.' },
        { url: 'tokyo-kokusai.html',  title: 'Tokyo Kokusai',                  desc: 'Tokyo — chương trình quốc tế đa dạng.' },
        { url: 'tokyo-yohoku.html',   title: 'Tokyo Yohoku',                   desc: 'Học bổng cho sinh viên Việt Nam.' },
        { url: 'topa21.html',         title: 'Topa 21',                        desc: 'Lộ trình du học định hướng đại học.' },
        { url: 'waseda-edu.html',     title: 'Waseda EDU',                     desc: 'Liên kết Waseda — đại học top Nhật.' }
      ]
    },
    'doi-tac': {
      label: 'Đối tác y tế',
      title: 'Đối tác tiếp nhận khác',
      subtitle: 'Mạng lưới bệnh viện, viện dưỡng lão tại Nhật Bản',
      items: [
        { url: 'care21.html',     title: 'Care 21',     desc: 'Tập đoàn chăm sóc người cao tuổi hàng đầu Nhật.' },
        { url: 'hokuyuukai.html', title: 'Hokuyuukai',  desc: 'Mạng lưới y tế tại Hokkaido.' },
        { url: 'nichii.html',     title: 'Nichii',      desc: 'Đối tác lớn về điều dưỡng và chăm sóc tại nhà.' },
        { url: 'seichoukai.html', title: 'Seichoukai',  desc: 'Bệnh viện và viện dưỡng lão uy tín.' },
        { url: 'tums.html',       title: 'TUMS',        desc: 'Trường đại học y khoa hàng đầu — đào tạo điều dưỡng.' }
      ]
    }
  };

  // -------------- CROSS-CATEGORY LINKS --------------
  // Cross-link from a detail page to specific pages in ANOTHER category.
  // Helps SEO + UX: visitors reading a du-hoc article can discover relevant
  // schools; ky-su readers can discover partner companies.
  const CROSS_LINKS = {
    'du-hoc': {
      targetCategory: 'truong',
      label: 'Trường Nhật ngữ liên kết',
      title: 'Trường Nhật ngữ phù hợp với chương trình này',
      subtitle: 'Các trường Sora Japan thường giới thiệu cho học viên đi theo lộ trình này',
      mapping: {
        'tu-tuc.html':              ['ica.html', 'osafune.html', 'oji.html'],
        'du-bi.html':               ['kuraku.html', 'topa21.html', 'waseda-edu.html'],
        'chuyen-doi-visa.html':     ['kyoritsu.html', 'jin-tokyo.html', 'sophia.html'],
        'bong-bao-yomiuri.html':    ['tokyo-yohoku.html', 'ica.html', 'asahi.html'],
        'bong-dieu-duong.html':     ['kyorin.html', 'jvc.html', 'kuraku.html'],
        'bong-nha-hang-zensho.html':['ica.html', 'sophia.html', 'oji.html']
      }
    },
    'ky-su': {
      // Custom mode: items are explicit (not pulled from RELATED_PAGES manifest).
      // Reason: existing /doi-tac/ partners are all medical/care — not relevant
      // for engineering pages. We instead point engineers to job-orders + N2 prep
      // which are the immediate next steps in their journey.
      label: 'Bước tiếp theo',
      title: 'Cùng tìm hiểu thêm',
      subtitle: 'Đơn hàng kỹ sư đang tuyển + lộ trình tiếng Nhật N2 bắt buộc cho visa Engineer 2026',
      customItems: {
        'cntt.html': [
          { url: 'index.html',                title: 'Tổng quan 5 ngành Kỹ sư',         desc: 'So sánh mức lương, yêu cầu JLPT và doanh nghiệp tiếp nhận của tất cả 5 ngành.' },
          { url: '../tieng-nhat/master.html', title: 'Khóa Shinjigen Master (N2–N1)',  desc: 'Lộ trình đạt JLPT N2 — yêu cầu bắt buộc của visa Engineer từ 2026.' }
        ],
        'co-khi.html': [
          { url: 'index.html',                title: 'Tổng quan 5 ngành Kỹ sư',         desc: 'So sánh mức lương, yêu cầu JLPT và doanh nghiệp tiếp nhận của tất cả 5 ngành.' },
          { url: '../tieng-nhat/master.html', title: 'Khóa Shinjigen Master (N2–N1)',  desc: 'Lộ trình đạt JLPT N2 — yêu cầu bắt buộc của visa Engineer từ 2026.' }
        ],
        'dien.html': [
          { url: 'index.html',                title: 'Tổng quan 5 ngành Kỹ sư',         desc: 'So sánh mức lương, yêu cầu JLPT và doanh nghiệp tiếp nhận của tất cả 5 ngành.' },
          { url: '../tieng-nhat/master.html', title: 'Khóa Shinjigen Master (N2–N1)',  desc: 'Lộ trình đạt JLPT N2 — yêu cầu bắt buộc của visa Engineer từ 2026.' }
        ],
        'xay-dung.html': [
          { url: 'index.html',                title: 'Tổng quan 5 ngành Kỹ sư',         desc: 'So sánh mức lương, yêu cầu JLPT và doanh nghiệp tiếp nhận của tất cả 5 ngành.' },
          { url: '../tieng-nhat/master.html', title: 'Khóa Shinjigen Master (N2–N1)',  desc: 'Lộ trình đạt JLPT N2 — yêu cầu bắt buộc của visa Engineer từ 2026.' }
        ],
        'kinh-te.html': [
          { url: 'index.html',                title: 'Tổng quan 5 ngành Kỹ sư',         desc: 'So sánh mức lương, yêu cầu JLPT và doanh nghiệp tiếp nhận của tất cả 5 ngành.' },
          { url: '../tieng-nhat/master.html', title: 'Khóa Shinjigen Master (N2–N1)',  desc: 'Lộ trình đạt JLPT N2 — yêu cầu bắt buộc của visa Engineer từ 2026.' }
        ]
      }
    }
  };

  // -------------- DETECT CURRENT PAGE --------------
  function detectCurrent() {
    const pathname = window.location.pathname;
    // Match /<category>/<file>.html
    const m = pathname.match(/\/([^\/]+)\/([^\/]+\.html)$/);
    if (!m) return null;
    const [, category, filename] = m;
    if (!RELATED_PAGES[category]) return null;
    return { category, filename, config: RELATED_PAGES[category] };
  }

  // -------------- BUILD HTML --------------
  function buildSection(current) {
    const { config, filename } = current;
    const others = config.items.filter(it => it.url !== filename);
    if (!others.length) return null;

    // Limit truong to 8 random picks (24 is too many)
    let display = others;
    if (current.category === 'truong' && others.length > 8) {
      display = others
        .map(it => ({ it, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .slice(0, 8)
        .map(x => x.it);
    }

    const cards = display.map(it => {
      const iconHtml = it.icon
        ? `<div class="related-card-icon" aria-hidden="true">${it.icon}</div>`
        : '';
      return `
        <a href="${it.url}" class="related-card">
          ${iconHtml}
          <div class="related-card-body">
            <h3 class="related-card-title">${escapeHtml(it.title)}</h3>
            <p class="related-card-desc">${escapeHtml(it.desc)}</p>
            <span class="related-card-cta">Tìm hiểu thêm
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </a>`;
    }).join('');

    return `
      <section class="related-pages-section" aria-label="${escapeHtml(config.label)} liên quan">
        <div class="related-pages-inner">
          <div class="related-pages-header">
            <div class="related-pages-eyebrow">${escapeHtml(config.label)}</div>
            <h2 class="related-pages-title">${escapeHtml(config.title)}</h2>
            <p class="related-pages-subtitle">${escapeHtml(config.subtitle)}</p>
          </div>
          <div class="related-pages-grid">${cards}</div>
        </div>
      </section>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // -------------- BUILD CROSS-CATEGORY SECTION --------------
  function buildCrossSection(current) {
    const crossConfig = CROSS_LINKS[current.category];
    if (!crossConfig) return null;

    let items = [];

    // Mode 1: customItems — full {url, title, desc} per page (e.g., ky-su)
    if (crossConfig.customItems) {
      const list = crossConfig.customItems[current.filename];
      if (!list || !list.length) return null;
      items = list.slice();
    }
    // Mode 2: mapping — slug list resolved from RELATED_PAGES manifest (e.g., du-hoc → truong)
    else if (crossConfig.mapping) {
      const targetUrls = crossConfig.mapping[current.filename];
      if (!targetUrls || !targetUrls.length) return null;
      const targetCat = RELATED_PAGES[crossConfig.targetCategory];
      if (!targetCat) return null;
      items = targetUrls.map(url => {
        const found = targetCat.items.find(it => it.url === url);
        if (!found) return null;
        return {
          url: '../' + crossConfig.targetCategory + '/' + url,
          title: found.title,
          desc: found.desc
        };
      }).filter(Boolean);
    }

    if (!items.length) return null;

    const cards = items.map(it => `
        <a href="${escapeHtml(it.url)}" class="related-card">
          <div class="related-card-body">
            <h3 class="related-card-title">${escapeHtml(it.title)}</h3>
            <p class="related-card-desc">${escapeHtml(it.desc)}</p>
            <span class="related-card-cta">Tìm hiểu thêm
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </a>`).join('');

    return `
      <section class="related-pages-section related-pages-cross" aria-label="${escapeHtml(crossConfig.label)}">
        <div class="related-pages-inner">
          <div class="related-pages-header">
            <div class="related-pages-eyebrow">${escapeHtml(crossConfig.label)}</div>
            <h2 class="related-pages-title">${escapeHtml(crossConfig.title)}</h2>
            <p class="related-pages-subtitle">${escapeHtml(crossConfig.subtitle)}</p>
          </div>
          <div class="related-pages-grid">${cards}</div>
        </div>
      </section>`;
  }

  // -------------- INJECT --------------
  function findInjectionPoint() {
    // Prefer placing BEFORE footer if exists, ELSE before floating-contact, ELSE end of body
    const footer = document.querySelector('footer, .footer, .site-footer');
    if (footer) return { node: footer, position: 'before' };
    const floating = document.querySelector('.floating-contact');
    if (floating) return { node: floating, position: 'before' };
    return { node: document.body, position: 'append' };
  }

  function inject() {
    const current = detectCurrent();
    if (!current) return;
    // Skip on index.html (doesn't need related)
    if (current.filename === 'index.html') return;
    const sameHtml = buildSection(current) || '';
    const crossHtml = buildCrossSection(current) || '';
    const html = sameHtml + crossHtml;
    if (!html) return;
    const { node, position } = findInjectionPoint();
    if (position === 'before') {
      node.insertAdjacentHTML('beforebegin', html);
    } else {
      node.insertAdjacentHTML('beforeend', html);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
