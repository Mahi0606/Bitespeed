const express = require('express');
const { createContact } = require('../controllers/identify');

const router = express.Router();

router.post("/identify", createContact);

module.exports = router;