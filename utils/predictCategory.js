const { AutoTokenizer, BertForSequenceClassification} = require("transformers");


const { SentenceTokenizer } = require('natural');
// Load pre-trained BERT model and tokenizer
const LabelEncoder = require('scikit-learn')
const path = require('path');

// Define the root directory (assuming the script is executed from the project root)
const rootDir = __dirname; // Points to the directory containing the script (utils)

// Define the relative path to the model directory
const modelRelativePath = path.join('..', '..','fine_tuned_bert_model');

// Combine the root directory and relative path to get the absolute model path
const model_path = path.join(rootDir, modelRelativePath);
console.log("model path : ",model_path)
async function loadModel() {
    const model = await BertForSequenceClassification.fromPretrained(model_path);
    return model;
  }
  
  (async () => {
    const model = await loadModel();
    // ... use the model here
  })();
  

// Load the label encoder
const labelEncoder = {
    "technical": 0,
    "HR": 1,
    // ... add other mappings
  };
// Preprocess the new question
function preprocess_text(text) {
    // Convert text to lowercase
    text = text.toLowerCase();
    // Remove special characters, numbers, and punctuations
    text = text.replace(/[^a-zA-Z\s]/g, "");
    return text;
}

// Tokenize and lemmatize the text
function tokenize_and_lemmatize(text) {
    // Tokenize text
    const tokens = word_tokenize(text);
    // Remove stopwords
    const stop_words = new Set(stopwords.words("english"));
    tokens = tokens.filter(token =>!stop_words.has(token));
    // Lemmatize tokens
    const lemmatizer = new WordNetLemmatizer();
    tokens = tokens.map(token => lemmatizer.lemmatize(token));
    return tokens;
}

// Predict the category of a given question
async function predict_category(question) {
    // Clean and preprocess the new question
    const cleaned_text = preprocess_text(question);
    const tokens = tokenize_and_lemmatize(cleaned_text);

    // Tokenize the preprocessed question using the BERT tokenizer
    const encoded_dict = tokenizer.encodePlus(
        tokens.join(" "),
        { addSpecialTokens: true, max_length: 128, padding: "max_length", truncation: true, return_attention_mask: true, return_tensors: "pt" }
    );

    const input_ids = encoded_dict.input_ids;
    const attention_mask = encoded_dict.attention_mask;

    // Perform inference on the new question
    model.eval();
    const outputs = await model(input_ids, attention_mask);
    const logits = outputs.logits;

    // Decode the predicted label
    const predicted_label = label_encoder.inverse_transform(logits.argmax(axis=1))[0];

    return predicted_label;
}

// Test a new question

const questions = [
    /* List of new questions */
];

for (const question of questions) {
    const predicted_category =  predict_category(question);
    console.log(predicted_category, question);
}