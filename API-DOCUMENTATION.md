# ATPL CRM - API Documentation

Base URL: `http://localhost:5000/api`

---

## Authentication

All protected routes require an `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /auth/register
Create a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "Sales Executive",
  "department": "Sales"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "Sales Executive"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### POST /auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "..."
  }
}
```

---

### GET /auth/me
Get current user details.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "User data retrieved successfully",
  "data": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "Sales Executive"
  }
}
```

---

## Client Endpoints

### GET /clients
Get all clients with pagination and filters.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)
- `search` (string) - Search term
- `status` (string) - Filter by status (Active, Inactive, Suspended)
- `category` (string) - Filter by category
- `sortBy` (string) - Field to sort by
- `sortOrder` (string) - asc or desc

**Response:**
```json
{
  "success": true,
  "message": "Clients retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### POST /clients
Create a new client.

**Request Body:**
```json
{
  "clientType": "Company",
  "companyName": "ABC Corp",
  "clientName": "John Smith",
  "email": "john@abccorp.com",
  "phone": "+1234567890",
  "gstNumber": "29ABCDE1234F1Z5",
  "panNumber": "ABCDE1234F",
  "addresses": [{
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001",
    "addressType": "Both"
  }],
  "category": "Premium",
  "priority": "High"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {...}
}
```

---

### GET /clients/:id
Get client details by ID.

**Response:**
```json
{
  "success": true,
  "message": "Client retrieved successfully",
  "data": {
    "_id": "...",
    "companyName": "ABC Corp",
    "clientName": "John Smith",
    ...
  }
}
```

---

### PUT /clients/:id
Update client information.

**Request Body:** Same as POST (partial updates allowed)

**Response:**
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {...}
}
```

---

### DELETE /clients/:id
Delete a client.

**Response:**
```json
{
  "success": true,
  "message": "Client deleted successfully",
  "data": null
}
```

---

## Lead Endpoints

### GET /leads
Get all leads with filters.

**Query Parameters:**
- `page`, `limit`, `search` (same as clients)
- `status` - Filter by status
- `stage` - Filter by stage (New, Contacted, Qualified, etc.)
- `assignedTo` - Filter by assigned user ID

**Response:**
```json
{
  "success": true,
  "message": "Leads retrieved successfully",
  "data": [...],
  "pagination": {...}
}
```

---

### POST /leads
Create a new lead.

**Request Body:**
```json
{
  "companyName": "XYZ Company",
  "contactName": "Jane Doe",
  "email": "jane@xyz.com",
  "phone": "+1234567890",
  "source": "Website",
  "serviceInterested": ["AMC", "Consulting"],
  "expectedRevenue": 50000,
  "expectedClosureDate": "2024-03-31",
  "priority": "High"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {...}
}
```

---

### POST /leads/:id/convert
Convert lead to client.

**Response:**
```json
{
  "success": true,
  "message": "Lead converted to client successfully",
  "data": {
    "lead": {...},
    "client": {...}
  }
}
```

---

### GET /leads/stats
Get lead statistics.

**Response:**
```json
{
  "success": true,
  "message": "Lead statistics retrieved successfully",
  "data": {
    "stageStats": [...],
    "sourceStats": [...],
    "conversionRate": [...]
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [...]  // Optional validation errors
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited to:
- 100 requests per 15 minutes per IP address

Exceeded limit response:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Additional Endpoints

The following endpoints are available with similar patterns:

- `/api/quotations` - Quotation management
- `/api/invoices` - Invoice management
- `/api/payments` - Payment tracking
- `/api/amc` - AMC management
- `/api/tasks` - Task management
- `/api/expenses` - Expense management
- `/api/calls` - Call log management
- `/api/documents` - Document management
- `/api/dashboard` - Dashboard statistics

Refer to the controller files for detailed endpoint documentation.

---

## Postman Collection

Import the API endpoints into Postman for testing:

1. Create a new collection
2. Add environment variables:
   - `baseURL`: `http://localhost:5000/api`
   - `accessToken`: Your JWT token
3. Use `{{baseURL}}` and `{{accessToken}}` in requests

---

**For complete API reference, check the route files in `crm-backend/src/routes/`**
