# Resource Management System - Frontend

React application for Resource Management System built with Webpack and Ant Design.

## Tech Stack

- **React** 18.2.0
- **Webpack** 5.89.0
- **Ant Design** 5.12.0
- **Redux Toolkit** 2.0.1
- **React Router** 6.20.0
- **SCSS** for styling

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── assets/          # Static assets (images, fonts, etc.)
│   ├── components/      # Reusable components
│   ├── configs/         # Configuration files
│   ├── layouts/         # Layout components (Header, Footer, Sidebar, MainLayout)
│   ├── navigation/      # Navigation configuration
│   ├── pages/           # Page components
│   ├── redux/           # Redux store and slices
│   ├── routes/          # Route configuration and guards
│   ├── styles/          # SCSS styles
│   ├── utils/           # Utility functions
│   ├── languages/       # Language/i18n files
│   ├── App.js           # Main App component
│   └── index.js          # Entry point
├── webpack.config.js    # Webpack configuration
├── package.json
└── README.md
```

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm start
```

The application will start on `http://localhost:3000`

## Build

```bash
npm run build
```

## Sample Login Credentials

- **Super Admin**: `superadmin` / `superadmin123`
- **Admin**: `admin` / `admin123`
- **User**: `user` / `user123`

## Features

- ✅ Authentication with role-based access
- ✅ Responsive layout with collapsible sidebar
- ✅ Fixed header and footer
- ✅ Role-based navigation menu
- ✅ Redux state management
- ✅ SCSS styling
- ✅ Mobile responsive design

## Layout Structure

- **Header**: Fixed at top, contains logo and user menu
- **Sidebar**: Collapsible, contains navigation menu
- **Footer**: Fixed at bottom
- **Main Content**: Scrollable area between header and footer
