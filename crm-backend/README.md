# ATPL-CRM Backend

Complete Service Industry CRM Backend System with Role-Based Access Control, AMC Management, and Advanced Automation.

## Features

- ✅ JWT Authentication with Refresh Tokens
- ✅ Role-Based Access Control (6 Roles)
- ✅ Complete Client & Contact Management
- ✅ Lead & Sales Pipeline
- ✅ Quotation & Invoice Management
- ✅ AMC (Annual Maintenance Contract) Management
- ✅ Calling & Follow-up Management
- ✅ Expense Tracking
- ✅ Task & Calendar Management
- ✅ Advanced Dashboards & Reporting
- ✅ Automation & Smart Rules
- ✅ Document Management
- ✅ Audit Logging & Security

## Tech Stack

- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- Node-cron for automation
- PDF Generation
- Email Integration

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB connection string and other credentials

5. Start the server:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

See `.env.example` for all required environment variables.

## API Documentation

Base URL: `http://localhost:5000/api`

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/logout` - Logout user

### Users
- GET `/api/users` - Get all users (Admin only)
- GET `/api/users/:id` - Get user by ID
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

### Clients
- GET `/api/clients` - Get all clients
- POST `/api/clients` - Create new client
- GET `/api/clients/:id` - Get client by ID
- PUT `/api/clients/:id` - Update client
- DELETE `/api/clients/:id` - Delete client

### Leads
- GET `/api/leads` - Get all leads
- POST `/api/leads` - Create new lead
- PUT `/api/leads/:id` - Update lead
- DELETE `/api/leads/:id` - Delete lead

### Quotations
- GET `/api/quotations` - Get all quotations
- POST `/api/quotations` - Create quotation
- GET `/api/quotations/:id/pdf` - Generate PDF

### Invoices
- GET `/api/invoices` - Get all invoices
- POST `/api/invoices` - Create invoice
- GET `/api/invoices/:id/pdf` - Generate PDF

### AMC
- GET `/api/amc` - Get all AMCs
- POST `/api/amc` - Create AMC
- GET `/api/amc/reminders` - Get upcoming reminders

### More endpoints available for all modules...

## Project Structure

```
crm-backend/
├── src/
│   ├── models/          # Mongoose models
│   ├── controllers/     # Route controllers
│   ├── routes/          # Express routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Helper functions
│   ├── cron/            # Cron jobs
│   └── config/          # Configuration files
├── server.js            # Entry point
├── .env                 # Environment variables
└── package.json         # Dependencies
```

## License

ISC
