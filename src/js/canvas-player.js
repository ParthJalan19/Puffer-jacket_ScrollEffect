// High-Performance 60FPS 3D Canvas Sequence Player (New Carousel Animation)
export class CanvasPlayer {
  constructor(canvas, images) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.images = images;
    this.currentFrame = 0;
    this.lastRenderedFrame = -1;
    this.totalFrames = images.length;

    // Colorway checkpoints across the 238-frame carousel with rich studio theme properties
    this.colorways = [
      {
        name: 'Terracotta Ochre',
        id: 'terracotta',
        startFrame: 0,
        endFrame: 85,
        color: '#e07a46',
        aura: 'rgba(224, 122, 70, 0.45)',
        accent: '#ea580c',
        studioBg: '#1f1610',
        studioGradient: 'linear-gradient(180deg, #2b1e15 0%, #1a120c 50%, #100b07 100%)'
      },
      {
        name: 'Arctic Platinum',
        id: 'arctic',
        startFrame: 86,
        endFrame: 130,
        color: '#e4e6e8',
        aura: 'rgba(215, 220, 225, 0.45)',
        accent: '#cbd5e1',
        studioBg: '#181b20',
        studioGradient: 'linear-gradient(180deg, #222730 0%, #15181c 50%, #0d0f12 100%)'
      },
      {
        name: 'Alpine Sage',
        id: 'sage',
        startFrame: 131,
        endFrame: 175,
        color: '#4f5847',
        aura: 'rgba(120, 140, 110, 0.45)',
        accent: '#788c6e',
        studioBg: '#171c16',
        studioGradient: 'linear-gradient(180deg, #20281e 0%, #141913 50%, #0d100c 100%)'
      },
      {
        name: 'Midnight Navy',
        id: 'navy',
        startFrame: 176,
        endFrame: 215,
        color: '#2d3748',
        aura: 'rgba(56, 189, 248, 0.45)',
        accent: '#38bdf8',
        studioBg: '#121824',
        studioGradient: 'linear-gradient(180deg, #1b2436 0%, #111722 50%, #0a0e14 100%)'
      },
      {
        name: 'Stealth Onyx',
        id: 'onyx',
        startFrame: 216,
        endFrame: 237,
        color: '#181a1d',
        aura: 'rgba(156, 163, 175, 0.45)',
        accent: '#9ca3af',
        studioBg: '#16181b',
        studioGradient: 'linear-gradient(180deg, #22252a 0%, #151719 50%, #0d0e0f 100%)'
      }
    ];

    this.activeColorway = this.colorways[0];
    this.applyColorwayTheme(this.activeColorway);
    this.onColorwayChange = null;
    this.onFrameChange = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);

    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.lastRenderedFrame = -1;
    this.render(this.currentFrame);
  }

  render(frameIndex) {
    const idx = Math.max(0, Math.min(Math.round(frameIndex), this.totalFrames - 1));
    if (idx === this.lastRenderedFrame && this.images[idx]) return;

    const img = this.images[idx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    this.currentFrame = idx;
    this.lastRenderedFrame = idx;

    const canvasW = this.width;
    const canvasH = this.height;
    const imgW = img.naturalWidth || 1920;
    const imgH = img.naturalHeight || 1080;

    // Use cover scale with centered positioning
    const hRatio = canvasW / imgW;
    const vRatio = canvasH / imgH;
    const ratio = Math.max(hRatio, vRatio);

    const drawW = imgW * ratio;
    const drawH = imgH * ratio;
    const drawX = (canvasW - drawW) / 2;
    const drawY = (canvasH - drawH) / 2;

    this.ctx.drawImage(img, drawX, drawY, drawW, drawH);

    this.updateColorway(idx);

    if (this.onFrameChange) {
      this.onFrameChange(idx, this.totalFrames);
    }
  }

  applyColorwayTheme(cw) {
    if (!cw) return;
    document.documentElement.style.setProperty('--aura-color', cw.aura);
    document.documentElement.style.setProperty('--accent-glow', cw.accent);
    document.documentElement.style.setProperty('--studio-bg', cw.studioBg);
    document.documentElement.style.setProperty('--studio-gradient', cw.studioGradient);
    document.documentElement.style.setProperty('--active-jacket-color', cw.color);
  }

  updateColorway(frameIndex) {
    const matched = this.colorways.find(c => frameIndex >= c.startFrame && frameIndex <= c.endFrame) || this.colorways[0];
    if (matched.id !== this.activeColorway.id) {
      this.activeColorway = matched;
      this.applyColorwayTheme(matched);

      if (this.onColorwayChange) {
        this.onColorwayChange(matched);
      }
    }
  }

  getColorwayTargetFrame(colorId) {
    switch(colorId) {
      case 'terracotta': return 45;
      case 'arctic': return 115;
      case 'sage': return 160;
      case 'navy': return 200;
      case 'onyx': return 230;
      default: return 45;
    }
  }
}
