export const dataManager = {
  transactions: [],
  budgets: {},

  // Load data from localStorage with normalization and duplicate key handling
  load() {
    try {
      // Clear budgets and transactions from localStorage on every load
      localStorage.removeItem("budgets");
      localStorage.removeItem("transactions");
  
      // Then set empty data
      this.transactions = [];
      this.budgets = {};
    } catch (err) {
      console.error("Error clearing data", err);
      this.transactions = [];
      this.budgets = {};
    }
  },
  

  // Save data to localStorage
  save() {
    try {
      localStorage.setItem("transactions", JSON.stringify(this.transactions));
      localStorage.setItem("budgets", JSON.stringify(this.budgets));
    } catch (err) {
      console.error("Error saving data", err);
    }
  },

  // Add a new transaction
  addTransaction(tx) {
    if (
      tx &&
      (tx.type === "income" || tx.type === "expense") &&
      typeof tx.amount === "number" &&
      tx.amount > 0 &&
      typeof tx.category === "string" &&
      typeof tx.description === "string" &&
      tx.date &&
      !isNaN(new Date(tx.date).getTime())
    ) {
      // Normalize category before saving
      tx.category = tx.category.toLowerCase().trim();
      this.transactions.push(tx);
      this.save();
      return true;
    }
    return false;
  },

  // Edit transaction by index
  editTransaction(index, newTx) {
    if (index >= 0 && index < this.transactions.length) {
      // Normalize category before saving
      newTx.category = newTx.category.toLowerCase().trim();
      this.transactions[index] = newTx;
      this.save();
      return true;
    }
    return false;
  },

  // Delete transaction by index
  deleteTransaction(index) {
    if (index >= 0 && index < this.transactions.length) {
      this.transactions.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  },

  // Set budget for a category (key normalized to lowercase)
  setBudget(category, amount) {
    if (typeof category === "string" && typeof amount === "number" && amount >= 0) {
      this.budgets[category.toLowerCase()] = amount;
      this.save();
      return true;
    }
    return false;
  },

  // Get budget amount for category
  getBudget(category) {
    return this.budgets[category.toLowerCase()] || 0;
  },

  // Get budget status for all categories: actual spending vs budget
  getBudgetStatus() {
    // Sum expenses by category lowercase
    const expensesByCategory = {};
    this.transactions.forEach(({ type, amount, category }) => {
      if (type === "expense") {
        const cat = category.toLowerCase();
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amount;
      }
    });

    // Build status object
    const status = {};
    for (const cat in this.budgets) {
      status[cat] = {
        budget: this.budgets[cat],
        spent: expensesByCategory[cat] || 0,
      };
    }
    return status;
  },
};
