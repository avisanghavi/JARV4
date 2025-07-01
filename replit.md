# HeyJarvis - Autonomous Orchestration System

## Overview

HeyJarvis is an autonomous orchestration system designed to streamline sales, marketing, and engineering workflows through AI-powered automation. The application follows a modern full-stack architecture with React frontend, Express.js backend, and PostgreSQL database, built with a focus on real-time communication and intelligent workflow automation.

## System Architecture

The application is structured as a monolithic full-stack application with the following key architectural decisions:

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern development experience
- **Vite** as the build tool for fast development and optimized production builds
- **Tailwind CSS** with shadcn/ui components for consistent, modern UI design
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **WebSocket integration** for real-time updates and notifications

### Backend Architecture
- **Express.js** server with TypeScript for API endpoints and middleware
- **WebSocket server** using 'ws' library for real-time communication
- **Drizzle ORM** for type-safe database operations with PostgreSQL
- **Service-oriented architecture** with separate services for AI operations, lead scoring, and orchestration
- **RESTful API design** with proper error handling and logging middleware

### Database Architecture
- **PostgreSQL** as the primary database with Neon serverless hosting
- **Drizzle ORM** with schema-first approach for type safety
- **Database tables** designed for multi-domain operations:
  - Users, leads, workflows, approvals
  - Outreach campaigns, marketing campaigns, generated sites
  - Activity tracking and audit logging

## Key Components

### 1. Domain-Driven Structure
The application is organized around three main business domains:
- **Sales Domain**: Lead import, scoring, and outreach automation
- **Marketing Domain**: Competitor intelligence and campaign optimization
- **Engineering Domain**: Automated site generation and A/B testing

### 2. Workflow Orchestration Engine
- Cross-domain workflow automation with human-in-the-loop approvals
- Real-time workflow progress tracking and status updates
- Configurable workflow steps with progress monitoring
- Automated triggers based on business events

### 3. AI Integration Layer
- Anthropic Claude Sonnet 4 integration for lead scoring and content generation
- Intelligent lead prioritization based on multiple factors
- Automated outreach message personalization
- Fallback mechanisms for AI service unavailability

### 4. Real-time Communication
- WebSocket connections for live dashboard updates
- Instant notifications for workflow completions and approvals
- Real-time progress tracking for long-running operations

## Data Flow

1. **Lead Import**: Data imported from LinkedIn, CSV files, or CRM systems
2. **AI Processing**: Leads automatically scored using OpenAI integration
3. **Human Approval**: High-value leads flagged for manual review
4. **Orchestration**: Approved leads trigger automated outreach workflows
5. **Real-time Updates**: Progress broadcasted to all connected clients via WebSocket

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **Anthropic Claude**: AI-powered lead scoring and content generation
- **@radix-ui components**: Accessible UI component primitives
- **@tanstack/react-query**: Server state management

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **Drizzle Kit**: Database schema migrations and management

## Deployment Strategy

The application is designed for cloud deployment with the following considerations:

### Production Environment
- **Frontend**: Static build served via CDN or static hosting
- **Backend**: Node.js server deployed on cloud platforms (Vercel, Railway, etc.)
- **Database**: Neon PostgreSQL serverless database
- **Real-time**: WebSocket connections maintained through server instances

### Development Environment
- **Vite dev server** for frontend with hot module replacement
- **tsx** for TypeScript execution in development
- **Database migrations** managed through Drizzle Kit
- **Environment-based configuration** for different deployment stages

### Build Process
- **Frontend build**: Vite compiles React app to static assets
- **Backend build**: esbuild bundles server code for production
- **Database setup**: Automatic schema deployment via Drizzle migrations

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 01, 2025. Initial setup
- July 01, 2025. Switched AI service from OpenAI to Anthropic Claude Sonnet 4 for all lead scoring, outreach generation, marketing insights, and website content creation