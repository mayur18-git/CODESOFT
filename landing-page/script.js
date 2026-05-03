const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
}, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 60);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
fadeEls.forEach(el => observer.observe(el));

let timerSec = 24 * 60 + 32;
const timerEl = document.getElementById('hero-timer');
const ringFill = document.querySelector('.ring-fill');
const totalSecs = 25 * 60;

setInterval(() => {
  if (timerSec > 0) timerSec--;
  const m = Math.floor(timerSec / 60);
  const s = timerSec % 60;
  timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const dashOffset = 377 - (377 * (timerSec / totalSecs));
  ringFill.style.strokeDashoffset = Math.max(0, 377 - dashOffset);
}, 1000);

const toggle = document.getElementById('pricing-toggle');
const monthlyLabel = document.getElementById('monthly-label');
const yearlyLabel = document.getElementById('yearly-label');
const proPrice = document.getElementById('pro-price');
const teamPrice = document.getElementById('team-price');
const proDesc = document.getElementById('pro-desc');
const teamDesc = document.getElementById('team-desc');
let isYearly = false;

toggle.addEventListener('click', () => {
  isYearly = !isYearly;
  toggle.classList.toggle('yearly', isYearly);
  monthlyLabel.classList.toggle('active', !isYearly);
  yearlyLabel.classList.toggle('active', isYearly);

  if (isYearly) {
    proPrice.textContent = '$7';
    teamPrice.textContent = '$18';
    proDesc.textContent = 'Billed $84/year.';
    teamDesc.textContent = 'Billed $216/year per seat.';
  } else {
    proPrice.textContent = '$12';
    teamPrice.textContent = '$29';
    proDesc.textContent = 'Billed monthly.';
    teamDesc.textContent = 'Billed monthly.';
  }
});

const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');
const mobileOverlay = document.getElementById('mobile-overlay');

function closeMobileNav() {
  mobileNav.classList.remove('open');
  mobileOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  const isOpen = mobileNav.classList.contains('open');
  if (isOpen) {
    closeMobileNav();
  } else {
    mobileNav.classList.add('open');
    mobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
});

mobileOverlay.addEventListener('click', closeMobileNav);
document.querySelectorAll('#mobile-nav a').forEach(a => a.addEventListener('click', closeMobileNav));

document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});