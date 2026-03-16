/**
 * <surfer-toolbar>
 *
 * Fixed bottom bar displaying link stats and action buttons.
 * Listens for `surfer:stats` events dispatched by <link-surfer> and
 * delegates button clicks back to it by reference.
 *
 * Stats display:
 *   📚 7 unread  ⭐ 3 saved
 *
 * Buttons:
 *   ← Prev  |  ⭐ Save  |  🗑 Dismiss  |  Next →  |  ↗ Open
 */
export class SurferToolbar extends HTMLElement {
  connectedCallback() {
    this._render();
    this._attachListeners();
  }

  _render() {
    this.innerHTML = `
      <style>
        surfer-toolbar {
          display: block;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 56px;
          z-index: 100;
          background: rgba(10, 10, 10, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .toolbar-inner {
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 0.75rem;
          gap: 0.4rem;
        }

        /* Stats */
        .toolbar-stats {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          flex: 1;
          min-width: 0;
          font-size: 0.78rem;
          color: #888;
          white-space: nowrap;
          overflow: hidden;
        }
        .stat-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .stat-num {
          color: #d4d4d8;
          font-variant-numeric: tabular-nums;
        }

        /* Buttons */
        .toolbar-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-shrink: 0;
        }

        .tb-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          height: 34px;
          padding: 0 0.7rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.04);
          color: #a1a1aa;
          font-size: 0.78rem;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          white-space: nowrap;
        }
        .tb-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f4f4f5;
          border-color: rgba(255, 255, 255, 0.15);
        }
        .tb-btn:active { background: rgba(255, 255, 255, 0.14); }

        .tb-btn-save:hover  { background: rgba(234, 179, 8, 0.15);  color: #fcd34d; border-color: rgba(234, 179, 8, 0.3); }
        .tb-btn-delete:hover { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border-color: rgba(239, 68, 68, 0.3); }
        .tb-btn-next:hover  { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border-color: rgba(99, 102, 241, 0.3); }
        .tb-btn-open:hover  { background: rgba(34, 197, 94, 0.12);  color: #86efac; border-color: rgba(34, 197, 94, 0.3); }

        /* Hide labels on very small screens */
        @media (max-width: 480px) {
          .btn-label { display: none; }
          .tb-btn { padding: 0 0.6rem; }
          .toolbar-stats { font-size: 0.72rem; gap: 0.6rem; }
        }
      </style>

      <div class="toolbar-inner">
        <div class="toolbar-stats">
          <span class="stat-badge">
            📚 <span class="stat-num" id="stat-unread">—</span>
            <span class="btn-label"> unread</span>
          </span>
          <span class="stat-badge">
            ⭐ <span class="stat-num" id="stat-saved">—</span>
            <span class="btn-label"> saved</span>
          </span>
        </div>

        <div class="toolbar-actions">
          <button class="tb-btn"            data-action="prev"   title="Previous link (←)">← <span class="btn-label">Prev</span></button>
          <button class="tb-btn tb-btn-save"   data-action="save"   title="Save link (S / ↑)">⭐ <span class="btn-label">Save</span></button>
          <button class="tb-btn tb-btn-delete" data-action="delete" title="Dismiss link (D / ↓)">🗑 <span class="btn-label">Dismiss</span></button>
          <button class="tb-btn tb-btn-next"   data-action="next"   title="Next link (→)"><span class="btn-label">Next</span> →</button>
          <button class="tb-btn tb-btn-open"   data-action="open"   title="Open in new tab (O)">↗</button>
        </div>
      </div>
    `;
  }

  _attachListeners() {
    // Button clicks → delegate to <link-surfer>
    this.querySelector(".toolbar-actions").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const surfer = document.querySelector("link-surfer");
      if (!surfer) return;
      switch (btn.dataset.action) {
        case "prev":   surfer.doPrev(); break;
        case "next":   surfer.doNext(); break;
        case "save":   surfer.doSave(); break;
        case "delete": surfer.doDelete(); break;
        case "open":   surfer.doOpenExternal(); break;
      }
    });

    // Stats updates from <link-surfer>
    document.addEventListener("surfer:stats", (e) => {
      const { remaining, saved } = e.detail;
      const unreadEl = this.querySelector("#stat-unread");
      const savedEl  = this.querySelector("#stat-saved");
      if (unreadEl) unreadEl.textContent = remaining;
      if (savedEl)  savedEl.textContent  = saved;
    });
  }
}
