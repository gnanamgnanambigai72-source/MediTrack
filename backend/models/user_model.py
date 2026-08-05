import uuid
import bcrypt
from datetime import datetime
from database.db import get_db

class UserModel:
    @staticmethod
    def generate_id():
        return str(uuid.uuid4())
    
    @staticmethod
    def hash_password(password):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password, hashed):
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    @staticmethod
    def create(name, email, password, phone, role='user'):
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            user_id = UserModel.generate_id()
            hashed_password = UserModel.hash_password(password)
            
            cursor.execute('''
                INSERT INTO users (id, name, email, phone, password, role)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (user_id, name, email, phone, hashed_password, role))
            
            return UserModel.get_by_id(user_id)
    
    @staticmethod
    def get_by_id(user_id):
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
            return cursor.fetchone()
    
    @staticmethod
    def get_by_email(email):
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
            return cursor.fetchone()
    
    @staticmethod
    def get_by_phone(phone):
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute('SELECT * FROM users WHERE phone = %s', (phone,))
            return cursor.fetchone()
    
    @staticmethod
    def get_all():
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
            return cursor.fetchall()
    
    @staticmethod
    def update(user_id, data):
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            fields = []
            values = []
            for key, value in data.items():
                fields.append(f"{key} = %s")
                values.append(value)
            values.append(user_id)
            
            cursor.execute(f'UPDATE users SET {", ".join(fields)} WHERE id = %s', values)
            return UserModel.get_by_id(user_id)
    
    @staticmethod
    def update_last_login(user_id):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE users SET last_login = %s WHERE id = %s', (datetime.now(), user_id))
    
    @staticmethod
    def delete(user_id):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM users WHERE id = %s', (user_id,))
            return True
    
    @staticmethod
    def toggle_role(user_id):
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute('SELECT role FROM users WHERE id = %s', (user_id,))
            user = cursor.fetchone()
            if user:
                new_role = 'admin' if user['role'] == 'user' else 'user'
                cursor.execute('UPDATE users SET role = %s WHERE id = %s', (new_role, user_id))
                return UserModel.get_by_id(user_id)
            return None
