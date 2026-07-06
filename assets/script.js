/* =========================================================
   JANAKA HESHAN — PORTFOLIO SCRIPT
   Vanilla JS only. Organised into small, independent modules
   so any single feature can be disabled without breaking others.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initParticles();
  initCursor();
  initHeaderScroll();
  initNavToggle();
  initSmoothAnchors();
  initTraceProgress();
  initRevealOnScroll();
  initTypingEffect();
  initSkillBars();
  initRadialChart();
  initStatsCounters();
  initProjects();
  initTestimonialSlider();
  initContactForm();
  initBackToTop();
  document.getElementById('year').textContent = new Date().getFullYear();
  registerServiceWorker();
});

/* ---------------------------------------------------------
   1. Loading screen
--------------------------------------------------------- */
function initLoader() {
  const loader = document.getElementById('loader');
  const bar = document.getElementById('loaderProgress');
  let progress = 0;

  const tick = setInterval(() => {
    progress += Math.random() * 18;
    if (progress >= 100) {
      progress = 100;
      clearInterval(tick);
      setTimeout(() => {
        loader.classList.add('is-hidden');
        document.body.style.overflow = '';
      }, 250);
    }
    bar.style.width = progress + '%';
  }, 140);

  document.body.style.overflow = 'hidden';
  // Safety net: never let the loader block the page for more than 3.5s
  setTimeout(() => loader.classList.add('is-hidden'), 3500);
}

/* ---------------------------------------------------------
   2. Particle background (canvas) — represents data/current
      flowing between circuit nodes.
--------------------------------------------------------- */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let particles = [];
  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = Math.min(70, Math.floor((width * height) / 22000));
  const colors = ['77,216,196', '184,115,51', '232,176,75'];

  function makeParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.2,
    };
  }
  particles = Array.from({ length: COUNT }, makeParticle);

  function step() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    }
    // connect nearby particles with faint traces
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(77,216,196, ${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    if (!prefersReduced) requestAnimationFrame(step);
  }
  step();
  if (prefersReduced) {
    // draw a single static frame, no animation loop
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    });
  }
}

/* ---------------------------------------------------------
   3. Custom cursor
--------------------------------------------------------- */
function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  });

  function loop() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  document.querySelectorAll('a, button, input, textarea, .project-card, .service-card').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
  });
}

/* ---------------------------------------------------------
   4. Header background on scroll
--------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------------------------------------------------------
   5. Mobile nav toggle
--------------------------------------------------------- */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/* ---------------------------------------------------------
   6. Smooth scroll for in-page anchors
--------------------------------------------------------- */
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ---------------------------------------------------------
   7. Scroll progress trace (signature element)
--------------------------------------------------------- */
function initTraceProgress() {
  const progressLine = document.getElementById('traceProgress');
  const node = document.getElementById('traceNode');
  const railHeight = 1000; // matches SVG viewBox height

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? scrollTop / docHeight : 0;
    const y = pct * railHeight;
    progressLine.setAttribute('y2', y);
    node.style.top = pct * 100 + '%';
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

/* ---------------------------------------------------------
   8. Reveal-on-scroll via IntersectionObserver
--------------------------------------------------------- */
function initRevealOnScroll() {
  const items = document.querySelectorAll('[data-reveal]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(item => observer.observe(item));
}

/* ---------------------------------------------------------
   9. Hero typing effect
--------------------------------------------------------- */
function initTypingEffect() {
  const el = document.getElementById('typedRole');
  if (!el) return;
  const roles = ['Web Developer', 'Computer Hardware Technician', 'Freelancer'];
  let roleIndex = 0, charIndex = 0, deleting = false;

  function tick() {
    const current = roles[roleIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
    }
    setTimeout(tick, deleting ? 40 : 75);
  }
  tick();
}

/* ---------------------------------------------------------
   10. Animated skill bars
--------------------------------------------------------- */
function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const fill = bar.querySelector('.skill-fill');
        const level = bar.getAttribute('data-level');
        fill.style.width = level + '%';
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.4 });
  bars.forEach(bar => observer.observe(bar));
}

