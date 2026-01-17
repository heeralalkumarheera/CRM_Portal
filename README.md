# ATPL CRM - Complete Service Industry CRM System

A comprehensive, full-stack CRM platform designed specifically for service-based businesses with role-based access control, AMC management, and advanced automation features.

---

## 🚀 Project Overview

**ATPL-CRM** is a production-ready, enterprise-grade Customer Relationship Management system built with the MERN stack (MongoDB, Express.js, React, Node.js) and designed for service industry businesses.

### Key Features

✅ **Complete CRM Functionality**
- Client & Contact Management
- Lead Management with Sales Pipeline
- Quotation & Invoice Generation
- Payment Tracking with GST Support
- AMC (Annual Maintenance Contract) Management
- Calling & Follow-up Management
- Expense Tracking & Approval
- Task & Calendar Management
- Advanced Dashboards & Reporting

✅ **Security & Access Control**
- JWT-based Authentication (Access + Refresh Tokens)
- Role-Based Access Control (6 user roles)
- Field-level Permissions
- Audit Logging
- Account Lock Mechanism
- Session Management

✅ **Automation Features**
- AMC Renewal Reminders
- Payment Overdue Alerts
- Task Deadline Notifications
- Follow-up Escalation
- Auto Status Updates

✅ **Production Ready**
- Modular Architecture
- Scalable Design
- Error Handling
- Security Best Practices
- API Documentation

---

## 📁 Project Structure

```
ATPL-CRM/
├── crm-backend/          # Node.js Express Backend
│   ├── src/
│   │   ├── config/       # Database & role configuration
│   │   ├── models/       # Mongoose models (11 models)
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── utils/        # Helper functions
│   │   └── cron/         # Automation jobs
│   ├── server.js         # Entry point
│   ├── package.json
│   └── .env.example
│
└── crm-frontend/         # React Frontend
    ├── src/
    │   ├── components/   # Reusable components
    │   ├── pages/        # Page components
    │   ├── services/     # API services
    │   ├── context/      # React context (Auth)
    │   ├── hooks/        # Custom hooks
    │   └── utils/        # Helper functions
    ├── index.html
    ├── package.json
    └── .env.example
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **Automation:** node-cron
- **Security:** helmet, cors, express-rate-limit
- **Utilities:** moment, pdfkit, nodemailer

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **State Management:** React Context API
- **Forms:** Formik + Yup
- **Charts:** Recharts
- **Notifications:** React Toastify
- **Icons:** React Icons

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (Local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd crm-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure MongoDB:**
   
   Open `.env` and update the MongoDB connection string:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/atpl-crm?retryWrites=true&w=majority
   ```

   **For MongoDB Atlas:**
   - Create a new cluster at https://www.mongodb.com/cloud/atlas
   - Create a database user
   - Whitelist your IP address
   - Copy the connection string
   - Replace `<username>`, `<password>`, and database name

5. **Update JWT secrets:**
   ```env
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
   ```

6. **Start the backend server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

   Server will run on: `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd crm-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure API URL (if needed):**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   Application will run on: `http://localhost:3000`

---

## 🔐 Default User Roles

The system supports 6 user roles with different permission levels:

1. **Super Admin** - Full system access
2. **Admin** - Administrative access (excluding system settings)
3. **Sales Executive** - Client, lead, quotation management
4. **Accountant** - Financial operations
5. **Manager** - Oversight and approval workflows
6. **Support Staff** - Limited access for support tasks

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Update password

### Clients
- `GET /api/clients` - Get all clients (with pagination)
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/stats` - Get client statistics

### Leads
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get lead details
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/convert` - Convert lead to client
- `GET /api/leads/stats` - Get lead statistics

More endpoints for Quotations, Invoices, AMC, Tasks, Expenses, etc.

---

## 🔄 Automation & Cron Jobs

The system includes automated background jobs:

1. **AMC Renewal Reminders** - Daily at 9:00 AM
2. **Payment Overdue Alerts** - Daily at 10:00 AM
3. **Task Deadline Reminders** - Daily at 8:00 AM
4. **Follow-up Reminders** - Every hour
5. **AMC Status Updates** - Daily at midnight

To enable cron jobs, set `NODE_ENV=production` in your `.env` file.

---

## 📊 Database Models

The system includes 11 comprehensive MongoDB models:

1. **User** - User authentication and profile
2. **Client** - Client information and contacts
3. **Lead** - Sales leads and pipeline
4. **Quotation** - Quotation management
5. **Invoice** - Invoice and billing
6. **Payment** - Payment tracking
7. **AMC** - Annual Maintenance Contracts
8. **CallLog** - Call and follow-up records
9. **Expense** - Expense tracking
10. **Task** - Task management
11. **AuditLog** - System audit trail
12. **Document** - Document management

---

## 🚢 Deployment

### Backend Deployment (Render/VPS)

1. **Environment Variables:** Set all variables from `.env.example`
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. **MongoDB:** Use MongoDB Atlas for production

### Frontend Deployment (Vercel/Netlify)

1. **Build Command:** `npm run build`
2. **Output Directory:** `dist`
3. **Environment Variables:** Set `VITE_API_URL` to your backend URL

---

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password encryption using bcrypt
- Role-based access control
- Account lockout after failed login attempts
- Rate limiting on API endpoints
- Helmet.js for HTTP security headers
- CORS configuration
- Input validation and sanitization
- Audit logging for all critical operations

---

## 📝 Development Guidelines

### Code Organization
- Follow modular architecture
- Keep components small and focused
- Use meaningful variable names
- Comment complex logic
- Follow REST API conventions

### Git Workflow
- `main` branch for stable releases
- `dev` branch for active development
- Feature branches: `feature/module-name`
- Commit often with clear messages
- Create pull requests for review

---

## 🎯 Future Enhancements

- AI-powered features (lead scoring, churn prediction)
- WhatsApp Business API integration
- Email automation (Gmail/Outlook)
- Payment gateway integration
- Mobile app (React Native)
- Advanced analytics and BI dashboards
- Multi-language support
- White-label capabilities
- SaaS multi-tenancy

---

## 📄 License

ISC License

---

## 👨‍💻 Developer

**ATPL Team**

For support or queries, contact: support@atpl.com

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices for production-grade applications.

---

**Happy Coding! 🚀**
