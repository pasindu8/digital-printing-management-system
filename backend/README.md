# Digital Printing Management System - Backend

## 📋 Overview
Complete backend API system for digital printing business management built with Node.js, Express.js, and MongoDB.

## 🏗️ Architecture

### MVC Pattern
- **Models**: Database schemas and data validation
- **Controllers**: Business logic and request handling
- **Routes**: API endpoints and routing
- **Middleware**: Authentication, error handling, validation

## 📁 Project Structure

```
backend/
├── 📄 app.js                    # Express application setup
├── 📄 server.js                 # Main server entry point
├── 📄 package.json             # Dependencies and scripts
├── 📄 .env                     # Environment variables
├── 📄 .gitignore              # Git ignored files
├── 📄 jest.config.js          # Testing configuration
│
├── 📁 config/
│   └── passport.js             # OAuth authentication strategies
│
├── 📁 controllers/             # Business logic handlers
│   ├── materialOrderController.js    # Raw material orders
│   ├── rawMaterialController.js      # Inventory management
│   └── supplierController.js         # Supplier management
│
├── 📁 middleware/
│   ├── auth.js                 # JWT authentication
│   └── errorHandler.js         # Global error handling
│
├── 📁 models/                  # MongoDB schemas
│   ├── User.js                 # User accounts & authentication
│   ├── Customer.js             # Customer information
│   ├── Order.js                # Print job orders
│   ├── Employee_Details.js     # Employee records
│   ├── Raw_materials.js        # Inventory items
│   ├── Material_orders.js      # Supplier orders
│   ├── Suppliers.js            # Vendor information
│   ├── Production.js           # Manufacturing workflow
│   ├── Schedule.js             # Production scheduling
│   ├── Delivery.js             # Shipping & logistics
│   ├── Billing.js              # Invoicing & payments
│   ├── Finance.js              # Financial records
│   ├── HR.js                   # Human resources
│   ├── CompanySettings.js      # System configuration
│   └── Counter.js              # Auto-increment IDs
│
├── 📁 routes/                  # API endpoints
│   ├── authRoutes.js           # Authentication APIs
│   ├── customers.js            # Customer management
│   ├── orderRoutes.js          # Order processing
│   ├── production.js           # Production management
│   ├── delivery.js             # Shipping & tracking
│   ├── billing.js              # Invoice generation
│   ├── finance.js              # Financial operations
│   ├── hr.js                   # Employee management
│   ├── rawMaterials.js         # Inventory control
│   ├── materialOrders.js       # Supplier orders
│   ├── suppliers.js            # Vendor management
│   ├── schedule.js             # Production planning
│   ├── reports.js              # Analytics & reporting
│   ├── notifications.js        # Email/SMS notifications
│   └── settings.js             # System configuration
│
├── 📁 utils/                   # Helper functions
│   ├── asyncHandler.js         # Async error handling
│   ├── emailService.js         # Email sending
│   ├── supplierEmailService.js # Supplier notifications
│   ├── invoiceGenerator.js     # PDF invoice creation
│   ├── generateId.js           # Unique ID generation
│   └── employeeUtils.js        # Employee utilities
│
└── 📁 uploads/                 # File storage
    ├── invoices/               # Generated PDF invoices
    └── receipts/               # Payment receipts
```

## 🔧 Core Features

### 1. Authentication & Authorization
- **JWT Token Authentication**
- **OAuth Integration** (Google, GitHub)
- **Role-based Access Control** (Admin, Employee, Customer)
- **Password Reset & Email Verification**

### 2. Customer Management
- Customer registration & profiles
- Order history tracking
- Address management
- Payment history

### 3. Order Processing
- Print job order creation
- Specification management
- Status tracking (Pending → Production → Delivery)
- Customer notifications

### 4. Production Management
- Job scheduling & assignment
- Employee task allocation
- Production workflow tracking
- Quality control checkpoints

### 5. Inventory Management
- Raw material stock tracking
- Supplier order management
- Automatic reorder alerts
- Damage/waste tracking

### 6. Financial System
- Invoice generation (PDF)
- Payment tracking
- Expense management
- Ledger entries & accounting
- Financial reporting

### 7. HR Management
- Employee records
- Attendance tracking
- Payroll management
- Leave management

### 8. Supplier Management
- Vendor database
- Purchase order automation
- Email notifications
- Performance tracking

## 🚀 Getting Started

### Prerequisites
```bash
Node.js (v16+)
MongoDB (v5+)
npm or yarn
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Variables
```env
# Database
MONGO_URI=mongodb://localhost:27017/printing_system

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# OAuth (Google)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# OAuth (GitHub)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Company Info
COMPANY_NAME=Your Printing Company
COMPANY_EMAIL=info@yourcompany.com
```

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register       # User registration
POST   /api/auth/login          # User login
GET    /api/auth/google         # Google OAuth
GET    /api/auth/github         # GitHub OAuth
POST   /api/auth/forgot-password # Password reset
```

