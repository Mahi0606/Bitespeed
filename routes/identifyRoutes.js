const express = require('express');
const { createContact } = require('../controllers/identify');
const { AllContacts } = require('../controllers/allContacts');

const router = express.Router();

router.post("/identify", createContact);
router.get('/allContacts', AllContacts)

module.exports = router;