# jlabs-assessment-web

This is the frontend for the jlabs assessment project, built with React, Vite, and TailwindCSS.

## Prerequisites
- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- Backend API running (see ../jlabs-assessment-api)

## Setup Instructions

### 1. Clone the repository
```
git clone <repo-url>
cd jlabs-assessment-web
```

### 2. Install dependencies
```
npm install
```

### 3. Environment variables
- Copy `.env.example` to `.env` and update values as needed.
- Example:
  ```
  VITE_API_URL=http://localhost:8000
  ```
- Make sure this matches your backend API URL.

### 4. Start the development server
```
npm run dev
```
- The app will be available at `http://localhost:5173` by default.

## Project Structure
- `src/pages/` — Main pages (LoginPage.jsx, HomePage.jsx)
- `src/components/` — Reusable components (ProtectedRoute.jsx, etc.)
- `src/context/` — Context providers and hooks (AuthContext.jsx, ThemeContext.jsx, etc.)

## Features
- Login with backend API
- Protected routes (Home page only accessible after login)
- Geolocation and IP info display
- TailwindCSS for styling (via CDN in index.html)

## Troubleshooting
- Ensure the backend API is running and accessible.
- Check `.env` for correct API URL.
- If you change dependencies, re-run `npm install`.
- For any issues, check the browser console and terminal output for errors.

---

For Docker or production setup, see instructions in this README once available.
