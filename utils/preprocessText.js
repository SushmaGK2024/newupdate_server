const { SentenceTokenizer, WordTokenizer } = require('natural');
const { Lemmatizer } = require('node-lemmatizer');



const sentTokenizer = new SentenceTokenizer();
const wordTokenizer = new WordTokenizer();
const stopWords = new Set(require('stopwords').english);
 // Removed 'new' keyword

function preprocessText(text) {
  // Tokenization
  const sentences = sentTokenizer.tokenize(text);

  // Tokenize words in each sentence
  const words = sentences.map(sentence => wordTokenizer.tokenize(sentence));

  // Flatten the list of words
  const flattenedWords = words.flat();

  // Remove stopwords and punctuation
  const filteredWords = flattenedWords.filter(word => /^[a-zA-Z]+$/.test(word) && !stopWords.has(word.toLowerCase()));

  // Lemmatization
  const lemmatizer = Lemmatizer(); 
  const lemmatizedWords = filteredWords.map(word => Lemmatizer.lemmatize(word));

  return { sentences, lemmatizedWords };
}

module.exports = preprocessText;
