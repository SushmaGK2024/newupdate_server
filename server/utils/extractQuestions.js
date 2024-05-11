const interrogativeWords = ["who", "what", "where", "when", "why", "how", "which", "whose", "whom", "explain", "tell", "do", "did", "question", "questions", "find", "write", "code", "programming", "approach"];

function extractQuestions({ sentences, lemmatizedWords }) {
    const questions = [];

    for (const sentence of sentences) {
        const words = lemmatizedWords.filter(word => sentence.split(' ').includes(word));  // Tokenize the sentence into words
        if (words.some(word => interrogativeWords.includes(word) || word.endsWith('?'))) {
            questions.push(sentence);
        }
    }

    return questions;
}

module.exports = extractQuestions;