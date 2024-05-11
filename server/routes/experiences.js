const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const db = require('../connection/databaseconnection');
const bodyParser = require('body-parser');
const { PythonShell } = require('python-shell');
const axios= require('axios')
// Use the authentication middleware for protected routes
router.use(authenticate);

router.get('/experience', (req, res) => {
  db.query('SELECT * FROM experiences ', (error, results) => {
      if (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
      } else {
      //  console.log("results : ",results);
        res.json(results);
      }
    });
});

router.get('/experience/:rollno', (req, res) => {
  const rollno = req.params.rollno;

  db.query('SELECT * FROM experiences WHERE rollno = ?', [rollno], (error, results) => {
      if (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
      } else {
        console.log("results : ",results);
        res.json(results);
      }
    });
});

router.get('/getexperience/:id', (req, res) => {
  const expid = req.params.id;

  db.query('SELECT * FROM experiences WHERE experience_id = ?', [expid], (error, results) => {
      if (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
      } else {
        console.log("results : ",results);
        res.json(results);
      }
    });
});
router.use(bodyParser.json());
router.post('/add-experience', (req, res) => {
  const userId = req.body.userId;
  const rollno = req.body.rollno;
  const companyName = req.body.company;
  const batch = req.body.batch;
  const educational_criteria = req.body.educationalCriteria;
  const overallExperience = req.body.overallExperience;
  const tips = req.body.tips;
  const role_offered = req.body.roleOffered;
  const ctc= req.body.ctc;

  const placed= req.body.placed===true?1:0;
  console.log("req body : ", req.body)
  console.log(userId,rollno,ctc,placed)
  db.query(
    'INSERT INTO experiences (user_id, rollno, company_name, batch, role_offered,ctc,placed, educational_criteria, overall_experience, tips) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)',
    [userId, rollno, companyName, batch, role_offered,ctc,placed, educational_criteria, overallExperience, tips],
    (err, results) => {
      console.log("results : ", results)
      const insertId=results.insertId;
      if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('Experience added successfully');
        // Extract questions from overall experience
        const extractQuestionsPayload = {
          overallExperience: overallExperience
        };
        axios.post('http://127.0.0.1:5000/extract-questions', extractQuestionsPayload)
          .then(response => {
            const questions = response.data.questions;
            console.log("questions : ", questions);
            // Send each question for category prediction
            const predictions = questions.map(question => {
              return axios.post('http://127.0.0.1:5000/predict-category', { question });
            });
            // Wait for all predictions to complete
            Promise.all(predictions)
              .then(results => {
                // Store experience and questions in your database
                const technicalQuestions = [];
                const hrQuestions = [];
                // Categorize questions into technical and HR questions
                results.forEach((result, index) => {
                  const question = questions[index];
                  const predictedCategory = result.data.predicted_category;
                  console.log("predcat : ", predictedCategory)
                  if (predictedCategory === "Tech questions") {
                    technicalQuestions.push(question);
                  } else if (predictedCategory === 'HR Questions') {
                    hrQuestions.push(question);
                  }
                });
                // Update the experiences table with technical and HR questions
                db.query(
                  'UPDATE experiences SET technical_questions = ?, hr_questions = ? WHERE experience_id = ?',
                  [technicalQuestions.join('\n '), hrQuestions.join('\n '), insertId],
                  (updateErr, updateResults) => {
                    if (updateErr) {
                      console.error(updateErr);
                      res.status(500).send('Internal Server Error');
                    } else {
                      console.log('Technical and HR questions stored successfully');
                      res.json({ message: 'Experience added successfully' });
                    }
                  }
                );
              })
              .catch(error => {
                console.error('Error predicting category:', error);
                res.status(500).send('Internal Server Error');
              });
          })
          .catch(error => {
            console.error('Error extracting questions:', error);
            res.status(500).send('Internal Server Error');
          });
      }
    }
  );
});

