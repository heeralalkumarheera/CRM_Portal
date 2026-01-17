# ATPL CRM - Quick Start Guide

## Step-by-Step Setup Instructions

### 1. MongoDB Setup

#### Option A: MongoDB Atlas (Recommended for Production)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (Free tier is sufficient for testing)
4. Click "Connect" on your cluster
5. Add your IP address to whitelist (or allow access from anywhere: 0.0.0.0/0)
6. Create a database user:
   - Username: `atplcrm`
   - Password: Choose a strong password
7. Click "Choose a connection method" → "Connect your application"
8. Copy the connection string
9. Replace `<password>` with your actual password
10. Replace `myFirstDatabase` with `atpl-crm`

Your connection string should look like:
```
mongodb+srv://atplcrm:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/atpl-crm?retryWrites=true&w=majority
```

#### Option B: Local MongoDB

1. Download and install MongoDB Community Edition
2. Start MongoDB service
3. Your connection string will be:
```
mongodb://localhost:27017/atpl-crm
```

---

### 2. Backend Setup

```bash
# 1. Navigate to backend folder
cd crm-backend

# 2. Install dependencies
npm install

# 3. Create .env file
copy .env.example .env    # Windows
# OR
cp .env.example .env      # Mac/Linux

# 4. Edit .env file and add your MongoDB connection string
# Open .env in any text editor and update MONGODB_URI

# 5. Start the backend server
npm run dev
```

**Expected Output:**
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
📊 Database: atpl-crm
🚀 Server running on port: 5000
```

The backend API is now running at: http://localhost:5000

---

### 3. Frontend Setup

Open a **new terminal window** and:

```bash
# 1. Navigate to frontend folder
cd crm-frontend

# 2. Install dependencies
npm install

# 3. Create .env file
copy .env.example .env    # Windows
# OR
cp .env.example .env      # Mac/Linux

# 4. Start the development server
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

The frontend is now running at: http://localhost:3000

---

### 4. First Login

1. Open your browser and go to: http://localhost:3000
2. You'll see the login page
3. Click "Sign up here" to create your first account
4. Fill in the registration form:
   - First Name: Your first name
   - Last Name: Your last name
   - Email: your.email@example.com
   - Phone: Your phone number
   - Password: At least 6 characters
5. Click "Create Account"
6. You'll be logged in automatically and redirected to the dashboard

---

### 5. Verify Everything Works

**Backend Health Check:**
- Open: http://localhost:5000
- You should see: `{"success":true,"message":"ATPL-CRM API is running"}`

**Frontend:**
- Open: http://localhost:3000
- You should see the dashboard with charts and statistics

---

## Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Error:** `MongoDB connection error`

**Solution:**
1. Check your internet connection (for Atlas)
2. Verify MongoDB connection string in `.env`
3. Ensure IP is whitelisted in MongoDB Atlas
4. Check username and password are correct

---

### Issue: Port Already in Use

**Error:** `Port 5000 is already in use`

**Solution:**
1. Kill the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -ti:5000 | xargs kill -9
   ```
2. Or change the port in `crm-backend/.env`:
   ```
   PORT=5001
   ```

---

### Issue: Dependencies Installation Failed

**Error:** `npm install` fails

**Solution:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
2. Delete `node_modules` and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   ```
3. Try again:
   ```bash
   npm install
   ```

---

### Issue: Frontend Not Connecting to Backend

**Error:** API calls failing

**Solution:**
1. Ensure backend is running on port 5000
2. Check `crm-frontend/.env` has correct API URL:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
3. Restart the frontend server

---

## Testing the Application

### 1. Create a Test Client

1. Go to Clients page (from sidebar)
2. Click "Add New Client"
3. Fill in client details
4. Save

### 2. Create a Test Lead

1. Go to Leads page
2. Click "Create Lead"
3. Fill in lead information
4. Save

### 3. View Dashboard

1. Go to Dashboard
2. See statistics update
3. Check recent activity

---

## Next Steps

1. **Explore Features:**
   - Create clients and leads
   - Generate quotations
   - Track invoices
   - Manage tasks

2. **Create Additional Users:**
   - Navigate to Settings
   - Add users with different roles
   - Test role-based permissions

3. **Customize:**
   - Update company logo
   - Configure email settings
   - Set up automation rules

4. **Deploy to Production:**
   - Follow deployment guide in main README
   - Use MongoDB Atlas for database
   - Deploy backend to Render/VPS
   - Deploy frontend to Vercel/Netlify

---

## Development Tips

- Backend auto-reloads on file changes (nodemon)
- Frontend has hot module replacement (Vite)
- Check browser console for frontend errors
- Check terminal for backend errors
- Use Postman to test API endpoints

---

## Support

If you encounter any issues:
1. Check the error message carefully
2. Verify all environment variables are set
3. Ensure both backend and frontend are running
4. Check MongoDB connection
5. Review the main README.md for detailed documentation

---

**You're all set! Start building your CRM! 🚀**
