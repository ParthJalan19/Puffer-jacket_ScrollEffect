import confetti from 'canvas-confetti';
import { sound } from './sound.js';

export class CartManager {
  constructor() {
    this.selectedSize = '38';
    this.selectedColor = 'Onyx Noir';
    this.selectedColorHex = '#1a1c20';
    this.price = 149;
    this.originalPrice = 199;
    this.cartItems = [];

    this.stockMap = {
      '36': 4,
      '38': 3,
      '40': 7,
      '42': 1
    };

    this.init();
  }

  init() {
    this.initSizeSelection();
    this.initCartDrawer();
    this.initAddToCartButtons();
    this.initCheckout();
    this.updateStockNotice();

    // Listen for seamless hero size clicks
    window.addEventListener('size-changed', (e) => {
      if (e.detail && e.detail.size) {
        this.selectedSize = e.detail.size;
        this.updateStockNotice();
      }
    });

    // Lookbook modal add to bag
    const lbBuyBtn = document.querySelector('.lb-modal-buy-btn');
    if (lbBuyBtn) {
      lbBuyBtn.addEventListener('click', () => {
        sound.playSuccess();
        this.addItem();
        const lbModal = document.getElementById('lookbookModal');
        if (lbModal) lbModal.classList.remove('active');
        this.openDrawer();
      });
    }
  }

  initSizeSelection() {
    const sizePills = document.querySelectorAll('.size-pill');
    sizePills.forEach(pill => {
      pill.addEventListener('click', () => {
        sound.playClick();
        sizePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedSize = pill.getAttribute('data-size');
        this.updateStockNotice();

        // Sync with sticky bar size selector if any
        document.querySelectorAll('.sticky-size-pill').forEach(sp => {
          sp.classList.toggle('active', sp.getAttribute('data-size') === this.selectedSize);
        });
      });
    });

    document.querySelectorAll('.sticky-size-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.sticky-size-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedSize = pill.getAttribute('data-size');
        this.updateStockNotice();

        // Sync hero size pills
        document.querySelectorAll('.size-pill').forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-size') === this.selectedSize);
        });
      });
    });
  }

  setColor(colorName, colorHex) {
    this.selectedColor = colorName;
    this.selectedColorHex = colorHex;
    const colorLabel = document.querySelector('.current-color-label');
    if (colorLabel) colorLabel.textContent = colorName.toUpperCase();
    const stickyColorLabel = document.querySelector('.sticky-color-name');
    if (stickyColorLabel) stickyColorLabel.textContent = colorName;
  }

  updateStockNotice() {
    const stockEl = document.querySelector('.stock-badge');
    const remaining = this.stockMap[this.selectedSize] || 5;
    if (stockEl) {
      stockEl.textContent = `⚡ Only ${remaining} pieces remaining in Size ${this.selectedSize}`;
      stockEl.classList.remove('pulse-warn');
      void stockEl.offsetWidth; // retrigger animation
      stockEl.classList.add('pulse-warn');
    }
  }

  initAddToCartButtons() {
    const addBtns = document.querySelectorAll('.btn-add-to-bag, .sticky-btn-add');
    addBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playSuccess();
        this.addItem();

        // Button micro-interaction
        const origText = btn.innerHTML;
        btn.innerHTML = `<span>ADDED TO BAG ✓</span>`;
        btn.classList.add('btn-success-state');

        setTimeout(() => {
          btn.innerHTML = origText;
          btn.classList.remove('btn-success-state');
        }, 1800);

        this.openDrawer();
      });
    });
  }

  addItem() {
    const existing = this.cartItems.find(
      item => item.size === this.selectedSize && item.color === this.selectedColor
    );

    if (existing) {
      existing.quantity++;
    } else {
      this.cartItems.push({
        id: `${this.selectedColor}-${this.selectedSize}`,
        title: 'AERO-800 EXPEDITION PUFFER',
        color: this.selectedColor,
        colorHex: this.selectedColorHex,
        size: this.selectedSize,
        price: this.price,
        quantity: 1
      });
    }

    this.renderCart();
  }

  removeItem(index) {
    sound.playClick();
    this.cartItems.splice(index, 1);
    this.renderCart();
  }

  updateQuantity(index, delta) {
    sound.playClick();
    if (!this.cartItems[index]) return;
    this.cartItems[index].quantity += delta;
    if (this.cartItems[index].quantity <= 0) {
      this.cartItems.splice(index, 1);
    }
    this.renderCart();
  }

  renderCart() {
    const totalCount = this.cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = this.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Update bag counters
    document.querySelectorAll('.cart-count-badge').forEach(badge => {
      badge.textContent = totalCount;
      badge.style.transform = 'scale(1.35)';
      setTimeout(() => badge.style.transform = 'scale(1)', 200);
    });

    const itemsContainer = document.querySelector('.cart-drawer-items');
    const emptyState = document.querySelector('.cart-drawer-empty');
    const footer = document.querySelector('.cart-drawer-footer');
    const subtotalEl = document.querySelector('.cart-subtotal-val');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal}.00`;

    if (totalCount === 0) {
      if (itemsContainer) itemsContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (footer) footer.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (footer) footer.style.display = 'block';

    if (itemsContainer) {
      itemsContainer.innerHTML = this.cartItems.map((item, idx) => `
        <div class="cart-item-card">
          <div class="cart-item-swatch" style="background-color: ${item.colorHex}"></div>
          <div class="cart-item-details">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-meta">${item.color} · SIZE ${item.size}</div>
            <div class="cart-item-price">$${item.price}</div>
          </div>
          <div class="cart-item-controls">
            <button class="cart-qty-btn dec-btn" data-index="${idx}">−</button>
            <span class="cart-qty-num">${item.quantity}</span>
            <button class="cart-qty-btn inc-btn" data-index="${idx}">+</button>
            <button class="cart-del-btn" data-index="${idx}" title="Remove">✕</button>
          </div>
        </div>
      `).join('');

      // Wire item control buttons
      itemsContainer.querySelectorAll('.dec-btn').forEach(btn => {
        btn.addEventListener('click', () => this.updateQuantity(parseInt(btn.getAttribute('data-index')), -1));
      });
      itemsContainer.querySelectorAll('.inc-btn').forEach(btn => {
        btn.addEventListener('click', () => this.updateQuantity(parseInt(btn.getAttribute('data-index')), 1));
      });
      itemsContainer.querySelectorAll('.cart-del-btn').forEach(btn => {
        btn.addEventListener('click', () => this.removeItem(parseInt(btn.getAttribute('data-index'))));
      });
    }
  }

  initCartDrawer() {
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-backdrop');
    const openBtns = document.querySelectorAll('.cart-toggle-btn');
    const closeBtn = document.querySelector('.cart-drawer-close');

    openBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.openDrawer();
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sound.playClick();
        this.closeDrawer();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.closeDrawer());
    }
  }

  openDrawer() {
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-backdrop');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeDrawer() {
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-backdrop');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  initCheckout() {
    const checkoutBtn = document.querySelector('.btn-checkout-now');
    const modal = document.querySelector('.checkout-success-modal');
    const modalClose = document.querySelector('.modal-success-close');

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        sound.playSuccess();
        this.closeDrawer();

        // Confetti celebration
        confetti({
          particleCount: 120,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#ffffff', '#dc2626', '#38bdf8']
        });

        if (modal) modal.classList.add('active');
        this.cartItems = [];
        this.renderCart();
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', () => {
        if (modal) modal.classList.remove('active');
      });
    }
  }
}
