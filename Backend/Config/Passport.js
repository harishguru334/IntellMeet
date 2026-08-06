require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../Models/UserModels"); 

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // findOneAndUpdate with upsert avoids a race condition where two
        // near-simultaneous logins both pass the findOne check and then
        // both try to create the same user, causing a duplicate key error.
        const user = await User.findOneAndUpdate(
          { email },
          {
            $setOnInsert: {
              name: profile.displayName,
              email,
              googleId: profile.id,
              avatar: profile.photos[0]?.value,
            },
          },
          { new: true, upsert: true }
        );

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;