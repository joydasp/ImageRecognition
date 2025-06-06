// The frontend code is already well structured with HTML and JavaScript, now we'll connect it to an Express backend.
// Here's the entire structure with the backend setup using Express.js

// === server.js ===

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let users = {};
let history = {};

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.status(400).send('User already exists');
  users[username] = { password };
  history[username] = [];
  res.send('Registered successfully');
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username]?.password === password) return res.send('Login success');
  res.status(401).send('Invalid credentials');
});

app.get('/api/history/:username', (req, res) => {
  res.send(history[req.params.username] || []);
});

app.post('/api/history', (req, res) => {
  const { username, prediction } = req.body;
  if (!history[username]) history[username] = [];
  history[username].push(prediction);
  res.send('Saved');
});

app.delete('/api/history/:username', (req, res) => {
  history[req.params.username] = [];
  res.send('Deleted');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


// === Frontend Adjustments (in HTML <script>) ===

// Replace localStorage logic with fetch API calls like:

function register() {
  const user = document.getElementById('regUser').value;
  const pass = document.getElementById('regPass').value;

  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass })
  })
  .then(res => {
    if (!res.ok) throw new Error('User already exists');
    alert('Registered successfully!');
    showLogin();
  })
  .catch(err => alert(err.message));
}

function login() {
  const user = document.getElementById('loginUser').value;
  const pass = document.getElementById('loginPass').value;

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass })
  })
  .then(res => {
    if (!res.ok) throw new Error('Invalid credentials');
    currentUser = user;
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('homePage').classList.remove('hidden');
    resetHomePage();
  })
  .catch(err => alert(err.message));
}

function savePrediction() {
  const prediction = document.getElementById('result').innerText;
  fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: currentUser, prediction })
  })
  .then(() => alert('Result saved!'));
}

function loadFullHistory() {
  fetch(`/api/history/${currentUser}`)
    .then(res => res.json())
    .then(data => {
      const fullHistoryList = document.getElementById('fullHistoryList');
      fullHistoryList.innerHTML = '';
      data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        fullHistoryList.appendChild(li);
      });
    });
}

function deleteHistory() {
  if (!confirm('Are you sure?')) return;
  fetch(`/api/history/${currentUser}`, { method: 'DELETE' })
    .then(() => loadFullHistory());
}

function resetHomePage() {
  document.getElementById('preview').src = '';
  document.getElementById('preview').classList.add('hidden');
  document.getElementById('result').innerText = '';
  document.getElementById('saveResultBtn').classList.add('hidden');
}
