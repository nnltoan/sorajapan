/* ============================================
   SORA JAPAN – Interactivity & Animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Config ---
  const CONFIG = {
    FORM_ENDPOINT: 'https://script.google.com/macros/s/AKfycbx8586l5zFB1npOid1uC4io_k9lH-5BD_u2HPky_XYUsP7UKbFnnGNShTCx2H8iO65t/exec'
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

      const formData = new FormData(contactForm);

      fetch(CONFIG.FORM_ENDPOINT, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.result === 'success' || data.status === 'success') {
          if(messageDiv) messageDiv.innerHTML = '<p style="color:var(--color-success); font-weight: 500;"><i class="fas fa-check-circle"></i> Cảm ơn bạn! Thông tin đã được gửi thành công. Chúng tôi sẽ sớm liên hệ lại.</p>';
          contactForm.reset();
        } else {
          if(messageDiv) messageDiv.innerHTML = '<p style="color:#ef4444; font-weight: 500;"><i class="fas fa-exclamation-circle"></i> Có lỗi xảy ra, vui lòng thử lại sau.</p>';
        }
      })
      .catch(error => {
        console.error('Form submission error:', error);
        if(messageDiv) messageDiv.innerHTML = '<p style="color:#ef4444; font-weight: 500;"><i class="fas fa-exclamation-circle"></i> Không thể gửi thông tin. Vui lòng kiểm tra kết nối mạng và thử lại.</p>';
      })
      .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
    });
  }

  // --- Inject Floating Contact Buttons ---
  // Detect subfolder depth: count path segments after the site root
  const pathSegments = window.location.pathname.replace(/\/[^/]*$/, '').split('/').filter(Boolean);
  const siteRoot = ''; // adjust if site is hosted in a subfolder
  const depth = pathSegments.length - (siteRoot ? siteRoot.split('/').filter(Boolean).length : 0);
  const basePath = depth > 0 ? '../'.repeat(depth) : './';
  const floatingHTML = `
    <!-- Floating Contact Buttons -->
    <div class="floating-contact">
      <!-- Messenger -->
      <a href="https://m.me/61568999725231" target="_blank" class="floating-btn btn-messenger" title="Chat Messenger" aria-label="Chat qua Messenger">
        <img src="${basePath}Messenger_Icon_Primary_Blue.png" alt="Messenger" style="width: 32px; height: 32px; object-fit: contain;">
      </a>
      
      <!-- Zalo -->
      <a href="https://zalo.me/0903539537" target="_blank" class="floating-btn btn-zalo" title="Chat Zalo ngay" aria-label="Chat qua Zalo">
        <img src="${basePath}Icon_of_Zalo.svg.webp" alt="Zalo" style="width: 36px; height: 36px; object-fit: contain;">
      </a>

      <!-- Call -->
      <a href="tel:0903539537" class="floating-btn btn-call" title="Gọi ngay" aria-label="Gọi hotline">
        <svg fill="#ffffff" width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', floatingHTML);
});
