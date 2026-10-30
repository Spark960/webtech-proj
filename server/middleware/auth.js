// auth.js — Authentication middleware

// Checks if user is logged in before allowing access to protected routes
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    // For API requests, send 401 JSON instead of redirecting
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to do that'
      });
    }
    // For page requests, redirect to login
    return res.redirect('/login.html');
  }
  next();
}

// Makes session user data available in all responses (useful for templates/frontend)
function addUserToLocals(req, res, next) {
  if (req.session && req.session.userId) {
    res.locals.user = {
      id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail
    };
  } else {
    res.locals.user = null;
  }
  next();
}

module.exports = { requireAuth, addUserToLocals };
