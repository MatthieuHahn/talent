# Copilot Instructions for Talent Project

## Project Overview

<!-- Describe the main purpose and type of project (web app, API, library, etc.) -->

This is a webapp focused on building an AI Recruiting CRM for Agencies and Companies.
The frontend is built with Next.js and Tailwind CSS, while the backend leverages NestJs and Express.
The frontend should use components as much as possible to ensure consistency and reusability across the application.
The backend follows a modular architecture, with each module encapsulating specific functionality and services.
The backend and the frontend communicate via RESTful APIs, ensuring a clear separation of concerns and scalability.
We'll have a single repository for both the frontend and backend code, organized into separate directories for clarity.
We'll use yarn workspaces to manage dependencies efficiently across the monorepo.

## Architecture & Structure

<!-- Update these sections as your project develops -->

### Key Directories

- `apps/frontend/` - Next.js frontend application with Tailwind CSS
- `apps/backend/` - NestJS backend API with Express
- `packages/` - Shared packages and utilities (future use)
- `.github/` - GitHub workflows and configurations
- `node_modules/` - Dependencies managed by yarn workspaces

### Core Components

- **Frontend App** (`apps/frontend/`) - Next.js 15 with App Router, TypeScript, and Tailwind CSS v4
- **Backend API** (`apps/backend/`) - NestJS application with Express, runs on port 3001
- **Shared Types** (`packages/` - future) - Common TypeScript interfaces and utilities

## Development Workflows

### Getting Started

```bash
# Install dependencies
yarn install

# Start both frontend and backend in development
yarn dev

# Or start them individually
yarn frontend dev  # Frontend on http://localhost:3000
yarn backend start:dev  # Backend on http://localhost:3001
```

### Common Commands

```bash
# Build all projects
yarn build

# Run tests across all workspaces
yarn test

# Lint all projects
yarn lint

# Clean all build artifacts and node_modules
yarn clean

# Work with specific workspace
yarn frontend build
yarn backend test
```

### Testing Strategy

- **Frontend**: Jest + Testing Library (React components and hooks)
- **Backend**: Jest + Supertest (unit and e2e tests)
- **Test commands**: `yarn test` (all) or `yarn frontend test` / `yarn backend test`
- **Coverage**: `yarn backend test:cov` for backend coverage reports

## Coding Conventions

### File Organization

- **Frontend**: App Router structure (`app/` directory), components in `components/`
- **Backend**: Modular architecture with feature-based modules
- **Naming**: PascalCase for components, camelCase for functions, kebab-case for files

### Code Patterns

- **Frontend**: Use React Server Components by default, Client Components when needed
- **Backend**: Controller → Service → Repository pattern, use DTOs for data validation
- **Shared**: Export interfaces from workspace packages when needed

### Dependencies & Integration

- **Communication**: RESTful APIs between frontend (port 3000) and backend (port 3001)
- **Styling**: Tailwind CSS v4 with custom design system components
- **State Management**: React built-in state + Server Actions (add external state manager if needed)
- **Database**: PostgreSQL (when added), use TypeORM or Prisma
- **Authentication**: JWT-based (to be implemented)

## Important Notes

- **Monorepo**: Use yarn workspaces - install dependencies at workspace level when possible
- **Ports**: Frontend (3000), Backend (3001) - backend has CORS enabled for frontend
- **Environment**: Copy `.env.example` to `.env` and configure as needed
- **Development**: Both apps auto-reload on changes, backend includes basic CORS setup
- **Architecture**: Keep frontend and backend loosely coupled, design APIs first

---

_Update this file as the project evolves to keep AI agents informed of current patterns and practices._
