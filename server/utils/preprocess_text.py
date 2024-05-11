import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Download NLTK resources (run only once)

def preprocess_text(text):
  """
  Preprocesses text by performing tokenization, stopword removal, and lemmatization.

  Args:
      text: The text to preprocess.

  Returns:
      A dictionary containing the preprocessed data in JSON format.
  """

  # Tokenization
  sentences = sent_tokenize(text)

  # Tokenize words in each sentence
  words = [word_tokenize(sentence) for sentence in sentences]

  # Flatten the list of words
  words = [word for sentence_words in words for word in sentence_words]

  # Remove stopwords and punctuation
  stop_words = set(stopwords.words("english"))
  filtered_words = [word.lower() for word in words if word.isalnum() and word.lower() not in stop_words]

  # Lemmatization
  lemmatizer = WordNetLemmatizer()
  lemmatized_words = [lemmatizer.lemmatize(word) for word in filtered_words]
 
  # Return data in JSON format
  return {
      "sentences": sentences,
      "lemmatized_words": lemmatized_words
  }
