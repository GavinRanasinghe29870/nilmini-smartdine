const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const User = require("../models/user.model");

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
          if (payload.type !== "access") return done(null, false);

          const user = await User.findById(payload.sub).select("-password");
          if (!user) return done(null, false);

          // logout-all
          if ((user.tokenVersion ?? 0) !== (payload.tokenVersion ?? 0)) {
            return done(null, false);
          }

          return done(null, { ...payload, user }); 
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
}

module.exports = { configurePassport };
