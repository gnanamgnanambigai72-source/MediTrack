import mysql.connector
from config import Config
from contextlib import contextmanager

def get_db_connection():
    return mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME
    )

@contextmanager
def get_db():
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20),
            password VARCHAR(255) NOT NULL,
            role ENUM('user', 'admin') DEFAULT 'user',
            avatar VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS health_profiles (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            date_of_birth DATE,
            gender ENUM('male', 'female', 'third-gender'),
            blood_group VARCHAR(5),
            weight DECIMAL(5,2),
            height DECIMAL(5,2),
            insurance_number VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS allergies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            profile_id VARCHAR(36) NOT NULL,
            name VARCHAR(100) NOT NULL,
            FOREIGN KEY (profile_id) REFERENCES health_profiles(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chronic_diseases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            profile_id VARCHAR(36) NOT NULL,
            name VARCHAR(100) NOT NULL,
            FOREIGN KEY (profile_id) REFERENCES health_profiles(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS emergency_contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            profile_id VARCHAR(36) NOT NULL,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            relationship VARCHAR(50),
            FOREIGN KEY (profile_id) REFERENCES health_profiles(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medicines (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            dosage VARCHAR(50),
            unit VARCHAR(20),
            frequency VARCHAR(50),
            times JSON,
            start_date DATE,
            end_date DATE,
            instructions TEXT,
            color VARCHAR(10),
            category VARCHAR(50),
            reminder_enabled BOOLEAN DEFAULT TRUE,
            voice_alert BOOLEAN DEFAULT FALSE,
            notification_sound BOOLEAN DEFAULT TRUE,
            sound_type VARCHAR(50) DEFAULT 'bell-chime',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medicine_doses (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            medicine_id VARCHAR(36) NOT NULL,
            medicine_name VARCHAR(255) NOT NULL,
            scheduled_date DATE NOT NULL,
            scheduled_time TIME NOT NULL,
            status ENUM('pending', 'taken', 'missed', 'skipped') DEFAULT 'pending',
            taken_at TIMESTAMP NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            doctor_name VARCHAR(255) NOT NULL,
            specialty VARCHAR(100),
            hospital VARCHAR(255),
            date DATE NOT NULL,
            time TIME NOT NULL,
            notes TEXT,
            status ENUM('upcoming', 'completed', 'cancelled') DEFAULT 'upcoming',
            reminder_set BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS health_records (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            type ENUM('prescription', 'lab_report', 'medical_image', 'vaccination', 'insurance') NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            file_name VARCHAR(255),
            file_size VARCHAR(20),
            file_type VARCHAR(100),
            file_data LONGBLOB,
            doctor_name VARCHAR(255),
            tags JSON,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            type ENUM('reminder', 'missed', 'appointment', 'system', 'summary') NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    cursor.close()
    conn.close()
    print("Database tables created successfully!")
