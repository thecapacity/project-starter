/**
 * <link-surfer>
 *
 * Full-screen link reader. Manages the current link queue, renders an iframe
 * (via the /proxy endpoint), and handles swipe + keyboard gestures.
 *
 * Gesture map:
 *   Swipe RIGHT  / →          → next link (skip)
 *   Swipe LEFT   / ←          → previous link
 *   Swipe UP     / ↑ / s      → save link
 *   Swipe DOWN   / ↓ / d      → delete link
 *   o                         → open link in new tab
 *
 * Dispatches `surfer:stats` (bubbles) after every navigation/action so the
 * toolbar can update its counters without tight coupling.
 */
export class LinkSurfer extends HTMLElement {
  constructor() {
    super();
    this.links = [];
    this.currentIndex = 0;
    this.savedCount = 0;
    // Gesture tracking
    this._startX = 0;
    this._startY = 0;
    this._dragging = false;
    this._mouseActive = false;
    this._headerTimer = null;
  }

  connectedCallback() {
    this._render();
    this._attachGestures();
    this._attachKeyboard();
    this._loadLinks();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("mouseup", this._onMouseUp);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  _render() {
    this.innerHTML = `
      <style>
        link-surfer {
          display: block;
          position: fixed;
          inset: 0;
          bottom: 56px; /* leave room for toolbar */
          overflow: hidden;
          user-select: none;
          -webkit-user-select: none;
        }

        .surfer-card {
          position: relative;
          width: 100%;
          height: 100%;
          will-change: transform;
          transform: translate(0, 0);
          transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          cursor: grab;
        }
        .surfer-card:active { cursor: grabbing; }

        /* Link header overlay — shows title + open button, fades after 3s */
        .link-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: opacity 0.6s ease;
        }
        .link-title {
          flex: 1;
          font-size: 0.85rem;
          color: #ccc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .link-open {
          color: #6366f1;
          text-decoration: none;
          font-size: 1rem;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .link-open:hover { background: rgba(99, 102, 241, 0.15); }

        /* Direction hint overlays */
        .hint {
          position: absolute;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.1s;
          padding: 0.5rem 1.2rem;
          border-radius: 8px;
        }
        .hint-right {
          right: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(99, 102, 241, 0.85);
          color: #fff;
        }
        .hint-left {
          left: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(100, 116, 139, 0.85);
          color: #fff;
        }
        .hint-top {
          top: 5rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(234, 179, 8, 0.85);
          color: #000;
        }
        .hint-bottom {
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(239, 68, 68, 0.85);
          color: #fff;
        }

        /* iframe */
        .surfer-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
          background: #fff;
        }

        /* Empty / loading states */
        .surfer-state {
          position: absolute;
          inset: 0;
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          background: #0a0a0a;
          color: #888;
          text-align: center;
          padding: 2rem;
        }
        .surfer-state.visible { display: flex; }
        .state-icon { font-size: 3.5rem; line-height: 1; }
        .surfer-state h2 { font-size: 1.4rem; color: #ccc; }
        .surfer-state p  { font-size: 0.9rem; max-width: 28ch; }
        .surfer-state code {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          background: #1a1a1a;
          padding: 0.6rem 1rem;
          border-radius: 6px;
          color: #a5b4fc;
          text-align: left;
          max-width: 90vw;
          overflow-x: auto;
          white-space: nowrap;
        }
      </style>

      <div class="surfer-card" id="surfer-card">
        <!-- Direction hints -->
        <div class="hint hint-right" id="hint-right">Next →</div>
        <div class="hint hint-left"  id="hint-left">← Back</div>
        <div class="hint hint-top"   id="hint-top">⭐ Save</div>
        <div class="hint hint-bottom" id="hint-bottom">🗑 Dismiss</div>

        <!-- Link header overlay -->
        <div class="link-header" id="link-header">
          <span class="link-title" id="link-title">Loading…</span>
          <a class="link-open" id="link-open" href="#" target="_blank" rel="noopener noreferrer" title="Open in new tab">↗</a>
        </div>

        <!-- Main iframe -->
        <iframe
          id="surfer-iframe"
          class="surfer-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="lazy"
          title="Link content"
        ></iframe>

        <!-- Loading state -->
        <div class="surfer-state" id="state-loading">
          <div class="state-icon">🌊</div>
          <h2>Loading your links…</h2>
        </div>

        <!-- Empty state -->
        <div class="surfer-state" id="state-empty">
          <div class="state-icon">🏄</div>
          <h2>All caught up!</h2>
          <p>No more unread links. Add more via:</p>
          <code>wrangler d1 execute link-surfer --local \<br>
  --command="INSERT INTO links (url, title) VALUES ('https://…', 'Title')"</code>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  async _loadLinks() {
    this._setState("loading");
    try {
      const res = await fetch("/api/links");
      this.links = res.ok ? await res.json() : [];
    } catch {
      this.links = [];
    }
    this.currentIndex = 0;
    this._showCurrent();
  }

  async _updateStatus(id, status) {
    try {
      await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Best-effort; UI already advanced
    }
  }

  // ---------------------------------------------------------------------------
  // Display
  // ---------------------------------------------------------------------------

  _showCurrent() {
    const link = this.links[this.currentIndex];
    const iframe = this.querySelector("#surfer-iframe");
    const header = this.querySelector("#link-header");
    const title = this.querySelector("#link-title");
    const openBtn = this.querySelector("#link-open");

    if (!link) {
      this._setState("empty");
      iframe.src = "about:blank";
      this._emitStats();
      return;
    }

    this._setState("none");

    title.textContent = link.title || link.url;
    openBtn.href = link.url;

    // Load via proxy to strip X-Frame-Options / CSP headers
    iframe.src = `/proxy?url=${encodeURIComponent(link.url)}`;

    // Show header overlay, then fade it out after 3.5s
    header.style.opacity = "1";
    clearTimeout(this._headerTimer);
    this._headerTimer = setTimeout(() => {
      header.style.opacity = "0";
    }, 3500);

    this._emitStats();
  }

  _setState(state) {
    const loading = this.querySelector("#state-loading");
    const empty = this.querySelector("#state-empty");
    const iframe = this.querySelector("#surfer-iframe");
    const header = this.querySelector("#link-header");

    loading.classList.toggle("visible", state === "loading");
    empty.classList.toggle("visible", state === "empty");
    iframe.style.visibility = state === "none" ? "visible" : "hidden";
    if (header) header.style.opacity = state === "none" ? "1" : "0";
  }

  // ---------------------------------------------------------------------------
  // Actions (called by gestures, keyboard, and toolbar buttons)
  // ---------------------------------------------------------------------------

  doNext() {
    if (this.currentIndex < this.links.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = this.links.length; // triggers empty state
    }
    this._showCurrent();
  }

  doPrev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this._showCurrent();
    }
  }

  async doSave() {
    const link = this.links[this.currentIndex];
    if (!link) return;
    await this._updateStatus(link.id, "saved");
    this.savedCount++;
    this.links.splice(this.currentIndex, 1);
    this._showCurrent();
  }

  async doDelete() {
    const link = this.links[this.currentIndex];
    if (!link) return;
    await this._updateStatus(link.id, "deleted");
    this.links.splice(this.currentIndex, 1);
    this._showCurrent();
  }

  doOpenExternal() {
    const link = this.links[this.currentIndex];
    if (link) window.open(link.url, "_blank", "noopener,noreferrer");
  }

  // ---------------------------------------------------------------------------
  // Stats event
  // ---------------------------------------------------------------------------

  _emitStats() {
    const remaining = Math.max(0, this.links.length - this.currentIndex);
    this.dispatchEvent(
      new CustomEvent("surfer:stats", {
        bubbles: true,
        composed: true,
        detail: {
          remaining,
          total: this.links.length,
          saved: this.savedCount,
          position: Math.min(this.currentIndex + 1, this.links.length),
        },
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Gestures — touch + mouse
  // ---------------------------------------------------------------------------

  _attachGestures() {
    const card = this.querySelector("#surfer-card");

    card.addEventListener(
      "touchstart",
      (e) => this._dragStart(e.touches[0].clientX, e.touches[0].clientY),
      { passive: true }
    );
    card.addEventListener(
      "touchmove",
      (e) => this._dragMove(e.touches[0].clientX, e.touches[0].clientY),
      { passive: true }
    );
    card.addEventListener("touchend", (e) =>
      this._dragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
    );

    card.addEventListener("mousedown", (e) => {
      this._mouseActive = true;
      this._dragStart(e.clientX, e.clientY);
    });

    this._onMouseMove = (e) => {
      if (this._mouseActive) this._dragMove(e.clientX, e.clientY);
    };
    this._onMouseUp = (e) => {
      if (this._mouseActive) {
        this._mouseActive = false;
        this._dragEnd(e.clientX, e.clientY);
      }
    };
    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mouseup", this._onMouseUp);
  }

  _dragStart(x, y) {
    this._startX = x;
    this._startY = y;
    this._dragging = true;
    const card = this.querySelector("#surfer-card");
    card.style.transition = "none";
  }

  _dragMove(x, y) {
    if (!this._dragging) return;
    const dx = x - this._startX;
    const dy = y - this._startY;
    const card = this.querySelector("#surfer-card");
    // Dampen movement so it feels weighty, not 1:1
    card.style.transform = `translate(${dx * 0.25}px, ${dy * 0.25}px)`;
    this._updateHints(dx, dy);
  }

  _dragEnd(x, y) {
    if (!this._dragging) return;
    this._dragging = false;
    const dx = x - this._startX;
    const dy = y - this._startY;

    const card = this.querySelector("#surfer-card");
    card.style.transition =
      "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    card.style.transform = "translate(0, 0)";

    this._clearHints();

    const THRESHOLD = 60;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= THRESHOLD) {
      dx > 0 ? this.doNext() : this.doPrev();
    } else if (Math.abs(dy) >= THRESHOLD) {
      dy < 0 ? this.doSave() : this.doDelete();
    }
  }

  _updateHints(dx, dy) {
    const ONSET = 30;   // px before hint starts appearing
    const FULL = 90;    // px where hint is fully opaque

    const fade = (delta) =>
      Math.min(Math.max((Math.abs(delta) - ONSET) / (FULL - ONSET), 0), 1);

    const xDom = Math.abs(dx) >= Math.abs(dy);

    const right  = xDom && dx > 0  ? fade(dx)  : 0;
    const left   = xDom && dx < 0  ? fade(dx)  : 0;
    const top    = !xDom && dy < 0 ? fade(dy)  : 0;
    const bottom = !xDom && dy > 0 ? fade(dy)  : 0;

    this.querySelector("#hint-right").style.opacity  = right;
    this.querySelector("#hint-left").style.opacity   = left;
    this.querySelector("#hint-top").style.opacity    = top;
    this.querySelector("#hint-bottom").style.opacity = bottom;
  }

  _clearHints() {
    ["right", "left", "top", "bottom"].forEach((d) => {
      const el = this.querySelector(`#hint-${d}`);
      if (el) el.style.opacity = 0;
    });
  }

  // ---------------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------------

  _attachKeyboard() {
    this._onKeyDown = (e) => {
      // Don't steal events from inputs
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      switch (e.key) {
        case "ArrowRight": e.preventDefault(); this.doNext(); break;
        case "ArrowLeft":  e.preventDefault(); this.doPrev(); break;
        case "ArrowUp":
        case "s":          e.preventDefault(); this.doSave(); break;
        case "ArrowDown":
        case "d":          e.preventDefault(); this.doDelete(); break;
        case "o":          e.preventDefault(); this.doOpenExternal(); break;
      }
    };
    document.addEventListener("keydown", this._onKeyDown);
  }
}