router.get('/search', (req, res) => {
  const query = req.query.query;
  const company_name = req.query.filters?.company_name || '';
  const role_offered = req.query.filters?.role_offered || '';
  const year = req.query.filters?.year || '';
  const sortby = req.query?.sortBy || 'created_at'; // default sort by created_at
  const sortorder = req.query?.sortOrder || 'desc'; // default sort order descending
  
  console.log("search params filters: ", req.query);
 // console.log("company name : ", company_name);

  let queryStr = 'SELECT * FROM experiences WHERE 1=1';

  if (query) {
    queryStr += ` AND (company_name LIKE '%${query}%' OR role_offered LIKE '%${query}%')`;
  }

  if (company_name) {
    queryStr += ` AND company_name = '${company_name}'`;
  }

  if (role_offered) {
    queryStr += ` AND role_offered = '${role_offered}'`;
  }

  if (year) {
    queryStr += ` AND created_at LIKE '%${year}%'`;
  }

  // Add sorting
  queryStr += ` ORDER BY ${sortby} ${sortorder}`;

  db.query(queryStr, (error, results) => {
    if (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('Internal Server Error');
    } else {
      console.log("results : ", results);
      res.json(results);
    }
  });
});


router.get('/company_names', (req, res) => {
  db.query('SELECT DISTINCT company_name FROM experiences', (error, results) => {
    if (error) {
      console.error('Error fetching company names:', error);
      res.status(500).send('Internal Server Error');
    } else {
      console.log("company names : ", results);
      res.json(results);
    }
  });
});

router.get('/years', (req, res) => {
  db.query('SELECT DISTINCT YEAR(created_at) AS year FROM experiences', (error, results) => {
    if (error) {
      console.error('Error fetching years:', error);
      res.status(500).send('Internal Server Error');
    } else {
      console.log("years : ", results);
      res.json(results);
    }
  });
});


router.get('/roles', (req, res) => {
  db.query('SELECT DISTINCT role_offered FROM experiences', (error, results) => {
    if (error) {
      console.error('Error fetching roles:', error);
      res.status(500).send('Internal Server Error');
    } else {
      console.log("roles : ", results);
      res.json(results);
    }
  });
});
// PUT request to update specific experience by ID
router.put('/experiences/:id', authenticate, async (req, res) => {
  console.log("req body : ", req.body)
  try {
    const updatedExperience = await db.query(
      'UPDATE experiences SET educational_criteria= ?, overall_experience = ?, tips = ? WHERE experience_id = ?',
      [req.body.educationalcriteria,req.body.overall_experience, req.body.tips, req.params.id],
      (err, results) => {
        if (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
        } else {
          console.log('Experience updated successfully');
          res.json({ message: 'Experience updated successfully', results });
        }
      }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete('/experiences/:id', authenticate, async (req, res) => {
  console.log("id :",req.params.id)
  try {
    const deletedExperience = await db.query(
      'DELETE FROM experiences WHERE experience_id = ?',
      [req.params.id]
    )
    res.json({ message: 'Experience deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message})
  }
})

router.get('/recent-technical-questions/:company', (req, res) => {
  const company = req.params.company;

  // Define the query to fetch the 5 most recent technical questions for the given company
  const query = `
    SELECT technical_questions FROM experiences
    WHERE company_name = ? 
    ORDER BY created_at DESC
    LIMIT 5
  `;

  db.query(query, [company], (error, results) => {
    if (error) {
      console.error('Error fetching recent technical questions:', error);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('Recent technical questions:', results);
      res.json(results);
    }
  });
});

// Get recent HR questions for a given company
router.get('/recent-hr-questions/:company', (req, res) => {
  const company = req.params.company;

  // Define the query to fetch the 5 most recent HR questions for the given company
  const query = `
    SELECT hr_questions FROM experiences
    WHERE company_name = ?     ORDER BY created_at DESC
    LIMIT 5
  `;

  db.query(query, [company], (error, results) => {
    if (error) {
      console.error('Error fetching recent HR questions:', error);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('Recent HR questions:', results);
      res.json(results);
    }
  });
});

module.exports = router;
