// middleware/auth.js
// ─────────────────────────────────────────────
//  This middleware runs BEFORE protected route handlers.
//  It reads the JWT from the Authorization header,
//  verifies it, and attaches the user payload to req.user.
// ─────────────────────────────────────────────
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // The client sends: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1]; // Extract just the token part

  try {
    // Verify signature + expiry using our secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, iat, exp }
    next(); // ✅ Token valid — proceed to the route handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

module.exports = authMiddleware;
