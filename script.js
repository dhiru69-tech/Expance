/* ==========================================================================
   Expense Tracker — script.js
   Vanilla JS app: state lives in an array of transaction objects,
   persisted to localStorage. Every render is derived fresh from that
   array, so the UI never gets out of sync with the data.
   ========================================================================== */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "expenseTracker.transactions";

const CATEGORIES = {
  income: ["Salary", "Freelance", "Scholarship", "Gift", "Other"],
  expense: [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Education",
    "Health",
    "Other",
  ],
};

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const form = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const categorySelect = document.getElementById("category");
const typeInputs = document.querySelectorAll('input[name="type"]');

const totalBalanceEl = document.getElementById("totalBalance");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");

const transactionListEl = document.getElementById("transactionList");
const emptyStateEl = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const sortSelect = document.getElementById("sortSelect");

const toastEl = document.getElementById("toast");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let transactions = loadTransactions();

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

/**
 * Reads transactions from localStorage.
 * localStorage only stores strings, so we JSON.parse() what we get back.
 * If the data is missing or corrupted (e.g. someone edited it by hand,
 * or an old incompatible version left bad data behind), we fail safely
 * and start with an empty list instead of crashing the app.
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Keep only entries that look like valid transaction objects.
    return parsed.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        (item.type === "income" || item.type === "expense") &&
        typeof item.description === "string" &&
        typeof item.amount === "number" &&
        typeof item.category === "string" &&
        typeof item.date === "string"
    );
  } catch (error) {
    console.error("Failed to load transactions from localStorage:", error);
    return [];
  }
}

/**
 * Saves the current transactions array to localStorage.
 * JSON.stringify() turns the array of objects into a string, because
 * that's the only type localStorage can store.
 */
function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Failed to save transactions to localStorage:", error);
    showToast("Could not save data. Your browser storage may be full.");
  }
}

// ---------------------------------------------------------------------------
// Category dropdown — depends on selected type
// ---------------------------------------------------------------------------

function populateCategories(type) {
  const options = CATEGORIES[type] || CATEGORIES.expense;
  categorySelect.innerHTML = options
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");
}

function getSelectedType() {
  const checked = document.querySelector('input[name="type"]:checked');
  return checked ? checked.value : "expense";
}

typeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    populateCategories(getSelectedType());
  });
});

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount) {
  return "₹" + amount.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function clearFieldErrors() {
  ["descriptionError", "amountError", "dateError", "categoryError"].forEach(
    (id) => {
      document.getElementById(id).textContent = "";
    }
  );
  [descriptionInput, amountInput, dateInput].forEach((el) =>
    el.classList.remove("input-invalid")
  );
}

function setFieldError(fieldId, inputEl, message) {
  document.getElementById(fieldId).textContent = message;
  if (inputEl) inputEl.classList.add("input-invalid");
}

/**
 * Validates the form fields. Returns true if valid, false otherwise,
 * and writes friendly messages next to the offending fields.
 */
function validateForm({ description, amount, date, category }) {
  let isValid = true;

  if (!description) {
    setFieldError("descriptionError", descriptionInput, "Description is required.");
    isValid = false;
  }

  if (Number.isNaN(amount) || amount <= 0) {
    setFieldError("amountError", amountInput, "Enter an amount greater than 0.");
    isValid = false;
  }

  if (!date) {
    setFieldError("dateError", dateInput, "Please select a date.");
    isValid = false;
  }

  if (!category) {
    setFieldError("categoryError", null, "Please select a category.");
    isValid = false;
  }

  return isValid;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderTotals() {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  totalBalanceEl.textContent = formatCurrency(balance);
  totalIncomeEl.textContent = formatCurrency(totalIncome);
  totalExpensesEl.textContent = formatCurrency(totalExpenses);
}

/**
 * Applies the current search term, filter, and sort order to the
 * transactions array, and returns a new array (the original is
 * never mutated by this).
 */
function getVisibleTransactions() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filterType = filterSelect.value;
  const sortOrder = sortSelect.value;

  let result = transactions.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      t.description.toLowerCase().includes(searchTerm) ||
      t.category.toLowerCase().includes(searchTerm);

    const matchesFilter = filterType === "all" || t.type === filterType;

    return matchesSearch && matchesFilter;
  });

  result.sort((a, b) => {
    switch (sortOrder) {
      case "oldest":
        return new Date(a.date) - new Date(b.date) || a.id - b.id;
      case "highest":
        return b.amount - a.amount;
      case "lowest":
        return a.amount - b.amount;
      case "newest":
      default:
        return new Date(b.date) - new Date(a.date) || b.id - a.id;
    }
  });

  return result;
}

