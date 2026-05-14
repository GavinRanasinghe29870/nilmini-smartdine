const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const User = require("../models/user.model");
const { redis } = require("./redis");

function cookieExtractor(req) {
  return req?.cookies?.accessToken || null;
}

function configurePassport() {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromAuthHeaderAsBearerToken(),
          cookieExtractor,
        ]),
        secretOrKey: process.env.ACCESS_TOKEN_SECRET,
      },
      async (payload, done) => {
        try {
          if (!payload || payload.type !== "access" || !payload.sid) {
            return done(null, false);
          }

          const sessionUserId = await redis.get(`session:${payload.sid}`);
          if (!sessionUserId || String(sessionUserId) !== String(payload.sub)) {
            return done(null, false);
          }

          const user = await User.findById(payload.sub).select("-password");
          if (!user) {
            return done(null, false);
          }

          if ((user.tokenVersion ?? 0) !== (payload.tokenVersion ?? 0)) {
            return done(null, false);
          }

          return done(null, {
            sub: String(user._id),
            sid: payload.sid,
            role: user.role,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            tokenVersion: user.tokenVersion ?? 0,
            user,
          });
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
}

module.exports = { configurePassport };