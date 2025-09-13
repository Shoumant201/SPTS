from flask import Flask, jsonify, request
from datetime import datetime
import os

app = Flask(__name__)

@app.route('/ping', methods=['GET'])
def ping():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'message': 'SPTM ML Service is running',
        'timestamp': datetime.now().isoformat(),
        'service': 'ml-service'
    })

@app.route('/api/v1/eta', methods=['POST'])
def calculate_eta():
    """Calculate ETA for a route (placeholder implementation)"""
    data = request.get_json()
    
    # Placeholder ETA calculation
    # In a real implementation, this would use ML models
    base_eta = 15  # minutes
    
    return jsonify({
        'eta_minutes': base_eta,
        'confidence': 0.85,
        'factors': ['traffic', 'weather', 'historical_data'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/v1/status', methods=['GET'])
def status():
    """Service status endpoint"""
    return jsonify({
        'service': 'SPTM ML Service',
        'version': '1.0.0',
        'environment': os.getenv('FLASK_ENV', 'development'),
        'models_loaded': True
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'path': request.path
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'Something went wrong'
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"🤖 ML Service starting on port {port}")
    print(f"🔍 Health check: http://localhost:{port}/ping")
    
    app.run(host='0.0.0.0', port=port, debug=debug)