// Asset Loader & Preloader with Live Numeric Counter
export class ImagePreloader {
  constructor(totalFrames = 261, basePath = '/frames/') {
    this.totalFrames = totalFrames;
    this.basePath = basePath;
    this.images = [];
    this.loadedCount = 0;
  }

  // Generate zero-padded filename: ezgif-frame-001.jpg
  getFrameUrl(index) {
    const padded = String(index + 1).padStart(3, '0');
    return `${this.basePath}ezgif-frame-${padded}.jpg`;
  }

  // Preload all frames with concurrency batching for ultra-fast startup
  load(onProgress, onComplete) {
    let completed = false;
    const urls = [];
    for (let i = 0; i < this.totalFrames; i++) {
      urls.push(this.getFrameUrl(i));
    }

    // Pre-allocate image array
    this.images = new Array(this.totalFrames);

    // Initial first frame priority load
    const firstImg = new Image();
    firstImg.src = urls[0];
    firstImg.onload = () => {
      this.images[0] = firstImg;
      this.loadedCount++;
      if (onProgress) onProgress(this.loadedCount, this.totalFrames, (this.loadedCount / this.totalFrames) * 100);

      // Now load the rest in batches
      this._loadBatch(urls, 1, onProgress, onComplete);
    };
    firstImg.onerror = () => {
      console.warn('Failed loading first frame, falling back batch');
      this._loadBatch(urls, 1, onProgress, onComplete);
    };
  }

  _loadBatch(urls, startIndex, onProgress, onComplete) {
    const total = urls.length;
    let inFlight = 0;
    let nextIndex = startIndex;
    const maxConcurrency = 16; // 16 parallel requests for high throughput without browser throttling

    const checkDone = () => {
      if (this.loadedCount >= total && !this.done) {
        this.done = true;
        if (onComplete) onComplete(this.images);
      }
    };

    const loadNext = () => {
      while (inFlight < maxConcurrency && nextIndex < total) {
        const idx = nextIndex++;
        inFlight++;
        const img = new Image();
        img.src = urls[idx];
        img.onload = () => {
          this.images[idx] = img;
          this.loadedCount++;
          inFlight--;
          if (onProgress) {
            onProgress(this.loadedCount, total, (this.loadedCount / total) * 100);
          }
          checkDone();
          loadNext();
        };
        img.onerror = () => {
          console.warn(`Frame ${idx} load error, continuing`);
          this.loadedCount++;
          inFlight--;
          if (onProgress) {
            onProgress(this.loadedCount, total, (this.loadedCount / total) * 100);
          }
          checkDone();
          loadNext();
        };
      }
    };

    loadNext();
  }
}
