/* ============================================
   SORA JAPAN – Interactivity & Animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // --- Scroll-based header styling ---
  const header = document.querySelector('.header');
  const handleScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
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
  window.addEventListener('scroll', highlightNav, { passive: true });

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
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --- Contact form (basic validation) ---
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = this.querySelector('#form-name').value.trim();
      const email = this.querySelector('#form-email').value.trim();
      const phone = this.querySelector('#form-phone').value.trim();
      const message = this.querySelector('#form-message').value.trim();

      if (!name || !email || !phone) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
        return;
      }

      // Simulate submission
      const submitBtn = this.querySelector('.form-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Đang gửi...';
      submitBtn.disabled = true;

      setTimeout(() => {
        alert('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.');
        this.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 1200);
    });
  }
});
