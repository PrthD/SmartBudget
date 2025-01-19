# <img src="https://github.com/PrthD/SmartBudget/blob/main/frontend/src/assets/icons/smartbudget-icon.png" width="50" alt="SmartBudget Icon" align="left" /> SmartBudget

[![React Version](https://img.shields.io/badge/React-18.3.1-blue?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas/database)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

SmartBudget is a powerful, user-friendly web application that helps individuals manage their expenses, set financial goals, and track savings—all in one place. Built with a modern MERN stack, it delivers a polished UI and real-time data handling for seamless budgeting.

## Key Features

- **Expense Tracking**: Add, edit, and delete expenses with support for recurring entries.
- **Income Management**: Manage multiple income sources, set income goals, and track performance.
- **Budget Setting**: Configure category-based budgets with custom intervals (weekly, monthly, etc.).
- **Savings & Goals**: Allocate savings ratios, set deadlines, and monitor progress toward specific goals.
- **Responsive UI**: A sleek interface optimized for both desktop and mobile views.
- **Profile Customization**: Upload profile photos, update personal info, and secure your account with JWT authentication.

## Technology Stack

| Layer        | Tech / Tools                                        |
| ------------ | --------------------------------------------------- |
| **Frontend** | React, Axios, React Router, CSS/SCSS                |
| **Backend**  | Node.js, Express.js, Helmet, Morgan                 |
| **Database** | MongoDB Atlas                                       |
| **APIs**     | RESTful endpoints (Express routes), JSON Web Tokens |
| **Hosting**  | - **Backend** on [Render](https://render.com/)      |
|              | - **Frontend** on [Render](https://render.com/)     |

## Live Demo

**Visit:** [SmartBudget](https://smartbudget.me)

> The app is fully deployed. Feel free to explore and test.

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **npm** or **yarn**
- A **MongoDB Atlas** database (or local MongoDB instance)

### Installation & Setup

1. **Clone** this repository:

   ```bash
   git clone https://github.com/PrthD/SmartBudget.git
   cd smartbudget
   ```

2. **Install** dependencies in both **frontend** and **backend** folders:

   ```bash
   # In project root
   cd frontend
   npm install
   # or yarn install

   cd ../backend
   npm install
   # or yarn install
   ```

3. **Environment Variables**: In the `backend/.env`, set:

   ```env
   PORT=5000
   MONGODB_URI=YOUR_MONGODB_ATLAS_URL
   JWT_SECRET=YOUR_SECRET_KEY
   ```

   In the `frontend/.env`, set:

   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

   Adjust these as needed for production vs. local dev.

4. **Run** the backend server:

   ```bash
   cd backend
   npm run dev
   # Runs on http://localhost:5000
   ```

5. **Run** the frontend dev server:
   ```bash
   cd frontend
   npm start
   # Runs on http://localhost:3000
   ```

### Deployment

- The **backend** is deployed on Render at: `https://smartbudget-backend.onrender.com`
- The **frontend** is deployed on Render at: `https://smartbudget-frontend.onrender.com`

To replicate this:

1. Create an account on [Render](https://render.com/).
2. Deploy each folder (backend, frontend) as separate web services.
3. Update environment variables on Render for both services.
4. Reference the correct `REACT_APP_API_URL` in the frontend `.env`.

## Screenshots

_(Optional) Insert some screenshots or GIFs here._

![SmartBudget Dashboard Screenshot](YOUR_SCREENSHOT.png)

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you would like to change.

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <sub><strong>SmartBudget</strong> – Helping you manage and grow your finances, one step at a time.</sub>
</p>
