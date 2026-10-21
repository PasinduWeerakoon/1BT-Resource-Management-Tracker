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

## Running different environments

The app supports **dev**, **qa**, and **prod** (see `src/api/config.js` for API URLs).

### Local development (per env)

```bash
npm start          # Uses .env or default (dev)
npm run start:dev  # Dev API
npm run start:qa   # QA API
npm run start:prod # Prod API
```

### Build for a specific env

```bash
npm run build        # Production build (uses .env or dev)
npm run build:dev    # Build with dev API URL
npm run build:qa     # Build with QA API URL
npm run build:prod   # Build with prod API URL
```

## Deployment (S3 + CloudFront)

**One script for all environments.** The same `deploy.sh` deploys dev, qa, or prod. Build and deploy target both use the same env (from `config.js`: dev → dev API, qa → QA API, prod → prod API).

### Prerequisites

- AWS CLI: `aws configure --profile rmproject`
- Run from the **frontend** directory

### Deploy (single script)

```bash
cd frontend

./deploy.sh              # Deploy dev (default)
./deploy.sh qa            # Deploy QA
./deploy.sh prod          # Deploy prod

# Or use REACT_APP_ENV (same as passing the arg):
REACT_APP_ENV=qa ./deploy.sh    # Build + deploy for QA
REACT_APP_ENV=prod ./deploy.sh # Build + deploy for prod
```

Each env has its own stack (`rm-frontend-dev-stack`, `rm-frontend-qa-stack`, `rm-frontend-prod-stack`), so all can be deployed at once.

### Override API URL

To use a custom API URL instead of the dev/qa/prod URLs in `config.js`:

```bash
REACT_APP_API_BASE_URL=https://your-api.example.com/api/v1 ./deploy.sh dev
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