/* ---------------------------------------------------------
   11. Radial "client satisfaction" chart
--------------------------------------------------------- */
function initRadialChart() {
  const circle = document.getElementById('radialFill');
  const numEl = document.getElementById('radialNum');
  if (!circle) return;
  const circumference = 314; // 2 * PI * r(50)
  const target = 98;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const offset = circumference - (target / 100) * circumference;
        circle.style.strokeDashoffset = offset;
        let current = 0;
        const step = () => {
          current += 2;
          if (current >= target) current = target;
          numEl.textContent = current + '%';
          if (current < target) requestAnimationFrame(step);
        };
        step();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  observer.observe(circle.closest('.skill-radial-wrap'));
}

/* ---------------------------------------------------------
   12. Animated stat counters
--------------------------------------------------------- */
function initStatsCounters() {
  const counters = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10);
        const duration = 1600;
        const start = performance.now();
        function frame(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target);
          if (progress < 1) requestAnimationFrame(frame);
          else el.textContent = target;
        }
        requestAnimationFrame(frame);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach(el => observer.observe(el));
}

/* ---------------------------------------------------------
   13. Projects: render, filter, and GitHub API sync
--------------------------------------------------------- */
const FALLBACK_PROJECTS = [
  {
    title: 'Kegalle Clinic Booking Platform',
    desc: 'Full appointment booking site with admin dashboard, built for a local medical clinic.',
    tag: 'Web',
    category: 'web',
    demo: '#',
    code: 'https://github.com/janakaheshan',
  },
  {
    title: 'ModBot — Discord Moderation Bot',
    desc: 'Custom Discord bot with auto-moderation, role management, and ticket support built on Discord.js.',
    tag: 'Bot',
    category: 'bot',
    demo: '#',
    code: 'https://github.com/janakaheshan',
  },
  {
    title: 'PSU Load Tester Companion',
    desc: 'A small utility app that logs voltage rail readings from a bench PSU tester for repair documentation.',
    tag: 'Hardware Tool',
    category: 'hardware',
    demo: '#',
    code: 'https://github.com/janakaheshan',
  },
  {
    title: 'Freelance Portfolio Builder',
    desc: 'A lightweight static-site generator that lets local freelancers spin up a portfolio in minutes.',
    tag: 'Web',
    category: 'web',
    demo: '#',
    code: 'https://github.com/janakaheshan',
  },
  {
    title: 'StudyRoom Bot',
    desc: 'Discord bot for study communities with focus timers, leaderboard, and reminder scheduling.',
    tag: 'Bot',
    category: 'bot',
    demo: '#',
    code: 'https://github.com/janakaheshan',
  },
  {
    title: 'Diagnostic Checklist App',
    desc: 'Offline-first PWA checklist that walks technicians through a full hardware fault-finding routine.',
    tag: 'Hardware Tool',
    category: 'hardware',
    demo: '#',
    code: 'https://github.com/janakaheshan',
  },
];

function projectCardHTML(p) {
  return `
    <article class="project-card" data-category="${p.category}">
      <div class="project-thumb"><span>${p.tag}</span></div>
      <div class="project-body">
        <span class="project-tag">${p.tag}</span>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <div class="project-links">
          <a href="${p.demo}" target="_blank" rel="noopener">Live Demo</a>
          <a href="${p.code}" target="_blank" rel="noopener">Source</a>
        </div>
      </div>
    </article>`;
}

function initProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  function render(list) {
    grid.innerHTML = list.map(projectCardHTML).join('');
    initRevealOnScroll(); // re-scan for any new [data-reveal] nodes (none here, kept for safety)
    bindFilters();
  }

  render(FALLBACK_PROJECTS);

  // Optional GitHub API integration — enhances the list with real repos if reachable.
  // Replace 'janakaheshan' with the real GitHub username to go live.
  fetch('https://api.github.com/users/janakaheshan/repos?sort=updated&per_page=6')
    .then(res => (res.ok ? res.json() : Promise.reject()))
    .then(repos => {
      if (!Array.isArray(repos) || repos.length === 0) return;
      const githubProjects = repos
        .filter(r => !r.fork)
        .map(r => ({
          title: r.name.replace(/[-_]/g, ' '),
          desc: r.description || 'No description provided yet.',
          tag: r.language || 'Repo',
          category: 'web',
          demo: r.homepage || r.html_url,
          code: r.html_url,
        }));
      if (githubProjects.length) render(githubProjects.concat(FALLBACK_PROJECTS.slice(0, 2)));
    })
    .catch(() => {
      /* Offline or rate-limited — fallback list stays in place. */
    });

  function bindFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.project-card').forEach(card => {
          const match = filter === 'all' || card.getAttribute('data-category') === filter;
          card.classList.toggle('is-filtered-out', !match);
        });
      });
    });
  }
}

