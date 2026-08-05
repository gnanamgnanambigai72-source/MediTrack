from flask import Blueprint, request, jsonify
from models.medicine_model import MedicineModel
from flask_jwt_extended import jwt_required, get_jwt_identity

medicine_bp = Blueprint('medicines', __name__)

@medicine_bp.route('/', methods=['GET'])
@jwt_required()
def get_medicines():
    try:
        user_id = get_jwt_identity()
        medicines = MedicineModel.get_by_user(user_id)
        return jsonify({'medicines': medicines}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@medicine_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_medicines():
    try:
        medicines = MedicineModel.get_all()
        return jsonify({'medicines': medicines}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@medicine_bp.route('/', methods=['POST'])
@jwt_required()
def create_medicine():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        medicine = MedicineModel.create(user_id, data)
        return jsonify({'medicine': medicine}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@medicine_bp.route('/<medicine_id>', methods=['GET'])
@jwt_required()
def get_medicine(medicine_id):
    try:
        medicine = MedicineModel.get_by_id(medicine_id)
        if not medicine:
            return jsonify({'error': 'Medicine not found'}), 404
        return jsonify({'medicine': medicine}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@medicine_bp.route('/<medicine_id>', methods=['PUT'])
@jwt_required()
def update_medicine(medicine_id):
    try:
        data = request.get_json()
        medicine = MedicineModel.update(medicine_id, data)
        return jsonify({'medicine': medicine}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@medicine_bp.route('/<medicine_id>', methods=['DELETE'])
@jwt_required()
def delete_medicine(medicine_id):
    try:
        MedicineModel.delete(medicine_id)
        return jsonify({'message': 'Medicine deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
