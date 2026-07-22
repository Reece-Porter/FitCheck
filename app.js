/* =====================================================================
   Fitted — Outfit Builder
   Client-side app. All data lives in localStorage so the site works on
   static hosting (e.g. GitHub Pages) with no backend.
   ===================================================================== */

(function () {
  "use strict";

  /* ---------------- Storage layer ---------------- */
  const NS = "fitted:";
  const DB = {
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(NS + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(NS + key, JSON.stringify(value));
      } catch (e) {
        toast("Storage is full or unavailable.");
      }
    }
  };

  /* Data collections
     - catalog   : every item the user has ever added (drives recommendations)
     - builder   : items currently on the outfit board
     - fits      : saved outfits
     - wishlist  : saved individual items                                  */
  const Store = {
    get catalog() { return DB.read("catalog", []); },
    set catalog(v) { DB.write("catalog", v); },
    get builder() { return DB.read("builder", []); },
    set builder(v) { DB.write("builder", v); },
    get fits() { return DB.read("fits", []); },
    set fits(v) { DB.write("fits", v); },
    get wishlist() { return DB.read("wishlist", []); },
    set wishlist(v) { DB.write("wishlist", v); }
  };

  /* ---------------- Categories ---------------- */
  const CATEGORIES = [
    { id: "headwear", label: "Headwear", icon: "🧢" },
    { id: "outerwear", label: "Outerwear", icon: "🧥" },
    { id: "top", label: "Tops", icon: "👕" },
    { id: "bottom", label: "Bottoms", icon: "👖" },
    { id: "footwear", label: "Footwear", icon: "👟" },
    { id: "accessory", label: "Accessories", icon: "👜" }
  ];
  const CAT_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]));
  const CAT_ICON = Object.fromEntries(CATEGORIES.map(c => [c.id, c.icon]));

  const CATEGORY_KEYWORDS = {
    headwear: ["hat", "cap", "beanie", "bucket", "headband", "visor"],
    outerwear: ["jacket", "coat", "hoodie", "parka", "puffer", "fleece", "blazer", "cardigan", "overshirt", "gilet", "vest", "windbreaker"],
    top: ["shirt", "tee", "t-shirt", "top", "polo", "knit", "sweater", "jumper", "sweatshirt", "blouse", "tank", "crewneck"],
    bottom: ["jeans", "trouser", "pant", "short", "chino", "skirt", "jogger", "cargo", "denim", "legging"],
    footwear: ["shoe", "sneaker", "boot", "trainer", "loafer", "sandal", "heel", "footwear", "runner", "550", "990"],
    accessory: ["bag", "belt", "watch", "scarf", "sunglass", "glove", "wallet", "tote", "necklace", "ring", "sock", "tie", "cardholder"]
  };

  function guessCategory(text) {
    const t = (text || "").toLowerCase();
    for (const cat of CATEGORIES) {
      const kws = CATEGORY_KEYWORDS[cat.id] || [];
      if (kws.some(k => t.includes(k))) return cat.id;
    }
    return "top";
  }

  /* ---------------- Helpers ---------------- */
  function uid() {
    return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(u) {
    if (!u) return "";
    try {
      const url = new URL(u, window.location.href);
      if (url.protocol === "http:" || url.protocol === "https:") return url.href;
    } catch (e) {}
    return "";
  }

  function parsePrice(v) {
    if (v == null || v === "") return null;
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  }

  function money(n) {
    if (n == null || isNaN(n)) return "";
    return "$" + n.toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }

  function totalPrice(items) {
    return items.reduce((sum, it) => sum + (it.price || 0), 0);
  }

  function hostname(u) {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }

  /* ---------------- Toast ---------------- */
  let toastTimer = null;
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = el('<div class="toast" role="status" aria-live="polite"></div>');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    // force reflow so the animation retriggers
    void t.offsetWidth;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------------- Link preview fetching ----------------
     Displaying a cross-origin <img> never needs CORS, but *reading* a
     product page's HTML does. We try public read-only CORS proxies as a
     best effort to auto-pull the Open Graph image / title / price. If they
     fail (offline, blocked, no proxy), the user just pastes an image URL. */
  function isImageUrl(u) {
    return /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(u || "");
  }

  const PROXIES = [
    u => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
    u => "https://corsproxy.io/?url=" + encodeURIComponent(u),
    u => "https://thingproxy.freeboard.io/fetch/" + u
  ];

  function metaFrom(doc, keys) {
    for (const k of keys) {
      const node = doc.querySelector(
        'meta[property="' + k + '"], meta[name="' + k + '"], meta[itemprop="' + k + '"]'
      );
      if (node && node.getAttribute("content")) return node.getAttribute("content").trim();
    }
    return null;
  }

  async function fetchPreview(rawUrl) {
    const url = safeUrl(rawUrl);
    const out = { image: null, title: null, price: null, site: hostname(url) };
    if (!url) return out;
    if (isImageUrl(url)) { out.image = url; return out; }

    for (const build of PROXIES) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 9000);
        const res = await fetch(build(url), { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) continue;
        const html = await res.text();
        if (!html || html.length < 30) continue;
        const doc = new DOMParser().parseFromString(html, "text/html");

        let img = metaFrom(doc, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src", "image"]);
        if (img) img = safeUrl(new URL(img, url).href);

        const title = metaFrom(doc, ["og:title", "twitter:title"]) ||
          (doc.querySelector("title") ? doc.querySelector("title").textContent.trim() : null);

        const price = metaFrom(doc, ["product:price:amount", "og:price:amount", "price", "twitter:data1"]);

        out.image = img || out.image;
        out.title = title || out.title;
        out.price = price || out.price;
        out.site = metaFrom(doc, ["og:site_name"]) || out.site;

        if (out.image) return out;
      } catch (e) {
        /* try the next proxy */
      }
    }
    return out;
  }

  /* ---------------- Catalog bookkeeping ---------------- */
  function recordInCatalog(item) {
    const catalog = Store.catalog;
    catalog.unshift({
      brand: item.brand || "",
      category: item.category || "",
      price: item.price || null,
      name: item.name || "",
      at: Date.now()
    });
    Store.catalog = catalog.slice(0, 500);
  }

  /* ---------------- Shared UI: nav counts ---------------- */
  function refreshNavCounts() {
    const map = {
      "nav-fits": Store.fits.length,
      "nav-wishlist": Store.wishlist.length
    };
    Object.entries(map).forEach(([id, n]) => {
      const badge = document.getElementById(id);
      if (badge) badge.textContent = n ? n : "";
    });
  }

  /* Render one item card. `context` = 'builder' | 'wishlist' | 'view' */
  function itemCard(item, context) {
    const img = safeUrl(item.image);
    const thumb = img
      ? '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(item.name) + '" loading="lazy" onerror="this.parentNode.innerHTML=\'<div class=&quot;noimg&quot;>👗</div>\'">'
      : '<div class="noimg">' + (CAT_ICON[item.category] || "👗") + "</div>";

    let actions = "";
    if (context === "builder") {
      actions =
        '<button class="icon-btn" title="Add to wishlist" data-act="wish" data-id="' + item.id + '">♡</button>' +
        '<button class="icon-btn danger" title="Remove" data-act="remove" data-id="' + item.id + '">×</button>';
    } else if (context === "wishlist") {
      actions =
        '<button class="icon-btn" title="Send to builder" data-act="tobuilder" data-id="' + item.id + '">→</button>' +
        '<button class="icon-btn danger" title="Remove" data-act="remove" data-id="' + item.id + '">×</button>';
    }

    const buy = safeUrl(item.url)
      ? '<a class="buy" href="' + escapeHtml(safeUrl(item.url)) + '" target="_blank" rel="noopener">View ↗</a>'
      : "";

    return el(
      '<article class="item-card" data-id="' + item.id + '">' +
        '<div class="thumb">' + thumb +
          (actions ? '<div class="card-actions">' + actions + "</div>" : "") +
        "</div>" +
        '<div class="info">' +
          '<div class="name">' + escapeHtml(item.name || "Untitled item") + "</div>" +
          (item.brand ? '<div class="brand">' + escapeHtml(item.brand) + "</div>" : "") +
          (item.price != null ? '<div class="price">' + money(item.price) + "</div>" : "") +
          buy +
        "</div>" +
      "</article>"
    );
  }

  /* =====================================================================
     PAGE: BUILDER
     ===================================================================== */
  function initBuilder() {
    const board = document.getElementById("board");
    const summary = document.getElementById("summary");
    const form = document.getElementById("add-form");
    const urlInput = document.getElementById("f-url");
    const nameInput = document.getElementById("f-name");
    const brandInput = document.getElementById("f-brand");
    const catInput = document.getElementById("f-cat");
    const priceInput = document.getElementById("f-price");
    const fetchBtn = document.getElementById("fetch-btn");
    const previewBox = document.getElementById("preview");
    const statusMsg = document.getElementById("form-status");
    let pendingImage = null;

    function setStatus(msg, kind) {
      statusMsg.textContent = msg || "";
      statusMsg.className = "status-msg" + (kind ? " " + kind : "");
    }

    function showPreview(p) {
      if (!p || !p.image) { previewBox.style.display = "none"; return; }
      previewBox.style.display = "flex";
      previewBox.innerHTML =
        '<img src="' + escapeHtml(p.image) + '" alt="preview" onerror="this.style.opacity=0.2">' +
        '<div class="pmeta"><strong>' + escapeHtml(p.title || "Image found") + "</strong>" +
        (p.site ? '<span class="hint">' + escapeHtml(p.site) + "</span>" : "") + "</div>";
    }

    async function runFetch() {
      const url = urlInput.value.trim();
      if (!url) { setStatus("Paste a shopping link or image URL first.", "err"); return; }
      if (!safeUrl(url)) { setStatus("That doesn't look like a valid URL.", "err"); return; }

      fetchBtn.disabled = true;
      const label = fetchBtn.innerHTML;
      fetchBtn.innerHTML = '<span class="spinner"></span>';
      setStatus("Fetching preview…");

      const p = await fetchPreview(url);
      fetchBtn.disabled = false;
      fetchBtn.innerHTML = label;

      if (p.image) {
        pendingImage = p.image;
        showPreview(p);
        if (!nameInput.value && p.title) nameInput.value = p.title.slice(0, 80);
        if (!priceInput.value && p.price) priceInput.value = parsePrice(p.price) || "";
        if (!catInput.value) catInput.value = guessCategory((p.title || "") + " " + url);
        setStatus("Preview loaded — tidy up the details and add it.", "ok");
      } else {
        pendingImage = isImageUrl(url) ? url : null;
        if (pendingImage) {
          showPreview({ image: pendingImage, site: hostname(url) });
          setStatus("Using the pasted image URL.", "ok");
        } else {
          setStatus("Couldn't auto-load an image. Paste a direct image URL (right-click the product photo → Copy image address) and fetch again, or just fill in the details below.", "err");
        }
      }
    }

    fetchBtn.addEventListener("click", runFetch);
    urlInput.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); runFetch(); }
    });
    urlInput.addEventListener("blur", () => {
      const u = urlInput.value.trim();
      if (isImageUrl(u)) { pendingImage = u; showPreview({ image: u, site: hostname(u) }); }
    });

    form.addEventListener("submit", e => {
      e.preventDefault();
      const url = urlInput.value.trim();
      const image = pendingImage || (isImageUrl(url) ? url : "");
      const name = nameInput.value.trim();

      if (!image && !name) {
        setStatus("Add at least an image (fetch a link) or a name.", "err");
        return;
      }

      const item = {
        id: uid(),
        name: name || "Untitled item",
        brand: brandInput.value.trim(),
        category: catInput.value || guessCategory(name + " " + url),
        price: parsePrice(priceInput.value),
        image: safeUrl(image),
        url: safeUrl(url),
        at: Date.now()
      };

      const builder = Store.builder;
      builder.push(item);
      Store.builder = builder;
      recordInCatalog(item);

      form.reset();
      pendingImage = null;
      previewBox.style.display = "none";
      setStatus("", "");
      urlInput.focus();
      render();
      toast("Added to your outfit");
    });

    /* Board actions (event delegation) */
    board.addEventListener("click", e => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      const builder = Store.builder;
      const item = builder.find(i => i.id === id);
      if (!item) return;

      if (act === "remove") {
        Store.builder = builder.filter(i => i.id !== id);
        render();
        toast("Removed");
      } else if (act === "wish") {
        addToWishlist(item);
        toast("Saved to wishlist");
      }
    });

    document.getElementById("clear-board").addEventListener("click", () => {
      if (!Store.builder.length) return;
      if (confirm("Clear all items from the current outfit?")) {
        Store.builder = [];
        render();
      }
    });

    document.getElementById("wishlist-all").addEventListener("click", () => {
      const builder = Store.builder;
      if (!builder.length) return;
      builder.forEach(addToWishlist);
      toast("Whole outfit saved to wishlist");
    });

    document.getElementById("save-fit").addEventListener("click", openSaveFit);

    function render() {
      const builder = Store.builder;
      refreshNavCounts();

      if (!builder.length) {
        board.innerHTML =
          '<div class="empty"><div class="emoji">👔</div>' +
          "<h3>Your outfit board is empty</h3>" +
          "<p>Paste a shopping link or image URL on the right, fetch the preview, and build a whole look you can see together.</p></div>";
        summary.innerHTML = "";
        return;
      }

      const groups = CATEGORIES
        .map(c => ({ cat: c, items: builder.filter(i => i.category === c.id) }))
        .filter(g => g.items.length);

      board.innerHTML = "";
      groups.forEach(g => {
        const slot = el(
          '<div class="category-slot"><h3>' + CAT_ICON[g.cat.id] + " " + g.cat.label + "</h3>" +
          '<div class="item-grid"></div></div>'
        );
        const grid = slot.querySelector(".item-grid");
        g.items.forEach(it => grid.appendChild(itemCard(it, "builder")));
        board.appendChild(slot);
      });

      const total = totalPrice(builder);
      summary.innerHTML =
        '<div class="totals"><strong>' + money(total) + "</strong> · " +
        builder.length + " item" + (builder.length === 1 ? "" : "s") +
        " across " + groups.length + " categor" + (groups.length === 1 ? "y" : "ies") + "</div>";
    }

    render();
  }

  /* ----- Save-fit modal ----- */
  function openSaveFit() {
    const builder = Store.builder;
    if (!builder.length) { toast("Add some items first"); return; }
    const backdrop = document.getElementById("save-modal");
    const nameField = document.getElementById("fit-name");
    nameField.value = "";
    backdrop.classList.add("open");
    nameField.focus();

    function close() { backdrop.classList.remove("open"); cleanup(); }
    function onConfirm() {
      const name = nameField.value.trim() || "Untitled fit";
      const fits = Store.fits;
      fits.unshift({
        id: uid(),
        name: name,
        items: JSON.parse(JSON.stringify(builder)),
        at: Date.now()
      });
      Store.fits = fits;
      close();
      refreshNavCounts();
      toast("Saved to My Fits");
    }
    function onKey(e) { if (e.key === "Enter") onConfirm(); if (e.key === "Escape") close(); }
    function onBackdrop(e) { if (e.target === backdrop) close(); }

    const confirmBtn = document.getElementById("fit-save-confirm");
    const cancelBtn = document.getElementById("fit-save-cancel");
    const closeBtn = document.getElementById("fit-modal-close");
    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", close);
    closeBtn.addEventListener("click", close);
    nameField.addEventListener("keydown", onKey);
    backdrop.addEventListener("click", onBackdrop);

    function cleanup() {
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", close);
      closeBtn.removeEventListener("click", close);
      nameField.removeEventListener("keydown", onKey);
      backdrop.removeEventListener("click", onBackdrop);
    }
  }

  /* ---------------- Wishlist helpers ---------------- */
  function addToWishlist(item) {
    const wishlist = Store.wishlist;
    // de-dupe on image+name so re-saving the same thing is a no-op
    const key = (item.image || "") + "|" + (item.name || "");
    if (wishlist.some(w => (w.image || "") + "|" + (w.name || "") === key)) return;
    const copy = JSON.parse(JSON.stringify(item));
    copy.id = uid();
    copy.at = Date.now();
    wishlist.unshift(copy);
    Store.wishlist = wishlist;
    recordInCatalog(item);
    refreshNavCounts();
  }

  /* =====================================================================
     PAGE: MY FITS
     ===================================================================== */
  function initFits() {
    const gallery = document.getElementById("fits-gallery");
    const statsRow = document.getElementById("fits-stats");

    function collage(items) {
      const shots = items.slice(0, 4);
      const cls = "fit-collage n" + Math.min(shots.length, 4);
      const cells = shots.map(it => {
        const img = safeUrl(it.image);
        return '<div class="cell">' +
          (img
            ? '<img src="' + escapeHtml(img) + '" alt="" loading="lazy" onerror="this.parentNode.innerHTML=\'<div class=&quot;noimg&quot;>👗</div>\'">'
            : '<div class="noimg">' + (CAT_ICON[it.category] || "👗") + "</div>") +
          "</div>";
      }).join("");
      return '<div class="' + cls + '">' + cells + "</div>";
    }

    function render() {
      const fits = Store.fits;
      refreshNavCounts();

      if (statsRow) {
        const totalItems = fits.reduce((n, f) => n + f.items.length, 0);
        statsRow.innerHTML = fits.length
          ? '<div class="stat"><div class="num">' + fits.length + '</div><div class="lbl">Saved fits</div></div>' +
            '<div class="stat"><div class="num">' + totalItems + '</div><div class="lbl">Pieces styled</div></div>'
          : "";
      }

      if (!fits.length) {
        gallery.innerHTML =
          '<div class="empty" style="grid-column:1/-1"><div class="emoji">📁</div>' +
          "<h3>No saved fits yet</h3>" +
          '<p>Build a look on the <a href="index.html">Builder</a> and hit “Save fit” to keep it here.</p></div>';
        return;
      }

      gallery.innerHTML = "";
      fits.forEach(fit => {
        const date = new Date(fit.at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
        const card = el(
          '<article class="fit-card" data-id="' + fit.id + '">' +
            collage(fit.items) +
            '<div class="fit-body">' +
              "<h3>" + escapeHtml(fit.name) + "</h3>" +
              '<p class="fit-meta">' + fit.items.length + " pieces · " + date + "</p>" +
              '<div class="fit-foot">' +
                '<span class="fit-price">' + money(totalPrice(fit.items)) + "</span>" +
                "<span>" +
                  '<button class="btn ghost sm" data-act="open" data-id="' + fit.id + '">View</button> ' +
                  '<button class="icon-btn danger" title="Delete" data-act="delete" data-id="' + fit.id + '">×</button>' +
                "</span>" +
              "</div>" +
            "</div>" +
          "</article>"
        );
        gallery.appendChild(card);
      });
    }

    gallery.addEventListener("click", e => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.act === "delete") {
        if (confirm("Delete this fit?")) {
          Store.fits = Store.fits.filter(f => f.id !== id);
          render();
          toast("Fit deleted");
        }
      } else if (btn.dataset.act === "open") {
        openFitViewer(id);
      }
    });

    render();
  }

  function openFitViewer(id) {
    const fit = Store.fits.find(f => f.id === id);
    if (!fit) return;
    const backdrop = document.getElementById("view-modal");
    const body = document.getElementById("view-body");
    const title = document.getElementById("view-title");
    title.textContent = fit.name;

    const groups = CATEGORIES
      .map(c => ({ cat: c, items: fit.items.filter(i => i.category === c.id) }))
      .filter(g => g.items.length);

    body.innerHTML = "";
    groups.forEach(g => {
      const slot = el(
        '<div class="category-slot"><h3>' + CAT_ICON[g.cat.id] + " " + g.cat.label + "</h3>" +
        '<div class="item-grid"></div></div>'
      );
      const grid = slot.querySelector(".item-grid");
      g.items.forEach(it => grid.appendChild(itemCard(it, "view")));
      body.appendChild(slot);
    });
    body.appendChild(el(
      '<div class="summary" style="border-radius:12px;margin-top:1rem">' +
      '<div class="totals"><strong>' + money(totalPrice(fit.items)) + "</strong> total</div>" +
      '<button class="btn accent sm" id="view-load">Load into builder</button></div>'
    ));

    backdrop.classList.add("open");

    function close() { backdrop.classList.remove("open"); cleanup(); }
    function onBackdrop(e) { if (e.target === backdrop) close(); }
    function onLoad() {
      Store.builder = JSON.parse(JSON.stringify(fit.items));
      toast("Loaded — opening builder");
      setTimeout(() => { window.location.href = "index.html"; }, 500);
    }
    const closeBtn = document.getElementById("view-modal-close");
    const loadBtn = document.getElementById("view-load");
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", onBackdrop);
    loadBtn.addEventListener("click", onLoad);
    function cleanup() {
      closeBtn.removeEventListener("click", close);
      backdrop.removeEventListener("click", onBackdrop);
    }
  }

  /* =====================================================================
     PAGE: WISHLIST
     ===================================================================== */
  function initWishlist() {
    const gallery = document.getElementById("wishlist-gallery");
    const statsRow = document.getElementById("wishlist-stats");

    function render() {
      const wishlist = Store.wishlist;
      refreshNavCounts();

      if (statsRow) {
        const total = totalPrice(wishlist);
        statsRow.innerHTML = wishlist.length
          ? '<div class="stat"><div class="num">' + wishlist.length + '</div><div class="lbl">Items saved</div></div>' +
            '<div class="stat"><div class="num">' + money(total) + '</div><div class="lbl">Total value</div></div>'
          : "";
      }

      if (!wishlist.length) {
        gallery.innerHTML =
          '<div class="empty" style="grid-column:1/-1"><div class="emoji">💝</div>' +
          "<h3>Your wishlist is empty</h3>" +
          '<p>Tap the ♡ on any item in the <a href="index.html">Builder</a> to save it here for later.</p></div>';
        return;
      }

      gallery.innerHTML = "";
      const grid = el('<div class="item-grid" style="grid-column:1/-1;grid-template-columns:repeat(auto-fill,minmax(160px,1fr))"></div>');
      wishlist.forEach(it => grid.appendChild(itemCard(it, "wishlist")));
      gallery.appendChild(grid);
    }

    gallery.addEventListener("click", e => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const id = btn.dataset.id;
      const wishlist = Store.wishlist;
      const item = wishlist.find(i => i.id === id);
      if (!item) return;

      if (btn.dataset.act === "remove") {
        Store.wishlist = wishlist.filter(i => i.id !== id);
        render();
        toast("Removed from wishlist");
      } else if (btn.dataset.act === "tobuilder") {
        const builder = Store.builder;
        const copy = JSON.parse(JSON.stringify(item));
        copy.id = uid();
        builder.push(copy);
        Store.builder = builder;
        toast("Added to builder");
      }
    });

    render();
  }

  /* =====================================================================
     PAGE: RECOMMENDATIONS
     ===================================================================== */
  function initRecommendations() {
    const brandWrap = document.getElementById("rec-brands");
    const itemWrap = document.getElementById("rec-items");
    const noteWrap = document.getElementById("rec-note");
    const statsRow = document.getElementById("rec-stats");

    // Gather the user's signal from everything they've entered.
    const catalog = Store.catalog;
    const wishlist = Store.wishlist;
    const fitItems = Store.fits.flatMap(f => f.items);
    const builder = Store.builder;
    const allItems = [].concat(catalog, wishlist, fitItems, builder);

    const brandCount = {};
    const catCount = {};
    allItems.forEach(it => {
      if (it.brand) {
        const b = it.brand.trim().toLowerCase();
        brandCount[b] = (brandCount[b] || 0) + 1;
      }
      if (it.category) catCount[it.category] = (catCount[it.category] || 0) + 1;
    });

    const usedBrandNames = Object.keys(brandCount);
    const totalEntries = allItems.length;

    // Build a style profile from the catalogue brands the user has used.
    const styleScore = {};
    const CATALOG = window.BRAND_CATALOG || [];
    CATALOG.forEach(b => {
      if (brandCount[b.name.toLowerCase()]) {
        const weight = brandCount[b.name.toLowerCase()];
        b.styles.forEach(s => { styleScore[s] = (styleScore[s] || 0) + weight; });
      }
    });

    function styleMatch(entry) {
      return entry.styles.reduce((n, s) => n + (styleScore[s] || 0), 0);
    }

    // ---- Recommended brands ----
    let brandRecs;
    const hasSignal = usedBrandNames.length > 0 || Object.keys(styleScore).length > 0;

    if (hasSignal) {
      brandRecs = CATALOG
        .filter(b => !brandCount[b.name.toLowerCase()]) // suggest new brands
        .map(b => ({ brand: b, score: styleMatch(b) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      // top-up with popular staples if we found few matches
      if (brandRecs.length < 6) {
        const have = new Set(brandRecs.map(x => x.brand.name));
        CATALOG.forEach(b => {
          if (brandRecs.length < 6 && !have.has(b.name) && !brandCount[b.name.toLowerCase()]) {
            brandRecs.push({ brand: b, score: 0 });
            have.add(b.name);
          }
        });
      }
    } else {
      brandRecs = CATALOG.slice(0, 8).map(b => ({ brand: b, score: 0 }));
    }

    // ---- Recommended items: fill gaps in the user's wardrobe ----
    const missingCats = CATEGORIES.map(c => c.id).filter(id => !catCount[id]);
    const SUGGESTIONS = window.ITEM_SUGGESTIONS || [];
    let itemRecs = SUGGESTIONS
      .map(s => {
        let score = s.styles.reduce((n, st) => n + (styleScore[st] || 0), 0);
        if (missingCats.includes(s.category)) score += 5; // strongly prefer gaps
        return { item: s, score: score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (!hasSignal) itemRecs = SUGGESTIONS.slice(0, 8).map(s => ({ item: s, score: 0 }));

    // ---- Stats ----
    if (statsRow) {
      const topStyles = Object.entries(styleScore).sort((a, b) => b[1] - a[1]).slice(0, 1);
      statsRow.innerHTML =
        '<div class="stat"><div class="num">' + totalEntries + '</div><div class="lbl">Items analysed</div></div>' +
        '<div class="stat"><div class="num">' + usedBrandNames.length + '</div><div class="lbl">Brands you’ve used</div></div>' +
        '<div class="stat"><div class="num">' + (topStyles.length ? escapeHtml(cap(topStyles[0][0])) : "—") + '</div><div class="lbl">Your top vibe</div></div>';
    }

    // ---- Note ----
    if (noteWrap) {
      if (!hasSignal) {
        noteWrap.innerHTML =
          "<strong>Just getting started?</strong> Add a few items with brands on the " +
          '<a href="index.html">Builder</a> and these picks will retune to your taste. ' +
          "For now, here are some editor favourites to explore.";
      } else {
        const styleList = Object.entries(styleScore).sort((a, b) => b[1] - a[1]).slice(0, 3)
          .map(s => cap(s[0]));
        noteWrap.innerHTML =
          "<strong>Tailored to you.</strong> Based on your " +
          (styleList.length ? "<em>" + escapeHtml(styleList.join(", ")) + "</em> leanings" : "entries") +
          (missingCats.length
            ? " — and we noticed your outfits are light on <em>" +
              escapeHtml(missingCats.map(c => CAT_LABEL[c]).join(", ")) + "</em>, so we’ve suggested pieces to fill the gaps."
            : ".");
      }
    }

    // ---- Render brands ----
    brandWrap.innerHTML = "";
    brandRecs.forEach(({ brand, score }) => {
      const initial = brand.name.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase() || "F";
      const matchTag = score > 0
        ? '<span class="match">Matches your style</span>'
        : '<span class="tag">' + brand.price + " · editor pick</span>";
      brandWrap.appendChild(el(
        '<article class="brand-card">' +
          '<div class="b-top"><div><h3>' + escapeHtml(brand.name) + "</h3>" +
            '<div class="brand" style="font-size:.78rem;color:var(--muted)">' +
              brand.categories.map(c => CAT_LABEL[c]).join(" · ") + "</div></div>" +
            '<div class="b-logo">' + escapeHtml(initial) + "</div></div>" +
          '<p class="b-desc">' + escapeHtml(brand.desc) + "</p>" +
          matchTag +
          ' <a class="buy" style="font-size:.82rem;font-weight:600" href="' + escapeHtml(safeUrl(brand.url)) +
            '" target="_blank" rel="noopener">Shop ↗</a>' +
        "</article>"
      ));
    });

    // ---- Render item suggestions ----
    itemWrap.innerHTML = "";
    itemRecs.forEach(({ item, score }) => {
      const gap = missingCats.includes(item.category);
      itemWrap.appendChild(el(
        '<article class="item-card">' +
          '<div class="thumb"><div class="noimg">' + (CAT_ICON[item.category] || "👗") + "</div></div>" +
          '<div class="info">' +
            '<div class="name">' + escapeHtml(item.name) + "</div>" +
            '<div class="brand">' + escapeHtml(item.brand) + "</div>" +
            '<div style="margin-top:.35rem">' +
              '<span class="tag">' + escapeHtml(CAT_LABEL[item.category] || item.category) + "</span>" +
              (gap ? '<span class="tag" style="background:var(--accent-soft);color:var(--accent-dark)">fills a gap</span>' : "") +
            "</div>" +
          "</div>" +
        "</article>"
      ));
    });
  }

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* =====================================================================
     Bootstrap
     ===================================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    refreshNavCounts();
    const page = document.body.dataset.page;
    try {
      if (page === "builder") initBuilder();
      else if (page === "fits") initFits();
      else if (page === "wishlist") initWishlist();
      else if (page === "recommendations") initRecommendations();
    } catch (e) {
      console.error(e);
    }
  });
})();
