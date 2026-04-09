# Academic CRM: Operation & Management Guide

This guide outlines the standard operating procedures (SOPs) for running, developing, and managing the Raffles University Academic CRM project.

## 1. Project Architecture

The project is split into two main logical parts:
- **Backend**: A FastAPI (Python) server handling database interactions (MongoDB), authentication (JWT), and API logic.
- **Frontend**: A React (JavaScript) application using Craco and TailwindCSS for a premium UI.

## 2. Quick Start (Operation Flow)

Follow these steps to get the environment running every time you start working:

### Step 1: Ensure MongoDB is Running
Check if the MongoDB service is active on your Windows machine.
- Open PowerShell as Admin and run: `Get-Service MongoDB` (status should be `Running`).

### Step 2: Start the Backend Server
Navigate to the backend directory and run the Uvicorn reloader:
```powershell
cd c:\Users\Sooja\OneDrive\Desktop\acadmeic\archive_full\backend
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```
- **API Docs**: Once running, visit `http://localhost:8000/docs` to see the interactive API documentation.

### Step 3: Start the Frontend Application
In a separate terminal window, navigate to the frontend and start the development server:
```powershell
cd c:\Users\Sooja\OneDrive\Desktop\acadmeic\archive_full\frontend
npx craco start
```
- **Live App**: Open `http://localhost:3000` in your browser.

## 3. Initial Login & Testing

Use the system administrator credentials to log in for the first time:
- **Email**: `admin@raffles.edu.in`
- **Password**: `admin123`
- **Role**: `admin`

## 4. Development Workflow

### Adding New Features
1. **Backend**: 
   - Define a New **Pydantic Model** in `server.py` for data validation.
   - Create the **API Endpoint** using `@api_router.get / post`.
   - Test the endpoint via the `/docs` page.
2. **Frontend**:
   - Create a new **Service** in `src/services/` to call the backend API.
   - Build a **Component** in `src/components/` for the UI section.
   - Link the component to a **Page** in `src/pages/`.

### Configuration (Environment Variables)
Configuration is managed via `.env` files. If you change your database location or backend URL, update these:
- **Backend**: `archive_full\backend\.env`
- **Frontend**: `archive_full\frontend\.env`

## 5. Management & Best Practices

- **Logs**: Monitor the backend terminal for access logs and error traces. Important errors are also logged using Python's `logging` module.
- **Database Backups**: Regularly export your MongoDB collections if you have important student data.
- **Styling**: Stick to the Tailwind CSS classes defined in `tailwind.config.js` to maintain the premium "Academic" brand aesthetic.
