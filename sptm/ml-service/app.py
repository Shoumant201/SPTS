from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'SPTM ML Service is running'
    })

@app.route('/predict-eta', methods=['POST'])
def predict_eta():
    """
    Predict estimated time of arrival for a bus
    """
    data = request.get_json()
    
    # Placeholder implementation
    # TODO: Implement actual ML model for ETA prediction
    
    return jsonify({
        'eta_minutes': 15,
        'confidence': 0.85,
        'message': 'ETA prediction (placeholder)'
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)