import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sound } from './sound.js';

gsap.registerPlugin(ScrollTrigger);

export class InteractionManager {
  constructor(canvasPlayer) {
    this.player = canvasPlayer;
    this.lenis = null;
    this.scrollTrigger = null;
    this.cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.cursorTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  init() {
    this.initSmoothScroll();
    this.initCanvasScrollTrigger();
    this.initCustomCursor();
    this.initMagneticElements();
    this.initHeaderScrollTrigger();
    this.initStickyBuyBar();
    this.initLookbookInteractions();
    this.initHeroTriggers();
  }

  initSmoothScroll() {
    this.lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
      infinite: false
    });

    this.lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  initCanvasScrollTrigger() {
    const heroSection = document.querySelector('.hero-scroll-container');
    const heroSticky = document.querySelector('.hero-sticky-canvas');
    if (!heroSection || !heroSticky) return;

    this.scrollTrigger = ScrollTrigger.create({
      trigger: heroSection,
      start: 'top top',
      end: 'bottom bottom',
      pin: heroSticky,
      scrub: 0.5, // Ultra-responsive physical scrub
      onUpdate: (self) => {
        const frameIndex = Math.min(
          this.player.totalFrames - 1,
          Math.floor(self.progress * (this.player.totalFrames - 1))
        );
        this.player.render(frameIndex);

        // Update progress scrub bar & badge
        const scrubProgress = document.querySelector('.scrub-progress-fill');
        const scrubLabel = document.querySelector('.scrub-label');
        if (scrubProgress) scrubProgress.style.width = `${(self.progress * 100).toFixed(1)}%`;
        if (scrubLabel) scrubLabel.textContent = `FRAME ${String(frameIndex + 1).padStart(3, '0')} / ${this.player.totalFrames}`;
      }
    });
  }

  // Reveal persistent header only when scrolled past hero (zero hero overlap!)
  initHeaderScrollTrigger() {
    const header = document.querySelector('.site-header');
    const hero = document.querySelector('.hero-scroll-container');
    if (!header || !hero) return;

    ScrollTrigger.create({
      trigger: hero,
      start: 'bottom 80%',
      onEnter: () => header.classList.add('visible'),
      onLeaveBack: () => header.classList.remove('visible')
    });
  }

  // Sticky Buy Bar on bottom when past hero
  initStickyBuyBar() {
    const bar = document.querySelector('.sticky-bottom-bar');
    const hero = document.querySelector('.hero-scroll-container');
    if (!bar || !hero) return;

    ScrollTrigger.create({
      trigger: hero,
      start: 'bottom 70%',
      onEnter: () => bar.classList.add('visible'),
      onLeaveBack: () => bar.classList.remove('visible')
    });
  }

  // Seamless Hero Hitboxes
  initHeroTriggers() {
    // Size Hitboxes: 36, 38, 40
    const indicator = document.querySelector('.size-active-indicator');
    const sizeHits = document.querySelectorAll('.hero-hitbox-size');

    sizeHits.forEach(hit => {
      hit.addEventListener('click', () => {
        sound.playClick();
        const size = hit.getAttribute('data-size');
        if (indicator) indicator.setAttribute('data-active', size);
        sizeHits.forEach(h => h.classList.remove('active'));
        hit.classList.add('active');

        // Sync with cart state
        window.dispatchEvent(new CustomEvent('size-changed', { detail: { size } }));
      });
    });
  }

  // Lookbook Filter tabs, 3D Hover Tilt, and Lightbox Modal
  initLookbookInteractions() {
    const cards = document.querySelectorAll('.lookbook-card');
    
    // 1. Reliable Entrance Reveal using IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    cards.forEach((card, index) => {
      card.style.transitionDelay = `${(index % 3) * 0.12}s`;
      observer.observe(card);
    });

    // 2. Category Filter Tabs
    const filterBtns = document.querySelectorAll('.lb-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        cards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.classList.remove('hidden');
            gsap.fromTo(card, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.35 });
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });

    // 3. 3D Perspective Hover Tilt on Cards
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotX = -((y - centerY) / centerY) * 7;
        const rotY = ((x - centerX) / centerX) * 7;

        card.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });

      // 4. Lightbox Modal Trigger
      card.addEventListener('click', (e) => {
        if (e.target.closest('.lb-shop-btn')) return; // Handled separately
        sound.playClick();
        const img = card.getAttribute('data-img');
        const title = card.getAttribute('data-title');
        const desc = card.getAttribute('data-desc');
        this.openLookbookModal(img, title, desc);
      });
    });

    // Wire "SHOP LOOK ↗" buttons on cards to jump 3D view to that color
    document.querySelectorAll('.lb-shop-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const colorId = btn.getAttribute('data-color');
        if (colorId) {
          this.scrollToColorway(colorId);
        }
      });
    });

    // Modal Close
    const modal = document.getElementById('lookbookModal');
    const closeBtn = document.getElementById('closeLookbookModal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        sound.playClick();
        modal.classList.remove('active');
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  }

  openLookbookModal(imgSrc, title, desc) {
    const modal = document.getElementById('lookbookModal');
    if (!modal) return;
    document.getElementById('lbModalImg').src = imgSrc;
    document.getElementById('lbModalTitle').textContent = title;
    document.getElementById('lbModalDesc').textContent = desc;
    modal.classList.add('active');
  }

  // Smoothly scroll to a specific frame / colorway
  scrollToColorway(colorId) {
    const targetFrame = this.player.getColorwayTargetFrame(colorId);
    const heroSection = document.querySelector('.hero-scroll-container');
    if (!heroSection || !this.scrollTrigger) return;

    const progress = targetFrame / (this.player.totalFrames - 1);
    const scrollDistance = heroSection.offsetHeight - window.innerHeight;
    const targetScrollY = heroSection.offsetTop + (progress * scrollDistance);

    sound.playClick();
    this.lenis.scrollTo(targetScrollY, {
      duration: 1.4,
      easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    });
  }

  // Fluid luxury cursor follower
  initCustomCursor() {
    const cursorDot = document.querySelector('.custom-cursor-dot');
    const cursorFollower = document.querySelector('.custom-cursor-follower');
    if (!cursorDot || !cursorFollower) return;

    let fx = 0, fy = 0;

    window.addEventListener('mousemove', (e) => {
      this.cursorTarget.x = e.clientX;
      this.cursorTarget.y = e.clientY;
      cursorDot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    });

    const loop = () => {
      fx += (this.cursorTarget.x - fx) * 0.15;
      fy += (this.cursorTarget.y - fy) * 0.15;
      cursorFollower.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.querySelectorAll('a, button, .interactive-item, .lookbook-card, .color-pill, .hero-hitbox-cta, .hero-hitbox-size').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorFollower.classList.add('cursor-hover');
        sound.playHover();
      });
      el.addEventListener('mouseleave', () => {
        cursorFollower.classList.remove('cursor-hover');
      });
    });
  }

  // Magnetic button pull
  initMagneticElements() {
    const magnetics = document.querySelectorAll('.magnetic-btn');
    magnetics.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = `translate3d(${x * 0.28}px, ${y * 0.28}px, 0)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = `translate3d(0, 0, 0)`;
      });
    });
  }
}
