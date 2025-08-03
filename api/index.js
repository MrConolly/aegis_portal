const express = require('express');
const path = require('path');
const { fileURLToPath } = require('url');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes (we'll need to convert these to CommonJS)
// For now, let's create a simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    database: true, 
    api: true, 
    websocket: false, // WebSocket not supported in Vercel
    status: 'operational' 
  });
});

// Basic auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple hardcoded auth for testing
  if (username === 'aegis' && password === 'admin123') {
    res.json({ 
      success: true, 
      user: { username: 'aegis', role: 'admin' },
      token: 'dummy-token'
    });
  } else if (username === 'employee@healthcare.com' && password === 'emp123') {
    res.json({ 
      success: true, 
      user: { username: 'employee@healthcare.com', role: 'employee' },
      token: 'dummy-token'
    });
  } else if (username === 'family@healthcare.com' && password === 'family123') {
    res.json({ 
      success: true, 
      user: { username: 'family@healthcare.com', role: 'family' },
      token: 'dummy-token'
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Serve static files
app.use(express.static('public'));

// Catch all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;