/* ---------------------------------------------------------
   14. Testimonial slider
--------------------------------------------------------- */
function initTestimonialSlider() {
  const track = document.getElementById('testimonialTrack');
  const dotsWrap = document.getElementById('testimonialDots');
  const prevBtn = document.getElementById('testPrev');
  const nextBtn = document.getElementById('testNext');
  if (!track) return;

  const slides = track.children.length;
  let index = 0;

  for (let i = 0; i < slides; i++) {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
    if (i === 0) dot.classList.add('is-active');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  }

  function goTo(i) {
    index = (i + slides) % slides;
    track.style.transform = `translateX(-${index * 100}%)`;
    [...dotsWrap.children].forEach((d, di) => d.classList.toggle('is-active', di === index));
  }

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));

  let autoplay = setInterval(() => goTo(index + 1), 6000);
  track.closest('.testimonial-slider').addEventListener('mouseenter', () => clearInterval(autoplay));
  track.closest('.testimonial-slider').addEventListener('mouseleave', () => {
    autoplay = setInterval(() => goTo(index + 1), 6000);
  });
}

/* ---------------------------------------------------------
   15. Contact form validation + submission
   NOTE: This posts to a placeholder endpoint. Swap
   CONTACT_ENDPOINT for a real backend (see /backend-example)
   or a form service like Formspree to make it fully live.
--------------------------------------------------------- */
const CONTACT_ENDPOINT = ''; // e.g. 'https://formspree.io/f/your-id'

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const status = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  const fields = {
    name: { el: document.getElementById('name'), error: document.getElementById('nameError') },
    email: { el: document.getElementById('email'), error: document.getElementById('emailError') },
    subject: { el: document.getElementById('subject'), error: document.getElementById('subjectError') },
    message: { el: document.getElementById('message'), error: document.getElementById('messageError') },
  };

  function validateField(key) {
    const { el, error } = fields[key];
    let message = '';
    const value = el.value.trim();

    if (!value) {
      message = 'This field is required.';
    } else if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      message = 'Enter a valid email address.';
    } else if (el.minLength && value.length < el.minLength) {
      message = `Please enter at least ${el.minLength} characters.`;
    }

    error.textContent = message;
    el.closest('.form-row').classList.toggle('has-error', !!message);
    return !message;
  }

  Object.keys(fields).forEach(key => {
    fields[key].el.addEventListener('blur', () => validateField(key));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.className = 'form-status';

    // Honeypot check — if filled, silently treat as spam and stop.
    if (form.company.value) return;

    const validations = Object.keys(fields).map(validateField);
    if (validations.includes(false)) {
      status.textContent = 'Please fix the highlighted fields.';
      status.classList.add('is-error');
      return;
    }

    const payload = {
      name: fields.name.el.value.trim(),
      email: fields.email.el.value.trim(),
      subject: fields.subject.el.value.trim(),
      message: fields.message.el.value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Sending...';

    try {
      if (CONTACT_ENDPOINT) {
        const res = await fetch(CONTACT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Request failed');
      } else {
        // No backend configured yet — fall back to opening the user's mail client.
        const mailto = `mailto:heshanmd.ml@gmail.com?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(payload.message + '\n\nFrom: ' + payload.name + ' (' + payload.email + ')')}`;
        window.location.href = mailto;
      }
      status.textContent = 'Message sent — thanks! I\'ll get back to you soon.';
      status.classList.add('is-success');
      form.reset();
    } catch (err) {
      status.textContent = 'Something went wrong. Please email me directly instead.';
      status.classList.add('is-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Send Message';
    }
  });
}

/* ---------------------------------------------------------
   16. Back-to-top button
--------------------------------------------------------- */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------------------------------------------------------
   17. PWA service worker registration
--------------------------------------------------------- */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* Fails gracefully if hosted somewhere without root scope access */
      });
    });
  }
}
