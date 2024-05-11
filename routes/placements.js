const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate'); // Add this line for authentication
const db = require('../connection/databaseconnection');

// Use the authentication middleware for protected routes
router.use(authenticate);
router.get('/placementrecord', (req, res) => {
 // const rollno = req.params.rollno;

  // Your database query
  db.query('SELECT * FROM placements ', (error, results) => {
      if (error) {
        console.error('Error fetching users:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log("results : ",results);
        res.json(results);
      }
    });
  });

  router.get('/placementrecord/:rollno', (req, res) => {
    const rollno = req.params.rollno;
  
    // Your database query
    db.query('SELECT * FROM placements WHERE rollno = ?', [rollno], (error, results) => {
      if (error) {
        console.error('Error fetching user:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log("results : ",results);
        res.json(results);
      }
    });
  });

  router.post('/add-placementrecord', (req, res) => {
    const placementrecord = req.body;
  
    // Your database query
    db.query('INSERT INTO placements SET ?', placementrecord, (error, results) => {
      if (error) {
        console.error('Error inserting user:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.json({ message: 'Placementrecord added successfully' });
      }
    });
  });

  router.put('/updateplacementrecord/:rollno', (req, res) => {
    const rollno = req.params.rollno;
    const updatedPlacementrecord = req.body;
  
    // Your database query
    db.query('UPDATE placements SET ? WHERE rollno = ?', [updatedPlacementrecord, rollno], (error, results) => {
      if (error) {
        console.error('Error updating user:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.json({ message: 'Placementrecord updated successfully' });
      }
    });
  });

  router.delete('/deleteplacementrecord/:rollno', (req, res) => {
    const rollno = req.params.rollno;
  
    // Your database query
    db.query('DELETE FROM placements WHERE rollno = ?', [rollno], (error, results) => {
      if (error) {
        console.error('Error deleting user:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.json({ message: 'Placementrecord deleted successfully' });
      }
    });
  });

  module.exports= router;