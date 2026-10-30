// ===== Konstanta & state =====
const STORAGE_KEYS = {
  transactions: "ebv_transactions",
  limit: "ebv_limit",
  theme: "ebv_theme",
  sort: "ebv_sort",
};

const CATEGORY_COLORS = {
  Food: "#2ecc71",
  Transport: "#3498db",
  Fun: "#e67e22",
};

let transactions = [];
let spendingLimit = null; // null = tanpa batas
let chart = null;

// ===== Elemen DOM =====
const form = document.getElementById("transaction-form");
const nameInput = document.getElementById("item-name");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const errorEl = document.getElementById("form-error");
const listEl = document.getElementById("transaction-list");
const totalEl = document.getElementById("total-balance");
const limitInput = document.getElementById("limit-input");
const limitWarningEl = document.getElementById("limit-warning");
const sortSelect = document.getElementById("sort-select");
const themeToggle = document.getElementById("theme-toggle");
const chartCanvas = document.getElementById("spending-chart");
const chartEmptyEl = document.getElementById("chart-empty");

// ===== Local Storage (dibungkus try/catch agar aman) =====
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Could not save to localStorage", e);
  }
}

// ===== Helper =====
function formatMoney(value) {
  return "$" + Number(value).toFixed(2);
}

function totalsByCategory() {
  const totals = {};
  transactions.forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });
  return totals;
}

function sortedTransactions() {
  const list = [...transactions];
  switch (sortSelect.value) {
    case "amount-desc": return list.sort((a, b) => b.amount - a.amount);
    case "amount-asc": return list.sort((a, b) => a.amount - b.amount);
    case "category": return list.sort((a, b) => a.category.localeCompare(b.category));
    default: return list.sort((a, b) => b.id - a.id); // terbaru dulu
  }
}

// ===== Render =====
function renderBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  totalEl.textContent = formatMoney(total);

  const overCount = spendingLimit === null
    ? 0
    : transactions.filter((t) => t.amount > spendingLimit).length;

  if (overCount > 0) {
    limitWarningEl.hidden = false;
    limitWarningEl.textContent =
      overCount + (overCount === 1 ? " transaction is" : " transactions are") +
      " over your " + formatMoney(spendingLimit) + " limit.";
  } else {
    limitWarningEl.hidden = true;
  }
}

function renderList() {
  listEl.innerHTML = "";

  if (transactions.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-message";
    empty.textContent = "No transactions yet. Add your first one above.";
    listEl.appendChild(empty);
    return;
  }

  sortedTransactions().forEach((t) => {
    const li = document.createElement("li");
    li.className = "transaction-item";
    if (spendingLimit !== null && t.amount > spendingLimit) {
      li.classList.add("over-limit");
    }

    const info = document.createElement("div");

    const nameEl = document.createElement("div");
    nameEl.className = "item-name";
    nameEl.textContent = t.name; // textContent mencegah injeksi HTML

    const amountEl = document.createElement("div");
    amountEl.className = "item-amount";
    amountEl.textContent = formatMoney(t.amount);

    const catEl = document.createElement("span");
    catEl.className = "item-category";
    catEl.textContent = t.category;

    info.append(nameEl, amountEl, catEl);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-delete";
    delBtn.textContent = "Delete";
    delBtn.setAttribute("aria-label", "Delete " + t.name);
    delBtn.addEventListener("click", () => deleteTransaction(t.id));

    li.append(info, delBtn);
    listEl.appendChild(li);
  });
}

function renderChart() {
  const totals = totalsByCategory();
  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const hasData = labels.length > 0;

  chartEmptyEl.hidden = hasData;
  chartCanvas.hidden = !hasData;

  if (typeof Chart === "undefined") return; // CDN gagal dimuat

  if (!hasData) {
    if (chart) { chart.destroy(); chart = null; }
    return;
  }

  const colors = labels.map((l) => CATEGORY_COLORS[l] || "#9b59b6");

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
  } else {
    chart = new Chart(chartCanvas, {
      type: "pie",
      data: { labels, datasets: [{ data, backgroundColor: colors }] },
      options: {
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: { label: (ctx) => ctx.label + ": " + formatMoney(ctx.parsed) },
          },
        },
      },
    });
  }
}

function render() {
  renderBalance();
  renderList();
  renderChart();
}

// ===== Aksi =====
function addTransaction(name, amount, category) {
  transactions.push({ id: Date.now(), name, amount, category });
  save(STORAGE_KEYS.transactions, transactions);
  render();
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  save(STORAGE_KEYS.transactions, transactions);
  render();
}

// ===== Event: form =====
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;

  if (!name || amountInput.value === "" || !category) {
    errorEl.textContent = "Please fill in all fields.";
    return;
  }
  if (Number.isNaN(amount) || amount <= 0) {
    errorEl.textContent = "Amount must be greater than 0.";
    return;
  }

  errorEl.textContent = "";
  addTransaction(name, amount, category);
  form.reset();
  nameInput.focus();
});

// ===== Opsional 1: batas pengeluaran =====
limitInput.addEventListener("input", () => {
  const value = parseFloat(limitInput.value);
  spendingLimit = Number.isNaN(value) || value <= 0 ? null : value;
  save(STORAGE_KEYS.limit, spendingLimit);
  renderBalance();
  renderList();
});

// ===== Opsional 2: sortir =====
sortSelect.addEventListener("change", () => {
  save(STORAGE_KEYS.sort, sortSelect.value);
  renderList();
});

// ===== Opsional 3: dark / light mode =====
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  if (chart) {
    // warna teks legend mengikuti tema
    chart.options.plugins.legend.labels.color = theme === "dark" ? "#e8eaed" : "#222";
    chart.update();
  }
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  save(STORAGE_KEYS.theme, next);
  applyTheme(next);
});

// ===== Inisialisasi =====
function init() {
  const stored = load(STORAGE_KEYS.transactions, []);
  transactions = Array.isArray(stored) ? stored : [];

  spendingLimit = load(STORAGE_KEYS.limit, null);
  if (spendingLimit !== null) limitInput.value = spendingLimit;

  sortSelect.value = load(STORAGE_KEYS.sort, "newest");

  render();
  applyTheme(load(STORAGE_KEYS.theme, "light"));
}

init();