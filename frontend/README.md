
# K6 Performance Dashboard - Frontend

Professional React + TypeScript frontend application for K6 performance testing dashboard with Clean Architecture principles.

## 🚀 Features

- **Modern Tech Stack**: React 18 + TypeScript + Vite
- **State Management**: Redux Toolkit + Redux-Saga
- **Real-time Communication**: Socket.IO for live test execution
- **Component Architecture**: Atomic Design (Atoms → Molecules → Organisms → Templates → Pages)
- **Styling**: SCSS with design system approach
- **Performance**: Lazy loading, memoization, code splitting
- **Type Safety**: Full TypeScript coverage with strict mode

## 📱 UI Components

### Dashboard
- **Performance Metrics**: Real-time cards showing health status, requests, response times, error rates
- **Interactive Charts**: Bar charts, line charts, pie charts using Recharts
- **Test Analysis**: Selected test run analysis with PDF report generation
- **Performance Summary**: Tabular view of test results

### Test Results
- **Test Selection**: Dropdown for selecting individual or sequential test runs
- **Tabbed Interface**: Navigation between multiple tests in sequential runs
- **Detailed Metrics**: HTTP request details, checks, pass/fail rates
- **Export Functionality**: PDF export for detailed reports

### Test Runner
- **Repository Management**: Git repository import, sync, and removal
- **Environment Selection**: PROD/DEV environment switching
- **Test Configuration**: Test selection, profile selection (LIGHT/MEDIUM/HEAVY)
- **Live Terminal**: Real-time test execution output with WebSocket connection
- **Token Management**: Custom authorization token support

## 🏗️ Architecture

### Atomic Design Structure
```
src/components/
├── atoms/           # Basic UI elements (Button, Card, Input)
├── molecules/       # Simple combinations (MetricCard, FormField)
├── organisms/       # Complex components (Sidebar, Terminal, Charts)
├── templates/       # Page layouts
└── pages/          # Complete pages (Dashboard, TestResults, TestRunner)
```

### State Management
- **Redux Toolkit**: Modern Redux with minimal boilerplate
- **Redux-Saga**: Side effect management for async operations
- **Slices**: Feature-based state organization
- **Type Safety**: Full TypeScript integration

### Folder Structure
```
frontend/
├── src/
│   ├── components/     # UI components (Atomic Design)
│   ├── pages/         # Page components
│   ├── store/         # Redux store, slices, sagas
│   ├── services/      # API services and external integrations
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── hooks/         # Custom React hooks
│   └── styles/        # Global styles and SCSS variables
├── public/           # Static assets
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── vite.config.ts    # Vite build configuration
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Access the application**
```
http://localhost:5000
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🔧 Configuration

### Environment Variables
Create `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4000
```

### API Integration
The frontend connects to the backend API running on port 4000:
- REST API: `http://localhost:4000/api`
- WebSocket: `http://localhost:4000` (for real-time terminal)

## 📊 Key Features Implementation

### Real-time Terminal
- WebSocket connection for live test execution output
- Auto-scroll functionality
- Connection status indicators
- Output clearing and connection reset

### Chart Visualization
- Recharts library for interactive charts
- Bar charts for response time comparison
- Line charts for performance trends
- Pie charts for success/error rates

### State Management
- Redux Toolkit for predictable state updates
- Redux-Saga for complex async flows
- Normalized state structure
- Optimistic updates for better UX

### Performance Optimizations
- React.memo for component memoization
- useMemo and useCallback for expensive calculations
- Lazy loading for route-based code splitting
- Efficient re-rendering with proper dependency arrays

## 🎨 Design System

### Colors
- Primary: `#3b82f6` (Blue)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Orange)
- Danger: `#ef4444` (Red)
- Gray scale: `#f9fafb` to `#111827`

### Typography
- Font Family: Inter
- Headings: 600 weight
- Body: 400 weight
- Small text: 0.875rem

### Spacing
- Base unit: 0.25rem (4px)
- Scale: 0.25, 0.5, 1, 1.5, 2, 3rem

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Deployment Options
- **Static Hosting**: Deploy `dist/` folder to any static hosting service
- **Replit**: Deploy directly on Replit platform
- **Docker**: Use provided Dockerfile for containerized deployment

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Component Testing
- Jest for unit testing
- React Testing Library for component testing
- Mock service workers for API mocking

## 📝 Contributing

1. Follow Atomic Design principles for component structure
2. Use TypeScript for all new code
3. Follow ESLint rules and formatting
4. Write tests for new components and features
5. Update documentation for significant changes

## 🔗 Integration with Backend

The frontend is designed to work seamlessly with the K6 Dashboard backend:
- **API Endpoints**: Connects to all backend REST endpoints
- **WebSocket**: Real-time communication for test execution
- **File Structure**: Mirrors backend domain structure
- **Type Safety**: Shared TypeScript interfaces

## 📈 Performance Monitoring

- Bundle size optimization with Vite
- Runtime performance monitoring
- Core Web Vitals tracking
- Efficient state updates and re-renders
