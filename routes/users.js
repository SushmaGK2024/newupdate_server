// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../connection/databaseconnection');
const mysql = require('mysql2');

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  database: process.env.DB_DATABSE,
  connectionLimit: 10, // Adjust this based on your needs
});
function authenticateToken(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    console.log('Token not found in headers');
    return res.status(401).json({ message: 'Authentication failed' });
  }

  const tokenValue = token.replace('Bearer ', ''); // Remove 'Bearer ' prefix
  jwt.verify(tokenValue, 'bf3ab437d9c353bc4dc2d3f2cce44c096f17ed57792e58bd09640c89f6376c7b', (err, decoded) => {
    if (err) {
      console.log('Error verifying token:', err);
      return res.status(403).json({ message: 'Authentication failed' });
    }
    
    req.userId = decoded.userId;
    console.log('Decoded userId:', req.userId);
    next();
  });
}


// Registration endpoint
router.post('/register', async (req, res) => {


  try {
    const { name, rollno, password } = req.body || {};
     
    if (!name || !rollno || !password) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }
    

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (full_name, rollno, password) VALUES (?, ?, ?)',
      [name, rollno, hashedPassword]
    );

    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Login endpoint using institute roll number (userId)
// routes/users.js
// routes/users.js
// routes/users.js
router.post('/login', async (req, res) => {
  try {
    const { rollNo, password } = req.body;

    // Assuming you have executed a query like this
    pool.query('SELECT * FROM users WHERE rollno = ?', [rollNo], async (error, results) => {
      try {
        if (error) {
          console.error('Error executing query:', error);
          return res.status(500).json({ error: 'Server error during login.' });
        }

        // Check if any user is found
        if (results.length === 0) {
          console.error('User not found for rollno', rollNo);
          return res.status(401).json({ error: 'Authentication failed. User not found.' });
        }

        const user = results[0];

        // Check if the user object has the 'password' property
        if (!user.password) {
          console.error('Password not found in user object:', user);
          return res.status(500).json({ error: 'Server error during login. no pasword' });
        }

        // Continue with authentication logic
        const storedPassword = user.password;

        // Check if storedPassword is undefined
        if (!storedPassword) {
          console.log("stored : ", storedPassword)
          return res.status(401).json({ message: 'Invalid roll number or password' });
        }
        console.log('Entered Password:', password);
console.log('Stored Password:', storedPassword);

        console.log('Stored Password Length:', storedPassword.length);
console.log('Entered Password Length:', password.length);

const passwordMatch = await bcrypt.compare(password.trim(), storedPassword.trim());
console.log('Bcrypt Compare Result:', passwordMatch);


        if (!passwordMatch) {
       
          return res.status(401).json({ message: 'Invalid roll number or password' });
        }

        // If authentication is successful, you can generate a token and send it in the response
        const token = jwt.sign({ userId: user.user_id }, 'bf3ab437d9c353bc4dc2d3f2cce44c096f17ed57792e58bd09640c89f6376c7b', {
          expiresIn: '1h',
        });
        
        const userId =user.user_id;
        res.json({ token, userId });
      } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ error: 'Server error during login.' });
      }
    });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Protected Route - Example: Fetch User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Decoded userId:", userId); // Log the decoded userId

    pool.query('SELECT * FROM users WHERE user_id = ?', [userId], async (error, results) => {
      try {
        if (error) {
          console.error('Error executing query:', error);
          return res.status(500).json({ error: 'Server error getting profile.' });
        }

        // Check if any user is found
        if (results.length === 0) {
          console.error('User not found for userId:', userId);
          return res.status(401).json({ error: 'Authentication failed. User not found.' });
        }

        const user = results[0];
        console.log("User found in database:", user); // Log the user data

        res.status(200).json(user);
      } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ error: 'Server error getting profile.' });
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Import necessary modules and dependencies

// Middleware for Authentication



  // Import necessary modules and dependencies

// Your existing code for handling the route
router.get('/profile/:rollno', (req, res) => {
  const rollno = req.params.rollno;
  console.log("rolno : ", rollno)
  // Your database query
  db.query('SELECT user_id, full_name ,degree, major, batch, cgpa, academic_info FROM users WHERE rollno = ?', [rollno], (error, results) => {
    if (error) {
      // Handle the database error
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      // Handle case where no user is found
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract necessary information from the result
    const userData = {
      user_id: results[0].user_id,
      full_name: results[0].full_name,
      academic_info: results[0].academic_info,
      degree: results[0].degree,
      major : results[0].major,
      batch : results[0].batch,
      cgpa : results[0].cgpa,
    };

    // Send the extracted data as JSON response
    res.status(200).json(userData);
  });
});

router.put('/profile/:rollno', authenticateToken, async (req, res) => {
  try {
    const updatedData = req.body;
    console.log("updated data : ", updatedData)
    const rollno = req.params.rollno;
    const user = await db.query(
      'UPDATE users SET full_name=?, degree=?, major=?, batch=?,cgpa=? WHERE rollno =?',
      [updatedData.full_name, updatedData.degree, updatedData.major, updatedData.batch, updatedData.cgpa, rollno]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/change-password/:currrollno', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const rollno = req.params.currrollno;
    console.log("data : ", data);
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    const updatedUser = await db.query(
      'UPDATE users SET password =? WHERE rollno =?',
      [hashedPassword, rollno]
    );
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
