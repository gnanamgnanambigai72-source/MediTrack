from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database.db import init_db
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.medicine_routes import medicine_bp
from config import Config

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = Config.JWT_ACCESS_TOKEN_EXPIRES

jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(medicine_bp, url_prefix='/api/medicines')

@app.before_request
def initialize_database():
    init_db()

@app.route('/')
def home():
    return jsonify({
        'message': 'MediTrack API Server',
        'version': '1.0.0',
        'status': 'running'
    })

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    print("Initializing database...")
    init_db()
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
