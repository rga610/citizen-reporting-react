import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback: serve index.html for all routes EXCEPT /api/*
// This prevents the web service from intercepting API requests
app.get('*', (req, res, next) => {
  // Don't serve index.html for API routes - let them 404 or pass through
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found on web service' });
  }
  // For all other routes, serve the SPA
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

