import { ImagePreloader } from './js/loader.js';
import { CanvasPlayer } from './js/canvas-player.js';
import { InteractionManager } from './js/interactions.js';
import { CartManager } from './js/cart.js';
import { sound } from './js/sound.js';

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_FRAMES = 238;
  const loaderOverlay = document.getElementById('preloader');
  const loaderPercent = document.getElementById('loaderPercent');
  const loaderBar = document.getElementById('loaderBar');
  const loaderStatus = document.getElementById('loaderStatus');
  const canvas = document.getElementById('scrollCanvas');

  let player = null;
  let interactions = null;
  let cart = null;

  // Sound toggle button
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      soundBtn.querySelector('.sound-icon').textContent = isMuted ? '🔇' : '🔊';
      soundBtn.querySelector('.sound-label').textContent = isMuted ? 'SOUND [OFF]' : 'SOUND [ON]';
      if (!isMuted) sound.playClick();
    });
  }

  // Preloader status messages
  const statusMilestones = [
    { at: 15, msg: '> CONNECTING TO 3D RENDER ENGINE...' },
    { at: 40, msg: '> BUFFERING 261 HIGH-RES ASSETS...' },
    { at: 75, msg: '> COMPILING SPATIAL REFLECTIONS...' },
    { at: 95, msg: '> INITIALIZING SMOOTH INERTIA SCROLL...' },
    { at: 100, msg: '> READY. UNLOCKING STUDIO VIEW.' }
  ];

  let displayPct = 0;
  let targetPct = 0;

  // Smooth interpolation for loader progress counter
  const updateCounter = () => {
    if (displayPct < targetPct) {
      displayPct += Math.max(1, (targetPct - displayPct) * 0.2);
      if (displayPct > 100) displayPct = 100;
      const formatted = Math.floor(displayPct).toString().padStart(2, '0');
      if (loaderPercent) loaderPercent.textContent = formatted;
      if (loaderBar) loaderBar.style.width = `${displayPct}%`;
    }
    if (displayPct < 100) {
      requestAnimationFrame(updateCounter);
    }
  };
  requestAnimationFrame(updateCounter);

  // Initialize Preloader
  const preloader = new ImagePreloader(TOTAL_FRAMES, '/frames/');
  preloader.load(
    // onProgress
    (loaded, total, percent) => {
      targetPct = percent;
      const match = statusMilestones.slice().reverse().find(m => percent >= m.at);
      if (match && loaderStatus) {
        loaderStatus.textContent = match.msg;
      }
    },
    // onComplete
    (images) => {
      targetPct = 100;
      displayPct = 100;
      if (loaderPercent) loaderPercent.textContent = '100';
      if (loaderBar) loaderBar.style.width = '100%';

      setTimeout(() => {
        // Initialize Core Engines
        player = new CanvasPlayer(canvas, images);
        interactions = new InteractionManager(player);
        interactions.init();
        cart = new CartManager();

        // Sync player colorway updates with UI
        player.onColorwayChange = (cw) => {
          cart.setColor(cw.name, cw.color);
          
          // Update hero bottom color pills
          document.querySelectorAll('.color-pill').forEach(pill => {
            const matches = pill.getAttribute('data-color') === cw.id;
            pill.classList.toggle('active', matches);
          });
        };

        // Wire bottom colorway pills
        document.querySelectorAll('.color-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            const colorId = pill.getAttribute('data-color');
            const colorName = pill.getAttribute('data-name');
            const colorHex = pill.getAttribute('data-hex');

            cart.setColor(colorName, colorHex);
            interactions.scrollToColorway(colorId);
          });
        });

        // Wire Vault "Inspect 3D" buttons
        document.querySelectorAll('.cw-inspect-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const colorId = btn.getAttribute('data-color');
            interactions.scrollToColorway(colorId);
          });
        });

        // Wire Material Science Tabs
        document.querySelectorAll('.mat-tab-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            sound.playClick();
            document.querySelectorAll('.mat-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.mat-content-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const target = document.getElementById(`tab-${tabId}`);
            if (target) target.classList.add('active');
          });
        });

        // Wire Size Guide Modals
        const sizeModal = document.getElementById('sizeGuideModal');
        const openSizeBtns = [
          document.getElementById('openSizeGuide'),
          document.getElementById('sizeGuideLink'),
          document.getElementById('footerSizeGuide')
        ];
        const closeSizeBtn = document.getElementById('closeSizeModal');

        openSizeBtns.forEach(b => {
          if (b) {
            b.addEventListener('click', (e) => {
              e.preventDefault();
              sound.playClick();
              if (sizeModal) sizeModal.classList.add('active');
            });
          }
        });

        if (closeSizeBtn) {
          closeSizeBtn.addEventListener('click', () => {
            sound.playClick();
            if (sizeModal) sizeModal.classList.remove('active');
          });
        }

        if (sizeModal) {
          sizeModal.addEventListener('click', (e) => {
            if (e.target === sizeModal) sizeModal.classList.remove('active');
          });
        }

        // Cinematic Entrance Reveal: Dismiss loader
        sound.playWhoosh();
        if (loaderOverlay) {
          loaderOverlay.classList.add('hidden');
        }
        document.body.classList.remove('loading-state');
        document.body.classList.add('loaded');

      }, 600);
    }
  );
});
