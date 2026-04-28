// ============ NAVBAR ============
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const progressBar = document.getElementById('scrollProgress');

// Sombra al hacer scroll + barra de progreso
function onScrollNav() {
  const y = window.scrollY;
  if (y > 30) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');

  if (progressBar) {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (y / max) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
}
window.addEventListener('scroll', onScrollNav, { passive: true });

// Menú hamburguesa
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navMenu.classList.toggle('active');
});
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
  });
});

// ============ PARALLAX EN HERO ============
// Los emojis flotando y la card del hero se mueven a distinto ritmo que el scroll
const heroDecos = document.querySelectorAll('.float-deco');
const heroCardWrap = document.querySelector('.hero-card-wrap');
const heroContent = document.querySelector('.hero-content');

let ticking = false;
function applyParallax() {
  const y = window.scrollY;
  if (y > window.innerHeight * 1.3) {
    ticking = false;
    return;
  }
  heroDecos.forEach((el, i) => {
    const speed = 0.25 + i * 0.12;
    const rot = y * 0.08;
    el.style.setProperty('--scroll-y', (y * speed) + 'px');
    el.style.setProperty('--scroll-rot', rot + 'deg');
  });
  if (heroCardWrap) {
    heroCardWrap.style.transform = `translateY(${y * -0.12}px)`;
  }
  if (heroContent) {
    heroContent.style.opacity = Math.max(0, 1 - y / 600);
    heroContent.style.transform = `translateY(${y * 0.2}px)`;
  }
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(applyParallax);
    ticking = true;
  }
}, { passive: true });

// ============ REVEAL ON SCROLL (con stagger) ============
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  // Threshold 0 = cualquier pixel visible. Importante para secciones muy altas
  // como el menú (10000px) donde "12% del elemento" nunca cabe en la pantalla.
  { threshold: 0, rootMargin: '0px 0px -80px 0px' }
);

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom').forEach(el => observer.observe(el));

// Stagger: a cada menu-card y feature le ponemos un delay incremental
function applyStagger() {
  // uipro skill: stagger-sequence — 30-50ms por item, no más
  document.querySelectorAll('.menu-grid, .features, .contact-info').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      child.style.setProperty('--stagger-delay', (i * 0.04) + 's');
      child.classList.add('stagger-item');
      observer.observe(child);
    });
  });
}
applyStagger();

// ============ ROTACIÓN DE ELEMENTOS AL SCROLLEAR ============
// La hero-card rota un poco según la posición de scroll
const rotateOnScroll = () => {
  const card = document.querySelector('.hero-card');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;
  const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
  const rot = 4 + progress * -8; // de 4° a -4°
  card.style.transform = `rotate(${rot}deg)`;
};
window.addEventListener('scroll', () => requestAnimationFrame(rotateOnScroll), { passive: true });

// ============ COUNT-UP DE PRECIOS ============
// Cada precio (ej "9€", "5,50€", "11€ / 22€") cuenta desde 0 al entrar en pantalla.
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animateNumber(el, target, hasDecimals, duration = 1100) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const v = target * easeOutCubic(t);
    el.textContent = hasDecimals
      ? v.toFixed(2).replace('.', ',')
      : Math.round(v).toString();
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // Pulso final para subrayar el precio
      el.classList.add('counting');
      setTimeout(() => el.classList.remove('counting'), 400);
    }
  }
  requestAnimationFrame(tick);
}

function setupPriceCountUp() {
  // Solo capturamos números seguidos de € (no afecta a "(2 uds)" o "consultar")
  const numEuro = /(\d+(?:[.,]\d+)?)(\s*€)/g;
  const prices = document.querySelectorAll('.price');

  prices.forEach(price => {
    const original = price.innerHTML;
    if (!numEuro.test(original)) return;
    numEuro.lastIndex = 0;
    // Reemplaza cada "9€" por un span animable que muestra "0€" al inicio
    price.innerHTML = original.replace(numEuro, (match, num, euro) => {
      const hasDec = num.includes(',') || num.includes('.');
      const target = parseFloat(num.replace(',', '.'));
      const placeholder = hasDec ? '0,00' : '0';
      return `<span class="price-num" data-target="${target}" data-dec="${hasDec}">${placeholder}</span>${euro}`;
    });
  });

  const priceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const nums = entry.target.querySelectorAll('.price-num');
      nums.forEach((numEl, i) => {
        const target = parseFloat(numEl.dataset.target);
        const hasDec = numEl.dataset.dec === 'true';
        // Pequeño delay entre números del mismo precio (ej "11€ / 22€")
        setTimeout(() => animateNumber(numEl, target, hasDec), i * 120);
      });
      priceObserver.unobserve(entry.target);
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -30px 0px' });

  prices.forEach(p => priceObserver.observe(p));
}
setupPriceCountUp();

// ============ FILTRO DEL MENÚ ============
function setupMenuFilter() {
  const pills = document.querySelectorAll('.filter-pill');
  const cats = document.querySelectorAll('.menu-category[data-cat], .menu-row[data-cat]');
  if (!pills.length || !cats.length) return;

  function applyFilter(filter) {
    cats.forEach(cat => {
      const matches = cat.dataset.cat === filter;
      if (matches) {
        cat.hidden = false;
        // Re-disparar el reveal/stagger en las cards de la categoría visible
        cat.querySelectorAll('.stagger-item').forEach((c, i) => {
          c.classList.remove('visible');
          c.style.setProperty('--stagger-delay', (i * 0.04) + 's');
          requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('visible')));
        });
      } else {
        cat.hidden = true;
      }
    });
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const filter = pill.dataset.filter;
      pills.forEach(p => {
        p.classList.toggle('active', p === pill);
        p.setAttribute('aria-selected', p === pill ? 'true' : 'false');
      });
      applyFilter(filter);
      // Scroll horizontal del propio pill al centro si hace falta
      pill.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
  });

  // Estado inicial: aplicar el filtro activo
  const initial = document.querySelector('.filter-pill.active')?.dataset.filter;
  if (initial) applyFilter(initial);
}
setupMenuFilter();

// ============ AÑO FOOTER ============
document.getElementById('year').textContent = new Date().getFullYear();
