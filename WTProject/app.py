from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename
import os
from PIL import Image
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions

app = Flask(__name__)

# Configurations
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load pre-trained MobileNetV2 model
model = MobileNetV2(weights='imagenet')

# Dummy user storage (for demonstration purposes)
users = {}

# Predict using MobileNetV2
def predict_image(image):
    image = image.resize((224, 224))
    image_array = np.array(image.convert('RGB'))
    image_array = np.expand_dims(image_array, axis=0)
    image_array = preprocess_input(image_array)
    predictions = model.predict(image_array)
    decoded = decode_predictions(predictions, top=1)[0][0]  # (class, name, score)
    return f"{decoded[1]} ({decoded[2]*100:.2f}%)"

# Route to handle prediction
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['image']
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    image = Image.open(file_path)
    label = predict_image(image)

    # Save the result (could be saved to DB instead)
    with open("history.txt", "a") as f:
        f.write(f"{filename},{label}\n")

    return jsonify({'label': label})

# Optional: Serve static frontend files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True)
