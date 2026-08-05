from flask import Blueprint, request, jsonify
from models.user_model import UserModel
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint('users', __name__)

@user_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    try:
        users = UserModel.get_all()
        for user in users:
            user.pop('password', None)
        return jsonify({'users': users}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    try:
        user = UserModel.get_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user.pop('password', None)
        return jsonify({'user': user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        if current_user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        user = UserModel.update(user_id, data)
        user.pop('password', None)
        return jsonify({'user': user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        UserModel.delete(user_id)
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/<user_id>/toggle-role', methods=['POST'])
@jwt_required()
def toggle_role(user_id):
    try:
        user = UserModel.toggle_role(user_id)
        user.pop('password', None)
        return jsonify({'user': user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
