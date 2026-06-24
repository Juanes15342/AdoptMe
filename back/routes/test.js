const express = require('express');
const router = express.Router();
const { resetCrudTestStore } = require('../lib/crudTestStore');

router.post('/reset', (req, res) => {
  resetCrudTestStore();
  res.status(200).json({ message: "Store reset done" });
});

module.exports = router;
