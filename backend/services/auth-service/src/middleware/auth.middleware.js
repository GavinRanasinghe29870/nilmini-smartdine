const passport = require("passport");

function requireAuth(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, decoded) => {
    if (err || !decoded) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = decoded;
    next();
  })(req, res, next);
}

module.exports = requireAuth;