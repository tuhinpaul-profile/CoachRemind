# Student Management System

## Overview

This is a comprehensive coaching center management system built as a full-stack web application. The system provides complete functionality for managing students, tracking attendance, handling fee payments, generating reports, and automated notifications. It features an AI-powered chatbot for administrative assistance and includes robust data visualization capabilities.

The application is designed for coaching centers and educational institutions to streamline their administrative operations, improve student tracking, and enhance communication with students and parents through automated notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing without the overhead of React Router
- **UI Framework**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design system variables and violet theme colors
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API development
- **Language**: TypeScript for type safety across the entire stack
- **Database ORM**: Drizzle ORM configured for PostgreSQL with type-safe database operations
- **Development**: TSX for TypeScript execution in development mode
- **Production**: ESBuild for server bundling and deployment optimization

### Data Storage Solutions
- **Primary Database**: PostgreSQL using Neon Database serverless infrastructure
- **ORM**: Drizzle ORM with Zod integration for schema validation and type generation
- **Local Storage**: Browser localStorage for client-side data persistence and offline capabilities
- **In-Memory Storage**: Fallback memory storage implementation for development and testing

### Authentication and Authorization
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple
- **User Model**: Basic user schema with username/password authentication
- **Security**: Express session handling with secure cookie configuration

### External Service Integrations
- **Email Service**: EmailJS integration for automated notifications and communication
- **AI Chatbot**: Advanced OpenAI GPT-4o server-side integration with security controls to prevent fee information disclosure while providing comprehensive student and attendance assistance
- **PDF Generation**: jsPDF for generating attendance and fee reports
- **Excel Export**: XLSX library for spreadsheet generation and data export
- **Charts**: Custom canvas-based charting implementation for attendance and fee visualization

### Component Architecture
- **Layout Components**: Responsive sidebar navigation and header with notification system
- **Modal System**: Reusable modal components for adding students, fees, and custom messages
- **Chart Components**: Custom data visualization components for attendance trends and fee collection
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Development and Deployment
- **Package Management**: npm with comprehensive dependency management
- **Development Server**: Vite dev server with Replit-specific plugins and error handling
- **Production Build**: Optimized client and server bundles with static asset management
- **Environment Configuration**: Support for development, production, and Replit environments

### Data Flow Architecture
- **Client-Server Communication**: RESTful API endpoints with JSON data exchange
- **Real-time Updates**: Polling-based notification system with automatic refresh intervals
- **Offline Capability**: Local storage fallback for core functionality when offline
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages

The system follows a modular architecture pattern with clear separation of concerns between frontend presentation, backend business logic, and data persistence layers. The use of TypeScript throughout ensures type safety and better developer experience, while the integration of modern tools like Drizzle ORM and TanStack Query provides efficient data management and caching capabilities.