function renderTransactionList() {
  const visible = getVisibleTransactions();

  transactionListEl.innerHTML = "";

  if (transactions.length === 0) {
    emptyStateEl.hidden = false;
    emptyStateEl.textContent =
      "No transactions yet. Add your first income or expense using the form.";
    return;
  }

  if (visible.length === 0) {
    emptyStateEl.hidden = false;
    emptyStateEl.textContent = "No transactions match your search or filter.";
    return;
  }

  emptyStateEl.hidden = true;

  const fragment = document.createDocumentFragment();

  visible.forEach((t) => {
    const item = document.createElement("li");
    item.className = `transaction-item transaction-item--${t.type}`;
    item.dataset.id = t.id;

    const sign = t.type === "income" ? "+" : "-";

    item.innerHTML = `
      <div class="transaction-stripe" aria-hidden="true"></div>
      <div class="transaction-main">
        <p class="transaction-description">${escapeHtml(t.description)}</p>
        <p class="transaction-meta">
          <span class="transaction-badge">${t.type}</span>
          ${escapeHtml(t.category)} · ${formatDate(t.date)}
        </p>
      </div>
      <span class="transaction-amount">${sign} ${formatCurrency(t.amount)}</span>
      <button type="button" class="btn-delete" aria-label="Delete transaction: ${escapeHtml(
        t.description
      )}">Delete</button>
    `;

    fragment.appendChild(item);
  });

  transactionListEl.appendChild(fragment);
}

/**
 * Basic HTML-escaping so user-entered text (description, category)
 * can't break the page's markup.
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderAll() {
  renderTotals();
  renderTransactionList();
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearFieldErrors();

  const newTransaction = {
    id: generateId(),
    type: getSelectedType(),
    description: descriptionInput.value.trim(),
    amount: parseFloat(amountInput.value),
    category: categorySelect.value,
    date: dateInput.value,
  };

  if (!validateForm(newTransaction)) return;

  transactions.push(newTransaction);
  saveTransactions();
  renderAll();

  form.reset();
  document.querySelector('input[name="type"][value="expense"]').checked = true;
  populateCategories("expense");
  dateInput.value = todayIsoDate();
  descriptionInput.focus();

  showToast("Transaction added.");
});

transactionListEl.addEventListener("click", (event) => {
  const deleteBtn = event.target.closest(".btn-delete");
  if (!deleteBtn) return;

  const item = deleteBtn.closest(".transaction-item");
  const id = Number(item.dataset.id);
  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) {
    // Transaction no longer exists (e.g. deleted in another tab). Just
    // refresh the view so the stale row disappears.
    renderAll();
    return;
  }

  const confirmed = window.confirm(
    `Delete "${transaction.description}" (${formatCurrency(transaction.amount)})?`
  );
  if (!confirmed) return;

  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  renderAll();
  showToast("Transaction deleted.");
});

searchInput.addEventListener("input", renderTransactionList);
filterSelect.addEventListener("change", renderTransactionList);
sortSelect.addEventListener("change", renderTransactionList);

// ---------------------------------------------------------------------------
// Toast messages
// ---------------------------------------------------------------------------

let toastTimeout = null;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.hidden = true;
  }, 2500);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function todayIsoDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

function init() {
  populateCategories(getSelectedType());
  dateInput.value = todayIsoDate();
  renderAll();
}

init();
