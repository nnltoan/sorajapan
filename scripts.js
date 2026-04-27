/* ============================================
   SORA JAPAN – Interactivity & Animations
   ============================================ */

/* ============================================
   ANALYTICS CONFIG — điền ID vào đây khi đã có
   ============================================
   Hướng dẫn:
   1. Tạo property GA4 tại https://analytics.google.com → lấy Measurement ID dạng "G-XXXXXXXXXX"
   2. Dán vào biến GA4_ID bên dưới (thay cả dấu 'G-XXXXXXXXXX')
   3. Commit + deploy → GA4 tự động bắn trên toàn bộ 107 trang
   4. Để verify Google Search Console: xem meta tag trong <head> của index.html
   Nếu ID còn là placeholder, đoạn code GA4 sẽ KHÔNG chạy → an toàn 100%.
   ============================================ */
const ANALYTICS = {
  GA4_ID: 'G-PMXJ7W8WCY'  // GA4 Main Web stream — stream ID 14408864458
};

/* ============================================
   reCAPTCHA v3 CONFIG — chặn spam form
   ============================================
   1. Đăng ký tại https://www.google.com/recaptcha/admin/create
   2. Chọn reCAPTCHA v3 → domain: sorajapan.edu.vn + www.sorajapan.edu.vn
   3. Paste Site Key (public) bên dưới
   4. Secret Key dán vào google-apps-script/Code.gs (RECAPTCHA_SECRET)
   Khi Site Key còn placeholder: form vẫn submit nhưng KHÔNG có chống spam.
   ============================================ */
const RECAPTCHA_SITE_KEY = '6Lc-4cIsAAAAAL99ErCCzxAz7pZWaJhwS196Wqll'; // Sora Japan reCAPTCHA v3 Site Key (public)

// Inject reCAPTCHA script khi đã cấu hình
(function injectRecaptcha() {
  if (!RECAPTCHA_SITE_KEY || RECAPTCHA_SITE_KEY.includes('xxxxxxxx')) return;
  const s = document.createElement('script');
  s.src = 'https://www.google.com/recaptcha/api.js?render=' + RECAPTCHA_SITE_KEY;
  s.async = true; s.defer = true;
  document.head.appendChild(s);
})();

// Helper: lấy reCAPTCHA token cho 1 action, Promise<token|null>
window.getRecaptchaToken = function (action) {
  if (!RECAPTCHA_SITE_KEY || RECAPTCHA_SITE_KEY.includes('xxxxxxxx')) {
    return Promise.resolve(null); // chưa cấu hình → bỏ qua
  }
  return new Promise((resolve) => {
    if (typeof grecaptcha === 'undefined' || !grecaptcha.ready) {
      resolve(null);
      return;
    }
    grecaptcha.ready(() => {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: action || 'submit' })
        .then(token => resolve(token))
        .catch(() => resolve(null));
    });
  });
};

// Inject GA4 (gtag.js) — chỉ khi ID đã được điền thật
(function injectGA4() {
  if (!ANALYTICS.GA4_ID || ANALYTICS.GA4_ID === 'G-XXXXXXXXXX') return;

  // 1. Loader script từ Google
  const loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + ANALYTICS.GA4_ID;
  document.head.appendChild(loader);

  // 2. Khởi tạo gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ANALYTICS.GA4_ID, {
    anonymize_ip: true,
    send_page_view: true
  });
})();

// Helper: bắn sự kiện conversion tùy ý từ bất kỳ đâu
// VD: window.trackEvent('contact_form_submit', { program: 'Du hoc' });
window.trackEvent = function (name, params) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params || {});
  }
};

