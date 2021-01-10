const controller = require('./controller');
const express = require('express');
const passport = require('passport');
const router = express.Router();

/** GET */
router.get('/subject/:id', passport.authenticate('user-rule', {session: false}), controller.getForSubject)
router.get('/:id', passport.authenticate('user-rule', {session: false}), controller.get)

/** POST */
router.post('', controller.create);
router.post('/log-in', controller.logIn);

/** PATCH */
router.patch('', passport.authenticate('user-rule', {session: false}), controller.update)

/** DELETE */
router.delete('', passport.authenticate('user-rule', {session: false}), controller.delete)

module.exports = router;
