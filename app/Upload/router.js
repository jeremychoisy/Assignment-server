const controller = require('./controller');
const express = require('express');
const router = express.Router();

/** GET */
router.get('', controller.getSignedRequest);

module.exports = router;
