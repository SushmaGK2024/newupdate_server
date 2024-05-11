const express = require('express');
const router = express.Router();


const db = require('../connection/databaseconnection');
const { PythonShell } = require('python-shell');  // Import for Python integration

// Function to call the Python preprocessing script (assuming it's a separate file)
async function preprocessText(text) {
    const { spawn } = require('child_process');
    console.log("11")
    // Replace with the actual path to your Python script
    const pythonProcess = spawn('python', ['../server/utils/preprocess_text.py']);
    console.log("12")
    return new Promise((resolve, reject) => {
    console.log("13")
      pythonProcess.stdout.on('data', (data) => {
        console.log("14")
        try {
          // Parse the JSON data returned from the Python script
          const preprocessedData = JSON.parse(data.toString());
          console.log("15")
          resolve(preprocessedData);
          console.log("16")
        } catch (error) {
          reject(error);
        }
        console.log("17")
      });
  
      pythonProcess.stderr.on('data', (data) => {
        console.error(`Error from Python script: ${data.toString()}`);
        reject(new Error('Error during preprocessing'));
      });
  
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script exited with code: ${code}`));
        }
      });
       console.log("18")
      pythonProcess.stdin.write(text);
       console.log("19")
      pythonProcess.stdin.end();
      console.log("20")
    });
  }
  
  const { spawn } = require('child_process');

async function extractQuestions(data) {
  const pythonProcess = spawn('python', ['../server/utils/extract_questions.py']);
  console.log("21")
  return new Promise((resolve, reject) => {
    pythonProcess.stdout.on('data', (data) => {
      try {
        // Parse the JSON data returned from the Python script (assuming JSON output)
        const extractedQuestions = JSON.parse(data.toString());
        resolve(extractedQuestions);
      } catch (error) {
        reject(error);
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Error from Python script: ${data.toString()}`);
      reject(new Error('Error during question extraction'));
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code: ${code}`));
      }
    });

    // Send the sentences and lemmatized words to the Python script (format the data as needed)
    pythonProcess.stdin.write(JSON.stringify({ sentences: data.sentences, lemmatizedWords: data.lemmatizedWords }));
    pythonProcess.stdin.end();
  });
}

// Function to call the Python prediction script
async function predictCategory(question) {
  return new Promise((resolve, reject) => {
    PythonShell.run('../utils/predict.py', {
      mode: 'text',
      pythonOptions: ['-u'],  // Optional: Unbuffered output
      scriptPath: './',  // Adjust path if needed
      args: [question],  // Pass the question as an argument
    }, (err, data) => {
      if (err) reject(err);
      resolve(data.trim());  // Extract predicted category from output
    });
  });
}

// Extract questions from overall experience
router.post('/extract-questions', async (req, res) => {
    console.log("in extract question")
  const overallExperience = req.body.overallExperience;

  if (!overallExperience) {
    return res.status(400).json({ error: 'Missing overall experience field' });
  }

  try {
    const { sentences, lemmatizedWords } = await preprocessText(overallExperience);
    console.log("sentences : ", sentences)
    const questions =await  extractQuestions({ sentences, lemmatizedWords });

    // Predict the category of each question using the Python function
    console.log("questions : ",questions)
    const categorizedQuestions = await Promise.all(
      questions.map(async question => {
        const category = await predictCategory(question);
        console.log(category, question);
        return { question, category };
      })
    );

    // Store questions in the database
    const experienceId = req.body.experienceId;
    const technicalQuestions = categorizedQuestions.filter(q => q.category === 'technical');
    const hrQuestions = categorizedQuestions.filter(q => q.category === 'HR');

    db.query('UPDATE experiences SET technical_questions =?, hr_questions =? WHERE experience_id =?', [technicalQuestions, hrQuestions, experienceId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.json({ message: 'Questions extracted and stored successfully' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