document.addEventListener('DOMContentLoaded', () => {

  // --- Config ---
  const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwE1UrOdpMcRdMPN1kPGPjFacHHOBcgSHkhKCn0SqQfjIvWPZ2NvLZKdX5z8rBQSLyihg/exec'
  };

  // --- Scroll throttle utility ---
  const throttleRAF = (fn) => {
    let ticking = false;
    return () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          fn();
          ticking = false;
        });
      }
    };
  };

  // --- Scroll-based header styling ---
  const header = document.querySelector('.header');
  const handleScroll = () => {
    if (!header) return;
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', throttleRAF(handleScroll), { passive: true });
  handleScroll();

  // --- Defensive state reset on page load ---
  // Recover from any leftover state if previous page's menu was open during navigation
  // (e.g., second-tap on parent dropbtn navigates while body.style.overflow='hidden').
  document.body.style.overflow = '';
  document.querySelectorAll('.nav-toggle.open, .nav-links.open, .dropdown.active').forEach(el => {
    el.classList.remove('open');
    el.classList.remove('active');
  });

  // --- Mobile nav: hamburger toggle handled by hamburgerFailsafe IIFE (document-level
  //     delegated capture-phase listener). Keep dropdown logic per-anchor below. ---
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    // Close nav when a link without dropdown is clicked, or handle dropdown toggle
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        const dropdownParent = link.parentElement;
        const isParentDropbtn = dropdownParent && dropdownParent.classList.contains('dropdown');

        // ── Mobile dropdown UX ──
        // Tap parent (submenu hidden) → expand this submenu, close others.
        // Tap parent (submenu showing) → navigate to parent page.
        // Tap parent of OTHER dropdown → close current submenu, open new one.
        // Tap child link → navigate to child page (default).
        if (isParentDropbtn && window.innerWidth <= 900) {
          if (!dropdownParent.classList.contains('active')) {
            e.preventDefault();
            // Close all other open dropdowns first
            document.querySelectorAll('.dropdown.active').forEach(d => {
              if (d !== dropdownParent) d.classList.remove('active');
            });
            // Open this one
            dropdownParent.classList.add('active');
            return; // Keep menu open
          }
          // Already expanded → second tap navigates to parent page.
          // Close the mobile menu overlay first so it doesn't linger after navigation.
          closeMobileMenu();
          return;
        }

        // Normal link behavior — child anchor or non-dropdown top link → close menu
        closeMobileMenu();
      });
    });
  }

  // Helper — reset all menu state. Called from dropdown click handler.
  function closeMobileMenu() {
    if (navToggle) navToggle.classList.remove('open');
    if (navLinks) navLinks.classList.remove('open');
    document.body.style.overflow = '';
    document.body.classList.remove('mobile-menu-open');
    document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
    const banner = document.querySelector('.urgency-banner');
    if (banner) banner.style.display = '';
  }

  // --- Active nav highlight on scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

  const highlightNav = () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === `#${current}`) {
        item.classList.add('active');
      }
    });
  };
  window.addEventListener('scroll', throttleRAF(highlightNav), { passive: true });

  // --- Scroll Reveal (IntersectionObserver) ---
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback: show everything
    revealElements.forEach(el => el.classList.add('visible'));
  }

  // --- Stat Counter Animation ---
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          const suffix = el.getAttribute('data-suffix') || '';
          const prefix = el.getAttribute('data-prefix') || '';
          const duration = 2000;
          const start = performance.now();

          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * eased);
            
            if (el.getAttribute('data-format') === 'year') {
              el.textContent = prefix + current + suffix;
              } else {
              el.textContent = prefix + current.toLocaleString('vi-VN') + suffix;
            }
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));
  }

  // --- Hero Particles ---
  const particleContainer = document.querySelector('.hero-particles');
  if (particleContainer) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.classList.add('hero-particle');
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (8 + Math.random() * 12) + 's';
      p.style.animationDelay = -(Math.random() * 20) + 's';
      p.style.width = (2 + Math.random() * 4) + 'px';
      p.style.height = p.style.width;
      particleContainer.appendChild(p);
    }
  }

  // --- Smooth scroll for all anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      // Skip bare "#" links (e.g. logo) — let them scroll to top naturally
      if (!href || href === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      try {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (_) {
        // Invalid selector — let the browser handle it normally
      }
    });
  });

  // --- Contact form (basic validation) ---
  const contactForm = document.getElementById('contact-form');
  const messageDiv = document.getElementById('message');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const submitBtn = this.querySelector('.form-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Đang gửi...';
      submitBtn.disabled = true;

      // Lấy reCAPTCHA token (nếu đã cấu hình) rồi submit
      window.getRecaptchaToken('contact_form').then((recaptchaToken) => {
        const payload = JSON.stringify({
          action: 'submitContact',
          hoTen: contactForm.querySelector('[name="ho-ten"]').value,
          sdt: contactForm.querySelector('[name="sdt"]').value,
          email: contactForm.querySelector('[name="email"]').value,
          chuongTrinh: contactForm.querySelector('[name="chuong-trinh"]').value,
          recaptchaToken: recaptchaToken || ''
        });

        // Use GET with payload param for small data (CORS-safe)
        const url = new URL(CONFIG.API_URL);
        url.searchParams.set('action', 'submitContact');
        url.searchParams.set('payload', payload);

        fetch(url.toString(), { redirect: 'follow' })
        .then(response => response.text())
        .then(text => {
          console.log('[Contact form] Response:', text.substring(0, 300));
          let data;
          try { data = JSON.parse(text); } catch (e) {
            console.error('[Contact form] JSON parse error:', e, text.substring(0, 500));
            if(messageDiv) messageDiv.innerHTML = '<p style="color:#ef4444; font-weight: 500;"><i class="fas fa-exclamation-circle"></i> Phản hồi không hợp lệ. Vui lòng thử lại sau.</p>';
          return;
        }
          if (data.result === 'success' || data.status === 'success') {
            if(messageDiv) messageDiv.innerHTML = '<p style="color:var(--color-success); font-weight: 500;"><i class="fas fa-check-circle"></i> Cảm ơn bạn! Thông tin đã được gửi thành công. Chúng tôi sẽ sớm liên hệ lại.</p>';
            // Track conversion trên GA4 (chỉ bắn khi GA4_ID đã được cấu hình)
            if (typeof window.trackEvent === 'function') {
              window.trackEvent('generate_lead', {
                form_name: 'contact_form_main',
                program: contactForm.querySelector('[name="chuong-trinh"]').value || 'unknown'
              });
          }
            contactForm.reset();
        } else {
            console.warn('[Contact form] Server error:', data.error || data);
            if(messageDiv) messageDiv.innerHTML = '<p style="color:#ef4444; font-weight: 500;"><i class="fas fa-exclamation-circle"></i> Có lỗi xảy ra, vui lòng thử lại sau.</p>';
        }
          })
        .catch(error => {
          console.error('[Contact form] Fetch error:', error);
          if(messageDiv) messageDiv.innerHTML = '<p style="color:#ef4444; font-weight: 500;"><i class="fas fa-exclamation-circle"></i> Không thể gửi thông tin. Vui lòng kiểm tra kết nối mạng và thử lại.</p>';
      })
        .finally(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
      }); // end getRecaptchaToken.then
    });
  }

  // --- Inject Floating Contact Buttons ---
  // Detect subfolder depth relative to site root (GitHub Pages: /sorajapan/)
  const siteRoot = '/sorajapan/';
  const currentDir = window.location.pathname.replace(/\/[^/]*$/, '/');
  // How many directories deep from siteRoot?
  const relPath = currentDir.startsWith(siteRoot) ? currentDir.slice(siteRoot.length) : currentDir;
  const depth = relPath.split('/').filter(Boolean).length;
  const basePath = depth > 0 ? '../'.repeat(depth) : './';

  // ===== EXIT-INTENT POPUP — thu lead khi user định rời trang =====
  (function initExitIntent() {
    // Không show lại trong cùng session
    if (sessionStorage.getItem('sora_popup_dismissed')) return;

    const popupHTML = `
      <div id="sora-exit-popup" style="position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);animation:fadeIn 0.3s ease;">
        <div style="background:white;border-radius:16px;max-width:480px;width:calc(100% - 32px);padding:32px 28px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
          <button id="sora-exit-close" aria-label="Đóng" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:24px;cursor:pointer;color:#888;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;">&times;</button>
          <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:44px;">🎌</div>
            <h3 style="margin:8px 0;font-size:22px;color:#d32f2f;font-weight:700;">Khoan đã!</h3>
            <p style="color:#444;margin:0;font-size:15px;line-height:1.5;">Để lại thông tin để nhận <strong>tư vấn lộ trình du học/kỹ sư Nhật Bản miễn phí</strong> từ chuyên gia Sora Japan.</p>
          </div>
          <form id="sora-exit-form" style="display:flex;flex-direction:column;gap:10px;">
            <input type="text" name="ho-ten" placeholder="Họ và tên *" required style="padding:12px 14px;border:1px solid #ddd;border-radius:8px;font-size:15px;font-family:inherit;">
            <input type="tel" name="sdt" placeholder="Số điện thoại *" required pattern="[0-9]{9,11}" style="padding:12px 14px;border:1px solid #ddd;border-radius:8px;font-size:15px;font-family:inherit;">
            <select name="chuong-trinh" required style="padding:12px 14px;border:1px solid #ddd;border-radius:8px;font-size:15px;font-family:inherit;background:white;">
              <option value="">Chương trình quan tâm *</option>
              <option value="Du học Nhật Bản">Du học Nhật Bản</option>
              <option value="Kỹ sư">Kỹ sư (CNTT, Cơ khí, Xây dựng, Điện)</option>
              <option value="Tokutei">Tokutei / Lao động có tay nghề</option>
              <option value="Điều dưỡng">Điều dưỡng</option>
              <option value="Học tiếng Nhật">Học tiếng Nhật</option>
            </select>
            <button type="submit" style="padding:12px;background:#d32f2f;color:white;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:4px;">Nhận tư vấn miễn phí</button>
            <div id="sora-exit-msg" style="text-align:center;font-size:14px;min-height:18px;"></div>
            <p style="font-size:11px;color:#888;text-align:center;line-height:1.5;margin:4px 0 0;">Bảo vệ bởi reCAPTCHA. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style="color:#555;text-decoration:underline;">Chính sách bảo mật</a> và <a href="https://policies.google.com/terms" target="_blank" rel="noopener" style="color:#555;text-decoration:underline;">Điều khoản</a> Google áp dụng.</p>
          </form>
          <p style="text-align:center;color:#888;font-size:12px;margin:12px 0 0;">Chúng tôi sẽ liên hệ trong vòng 24h</p>
        </div>
      </div>
      <style>@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }</style>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    const popup = document.getElementById('sora-exit-popup');
    const closeBtn = document.getElementById('sora-exit-close');
    const form = document.getElementById('sora-exit-form');
    const msgEl = document.getElementById('sora-exit-msg');
    let shown = false;

    function showPopup(trigger) {
      if (shown) return;
      if (sessionStorage.getItem('sora_popup_dismissed')) return;
      shown = true;
      popup.style.display = 'flex';
      if (typeof window.trackEvent === 'function') {
        window.trackEvent('popup_shown', { trigger: trigger });
      }
    }

    function dismissPopup() {
      popup.style.display = 'none';
      sessionStorage.setItem('sora_popup_dismissed', '1');
    }

    closeBtn.addEventListener('click', dismissPopup);
    popup.addEventListener('click', (e) => { if (e.target === popup) dismissPopup(); });

    // Desktop: mouse leaves top of viewport
    let mouseLeft = false;
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget && e.clientY <= 0 && !mouseLeft) {
        mouseLeft = true;
        showPopup('exit_intent_desktop');
      }
    });

    // Mobile: trigger after 45 seconds OR after scrolling past 70% of page
    if (window.innerWidth <= 900) {
      setTimeout(() => showPopup('mobile_time_45s'), 45000);
      let scrollTriggered = false;
      window.addEventListener('scroll', () => {
        if (scrollTriggered) return;
        const pct = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        if (pct >= 0.7) {
          scrollTriggered = true;
          showPopup('mobile_scroll_70pct');
        }
      }, { passive: true });
    }

    // Form submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Đang gửi...';
      msgEl.textContent = '';

      const CONFIG_API = 'https://script.google.com/macros/s/AKfycbwE1UrOdpMcRdMPN1kPGPjFacHHOBcgSHkhKCn0SqQfjIvWPZ2NvLZKdX5z8rBQSLyihg/exec';

      window.getRecaptchaToken('popup_form').then((recaptchaToken) => {
        const payload = JSON.stringify({
          action: 'submitContact',
          hoTen: form.querySelector('[name="ho-ten"]').value,
          sdt: form.querySelector('[name="sdt"]').value,
          email: '',
          chuongTrinh: form.querySelector('[name="chuong-trinh"]').value,
          source: 'exit_intent_popup',
          recaptchaToken: recaptchaToken || ''
        });

        const url = new URL(CONFIG_API);
        url.searchParams.set('action', 'submitContact');
        url.searchParams.set('payload', payload);

        fetch(url.toString(), { redirect: 'follow' })
          .then(r => r.text())
          .then(t => {
            let data = {};
            try { data = JSON.parse(t); } catch (_) {}
            if (data.result === 'success' || data.status === 'success') {
              msgEl.style.color = '#16a34a';
              msgEl.textContent = 'Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm.';
              if (typeof window.trackEvent === 'function') {
                window.trackEvent('generate_lead', { form_name: 'exit_popup', program: form.querySelector('[name="chuong-trinh"]').value });
              }
              sessionStorage.setItem('sora_popup_dismissed', '1');
              setTimeout(() => { popup.style.display = 'none'; }, 1800);
            } else {
              msgEl.style.color = '#ef4444';
              msgEl.textContent = 'Có lỗi xảy ra, vui lòng thử lại.';
            }
          })
          .catch(() => {
            msgEl.style.color = '#ef4444';
            msgEl.textContent = 'Không gửi được, kiểm tra mạng.';
          })
          .finally(() => {
            btn.disabled = false;
            btn.textContent = originalText;
          });
      });
    });
  })();

  const floatingHTML = `
    <!-- Floating Contact Buttons -->
    <div class="floating-contact">
      <!-- Messenger — white bubble icon on Messenger blue gradient -->
      <a href="https://m.me/61568999725231" target="_blank" class="floating-btn btn-messenger" title="Chat Messenger" aria-label="Chat qua Messenger">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="30" height="30" fill="#ffffff" aria-hidden="true">
          <path d="M18 2C9.2 2 2 8.7 2 16.9c0 4.7 2.3 8.8 5.9 11.4v5.7l5.4-3c1.4.4 2.9.6 4.7.6 8.8 0 16-6.7 16-14.9S26.8 2 18 2zm1.6 20l-4.1-4.4-8 4.4 8.8-9.3 4.2 4.4 7.9-4.4-8.8 9.3z"/>
        </svg>
      </a>

      <!-- Zalo — white wordmark on Zalo blue -->
      <a href="https://zalo.me/0903539537" target="_blank" class="floating-btn btn-zalo" title="Chat Zalo ngay" aria-label="Chat qua Zalo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24" width="38" height="19" aria-hidden="true">
          <text x="24" y="19" text-anchor="middle" fill="#ffffff" font-family="Arial Black, Arial, sans-serif" font-size="20" font-weight="900" letter-spacing="-0.5">Zalo</text>
        </svg>
      </a>

      <!-- Call -->
      <a href="tel:0903539537" class="floating-btn btn-call" title="Gọi ngay" aria-label="Gọi hotline">
        <svg fill="#ffffff" width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', floatingHTML);
});

