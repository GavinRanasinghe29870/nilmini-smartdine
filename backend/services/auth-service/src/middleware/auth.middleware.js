const passport = require("passport");
const { sessionExists } = require("../utils/tokens");

function requireAuth(req, res, next) {
  passport.authenticate("jwt", { session: false }, async (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });
    if (!decoded) return res.status(401).json({ message: "Unauthorized" });

    const ok = await sessionExists(decoded.sid);
    if (!ok) return res.status(401).json({ message: "Session revoked" });

    req.user = decoded;
    next();
  })(req, res, next);
}

module.exports = requireAuth;
