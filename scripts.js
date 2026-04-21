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

  // --- Mobile nav toggle ---
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
      
      // Reset dropdowns when closing the menu
      if (!navLinks.classList.contains('open')) {
        document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
      }
    });

    // Close nav when a link without dropdown is clicked, or handle dropdown toggle
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        const dropdownParent = link.parentElement;
        
        // Mobile dropdown logic
        if (dropdownParent && dropdownParent.classList.contains('dropdown') && window.innerWidth <= 900) {
          // If the dropdown is not yet expanded, prevent navigation and expand it
          if (!dropdownParent.classList.contains('active')) {
            e.preventDefault();
            dropdownParent.classList.add('active');
            return; // Exit here, keeping menu open
                }
          // If already expanded, let the default navigation happen (second tap navigates to the page)
          // Still need to close the mobile menu overlay manually though so it doesn't linger
          navToggle.classList.remove('open');
          navLinks.classList.remove('open');
          document.body.style.overflow = '';
          document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
            return;
        }

        // Normal link behavior (close the menu)
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
        document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
      });
    });
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
      <!-- Messenger -->
      <a href="https://m.me/61568999725231" target="_blank" class="floating-btn btn-messenger" title="Chat Messenger" aria-label="Chat qua Messenger">
        <img src="${basePath}Messenger_Icon_Primary_Blue.png" alt="Messenger" style="width: 32px; height: 32px; object-fit: contain;">
      </a>
      
      <!-- Zalo -->
      <a href="https://zalo.me/0903539537" target="_blank" class="floating-btn btn-zalo" title="Chat Zalo ngay" aria-label="Chat qua Zalo">
        <img src="${basePath}Icon_of_Zalo.png" alt="Zalo" style="width: 36px; height: 36px; object-fit: contain;">
      </a>

      <!-- Call -->
      <a href="tel:0903539537" class="floating-btn btn-call" title="Gọi ngay" aria-label="Gọi hotline">
        <svg fill="#ffffff" width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', floatingHTML);
});
