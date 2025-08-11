# Replit.md

## Overview

This is an academic study application designed to help users create Anki flashcards from PDF documents. The application features a split-screen interface where users can view PDFs on one side and create flashcards on the other. Users can select areas from PDFs to capture as images and embed them into their flashcards, making it ideal for studying visual content like diagrams, charts, and text excerpts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with a custom academic-themed design system
- **State Management**: React Query (@tanstack/react-query) for server state management
- **Routing**: Wouter for client-side routing
- **Layout**: Split-screen design using react-resizable-panels for adjustable panes

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with `/api` prefix routing
- **Development**: Hot module replacement with Vite in development mode
- **Build**: ESBuild for server bundling, Vite for client bundling

### Data Storage Solutions
- **Database**: PostgreSQL configured with Drizzle ORM
- **Schema**: Shared schema definitions between client and server
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Neon Database serverless PostgreSQL driver
- **Fallback**: In-memory storage implementation for development

### PDF and Image Processing
- **PDF Rendering**: react-pdf library with PDF.js worker for client-side PDF rendering
- **Image Capture**: Canvas-based area selection for capturing PDF regions
- **File Handling**: Client-side file upload and processing

### Component Architecture
- **Split Layout**: Resizable panel system with PDF viewer and flashcard creator
- **PDF Viewer**: Includes zoom controls, page navigation, and area selection tools
- **Flashcard Creator**: Form-based interface for creating front/back content with image embedding
- **UI Components**: Comprehensive component library including forms, dialogs, toasts, and data tables

### Authentication and Authorization
- **Current State**: Basic user schema defined but authentication not yet implemented
- **Schema**: Users table with username/password fields ready for auth implementation

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **react-pdf**: PDF rendering and manipulation
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL connection driver

### UI and Styling Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library
- **react-resizable-panels**: Split pane layout system

### Form and Validation Dependencies
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Schema validation (via drizzle-zod)

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **esbuild**: Fast JavaScript bundler for server code
- **drizzle-kit**: Database migration and introspection tools

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling integration