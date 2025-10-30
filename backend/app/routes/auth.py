from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from app.models import User

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({
            'error': 'Missing required fields',
            'required': ['username', 'email', 'password']
        }), 400
    
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    
    if '@' not in email or '.' not in email:
        return jsonify({'error': 'Invalid email format'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    


    existing_user = User.find_by_username(username)
    if existing_user:
        return jsonify({'error': 'Username already taken'}), 400
    

    existing_email = User.find_by_email(email)
    if existing_email:
        return jsonify({'error': 'Email already registered'}), 400
    

    try:
        new_user = User(
            username=username,
            email=email
        )
        new_user.set_password(password)  
        

        db.session.add(new_user)
        db.session.commit()
        

        access_token = create_access_token(identity=str(new_user.id))
        refresh_token = create_refresh_token(identity=str(new_user.id))
        
        
        return jsonify({
            'message': 'User created successfully',
            'user': new_user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({
            'error': 'Missing required fields',
            'required': ['username', 'password']
        }), 400
    
    user = User.find_by_username(username)
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = int(get_jwt_identity())
    
    new_access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'access_token': new_access_token
    }), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = int(get_jwt_identity())
    
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict()
    }), 200
