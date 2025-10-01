## Frontend (Next.js) Overview

[cite_start]Digital Printing Management System frontend implementing responsive user interface for automated printing business processes[cite: 130, 527, 553]. This Next.js application provides customer-facing and management interfaces for Order, Inventory, Finance, HR, Delivery, Dashboard and Auth workflows.

### Business Module Features
[cite_start]Designed to be responsive, working smoothly on PCs, tablets, and mobile phones[cite: 424, 425, 418]. This frontend consumes backend REST APIs and renders:

#### Customer Interface
- [cite_start]View sample products and request quotations[cite: 193, 194]
- [cite_start]Register, log in, and convert approved quotations into orders by uploading design files[cite: 195, 196]
- [cite_start]Real-time order status tracking[cite: 197]
- [cite_start]View shop location for pickup or delivery[cite: 198]
- [cite_start]Track delivery status to know when order will arrive[cite: 182]

#### Management Interface
- [cite_start]Order managers: Generate prices for quotations, approve/reject orders, update statuses, create sales trend reports[cite: 200, 201, 203, 205]
- [cite_start]Inventory managers: Add/update/remove raw materials, view stock dashboards, generate stock reports[cite: 184, 189, 190]
- [cite_start]Finance managers: View automated invoices, digital ledger, financial reports, real-time dashboard summaries[cite: 155, 156, 157, 160, 576]
- [cite_start]HR managers: Register/maintain employee profiles, record attendance, track leave, monitor performance[cite: 164, 166, 170]
- [cite_start]Owners: View delivery calendar for effective scheduling[cite: 181]

#### Staff Interface  
- [cite_start]Workers: Record raw materials used per order[cite: 188]
- [cite_start]Staff: View salary details, payslips, apply for leave[cite: 159, 168, 169]
- [cite_start]Delivery personnel: View assigned deliveries, access Google Maps locations, update delivery status, generate reports[cite: 177, 178, 179, 180]

### Tech Stack
- [cite_start]ReactJS front-end for the user interface[cite: 421]
- Next.js (App Router) framework
- [cite_start]Responsive design for PCs, tablets, and mobile phones[cite: 424, 425, 418]
- CSS Modules / Global styles (`globals.css`)
- PDF export utilities (`src/lib/pdfExport.js` / stylesheet)
- [cite_start]JWT (JSON Web Tokens) for authentication[cite: 424] + Google OAuth redirect handling

### Structure
- `src/app/` Route segments per module (orders, inventory, finance, hr, etc.)
- `src/components/` Shared UI (layout, form elements)
- `src/lib/` Utilities (pdfExport, generic helpers)
- `public/` Assets

### Auth Flow (Frontend Perspective)
1. Local login posts credentials; stores JWT + user in `localStorage`.
2. Google OAuth button redirects to backend `/api/auth/google`.
3. Callback returns token & user via query params; parsed and stored; user redirected to dashboard.

### Getting Started
```bash
npm install
npm run dev
```
Visit: http://localhost:3000

### Environment Assumptions
Backend runs at `http://localhost:5000` with CORS enabled for `http://localhost:3000`.

### Next Steps
- Implement protected client components that validate token freshness
- Add loading & error boundaries around data-heavy pages
- Introduce design system tokens for consistent spacing/typography

### Deployment
Standard Next.js build (`npm run build` / `npm start`) or Vercel deployment. Ensure environment variables and backend URL are configured in production.

