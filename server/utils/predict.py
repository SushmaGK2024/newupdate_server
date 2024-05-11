import torch
from transformers import BertTokenizer, BertForSequenceClassification
from sklearn.preprocessing import LabelEncoder
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Load pre-trained BERT model and tokenizer
model_name = "bert-base-uncased"
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForSequenceClassification.from_pretrained(model_name, num_labels=2)

# Load the fine-tuned model
model_path = "fine_tuned_bert_model"
model = BertForSequenceClassification.from_pretrained(model_path)
import joblib

# Specify the path to the label encoder file
label_encoder_path = "label_encoder.pkl"

# Load the label encoder
label_encoder = joblib.load(label_encoder_path)



# Preprocess the new question
def preprocess_text(text):
    # Convert text to lowercase
    text = text.lower()
    # Remove special characters, numbers, and punctuations
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    return text

def tokenize_and_lemmatize(text):
    # Tokenize text
    tokens = word_tokenize(text)
    # Remove stopwords
    stop_words = set(stopwords.words('english'))
    tokens = [token for token in tokens if token not in stop_words]
    # Lemmatize tokens
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(token) for token in tokens]
    return tokens

def predict_category(question):
    # Clean and preprocess the new question
    cleaned_text = preprocess_text(question)
    tokens = tokenize_and_lemmatize(cleaned_text)

    # Tokenize the preprocessed question using the BERT tokenizer
    encoded_dict = tokenizer.encode_plus(
                        " ".join(tokens),
                        add_special_tokens=True,
                        max_length=128,
                        padding='max_length',
                        truncation=True,
                        return_attention_mask=True,
                        return_tensors='pt'
                   )

    input_ids = encoded_dict['input_ids']
    attention_mask = encoded_dict['attention_mask']

    # Perform inference on the new question
    model.eval()
    with torch.no_grad():
        outputs = model(input_ids, attention_mask=attention_mask)
        logits = outputs.logits

    # Decode the predicted label
    predicted_label = label_encoder.inverse_transform(logits.argmax(axis=1).detach().numpy())[0]

    return predicted_label

# Test a new question
"""
for question in questions:
    predicted_category = predict_category(question)
    print( predicted_category, question)


"""