/* ============================================================================
   UI MODERNIZATION — interactive enhancements
   - Magnetic button hover (attracts to cursor within radius)
   - Hero parallax on scroll (subtle depth)
   - Text reveal line split for .reveal-lines elements
   - Stagger indices auto-assigned for legacy IntersectionObserver fallback
   - Dynamic kanji watermark follow-scroll subtle float
   ============================================================================ */
(function uiModernization() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  /* ---------- Magnetic buttons ---------- */
  // Add class .btn-magnetic to any button/link to enable
  document.addEventListener('DOMContentLoaded', () => {
    const magneticTargets = document.querySelectorAll('.btn-primary, .btn-magnetic, .nav-cta, .hero-actions .btn');
    magneticTargets.forEach(el => {
      el.classList.add('btn-magnetic');
      const strength = 0.35;
      const radius = 90;

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius * 1.4) return;
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  });

  /* ---------- Hero parallax ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const bg = hero.querySelector('.hero-bg');
    const particles = hero.querySelector('.hero-particles');
    const content = hero.querySelector('.hero-content');
    const floating = hero.querySelector('.hero-floating');
    let ticking = false;

    function updateParallax() {
      const y = window.scrollY;
      if (y > window.innerHeight * 1.1) { ticking = false; return; }
      if (bg)       bg.style.transform       = `translateY(${y * 0.25}px) scale(${1 + y * 0.0003})`;
      if (particles) particles.style.transform = `translateY(${y * 0.15}px)`;
      if (content)  content.style.transform   = `translateY(${y * -0.08}px)`;
      if (floating) floating.style.transform  = `translate(${y * -0.04}px, calc(-50% + ${y * -0.12}px))`;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  });

  /* ---------- Text reveal: split lines for hero H1 with .reveal-lines ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const targets = document.querySelectorAll('.reveal-lines');
    targets.forEach(el => {
      if (el.dataset.split === 'done') return;
      const html = el.innerHTML;
      // Simple word-based split wrapped so each word animates on its own row
      const words = html.split(/(<[^>]+>|\s+)/).filter(Boolean);
      let out = '';
      let idx = 0;
      words.forEach(w => {
        if (/^\s+$/.test(w)) { out += ' '; return; }
        if (/^<[^>]+>$/.test(w)) { out += w; return; }
        out += `<span style="display:inline-block;overflow:hidden;vertical-align:top;"><span style="display:inline-block;--i:${idx};transform:translateY(110%);animation:lineRise 900ms cubic-bezier(0.19,1,0.22,1) forwards;animation-delay:calc(${idx} * 60ms + 180ms);">${w}</span></span>`;
        idx++;
      });
      el.innerHTML = out;
      el.dataset.split = 'done';
    });
  });

  /* ---------- Auto-assign stagger --stagger-i for Safari/older browsers ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.stagger-children').forEach(parent => {
      Array.from(parent.children).forEach((child, i) => {
        child.style.setProperty('--stagger-i', i + 1);
      });
    });
  });

  /* ---------- Kanji watermark subtle float on scroll ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const kanjiHeaders = document.querySelectorAll('.section-header[data-kanji]');
    if (!kanjiHeaders.length) return;
    let ticking = false;
    function updateKanji() {
      const y = window.scrollY;
      kanjiHeaders.forEach((header) => {
        const rect = header.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const offset = (rect.top - window.innerHeight / 2) * 0.04;
        header.style.setProperty('--kanji-offset', `${offset}px`);
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateKanji); ticking = true; }
    }, { passive: true });
  });

  /* ---------- Service cards: 3D tilt on hover (light touch) ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.service-card, .case-card, .hero-float-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;  // 0..1
        const y = (e.clientY - rect.top) / rect.height;  // 0..1
        const rx = (y - 0.5) * -4;  // max 4deg
        const ry = (x - 0.5) * 4;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  });

  /* ---------- Smooth scroll progress bar (top) ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText = `
      position: fixed; top: 0; left: 0; height: 3px; width: 0%;
      background: linear-gradient(90deg, #1E3A5F, #C8383E, #C9A961);
      z-index: 9999; transition: width 120ms linear; pointer-events: none;
    `;
    document.body.appendChild(bar);

    let ticking = false;
    function updateBar() {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
      bar.style.width = `${Math.max(0, Math.min(1, scrolled)) * 100}%`;
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateBar); ticking = true; }
    }, { passive: true });
  });
})();
/* END UI MODERNIZATION */


/* ============================================================================
   BREAKTHROUGH ANIMATION INTERACTIVITY
   - Cursor-follow spotlight on hero
   - Counter reel digit effect with glitch
   - Scroll-velocity reactive marquee speed
   - Title glitch/decrypt flash on first reveal
   - Smooth cursor trail on buttons
   ============================================================================ */
(function breakthroughAnimations() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  /* ---------- 1. Cursor Spotlight on Hero ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    let raf = null;
    hero.addEventListener('mousemove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty('--mx', `${mx}%`);
        hero.style.setProperty('--my', `${my}%`);
        raf = null;
      });
    });
  });

  /* ---------- 2. Counter Reel Effect ---------- */
  /* Hijack existing counter animation to add glitch + burst */
  document.addEventListener('DOMContentLoaded', () => {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const formatNumber = (n, format) => {
      if (format === 'year') return String(n);
      // Add thousand separator (Vietnamese locale: dot)
      return n.toLocaleString('vi-VN');
    };

    const animateCounter = (el) => {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || '';
      const format = el.dataset.format || '';
      const duration = 1800;
      const start = performance.now();
      const startValue = 0;
      // Easing: ease-out-expo for dramatic slowdown
      const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

      let lastVal = -1;

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        const current = Math.floor(startValue + (target - startValue) * eased);

        if (current !== lastVal) {
          el.textContent = formatNumber(current, format) + suffix;
          // Brief reel glitch on digit change
          el.classList.remove('count-reel');
          void el.offsetWidth; // force reflow
          el.classList.add('count-reel');
          lastVal = current;
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = formatNumber(target, format) + suffix;
          el.classList.remove('count-reel');
          el.classList.add('count-done');
          setTimeout(() => el.classList.remove('count-done'), 650);
        }
      }
      requestAnimationFrame(step);
    };

    // IntersectionObserver to trigger when visible
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(el => {
      // Skip if already counted by prior JS
      if (!el.dataset.counted) {
        el.textContent = '0';
        io.observe(el);
      }
    });
  });

  /* ---------- 3. Scroll-Velocity Reactive Marquee ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const marquees = document.querySelectorAll('.marquee');
    if (!marquees.length) return;

    let lastY = window.scrollY;
    let lastTime = performance.now();
    let currentSpeed = 1;
    let targetSpeed = 1;

    window.addEventListener('scroll', () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastY);
      const dt = now - lastTime;
      const velocity = dy / dt; // px/ms
      // Map velocity 0..5 → speed 1..2.8
      targetSpeed = Math.min(2.8, 1 + velocity * 0.35);
      lastY = window.scrollY;
      lastTime = now;
    }, { passive: true });

    function tick() {
      // Smooth lerp toward target, decay back to 1 when not scrolling
      currentSpeed += (targetSpeed - currentSpeed) * 0.08;
      targetSpeed += (1 - targetSpeed) * 0.04; // decay
      marquees.forEach(m => m.style.setProperty('--marquee-speed', currentSpeed.toFixed(2)));
      requestAnimationFrame(tick);
    }
    tick();
  });

  /* ---------- 4. Title Decrypt Glitch Flash on First Reveal ---------- */
  /* Randomize chars briefly then settle to original — delightful surprise */
  document.addEventListener('DOMContentLoaded', () => {
    const titles = document.querySelectorAll('.section-title');
    const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';

    const decrypt = (el) => {
      if (el.dataset.decrypted) return;
      el.dataset.decrypted = '1';
      const original = el.innerHTML;
      const plainText = el.textContent;
      // Only decrypt text nodes, preserve <em> tags. Simpler: scramble innerText briefly.
      const iterations = 8;
      let i = 0;
      const interval = setInterval(() => {
        let scrambled = '';
        for (let j = 0; j < plainText.length; j++) {
          if (Math.random() < i / iterations || plainText[j] === ' ' || plainText[j] === '\n') {
            scrambled += plainText[j];
          } else {
            scrambled += glyphs[Math.floor(Math.random() * glyphs.length)];
          }
        }
        el.textContent = scrambled;
        i++;
        if (i > iterations) {
          clearInterval(interval);
          el.innerHTML = original; // restore with emphasis tags
        }
      }, 42);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          decrypt(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    titles.forEach(t => io.observe(t));
  });

  /* ---------- 5. Cursor Trail on Hero Primary Buttons ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const btns = document.querySelectorAll('.btn-primary, .btn-secondary');
    btns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty('--bx', `${x}%`);
        btn.style.setProperty('--by', `${y}%`);
      });
    });
  });

  /* ---------- 6. Service Card 3D Tilt + Glow Spot ---------- */
  /* Upgrade: add CSS variable for a "hover glow spot" that follows mouse */
  document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.service-card, .case-card, .problem-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--gx', `${x}%`);
        card.style.setProperty('--gy', `${y}%`);
      });
    });
  });

  /* ---------- 7. Kanji Watermark Cursor Reactivity ---------- */
  /* Kanji subtly leans toward cursor when section is hovered */
  document.addEventListener('DOMContentLoaded', () => {
    const kanjiHeaders = document.querySelectorAll('.section-header[data-kanji]');
    kanjiHeaders.forEach(header => {
      header.addEventListener('mousemove', (e) => {
        const rect = header.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const dy = (e.clientY - rect.top - rect.height / 2) / rect.height;
        header.style.setProperty('--kanji-dx', `${dx * 20}px`);
        header.style.setProperty('--kanji-dy', `${dy * 14}px`);
      });
      header.addEventListener('mouseleave', () => {
        header.style.setProperty('--kanji-dx', '0px');
        header.style.setProperty('--kanji-dy', '0px');
      });
    });
  });
})();
/* END BREAKTHROUGH ANIMATIONS */


