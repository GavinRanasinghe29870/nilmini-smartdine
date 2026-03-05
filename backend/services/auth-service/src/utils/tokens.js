const jwt = require("jsonwebtoken");

function signAccessToken(user, sid) {
  return jwt.sign(
    {
      type: "access",
      sid,
      role: user.role,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      subject: String(user._id),
      expiresIn: "15m",
    }
  );
}

function signRefreshToken(user, sid) {
  return jwt.sign(
    { sid },
    process.env.REFRESH_TOKEN_SECRET,
    {
      subject: String(user._id),
      expiresIn: "7d",
    }
  );
}

module.exports = { signAccessToken, signRefreshToken };
