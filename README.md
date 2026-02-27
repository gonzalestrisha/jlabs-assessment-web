# jlabs-assessment-web

This is the frontend for the jlabs assessment project, built with React, Vite, and TailwindCSS.

## Prerequisites
- Node.js v24.14.0
- npm (comes with Node.js)
- Backend API running (see ../jlabs-assessment-api)

## Project Structure
```
jlabs-assessment-web/
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── nginx.conf
├── package.json
├── README.md
├── vite.config.js
├── public/
├── src/
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── assets/
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   ├── useAuth.js
│   │   └── useTheme.js
│   └── pages/
│       ├── HomePage.jsx
│       └── LoginPage.jsx
```
- `src/pages/` — Main pages (LoginPage.jsx, HomePage.jsx)
- `src/components/` — Reusable components (ProtectedRoute.jsx, etc.)
- `src/context/` — Context providers and hooks (AuthContext.jsx, ThemeContext.jsx, etc.)

## Setup Instructions

### 1. Clone the repository
```
git clone https://github.com/gonzalestrisha/jlabs-assessment-web
cd jlabs-assessment-web
```

### 2. Install dependencies
```
npm install
```

### 3. Environment variables
`.env` file
  ```
  VITE_API_URL=http://localhost:8000
  ```

### 4. Start the development server
```
npm run dev
```
- The app will be available at `http://localhost:5173` by default.

## Features
- Login with backend API
- Protected routes (Home page only accessible after login)
- Geolocation and IP info display
- TailwindCSS for styling (via CDN in index.html)

## Troubleshooting
- Ensure the backend API is running and accessible.
- For any issues, check the browser console and terminal output for errors.