/* ============================================================================
   ACTIVE NAV HIGHLIGHTING
   - Auto-highlight nav-links item based on current URL
   - When on a detail page, parent dropdown button (.dropbtn) gets .active too
   - Also adds .active to exact submenu link if matches current page
   - Removes hardcoded class="active" on Trang chủ from non-home pages
   ============================================================================ */
(function activeNavHighlight() {
  // Map category folder slug → nav href that should be highlighted
  // (truong/dieu-duong fall under "Đối tác" since schools/medical partners are listed there)
  const CATEGORY_TO_NAV = {
    'du-hoc':         'du-hoc/index.html',
    'ky-su':          'ky-su/index.html',
    'tieng-nhat':     'tieng-nhat/index.html',
    'doi-tac':        'doi-tac/index.html',
    'truong':         'doi-tac/index.html',  // schools listed under Partners
    'dieu-duong':     'doi-tac/index.html',
    'don-hang-ky-su': 'ky-su/index.html'
  };

  function detectCategory(path) {
    const m = path.match(/\/(du-hoc|ky-su|tieng-nhat|dieu-duong|truong|doi-tac|don-hang-ky-su)(?:\/|$)/);
    if (m) return m[1];
    if (/tin-tuc(-detail)?\.html$/.test(path)) return 'tin-tuc';
    return 'home';
  }

  function highlight() {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;

    // Strip ALL existing .active to start fresh (overrides hardcoded class="active" on home)
    nav.querySelectorAll('.active').forEach(el => el.classList.remove('active'));

    const currentPath = window.location.pathname;
    const category = detectCategory(currentPath);

    const links = Array.from(nav.querySelectorAll('a'));

    // 1) Exact submenu match — highlight the deepest matching link first
    let exactLink = null;
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#')) continue;
      try {
        const linkPath = new URL(href, window.location.href).pathname;
        if (linkPath === currentPath) {
          exactLink = a;
          break;
        }
      } catch (_) {}
    }
    if (exactLink) {
      exactLink.classList.add('active');
      // If inside a dropdown, also highlight parent .dropbtn AND the .dropdown wrapper
      const parent = exactLink.closest('.dropdown');
      if (parent) {
        parent.classList.add('active');
        const btn = parent.querySelector('.dropbtn');
        if (btn) btn.classList.add('active');
      }
    }

    // 2) Category match — resolve hrefs to absolute paths so relative URLs match
    if (category !== 'home' && category !== 'tin-tuc') {
      const targetHrefSuffix = CATEGORY_TO_NAV[category];
      if (targetHrefSuffix) {
        for (const a of links) {
          const href = a.getAttribute('href') || '';
          if (!href || href.startsWith('#')) continue;
          let linkPath;
          try {
            linkPath = new URL(href, window.location.href).pathname;
          } catch (_) { continue; }
          // Compare absolute path tail against targetHrefSuffix
          if (linkPath.endsWith('/' + targetHrefSuffix) || linkPath.endsWith(targetHrefSuffix)) {
            a.classList.add('active');
            const parent = a.closest('.dropdown');
            if (parent) parent.classList.add('active');
          }
        }
      }
    }

    // 3) Tin tức special
    if (category === 'tin-tuc') {
      for (const a of links) {
        const href = a.getAttribute('href') || '';
        if (/tin-tuc\.html(\?|$|#)/.test(href)) {
          a.classList.add('active');
        }
      }
    }

    // 4) Home
    if (category === 'home') {
      // Home page: index.html (root) — find link that points to index.html#home or root
      const isRootIndex = /(?:^|\/)(index\.html)?$/.test(currentPath) ||
                          currentPath === '/' ||
                          currentPath.endsWith('/index.html') === false; // fallthrough

      // Prefer exact "#home" link
      for (const a of links) {
        const href = a.getAttribute('href') || '';
        if (/index\.html#home$/.test(href) || href === '#home' || href === '/' || href === 'index.html') {
          a.classList.add('active');
          break;
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlight);
  } else {
    highlight();
  }
})();
/* END ACTIVE NAV HIGHLIGHTING */


/* ============================================================================
   DEFENSIVE NAV HREF GUARD
   For top-level nav links (Đối tác, Tin tức, dropbtn parent links, etc.) — bypass
   any interfering smooth-scroll or click handler by forcing navigation via
   window.location.assign in capture phase. Stops other listeners from preventing
   default navigation on legit page links.
   ============================================================================ */
(function navHrefGuard() {
  function setup() {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;

    nav.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href') || '';
      // Skip empty / pure-anchor / no-href links — anchors are for in-page scroll, leave alone
      if (!href || href.startsWith('#')) return;
      // Skip submenu items (.dropdown-content a) — handled normally for now
      if (a.closest('.dropdown-content')) return;

      a.addEventListener('click', (e) => {
        // Allow modifier-clicks (cmd/ctrl/shift/middle) for new-tab/save-link behavior
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (a.target === '_blank') return;

        // Mobile dropdown UX — let dropdown toggle handler expand submenu BEFORE navigating.
        // Parent dropbtn only navigates when its submenu is already shown (second tap).
        if (window.innerWidth <= 900) {
          const dropdownEl = a.closest('.dropdown');
          if (dropdownEl && !dropdownEl.classList.contains('active')) {
            // Submenu chưa show — không force navigate, để dropdown logic mở submenu
            return;
          }
        }

        let absolute;
        try {
          absolute = new URL(href, window.location.href).href;
        } catch (_) { return; }

        // Force navigation, bypassing any other click handler
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.assign(absolute);
      }, true); // capture phase — runs before any other listener
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
/* END DEFENSIVE NAV HREF GUARD */


/* ============================================================================
   CONTACT MODAL — auto-injects on non-home pages
   - On home page: links pointing to #contact still scroll naturally
   - On other pages: clicking same link opens modal with cloned form
   - Reuses reCAPTCHA + Google Apps Script submission logic
   ============================================================================ */
(function contactModal() {
  // Detect if current page is the ROOT home (only place where #contact section exists)
  function isHomePage() {
    const path = window.location.pathname;
    // Any subfolder pages → NOT home
    const subfolders = ['du-hoc', 'ky-su', 'tieng-nhat', 'dieu-duong', 'doi-tac', 'truong', 'don-hang-ky-su'];
    for (const sub of subfolders) {
      if (path.includes('/' + sub + '/')) return false;
    }
    // Specific top-level non-home pages
    const otherTopPages = ['tin-tuc.html', 'tin-tuc-detail.html', 'case-study.html', 'admin.html', 'quotation.html'];
    for (const p of otherTopPages) {
      if (path.endsWith('/' + p) || path.endsWith(p)) return false;
    }
    // Otherwise = root home (path '/', '/index.html', or any other root file)
    return true;
  }

  function buildModalHTML() {
    return `
<div class="contact-modal-overlay" id="contact-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
  <div class="contact-modal" role="document">
    <button type="button" class="contact-modal-close" aria-label="Đóng" id="contact-modal-close-btn">×</button>
    <div class="contact-modal-header">
      <div class="contact-modal-eyebrow">Liên hệ</div>
      <h2 class="contact-modal-title" id="contact-modal-title">Bắt đầu hành trình của bạn</h2>
      <p class="contact-modal-subtitle">Để lại thông tin, đội ngũ chuyên gia Sora Japan sẽ liên hệ tư vấn lộ trình phù hợp nhất hoàn toàn miễn phí.</p>
    </div>
    <form id="contact-form-modal" novalidate>
      <div class="form-group">
        <label for="ho-ten-modal" class="form-label">Họ và tên *</label>
        <input type="text" id="ho-ten-modal" name="ho-ten" class="form-input" placeholder="Nhập họ tên của bạn" required>
      </div>
      <div class="form-group">
        <label for="sdt-modal" class="form-label">Số điện thoại *</label>
        <input type="tel" id="sdt-modal" name="sdt" class="form-input" placeholder="090x xxx xxx" required pattern="[0-9]{9,11}">
      </div>
      <div class="form-group">
        <label for="email-modal" class="form-label">Email *</label>
        <input type="email" id="email-modal" name="email" class="form-input" placeholder="email@example.com" required>
      </div>
      <div class="form-group">
        <label for="chuong-trinh-modal" class="form-label">Bạn quan tâm đến chương trình nào?</label>
        <select id="chuong-trinh-modal" name="chuong-trinh" class="form-input" required>
          <option value="">Chọn chương trình</option>
          <option value="Du học Nhật Bản">Du học Nhật Bản</option>
          <option value="Kỹ sư CNTT">Kỹ sư CNTT</option>
          <option value="Kỹ sư Cơ khí">Kỹ sư Cơ khí</option>
          <option value="Điều dưỡng">Điều dưỡng</option>
          <option value="Học tiếng Nhật">Học tiếng Nhật</option>
        </select>
      </div>
      <button type="submit" class="form-submit">Gửi yêu cầu tư vấn</button>
    </form>
    <div id="contact-modal-message" class="contact-modal-message" aria-live="polite"></div>
    <p class="contact-modal-disclaimer">
      Biểu mẫu này được bảo vệ bởi reCAPTCHA. Áp dụng <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Chính sách bảo mật</a> và <a href="https://policies.google.com/terms" target="_blank" rel="noopener">Điều khoản dịch vụ</a> của Google.
    </p>
    <div class="contact-modal-quick">
      <a href="tel:0903539537">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        Gọi ngay
      </a>
      <a href="https://zalo.me/0903539537" target="_blank" rel="noopener" class="quick-zalo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#0068FF"/>
          <text x="12" y="16" text-anchor="middle" fill="#ffffff" font-family="Arial Black, Arial, sans-serif" font-size="9" font-weight="900" letter-spacing="-0.4">Zalo</text>
        </svg>
        Chat Zalo
      </a>
    </div>
  </div>
</div>`;
  }

  function inject() {
    // Always inject — modal is hidden by default
    if (document.getElementById('contact-modal-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', buildModalHTML());

    const overlay = document.getElementById('contact-modal-overlay');
    const closeBtn = document.getElementById('contact-modal-close-btn');
    const form = document.getElementById('contact-form-modal');
    const messageDiv = document.getElementById('contact-modal-message');

    function open() {
      overlay.classList.add('show');
      document.body.classList.add('contact-modal-open');
      // Focus first input for UX
      setTimeout(() => {
        const first = form.querySelector('input');
        if (first) first.focus();
      }, 200);
    }
    function close() {
      overlay.classList.remove('show');
      document.body.classList.remove('contact-modal-open');
      messageDiv.textContent = '';
      messageDiv.style.color = '';
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('show')) close();
    });

    // Form submit handler — same logic as inline form, just with modal IDs
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = form.querySelector('.form-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Đang gửi...';
      submitBtn.disabled = true;
      messageDiv.style.color = '';
      messageDiv.textContent = '';

      const tokenPromise = (typeof window.getRecaptchaToken === 'function')
        ? window.getRecaptchaToken('contact_form_modal')
        : Promise.resolve(null);

      tokenPromise.then((recaptchaToken) => {
        const payload = JSON.stringify({
          action: 'submitContact',
          hoTen: form.querySelector('[name="ho-ten"]').value,
          sdt: form.querySelector('[name="sdt"]').value,
          email: form.querySelector('[name="email"]').value,
          chuongTrinh: form.querySelector('[name="chuong-trinh"]').value,
          recaptchaToken: recaptchaToken || ''
        });

        // Use the SAME Google Apps Script endpoint as the inline form (CONFIG.API_URL)
        // Use GET with payload param for CORS-safe submission (matching main form behavior)
        const apiUrl = (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
          ? CONFIG.API_URL
          : 'https://script.google.com/macros/s/AKfycbwE1UrOdpMcRdMPN1kPGPjFacHHOBcgSHkhKCn0SqQfjIvWPZ2NvLZKdX5z8rBQSLyihg/exec';
        const url = new URL(apiUrl);
        url.searchParams.set('action', 'submitContact');
        url.searchParams.set('payload', payload);

        return fetch(url.toString(), { redirect: 'follow' })
          .then(r => r.text())
          .then(text => {
            let data;
            try { data = JSON.parse(text); } catch (e) {
              throw new Error('Phản hồi không hợp lệ');
            }
            if (data.result === 'success' || data.status === 'success') {
              return true;
            }
            throw new Error(data.message || 'Lỗi không xác định');
          });
      })
      .then(() => {
        // Track GA4 event if available
        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', { form_name: 'contact_form_modal' });
        }
        messageDiv.style.color = '#16A34A';
        messageDiv.innerHTML = '<strong>✓ Cảm ơn bạn!</strong> Sora Japan sẽ liên hệ trong vòng 24h.';
        form.reset();
        // Auto-close after 3.5s
        setTimeout(close, 3500);
      })
      .catch((err) => {
        messageDiv.style.color = '#EF4444';
        messageDiv.textContent = 'Không gửi được, vui lòng kiểm tra mạng hoặc gọi hotline 0903 539 537.';
        console.warn('[Contact modal]', err);
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
    });

    // -------- Contact-link interception (off-home pages) --------
    // Strategy (defense in depth):
    //  1. REWRITE href on all matching anchors: index.html#contact / #contact → #contact-modal
    //     This prevents ANY navigation to /index.html#contact even if JS fails afterwards.
    //  2. CAPTURE-PHASE click listener: opens modal when any [data-contact-modal] anchor
    //     OR any [href$=#contact-modal] anchor is clicked.
    //  3. MUTATION OBSERVER: re-runs rewrite when new content is injected dynamically
    //     (e.g., related-pages.js inserting cards after page load).
    const onHome = isHomePage();

    function pointsToHomeContact(href) {
      return /(^|\/)index\.html#contact$/i.test(href) || href === '#contact';
    }
    function rewriteContactLinks(root) {
      (root || document).querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (pointsToHomeContact(href)) {
          a.setAttribute('href', '#contact-modal');
          a.setAttribute('data-contact-modal', 'true');
          a.removeAttribute('data-original-href'); // keep simple — no need to restore
        }
      });
    }

    if (!onHome) {
      // Off-home: rewrite immediately
      rewriteContactLinks(document);

      // Re-rewrite on dynamic content injection (related-pages.js etc.)
      try {
        const mo = new MutationObserver((mutations) => {
          for (const m of mutations) {
            for (const node of m.addedNodes) {
              if (node.nodeType === 1) rewriteContactLinks(node);
            }
          }
        });
        mo.observe(document.body, { childList: true, subtree: true });
      } catch (_) {}
    }

    // Click listener — capture phase, runs BEFORE any other handler
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href') || '';

      // Modal triggers: rewritten anchor (data-contact-modal) OR raw home-contact href
      const isModalTrigger =
        link.hasAttribute('data-contact-modal') ||
        href === '#contact-modal' ||
        pointsToHomeContact(href);
      if (!isModalTrigger) return;

      // Allow modifier clicks (cmd/ctrl/shift/middle) for new tab
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (link.target === '_blank') return;

      if (onHome && pointsToHomeContact(href)) {
        // On home, raw #contact href → let smooth-scroll handler do its job
        return;
      }

      // Off-home OR rewritten anchor → open modal
      e.preventDefault();
      e.stopImmediatePropagation();
      open();
    }, true);

    // Expose openContactModal globally
    window.openContactModal = open;
    window.closeContactModal = close;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
/* END CONTACT MODAL */


/* ============================================================================
   FAILSAFE: Header scrolled-state observer
   Some pages may have an early JS error preventing the main DOMContentLoaded
   handler from attaching the scroll listener. This standalone IIFE attaches
   independently of any other code so .scrolled class is always added/removed.
   ============================================================================ */
(function headerScrolledFailsafe() {
  function setup() {
    const header = document.querySelector('.header');
    if (!header) return;
    function update() {
      if (window.scrollY > 60) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
/* END HEADER FAILSAFE */


/* ============================================================================
   HAMBURGER FAILSAFE — delegated click handler tại document level.
   Đảm bảo hamburger luôn fire dù direct attach trong main IIFE bị fail.
   Cũng auto-hide urgency banner khi menu open (fallback nếu :has() CSS không support).
   ============================================================================ */
(function hamburgerFailsafe() {
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.nav-toggle');
    if (!toggle) return;
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    // Block default + ngăn các handler khác fire trên cùng button
    e.preventDefault();
    e.stopPropagation();
    const willOpen = !navLinks.classList.contains('open');
    toggle.classList.toggle('open', willOpen);
    navLinks.classList.toggle('open', willOpen);
    document.body.style.overflow = willOpen ? 'hidden' : '';
    document.body.classList.toggle('mobile-menu-open', willOpen);
    if (!willOpen) {
      document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
    }
    // Belt-and-suspenders: hide urgency banner via JS in case :has() CSS fails
    const banner = document.querySelector('.urgency-banner');
    if (banner) {
      banner.style.display = willOpen ? 'none' : '';
    }
  }, true); // capture phase — wins over any other click handler

  // Also reset state on pageshow (back/forward cache restore)
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return; // chỉ khi từ bfcache
    document.body.style.overflow = '';
    document.body.classList.remove('mobile-menu-open');
    document.querySelectorAll('.nav-toggle.open, .nav-links.open, .dropdown.active').forEach(el => {
      el.classList.remove('open');
      el.classList.remove('active');
    });
    const banner = document.querySelector('.urgency-banner');
    if (banner) banner.style.display = '';
  });
})();
/* END HAMBURGER FAILSAFE */


/* ============================================================================
   URGENCY COUNTDOWN BANNER
   Sticky banner top of page với live countdown tới deadline tuyển sinh.
   - Auto-injects vào home + 4 trang dịch vụ chính (du-hoc, ky-su, tieng-nhat, dieu-duong)
   - Dismissible (X button) — lưu sessionStorage, reset khi tab đóng
   - Tự ẩn khi past deadline
   - CTA button mở modal liên hệ (off-home) hoặc scroll to #contact (home)
   ============================================================================ */
(function urgencyBanner() {
  // -------- CONFIG --------
  const DEADLINE = new Date('2026-06-30T23:59:59+07:00').getTime();
  const DEADLINE_LABEL = '30/06/2026';
  const TITLE = 'Kỳ tuyển sinh tháng 10/2026';
  const STORAGE_KEY = 'sj_urgency_dismissed_2026_10';

  function shouldShowOnPage() {
    const path = window.location.pathname;
    // Whitelist explicit: home + 4 trang dịch vụ chính
    const allowed = [
      '/', '/index.html',
      '/du-hoc/', '/du-hoc/index.html',
      '/ky-su/', '/ky-su/index.html',
      '/tieng-nhat/', '/tieng-nhat/index.html',
      '/dieu-duong/', '/dieu-duong/index.html'
    ];
    return allowed.includes(path);
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function buildBannerHTML() {
    return `
<div class="urgency-banner" id="urgency-banner" role="region" aria-label="Hạn đăng ký">
  <div class="urgency-inner">
    <span class="urgency-eyebrow"><span>Hạn đăng ký</span></span>
    <span class="urgency-text">${TITLE} — đóng đăng ký <strong>${DEADLINE_LABEL}</strong></span>
    <div class="urgency-countdown" aria-live="polite" aria-atomic="true">
      <div class="urgency-time"><span data-urgency-d>00</span><label>ngày</label></div>
      <div class="urgency-time"><span data-urgency-h>00</span><label>giờ</label></div>
      <div class="urgency-time"><span data-urgency-m>00</span><label>phút</label></div>
      <div class="urgency-time"><span data-urgency-s>00</span><label>giây</label></div>
    </div>
    <a href="#contact-modal" class="urgency-cta" data-contact-modal="true">Đăng ký ngay</a>
    <button type="button" class="urgency-close" aria-label="Đóng banner">×</button>
  </div>
</div>`;
  }

  function init() {
    if (!shouldShowOnPage()) return;

    // Past deadline — don't show
    if (Date.now() >= DEADLINE) return;

    // User previously dismissed in this session
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    } catch (_) {}

    // Inject banner at top of body
    document.body.insertAdjacentHTML('afterbegin', buildBannerHTML());
    document.body.classList.add('has-urgency');

    const banner = document.getElementById('urgency-banner');
    if (!banner) return;

    const dEl = banner.querySelector('[data-urgency-d]');
    const hEl = banner.querySelector('[data-urgency-h]');
    const mEl = banner.querySelector('[data-urgency-m]');
    const sEl = banner.querySelector('[data-urgency-s]');
    const closeBtn = banner.querySelector('.urgency-close');
    let timerId = null;

    function tick() {
      const now = Date.now();
      const diff = DEADLINE - now;
      if (diff <= 0) {
        hide();
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (dEl) dEl.textContent = pad2(days);
      if (hEl) hEl.textContent = pad2(hours);
      if (mEl) mEl.textContent = pad2(mins);
      if (sEl) sEl.textContent = pad2(secs);
    }

    function hide() {
      banner.classList.remove('show');
      document.body.classList.remove('has-urgency');
      setTimeout(() => banner.remove(), 400);
      if (timerId) clearInterval(timerId);
    }

    closeBtn.addEventListener('click', () => {
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
      hide();
    });

    // Initial tick + animate in
    tick();
    requestAnimationFrame(() => banner.classList.add('show'));
    timerId = setInterval(tick, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
/* END URGENCY BANNER */


/* ============================================================================
   VIDEO TESTIMONIAL — lite-youtube lazy embed
   Click thumbnail → swap to YouTube iframe with autoplay=1.
   Saves ~500KB initial JS + iframe cost per page.
   ============================================================================ */
(function videoTestimonialLazy() {
  function setup() {
    document.querySelectorAll('.video-card-frame[data-yt-id]').forEach(frame => {
      // Only attach once
      if (frame.dataset.bound === '1') return;
      frame.dataset.bound = '1';

      frame.addEventListener('click', (e) => {
        e.preventDefault();
        const ytId = frame.getAttribute('data-yt-id');
        if (!ytId || frame.classList.contains('is-playing')) return;
        // Build iframe URL — use youtube-nocookie for privacy + autoplay
        const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}?autoplay=1&rel=0&modestbranding=1`;
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = frame.getAttribute('aria-label') || 'Video testimonial';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        // Remove existing thumbnail content + insert iframe
        const img = frame.querySelector('img');
        if (img) img.style.display = 'none';
        frame.appendChild(iframe);
        frame.classList.add('is-playing');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
/* END VIDEO TESTIMONIAL */
