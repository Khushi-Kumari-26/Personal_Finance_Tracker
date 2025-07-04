import { dataManager } from "./data.js";
import { updateCharts } from "./charts.js"; // Person 3's charts update function

// Cache DOM elements
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("date");
const addBtn = document.getElementById("addTransaction");

const budgetCategoryInput = document.getElementById("budget-category");
const monthlyLimitInput = document.getElementById("monthly-limit");
const setBudgetBtn = document.getElementById("setBudget");
const budgetStatusDiv = document.getElementById("budget-status");

const totalIncomeSpan = document.getElementById("totalIncome");
const totalExpensesSpan = document.getElementById("totalExpenses");
const netSavingsSpan = document.getElementById("netSavings");
const savingsRateSpan = document.getElementById("savingsRate");

const recentTransactionsList = document.getElementById("recentTransactions");

// Helper to capitalize category names for display
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize UI
export function initUI() {
  dataManager.load();
  updateUI();

  addBtn.addEventListener("click", onAddTransaction);
  setBudgetBtn.addEventListener("click", onSetBudget);
}

function onAddTransaction() {
  const tx = {
    type: typeInput.value,
    amount: parseFloat(amountInput.value),
    category: categoryInput.value.trim().toLowerCase(),  // Normalize here
    description: descriptionInput.value.trim(),
    date: dateInput.value,
  };

  if (
    !tx.amount ||
    !tx.category ||
    !tx.description ||
    !tx.date
  ) {
    alert("Please fill all fields correctly.");
    return;
  }

  if (dataManager.addTransaction(tx)) {
    clearTransactionInputs();
    updateUI();
  } else {
    alert("Failed to add transaction. Check input data.");
  }
}

function onSetBudget() {
  const category = budgetCategoryInput.value.trim().toLowerCase(); // Normalize here
  const limit = parseFloat(monthlyLimitInput.value);

  if (!category || isNaN(limit) || limit < 0) {
    alert("Please enter a valid category and limit.");
    return;
  }

  if (dataManager.setBudget(category, limit)) {
    budgetCategoryInput.value = "";
    monthlyLimitInput.value = "";
    updateUI();
  } else {
    alert("Failed to set budget.");
  }
}

function clearTransactionInputs() {
  amountInput.value = "";
  categoryInput.value = "";
  descriptionInput.value = "";
  dateInput.value = "";
}

export function updateUI() {
  const txs = dataManager.transactions;

  // Update stats
  const totalIncome = txs.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = txs.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;

  totalIncomeSpan.textContent = `₹${totalIncome.toFixed(2)}`;
  totalExpensesSpan.textContent = `₹${totalExpenses.toFixed(2)}`;
  netSavingsSpan.textContent = `₹${netSavings.toFixed(2)}`;
  savingsRateSpan.textContent = `${(totalIncome ? (netSavings / totalIncome) * 100 : 0).toFixed(1)}%`;

  // Update recent transactions list (show latest 10)
  const recentHTML = txs
    .slice(-10)
    .reverse()
    .map(
      (t, i) =>
        `<li>${t.date} - <b>${capitalize(t.category)}</b> - ₹${t.amount.toFixed(2)} (${t.type})</li>`
    )
    .join("");
  recentTransactionsList.innerHTML = recentHTML;

  // Update budget status display with progress bars
  const budgetStatus = dataManager.getBudgetStatus();
  budgetStatusDiv.innerHTML = Object.entries(budgetStatus)
    .map(([cat, { budget, spent }]) => {
      const normalizedCat = cat.toLowerCase();
      const percentSpent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
      let colorClass = "";

      if (percentSpent < 50) {
        colorClass = "progress-low";
      } else if (percentSpent < 80) {
        colorClass = "progress-medium";
      } else {
        colorClass = "progress-high";
      }

      return `
        <div class="budget-item">
          <div class="budget-label"><b>${capitalize(normalizedCat)}</b>: ₹${spent.toFixed(2)} / ₹${budget.toFixed(2)}</div>
          <div class="progress-bar-container">
            <div class="progress-bar ${colorClass}" style="width: ${percentSpent}%;"></div>
          </div>
        </div>
      `;
    })
    .join("");

  // Update charts
  updateCharts();
}
