import sys


def extract_questions(sentences, lemmatized_words):
  """
  Extracts potential questions from a list of sentences and lemmatized words.

  Args:
      sentences: A list of strings representing the original sentences.
      lemmatized_words: A list of strings containing the lemmatized words.

  Returns:
      A list of strings representing the extracted potential questions.
  """

  questions = []
  
  try : 
    interrogative_words = ["who", "what", "where", "when", "why", "how", "which", "whose", "whom", "explain", "tell", "do", "did", "question", "questions", "find", "write", "code", "programming", "approach"]
    
    for i, sentence in enumerate(sentences):
       
    # Filter lemmatized words that appear in the sentence
        words_in_sentence = [lemmatized_words[j] for j in range(len(lemmatized_words)) if sentences[i].split(' ')[j] == lemmatized_words[j]]

        if any(word in words_in_sentence for word in interrogative_words) or sentence.endswith('?'):
            questions.append(sentence)

    return questions
  except Exception as e:
    print(f"Error during question extraction: {e}", file=sys.stderr)
    return None  # Or return an error indicator as needed

# Example usage (assuming you have a separate Python file for the API)
if __name__ == "__main__":
  sentences = ["This is a statement.", "What is the purpose of life?"]
  lemmatized_words = ["this", "is", "a", "statement", "what", "is", "the", "purpose", "of", "life"]
  extracted_questions = extract_questions(sentences, lemmatized_words)
  print(extracted_questions)  # Output: ["What is the purpose of life?"]
