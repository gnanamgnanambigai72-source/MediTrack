import uuid
import json
from datetime import datetime
from database.db import get_db

class MedicineModel:
    @staticmethod
    def generate_id():
        return str(uuid.uuid4())
    
    @staticmethod
    def create(user_id, data):
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            medicine_id = MedicineModel.generate_id()
            
            cursor.execute('''
                INSERT INTO medicines (id, user_id, name, dosage, unit, frequency, times,
                    start_date, end_date, instructions, color, category,
                    reminder_enabled, voice_alert, notification_sound, sound_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                medicine_id, user_id, data['name'], data.get('dosage'), data.get('unit'),
                data.get('frequency'), json.dumps(data.get('times', [])),
                data.get('startDate'), data.get('endDate'), data.get('instructions'),
                data.get('color'), data.get('category'),
                data.get('reminderEnabled', True), data.get('voiceAlert', False),
                data.get('notificationSound', True), data.get('soundType', 'bell-chime')
            ))
            
            return MedicineModel.get_by_id(medicine_id)
    
    @staticmethod
    def get_by_id(medicine_id):
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute('SELECT * FROM medicines WHERE id = %s', (medicine_id,))
            medicine = cursor.fetchone()
            if medicine and medicine.get('times'):
                medicine['times'] = json.loads(medicine['times'])
            return medicine
    
    @staticmethod
    def get_by_user(user_id):
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute('SELECT * FROM medicines WHERE user_id = %s ORDER BY created_at DESC', (user_id,))
            medicines = cursor.fetchall()
            for med in medicines:
                if med.get('times'):
                    med['times'] = json.loads(med['times'])
            return medicines
    
    @staticmethod
    def get_all():
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute('SELECT * FROM medicines ORDER BY created_at DESC')
            medicines = cursor.fetchall()
            for med in medicines:
                if med.get('times'):
                    med['times'] = json.loads(med['times'])
            return medicines
    
    @staticmethod
    def update(medicine_id, data):
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            fields = []
            values = []
            
            for key, value in data.items():
                if key == 'times':
                    value = json.dumps(value)
                fields.append(f"{key} = %s")
                values.append(value)
            values.append(medicine_id)
            
            cursor.execute(f'UPDATE medicines SET {", ".join(fields)} WHERE id = %s', values)
            return MedicineModel.get_by_id(medicine_id)
    
    @staticmethod
    def delete(medicine_id):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM medicines WHERE id = %s', (medicine_id,))
            return True
