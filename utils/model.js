const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const { BertTokenizer, BertForSequenceClassification } = require("@huggingface/node-bert");
const { LabelEncoder } = require("sklearn");
const re = require('re');
const { WordTokenizer, WordNetLemmatizer, stopwords } = require('natural');

// Download NLTK resources (run only once)
nltk.download('punkt');
nltk.download('stopwords');
nltk.download('wordnet');

// Step 1: Load Dataset
const data = fs.readFileSync('/content/questions - questions.csv', 'utf8'); // Load the dataset
const dataset = data.split('\n').map(row => row.split(','));

// Step 2: Data Preprocessing
function cleanText(text) {
    text = text.toLowerCase(); // Convert text to lowercase
    text = re.sub('[^a-zA-Z\s]', '', text); // Remove special characters, numbers, and punctuations
    return text;
}
function tokenizeAndLemmatize(text) {
    const tokens = wordTokenizer.tokenize(text); // Tokenize text
    const stopWords = new Set(stopwords.words('english')); // Remove stopwords
    const lemmatizer = new WordNetLemmatizer(); // Lemmatize tokens
    return tokens.filter(token => !stopWords.has(token)).map(token => lemmatizer.lemmatize(token));
}

const cleanedTexts = dataset.map(row => cleanText(row[0])); // Clean text
const tokenizedTexts = cleanedTexts.map(text => tokenizeAndLemmatize(text)); // Tokenize and lemmatize

// Step 3: Label Encoding
const labelEncoder = LabelEncoder();
const labels = dataset.map(row => row[1]);
const encodedLabels = labelEncoder.fitTransform(labels);

// Step 4: Model Architecture
const modelName = "bert-base-uncased";
const tokenizer =  BertTokenizer.fromPretrained(modelName);
const model =  BertForSequenceClassification.fromPretrained(modelName, { numLabels: labelEncoder.classes_.length });

// Step 5: Training and Evaluation
const maxLen = 128; // Max length of input tokens

// Train-validation split
const [trainData, valData] = trainTestSplit(tokenizedTexts, encodedLabels, { testSize: 0.2, randomState: 42 });

// Tokenize input text and convert to input IDs
function tokenizeData(data) {
    const inputIds = [];
    const attentionMasks = [];

    for (const tokens of data) {
        const encodedDict = tokenizer.encodeBatch(tokens, { addSpecialTokens: true, maxLen, padding: 'max_length', truncation: true, returnAttentionMask: true });

        inputIds.push(encodedDict.inputIds);
        attentionMasks.push(encodedDict.attentionMask);
    }

    return { inputIds, attentionMasks, labels };
}

const trainDataset = tokenizeData(trainData);
const valDataset = tokenizeData(valData);

const batchSize = 32;
const trainDataLoader = new DataLoader(trainDataset, { sampler: RandomSampler(trainDataset), batchSize });
const valDataLoader = new DataLoader(valDataset, { sampler: SequentialSampler(valDataset), batchSize });

// Step 6: Model Training and Evaluation
const device = torch.device(torch.cuda.is_available()? "cuda" : "cpu");
model.to(device);

const optimizer = AdamW(model.parameters(), { lr: 2e-5, eps: 1e-8 });

const epochs = 3;
for (let epoch = 0; epoch < epochs; epoch++) {
    model.train();
    let totalLoss = 0;

    for (const batch of trainDataLoader) {
        const inputs = { inputIds: batch.inputIds.to(device), attentionMask: batch.attentionMask.to(device), labels: batch.labels.to(device) };

        optimizer.zeroGrad();
        const outputs = model(inputs);
        const loss = outputs.loss;
        totalLoss += loss.item();

        loss.backward();
        torch.nn.utils.clipGradNorm(model.parameters(), 1.0);
        optimizer.step();
    }

    const avgTrainLoss = totalLoss / trainDataLoader.length;

    model.eval();
    let valLoss = 0;
    let valAccuracy = 0;

    for (const batch of valDataLoader) {
        const inputs = { inputIds: batch.inputIds.to(device), attentionMask: batch.attentionMask.to(device), labels: batch.labels.to(device) };

        const outputs = model(inputs);
        const logits = outputs.logits;

        valLoss += outputs.loss.item();
        valAccuracy += (logits.argmax(axis=1) == inputs.labels).float().mean();
    }

    const avgValLoss = valLoss / valDataLoader.length;
    const avgValAccuracy = valAccuracy / valDataLoader.length;

    console.log(`Epoch ${epoch + 1}:`);
    console.log(`  Training Loss: ${avgTrainLoss.toFixed(4)}`);
    console.log(`  Validation Loss: ${avgValLoss.toFixed(4)}`);
    console.log(`  Validation Accuracy: ${avgValAccuracy.toFixed(4)}`);
}

// Step 7: Fine-tuning

// Step 8: Inference

