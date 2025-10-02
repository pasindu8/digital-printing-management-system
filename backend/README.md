## Backend Overview

[cite_start]Digital Printing Management System backend implementing REST APIs for automated business processes[cite: 130, 527, 553]. Built with Express + Mongoose in a modular structure covering Order, Inventory, Finance, HR, and Delivery management.

### Key Business Modules

#### Order Management
* [cite_start]**For Customers**: View sample products, register and log in, request quotations, and convert approved quotations into orders by uploading design files[cite: 193, 194, 195, 196]. [cite_start]Track order status in real-time and view shop location for pickup or delivery[cite: 197, 198].
* [cite_start]**For Managers**: Generate prices for quotations, approve or reject orders, update order statuses, and create reports on order volumes to analyze sales trends[cite: 200, 201, 203, 205].

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