### Customers
```
GET    /api/customers           # List all customers
POST   /api/customers           # Create customer
GET    /api/customers/:id       # Get customer details
PUT    /api/customers/:id       # Update customer
DELETE /api/customers/:id       # Delete customer
```

### Orders
```
GET    /api/orders              # List orders
POST   /api/orders              # Create order
GET    /api/orders/:id          # Get order details
PUT    /api/orders/:id          # Update order
DELETE /api/orders/:id          # Cancel order
POST   /api/orders/:id/assign   # Assign to production
```

### Production
```
GET    /api/production          # Production dashboard
POST   /api/production/assign   # Assign job to employee
PUT    /api/production/:id/status # Update job status
GET    /api/production/schedule # Production schedule
```

### Inventory
```
GET    /api/raw-materials       # List materials
POST   /api/raw-materials       # Add material
PUT    /api/raw-materials/:id   # Update stock
GET    /api/material-orders     # Supplier orders
POST   /api/material-orders     # Create order
PUT    /api/material-orders/:id/delivered # Mark delivered
```

### Finance
```
GET    /api/billing             # Billing dashboard
POST   /api/billing/invoice     # Generate invoice
GET    /api/finance/expenses    # Expense tracking
POST   /api/finance/expense     # Add expense
GET    /api/reports/financial   # Financial reports
```

## 🔐 Authentication Flow

### JWT Authentication
1. User login with credentials
2. Server validates and returns JWT token
3. Client includes token in Authorization header
4. Server validates token for protected routes

### OAuth Flow
1. User clicks Google/GitHub login
2. Redirected to OAuth provider
3. User authorizes application
4. Callback creates/links user account
5. JWT token returned for session

## 📊 Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['Customer', 'Employee', 'Admin'],
  googleId: String,
  githubId: String,
  emailVerified: Boolean,
  createdAt: Date
}
```

### Order Model
```javascript
{
  orderId: String (auto-generated),
  customerId: ObjectId,
  items: [{
    product: String,
    quantity: Number,
    specifications: Object
  }],
  status: ['Pending', 'Production', 'Quality Check', 'Delivered'],
  totalAmount: Number,
  assignedEmployee: ObjectId,
  deadline: Date,
  createdAt: Date
}
```

### Material Order Model
```javascript
{
  order_id: String,
  material_id: String,
  supplier_id: String,
  quantity_ordered: Number,
  unit_price: Number,
  total_price: Number,
  status: ['Pending', 'Confirmed', 'Delivered'],
  damaged_items_amount: Number,
  delivery_date: Date
}
```

## 🛠️ Business Logic

### Order Processing Workflow
1. **Customer places order** → Order created with "Pending" status
2. **Admin/Employee reviews** → Order assigned to production employee
3. **Production starts** → Status updated to "Production"
4. **Quality check** → Status updated to "Quality Check"
5. **Order completed** → Status updated to "Delivered"
6. **Invoice generated** → PDF invoice sent to customer

### Inventory Management
1. **Stock monitoring** → Low stock alerts
2. **Supplier ordering** → Automatic purchase orders
3. **Delivery tracking** → Update stock levels
4. **Damage recording** → Adjust usable quantities

### Financial Integration
1. **Order completion** → Invoice generation
2. **Material delivery** → Expense entry creation
3. **Payment received** → Ledger entry update
4. **Monthly reports** → Financial analytics

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Production Setup
```bash
# Build for production
npm run build

# Start production server
npm start

# Using PM2 (recommended)
pm2 start server.js --name "printing-backend"
pm2 startup
pm2 save
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

## 🔧 Configuration

### Email Templates
- **Order confirmation** → Customer notification
- **Invoice delivery** → PDF attachment
- **Supplier orders** → Purchase order details
- **Status updates** → Real-time notifications

### PDF Generation
- **Invoice templates** → Company branding
- **Order specifications** → Detailed requirements
- **Reports** → Financial & operational data

## 🚨 Error Handling

### Global Error Middleware
- **Validation errors** → 400 Bad Request
- **Authentication errors** → 401 Unauthorized
- **Authorization errors** → 403 Forbidden
- **Not found errors** → 404 Not Found
- **Server errors** → 500 Internal Server Error

### Logging
- **Request logging** → API access tracking
- **Error logging** → Debug information
- **Business events** → Audit trails

## 🔒 Security Features

- **Password hashing** (bcrypt)
- **JWT token security**
- **Rate limiting**
- **Input validation & sanitization**
- **CORS configuration**
- **Environment variable protection**

## 📈 Performance

### Database Optimization
- **Indexing** on frequently queried fields
- **Aggregation pipelines** for complex queries
- **Connection pooling**
- **Query optimization**

### Caching Strategy
- **Session caching**
- **Frequently accessed data**
- **API response caching**

## 🔄 API Versioning

Current version: **v1**
Base URL: `/api/v1`

Future versions will maintain backward compatibility.

## 📞 Support

