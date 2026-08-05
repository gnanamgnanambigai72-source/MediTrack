# MediTrack Flask + MySQL Backend

## Setup Instructions

### 1. Prerequisites
- Python 3.9+
- MySQL Server installed and running

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Create MySQL Database
```sql
CREATE DATABASE meditrack;
```

### 4. Configure Environment
Edit `.env` file with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=meditrack
```

### 5. Run the Server
```bash
python app.py
```

The server will start at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires JWT)

### Users
- `GET /api/users/` - Get all users
- `GET /api/users/<id>` - Get user by ID
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user
- `POST /api/users/<id>/toggle-role` - Toggle user role

### Medicines
- `GET /api/medicines/` - Get user's medicines
- `GET /api/medicines/all` - Get all medicines (admin)
- `POST /api/medicines/` - Create medicine
- `GET /api/medicines/<id>` - Get medicine by ID
- `PUT /api/medicines/<id>` - Update medicine
- `DELETE /api/medicines/<id>` - Delete medicine

## Database Tables
- users
- health_profiles
- allergies
- chronic_diseases
- emergency_contacts
- medicines
- medicine_doses
- appointments
- health_records
- notifications
