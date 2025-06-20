const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory "database"
let expenses = [];

// Routes

// POST /expenses – Add a new expense
app.post('/expenses', (req, res) => {
  const { user_id, amount, category, description, date } = req.body;

  const newExpense = {
    id: uuidv4(),
    user_id,
    amount: parseFloat(amount),
    category,
    description,
    date,
    created_at: new Date().toISOString()
  };

  expenses.push(newExpense);

  console.log("New Expense Added:");
  console.log("All Expenses:", JSON.stringify(expenses, null, 2)); // 👈 Pretty print

  res.status(201).json(newExpense);
});


// GET /expenses – Get all expenses
app.get('/expenses', (req, res) => {
  res.json(expenses);
});

// PUT /expenses/:id – Update an expense
app.put('/expenses/:id', (req, res) => {
  const { id } = req.params;
  const index = expenses.findIndex(exp => exp.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Expense not found" });
  }

  expenses[index] = {
    ...expenses[index],
    ...req.body,
    id,
    updated_at: new Date().toISOString()
  };

  res.json(expenses[index]);
});

// DELETE /expenses/:id – Remove an expense
app.delete('/expenses/:id', (req, res) => {
  const { id } = req.params;
  expenses = expenses.filter(exp => exp.id !== id);
  res.json({ message: "Expense deleted" });
});

// GET /expenses/analytics – Summary per category
app.get('/expenses/analytics', (req, res) => {
  const summary = {};

  for (const exp of expenses) {
    summary[exp.category] = (summary[exp.category] || 0) + exp.amount;
  }

  res.json(summary);
});
app.get('/', (req, res) => {
  res.send('Expense Tracker API is running 🚀');
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