For technical support or questions:
- **Email**: support@yourcompany.com
- **Documentation**: /docs
- **API Reference**: /api-docs

---

## 🎯 Key Benefits

✅ **Complete Business Management** - End-to-end printing business operations  
✅ **Scalable Architecture** - Microservices-ready design  
✅ **Real-time Notifications** - Email & system alerts  
✅ **Financial Integration** - Automated accounting entries  
✅ **Multi-user Support** - Role-based access control  
✅ **Inventory Automation** - Smart reordering & tracking  
✅ **Production Workflow** - Streamlined job management  
✅ **Customer Portal** - Self-service order tracking  

**Built for efficiency, designed for growth!** 🚀

## ----------------------------- PREVIOUS CONTENT BELOW -----------------------------

### Key Business Modules

#### Order Management

#### Inventory Management  
* [cite_start]**For Managers**: Add, update, and remove raw materials[cite: 184]. [cite_start]Automatically reduce stock levels when an order is placed and provide low-stock alerts[cite: 185, 186, 663]. [cite_start]Generate detailed stock reports and view a visual stock dashboard for better decision-making[cite: 189, 190].
* [cite_start]**For Workers**: Record raw materials used for each order to ensure accurate inventory updates[cite: 188].

#### Finance Management
* [cite_start]Automate generation of accurate invoices when an order is confirmed and maintain a digital ledger of income, expenses, and payments[cite: 155, 156, 576]. [cite_start]Automatically calculate staff salaries based on attendance records[cite: 158]. [cite_start]Finance managers can generate financial reports and view a real-time dashboard of financial summaries and cash flow[cite: 157, 160].

#### Human Resources (HR) Management
* [cite_start]**For Managers**: Register and maintain employee profiles, record attendance, and track leave[cite: 164, 166]. [cite_start]Monitor employee performance and completed tasks[cite: 170].
* [cite_start]**For Staff**: View salary details and payslips[cite: 159, 169]. [cite_start]Apply for leave through the system[cite: 168].

#### Delivery Management
* [cite_start]**For Delivery Personnel**: View assigned deliveries, access customer locations via Google Maps, and update delivery status to inform owner and customer[cite: 177, 178, 179]. [cite_start]Generate automatic delivery reports[cite: 180].
* [cite_start]**For Owners/Customers**: Owner can view a calendar of all deliveries for effective scheduling[cite: 181]. [cite_start]Customers can track their delivery status to know when their order will arrive[cite: 182].

### Technical Implementation Details

#### API Endpoints by Module
| Module | Routes File | Key Endpoints |
|--------|-------------|---------------|
| Orders | `orderRoutes.js` | POST /orders, GET /orders/:id, PUT /orders/:id/status |
| Inventory | `rawMaterials.js` | GET /materials, POST /materials, PUT /materials/:id |
| Finance | `finance.js` | GET /invoices, POST /invoices, GET /reports/financial |
| HR | `hr.js` | POST /attendance/clockin, POST /attendance/clockout, GET /employees |
| Delivery | `delivery.js` | GET /deliveries, PUT /deliveries/:id/status |
| Auth | `authRoutes.js` | POST /auth/login, POST /auth/register, GET /auth/google |

#### Database Models
| Model | File | Key Features |
|-------|------|--------------|
| Order | `Order.js` | Status tracking, customer info, design files |
| RawMaterials | `Raw_materials.js` | Stock levels, alerts, usage tracking |
| Finance | `Finance.js` | Income/expense ledger, automated calculations |
| HR | `HR.js` | Employee profiles, attendance, leave management |
| Delivery | `Delivery.js` | Route planning, status updates, GPS tracking |
| User | `User.js` | Authentication, roles, OAuth integration |

#### Business Logic Controllers
- `materialOrderController.js` - Handles inventory automation during order processing
- `rawMaterialController.js` - Manages stock levels and alerts
- `supplierController.js` - Supplier relationship management

### Auth
- Local: JWT issued on login / registration.
- Google OAuth: Passport strategy creates/links user then redirects with JWT.
- [cite_start]JWT (JSON Web Tokens) for authentication[cite: 424]

### Automation Features
- [cite_start]Automatic stock reduction when orders are placed[cite: 185]
- [cite_start]Automated invoice generation upon order confirmation[cite: 155]
- [cite_start]Automatic salary calculation based on attendance[cite: 158]
- [cite_start]Low-stock alerts for inventory management[cite: 186, 663]
- [cite_start]Automatic delivery report generation[cite: 180]

### Common Scripts
| Script | Purpose |
|--------|---------|
| seedAllData.js | Populate full sample dataset |
| seedBasicEmployee.js | Insert sample employee & attendance |
| test*.js | Ad hoc API test scripts |

### Error Handling
`errorHandler` middleware standardizes JSON responses `{ success: false, message, details }`.

### Environment
See root `README.md` for required variables.

### Testing
Initial Jest config present (`jest.config.js`); expand with unit tests for controllers & integration tests for routes.
