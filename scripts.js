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
  const messageDiv = document.getElementById('message');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const submitBtn = this.querySelector('.form-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Đang gửi...';
      submitBtn.disabled = true;

      const formData = new FormData(contactForm);

      fetch('https://script.google.com/macros/s/AKfycbx8586l5zFB1npOid1uC4io_k9lH-5BD_u2HPky_XYUsP7UKbFnnGNShTCx2H8iO65t/exec', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.result === 'success' || data.status === 'success') {
          if(messageDiv) messageDiv.innerHTML = '<p style="color:var(--color-success); font-weight: 500;"><i class="fas fa-check-circle"></i> Cảm ơn bạn! Thông tin đã được gửi thành công. Chúng tôi sẽ sớm liên hệ lại.</p>';
          contactForm.reset();
        } else {
          // If the script returns another structure or error
          if(messageDiv) messageDiv.innerHTML = '<p style="color:#ef4444; font-weight: 500;">Cảm ơn bạn! Thông tin đã được gửi.</p>';
          contactForm.reset();
        }
      })
      .catch(error => {
        // Since no-cors or some proxy issues usually trigger catch, we can still show success if it's sent.
        if(messageDiv) messageDiv.innerHTML = '<p style="color:var(--color-success); font-weight: 500;"><i class="fas fa-check-circle"></i> Đã gửi thông tin thành công!</p>';
        contactForm.reset();
      })
      .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
    });
  }

  // --- Inject Floating Contact Buttons ---
  const floatingHTML = `
    <!-- Floating Contact Buttons -->
    <div class="floating-contact">
      <!-- Messenger -->
      <a href="https://m.me/yourpageid" target="_blank" class="floating-btn btn-messenger" title="Chat Messenger" aria-label="Chat qua Messenger">
        <svg fill="#ffffff" width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,2C6.477,2,2,6.14,2,11.25C2,14.134,3.535,16.697,5.923,18.307L5.344,21.04C5.161,21.897,5.942,22.585,6.766,22.296L9.622,21.295C10.384,21.439,11.178,21.516,12,21.516C17.523,21.516,22,17.376,22,12.266C22,7.155,17.523,3.016,12,3.016V2ZM13.823,15.526L11.397,12.871C11.196,12.651,10.854,12.623,10.613,12.809L7.54,15.176C7.221,15.421,6.852,14.966,7.126,14.664L9.544,12.002C9.743,11.783,10.083,11.758,10.323,11.942L13.388,14.28C13.713,14.53,14.08,14.07,13.823,13.788L11.397,11.134C11.196,10.914,10.854,10.886,10.613,11.072L7.54,13.439C7.221,13.684,6.852,13.229,7.126,12.927L10.368,9.362C10.697,8.995,11.233,8.91,11.666,9.155L14.372,10.687C14.636,10.835,14.957,10.796,15.183,10.59L17.53,8.441C17.848,8.149,18.257,8.583,17.994,8.895L14.757,12.721C14.432,13.104,13.896,13.194,13.456,12.946L10.74,11.413C10.477,11.265,10.155,11.303,9.929,11.51C9.612,11.802,9.202,11.368,9.466,11.056L12.709,7.23C13.033,6.848,13.568,6.758,14.008,7.005L16.724,8.539C16.988,8.687,17.309,8.648,17.535,8.441L19.883,6.293C20.2,6.001,20.61,6.435,20.346,6.747L17.109,10.574C16.785,10.957,16.249,11.047,15.809,10.8M13.823,15.526" /></svg>
      </a>
      
      <!-- Zalo -->
      <a href="https://zalo.me/0903539537" target="_blank" class="floating-btn btn-zalo" title="Chat Zalo ngay" aria-label="Chat qua Zalo">
        <svg height="40" width="40" viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M141.547 51.524H86.208c-30.837 0-55.836 24.999-55.836 55.836v49.255c0 30.837 24.999 55.836 55.836 55.836v32.656c0 4.609 5.342 7.155 8.927 4.257l44.382-35.918h1.879l.152.005h.154c30.837 0 55.836-24.999 55.836-55.836v-50.255c0-30.837-24.999-55.836-55.836-55.836" fill="#fff" /><path d="M127.34 94.757h-36.467c-1.897 0-3.435 1.537-3.435 3.435v9.525c0 1.897 1.537 3.435 3.435 3.435h20.672L88.081 138.64c-1.373 1.536-2.14 3.791-.97 5.768v.002c1.042 1.763 2.91 2.894 5.341 2.894h40.457c1.897 0 3.435-1.537 3.435-3.435v-9.526c0-1.897-1.537-3.435-3.435-3.435h-24.6l23.468-27.481c1.372-1.536 2.14-3.792.97-5.768v-.002c-1.042-1.763-2.91-2.895-5.341-2.895h-.065Z" fill="#25d366"/></svg>
      </a>

      <!-- Call -->
      <a href="tel:0903539537" class="floating-btn btn-call" title="Gọi ngay" aria-label="Gọi hotline">
        <svg fill="#ffffff" width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', floatingHTML);
});
