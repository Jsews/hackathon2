// --- CONFIG & API WRAPPER ---
// 👇 set your backend API base here (FastAPI default is http://127.0.0.1:8000)
// window.API_BASE = "http://127.0.0.1:8000";   

// Use mock mode if API_BASE is not set
const USE_MOCK = !window.API_BASE;           

async function API(path, opts = {}) {
  if (USE_MOCK) return mockAPI(path, opts);

  const url = `${window.API_BASE}${path}`;
  const headers = Object.assign(
    { "Content-Type": "application/json" },
    opts.headers || {}
  );
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- DEMO AUTH ---
const auth = {
  user: null,
  async signInDemo(role = "buyer") {
    this.user = { email: `${role}@demo.local`, role };
    localStorage.setItem("user", JSON.stringify(this.user));
    location.href = "insight.html";
  },
  current() {
    if (!this.user)
      this.user = JSON.parse(localStorage.getItem("user") || "null");
    return this.user;
  },
  signOut() {
    this.user = null;
    localStorage.removeItem("user");
    location.href = "login.html";
  },
};

// --- PAGE: insight.html ---
async function loadItems() {
  try {
    const items = await API("/items");
    const container = document.querySelector("#items");
    if (!container) return;
    container.innerHTML = "";

    items.forEach((it) => {
      const card = document.createElement("div");
      card.className = "card glass";
      card.innerHTML = `
        <img src="${it.photo_url}" alt="${it.title}" style="width:100%;height:150px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />
        <h4>${it.title}</h4>
        <p>${it.description || ""}</p>
        <p><b>${it.portions}</b> portions @ TZS ${(it.price_cents).toLocaleString()}</p>
        <button class="btn" onclick="checkout(${it.id})">Reserve</button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load items", err);
  }
}

async function checkout(id) {
  try {
    const res = await API("/checkout", {
      method: "POST",
      body: JSON.stringify({ order_id: id }),
    });
    if (res.payment_url) {
      window.open(res.payment_url, "_blank");
    }
  } catch (err) {
    alert("Checkout failed: " + err.message);
  }
}

// --- NEW LISTING MODAL ---
function initListingModal() {
  const modal = document.querySelector("#modal");
  if (!modal) return;
  const openBtn = document.querySelector("#newListingBtn");
  const closeBtn = document.querySelector("#closeModal");
  const cancelBtn = document.querySelector("#cancelBtn");
  const form = document.querySelector("#listingForm");

  function close() {
    modal.style.display = "none";
  }
  function open() {
    modal.style.display = "flex";
  }

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  cancelBtn?.addEventListener("click", close);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      title: form.querySelector("#title").value,
      description: form.querySelector("#description").value,
      category: form.querySelector("#category").value,
      portions: parseInt(form.querySelector("#portions").value || "1"),
      price_cents: parseInt(form.querySelector("#price").value || "0") * 100,
      photo_url: form.querySelector("#photo").value,
      pickup_window_start: form.querySelector("#pickupStart").value,
      pickup_window_end: form.querySelector("#pickupEnd").value,
    };
    try {
      await API("/items", { method: "POST", body: JSON.stringify(data) });
      close();
      loadItems();
    } catch (err) {
      alert("Failed to create item: " + err.message);
    }
  });
}

// --- IMPACT CHART ---
function renderImpact() {
  const ctx = document.getElementById("impactChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Meals Saved", "CO₂ Reduced", "Water Saved"],
      datasets: [
        {
          label: "Impact",
          data: [12, 34, 56],
        },
      ],
    },
  });
}

// --- MICRO LESSONS ---
function showLesson() {
  const box = document.querySelector("#lesson");
  if (!box) return;
  const lessons = [
    "📦 Tip: Label your food surplus with clear pickup times.",
    "🌱 Reminder: Donating surplus reduces landfill waste.",
    "🤝 Community: Partner with local charities for pickups.",
  ];
  box.innerHTML = lessons[Math.floor(Math.random() * lessons.length)];
}

// --- AI MATCH SIM ---
function initAI() {
  const btn = document.querySelector("#simulateAI");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const result = {
      item: "Chicken Rice Box",
      match: "Local Shelter",
      confidence: 0.92,
    };
    document.querySelector("#aiResult").innerHTML = `
      <div class="card glass">
        <h4>AI Match Found</h4>
        <p>${result.item} → ${result.match}</p>
        <small>Confidence: ${(result.confidence * 100).toFixed(1)}%</small>
      </div>`;
  });
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#items")) {
    loadItems();
    initListingModal();
    renderImpact();
    showLesson();
    initAI();
    document
      .querySelector("#logoutBtn")
      ?.addEventListener("click", () => auth.signOut());
  }
});

// --- MOCK FALLBACKS ---
function mockAPI(path, opts = {}) {
  const method = opts.method || "GET"; // default to GET
  if (path === "/items" && method === "GET") {
    return Promise.resolve([
      { id: 1, title: "Chicken Rice Box", description: "Fresh surplus of chicken rice", portions: 5, price_cents: 250000, photo_url: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=6e0b6ed9b9b5f9b2c2a7b8d08f6bff23" },
      { id: 2, title: "Bakery Pack", description: "Assorted fresh breads", portions: 10, price_cents: 50000, photo_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80" },
      { id: 3, title: "Vegetable Box", description: "Local fresh veggies", portions: 7, price_cents: 120000, photo_url:"https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=7b5b6b9c2d8d8d8d8d8d8d8d8d8d8" },
    ]);
  }

  if (path === "/checkout") {
    return Promise.resolve({ payment_url: "https://paystack.com/pay/demo-foodlink-checkout" });
  }

  if (path === "/items" && method === "POST") {
    return Promise.resolve({ id: Math.random() * 1000 });
  }

  return Promise.reject(new Error("Unknown mock path " + path));
}

