## Digital Printing Management System

### Overview
[cite_start]The Digital Printing Management System is designed to automate and streamline various manual processes of a printing business[cite: 130, 527, 553]. This comprehensive web application provides modular functionality covering Order, Inventory, Finance, HR, Delivery, Scheduling and Reporting workflows. The frontend (Next.js / React) and backend (Node.js / Express / MongoDB) communicate over REST APIs secured with JWT and OAuth authentication plus role-based authorization.

### Core Modules & Capabilities
* **Order Management**  
  [cite_start]**For Customers**: The system allows customers to view sample products, register and log in, request quotations, and convert approved quotations into orders by uploading their design files[cite: 193, 194, 195, 196]. [cite_start]They can also track their order status in real-time and view the shop's location for pickup or delivery[cite: 197, 198].  
  [cite_start]**For Managers**: Order managers can generate prices for quotations, approve or reject orders, update order statuses, and create reports on order volumes to analyze sales trends[cite: 200, 201, 203, 205].
* **Inventory Management**  
  [cite_start]**For Managers**: Add, update, and remove raw materials[cite: 184]. [cite_start]Automatically reduce stock levels when an order is placed and provide low-stock alerts[cite: 185, 186, 663]. [cite_start]Generate detailed stock reports and view a visual stock dashboard[cite: 189, 190].  
  [cite_start]**For Workers**: Record raw materials used per order for accurate inventory updates[cite: 188].
* **Finance Management**  
  [cite_start]Automates generation of invoices when an order is confirmed and maintains a digital ledger of income, expenses, and payments[cite: 155, 156, 576]. [cite_start]Automatically calculates staff salaries from attendance records[cite: 158]. [cite_start]Finance managers generate financial reports and view real-time dashboard summaries and cash flow[cite: 157, 160].
* **Human Resources (HR) Management**  
  [cite_start]**For Managers**: Register / maintain employee profiles, record attendance, track leave[cite: 164, 166]. [cite_start]Monitor performance and completed tasks[cite: 170].  
  [cite_start]**For Staff**: View salary details and payslips[cite: 159, 169]. [cite_start]Apply for leave[cite: 168].
* **Delivery Management**  
  [cite_start]**For Delivery Personnel**: View assigned deliveries, access customer locations via Google Maps, update delivery status, generate automatic delivery reports[cite: 177, 178, 179, 180].  
  [cite_start]**For Owners/Customers**: Owner views calendar of all deliveries[cite: 181]. Customers track delivery status[cite: 182].

### Technology & Architecture
[cite_start]The proposed system has a modular architecture[cite: 418]. [cite_start]It uses a **ReactJS** front-end for the user interface and a **Node.js** and **Express.js** back-end for handling API routes[cite: 421, 422]. [cite_start]**MongoDB** is used as the database to store all system data[cite: 423]. [cite_start]For security, it uses **JWT** (JSON Web Tokens) for authentication, and it is designed to be responsive, working smoothly on PCs, tablets, and mobile phones[cite: 424, 425, 418].

### Backend Structure (folder: `backend/`)
- `models/` Domain schemas (Orders, Users, Raw Materials, Finance, HR, etc.)
- `routes/` Express route modules per domain
- `controllers/` Business logic (materials, suppliers, orders)
- `middleware/` Auth (JWT), error handling
- `utils/` Helpers (async handler, ID generation)
- `server.js` / `app.js` bootstrap & middleware wiring
- `seed*.js` Data seeding scripts

### Frontend Structure (folder: `itp/`)
- `src/app/` Next.js App Router routes per module (dashboard, orders, inventory, finance, hr, etc.)
- `src/components/` Reusable UI & layout components
- `src/lib/` Utilities (PDF export, generic helpers)
- `public/` Static assets

### Authentication Flow
1. Local auth (register/login) returns JWT stored client-side.  
2. Google OAuth (Passport) performs external consent, backend generates JWT, redirects to frontend with token + user payload.  
3. Protected routes verify JWT; role-based checks (manager, staff, delivery) enforced at route/middleware level.

### Key Cross-Cutting Concerns
- Validation & Error Handling: Centralized middleware returns consistent JSON errors.
- Security: JWT, sessions only for OAuth handshake, CORS restricted to frontend origin.
- Reporting & Dashboards: Aggregations over Orders, Inventory, Finance, Delivery collections.
- Data Consistency: Inventory decremented atomically during order confirmation; attendance drives payroll calculations.

### Environment Variables (sample)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/itp
JWT_SECRET=replace_me
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SESSION_SECRET=replace_me_session
```

### Development
Backend: `cd backend && npm install && npm start`  
Frontend: `cd itp && npm install && npm run dev`  

### Next Steps / Roadmap
- Complete GitHub OAuth provider
- Add automated test coverage (Jest) for critical APIs
- Improve stock usage audit trails per order line item
- Add role management UI
- CI pipeline for lint/test/build

### License
Internal / educational project (license not specified yet).
