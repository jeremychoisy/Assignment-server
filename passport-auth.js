const bcrypt = require('bcrypt');
const mongoose = require( 'mongoose' );
const passport = require('passport');
const passportJWT = require('passport-jwt');
const LocalStrategy = require ('passport-local').Strategy;
const keys = require('./config/jwtKeys');

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const User = mongoose.model( "User" );

passport.use('login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
    },
    async (email, password, done) => {
        try {
            await User.findOne({email: email})
            .exec(async (err, user) => {
                if (user) {
                    const result = await bcrypt.compare(password, user.password);
                    if (result) {
                        return done(null, user, {message: 'Logged In Successfully !'})
                    } else {
                        return done(null, false, {message: 'Incorrect password.', code: 401})
                    }
                }
                return done(null, false, {message: "User doesn't exist.", code: 404})
            });
        } catch (err) {
            return done(err);
        }
    }
));

passport.use('user-rule',new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: keys.secretKey
    },
    async (jwtPayLoad, done) => {
        try {
            const user = await User.findOne({email: jwtPayLoad.email});
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch(err){
            return done(err);
        }
    })
);

passport.use('admin-rule', new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: keys.secretKey
    },
    async (jwtPayLoad, done) => {
        try {
            const user = await User.findOne({email: jwtPayLoad.email});
            if (user && jwtPayLoad.admin) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch(err){
            return done(err);
        }
    })
);
