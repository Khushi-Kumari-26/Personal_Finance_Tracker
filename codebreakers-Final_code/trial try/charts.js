// charts.js
import { dataManager } from "./data.js";

// Cache canvas contexts
const pieCanvas = document.getElementById("expense-pie-chart");
const lineCanvas = document.getElementById("expense-line-chart");
const barCanvas = document.getElementById("budget-bar-chart");

const pieCtx = pieCanvas.getContext("2d");
const lineCtx = lineCanvas.getContext("2d");
const barCtx = barCanvas.getContext("2d");

// File elements
const csvFileInput = document.getElementById("csvFile");
const importCsvBtn = document.getElementById("importCsv");
const exportJsonBtn = document.getElementById("exportData");

// Store chart instances for updates
let pieChart, lineChart, barChart;

export function initCharts() {
  importCsvBtn.addEventListener("click", onImportCSV);
  exportJsonBtn.addEventListener("click", onExportJSON);

  drawEmptyCharts();
}

function drawEmptyCharts() {
  // Just clear previous charts or create empty placeholders
  if (pieChart) pieChart.destroy();
  if (lineChart) lineChart.destroy();
  if (barChart) barChart.destroy();
}

// Pie Chart: expense categories
function drawPieChart(ctx, data) {
  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: generateColors(data.length),
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
    },
  });
}

// Line Chart: daily expenses over last 30 days
function drawLineChart(ctx, data) {
  if (lineChart) lineChart.destroy();

  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: "Expenses",
        data: data.map(d => d.amount),
        borderColor: "#FF6384",
        fill: false,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      scales: {
        x: { display: true },
        y: { beginAtZero: true },
      },
    },
  });
}

// Bar Chart: budget vs actual expenses per category
function drawBarChart(ctx, budgets, expenses) {
  if (barChart) barChart.destroy();

  const categories = Object.keys(budgets);
  const budgetValues = categories.map(cat => budgets[cat]);
  const expenseValues = categories.map(cat => expenses[cat] || 0);

  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: categories,
      datasets: [
        {
          label: "Budget",
          data: budgetValues,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        },
        {
          label: "Spent",
          data: expenseValues,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

// Helper: generate color array
function generateColors(num) {
  const palette = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40",
  ];
  return Array.from({ length: num }, (_, i) => palette[i % palette.length]);
}

// Prepare and update all charts based on current data
export function updateCharts() {
  const txs = dataManager.transactions;

  // Pie chart data: sum expenses by category
  const expenseCategories = {};
  txs.forEach(({ type, amount, category }) => {
    if (type === "expense") {
      const cat = category.toLowerCase();
      expenseCategories[cat] = (expenseCategories[cat] || 0) + amount;
    }
  });

  const pieData = Object.entries(expenseCategories).map(([label, value]) => ({
    label,
    value,
  }));

  drawPieChart(pieCtx, pieData);

  // Line chart data: daily expenses for last 30 days
  const dailyExpenses = {};
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    dailyExpenses[key] = 0;
  }
  txs.forEach(({ type, amount, date }) => {
    if (type === "expense" && dailyExpenses[date] !== undefined) {
      dailyExpenses[date] += amount;
    }
  });

  const lineData = Object.entries(dailyExpenses).map(([date, amount]) => ({ date, amount }));

  drawLineChart(lineCtx, lineData);

  // Bar chart data: budgets vs expenses
  const budgets = {};
  const expenses = {};

  for (const cat in dataManager.budgets) {
    budgets[cat] = dataManager.budgets[cat];
  }

  txs.forEach(({ type, amount, category }) => {
    if (type === "expense") {
      const cat = category.toLowerCase();
      expenses[cat] = (expenses[cat] || 0) + amount;
    }
  });

  drawBarChart(barCtx, budgets, expenses);
}

// CSV Import
function onImportCSV() {
  const file = csvFileInput.files[0];
  if (!file) {
    alert("Please select a CSV file first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    parseCSV(text);
  };
  reader.onerror = () => alert("Error reading file.");
  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  let successCount = 0;
  lines.forEach(line => {
    const [type, amount, category, description, date] = line.split(",").map(s => s.trim());
    if (type && amount && category && description && date) {
      const tx = {
        type: type.toLowerCase(),
        amount: parseFloat(amount),
        category,
        description,
        date,
      };
      if (dataManager.addTransaction(tx)) {
        successCount++;
      }
    }
  });
  alert(`Imported ${successCount} transactions.`);
  updateCharts();
  // Also update UI (call function from ui.js)
  import("../ui.js").then(({ updateUI }) => updateUI());
}

// JSON Export
function onExportJSON() {
  const dataStr = JSON.stringify(dataManager.transactions, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

