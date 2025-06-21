const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 4000;
const SECRET = "jwt-secret-key"; // In production, store in env

app.use(cors());
app.use(express.json());

// In-memory users and expenses
let users = [];     // { id, email, passwordHash }
let expenses = [];// { id, user_id, ... }

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}



// Routes

// POST /expenses – Add a new expense
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const existing = users.find(u => u.email === email);
  if (existing) return res.status(400).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = { id: uuidv4(), email, passwordHash };
  users.push(newUser);

  res.status(201).json({ message: "User registered" });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});



// GET /expenses – Get all expenses
app.post('/expenses', authenticateToken, (req, res) => {
  const { amount, category, description, date } = req.body;

  const newExpense = {
    id: uuidv4(),
    user_id: req.user.id,
    amount: parseFloat(amount),
    category,
    description,
    date,
    created_at: new Date().toISOString()
  };

  expenses.push(newExpense);
  res.status(201).json(newExpense);
});

app.get('/expenses', authenticateToken, (req, res) => {
  const userExpenses = expenses.filter(exp => exp.user_id === req.user.id);
  res.json(userExpenses);
});

app.get('/expenses/analytics', authenticateToken, (req, res) => {
  const summary = {};
  const userExpenses = expenses.filter(e => e.user_id === req.user.id);
  for (const exp of userExpenses) {
    summary[exp.category] = (summary[exp.category] || 0) + exp.amount;
  }
  res.json(summary);
});

app.put('/expenses/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const index = expenses.findIndex(e => e.id === id && e.user_id === req.user.id);
  if (index === -1) return res.status(404).json({ message: "Expense not found" });

  expenses[index] = {
    ...expenses[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };

  res.json(expenses[index]);
});

app.delete('/expenses/:id', authenticateToken, (req, res) => {
  expenses = expenses.filter(e => !(e.id === req.params.id && e.user_id === req.user.id));
  res.json({ message: "Deleted if owned" });
});

app.get('/', (req, res) => {
  res.send('Expense Tracker API with Auth is running ✅');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

