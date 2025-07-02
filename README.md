# HeyJarvis - Autonomous Orchestration System

## Overview

HeyJarvis is an autonomous orchestration system designed to streamline sales, marketing, and engineering workflows through AI-powered automation. The application features conversational AI agents that replace traditional dashboards with intuitive chat interfaces.

## Features

### 🤖 AI Agents
- **Sales Agent**: Lead qualification, LinkedIn scraping, and outreach automation
- **Marketing Agent**: Competitor analysis, campaign optimization, and market intelligence
- **Engineering Agent**: Automated website generation, A/B testing, and technical optimization

### 🔧 Core Capabilities
- Real-time workflow orchestration with human-in-the-loop approvals
- LinkedIn credential storage for secure lead scraping
- AI-powered lead scoring using Anthropic Claude Sonnet 4
- Cross-domain workflow automation
- Real-time updates via WebSocket connections

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** + **shadcn/ui** for styling
- **Wouter** for routing
- **TanStack Query** for server state management
- **WebSocket** for real-time updates

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL
- **Anthropic Claude Sonnet 4** for AI capabilities
- **WebSocket server** for real-time communication
- **Service-oriented architecture**

### Database
- **PostgreSQL** (Neon serverless recommended)
- **Drizzle migrations** for schema management

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Anthropic API key

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd heyjarvis
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file with:
```env
DATABASE_URL=your_postgresql_connection_string
ANTHROPIC_API_KEY=your_anthropic_api_key
NODE_ENV=development
```

4. **Database Setup**
```bash
# Push schema to database
npm run db:push

# Optional: Open Drizzle Studio to inspect data
npm run db:studio
```

5. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and config
├── server/                 # Backend Express application
│   ├── services/           # Business logic services
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data access layer
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle database schema
└── components.json         # shadcn/ui configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:generate` - Generate migration files

## Agent Usage

### Sales Agent (`/sales-agent`)
- Lead qualification and scoring
- LinkedIn lead import (requires credentials)
- Automated outreach message generation
- CRM integration capabilities

### Marketing Agent (`/marketing-agent`)
- Competitor analysis and monitoring
- Campaign optimization recommendations
- Market intelligence insights
- Performance tracking

### Engineering Agent (`/engineering-agent`)
- Automated website generation
- A/B testing setup and analysis
- Technical performance optimization
- SEO and conversion optimization

## Configuration

### LinkedIn Integration
Users can securely add LinkedIn credentials through the Sales Agent interface:
1. Navigate to `/sales-agent`
2. Type "add LinkedIn credentials"
3. Fill out the secure form that appears

### Database Schema
The application uses the following main entities:
- **Users**: User accounts with LinkedIn credentials
- **Leads**: Imported prospects with scoring
- **Workflows**: Automated process definitions
- **Approvals**: Human-in-the-loop confirmations
- **Campaigns**: Marketing and outreach campaigns
- **Activities**: Audit log of system actions

### AI Services
All AI functionality uses Anthropic Claude Sonnet 4:
- Lead scoring and qualification
- Outreach message personalization
- Marketing insights generation
- Website content creation

## API Endpoints

### Core Routes
- `GET /api/dashboard/stats` - Dashboard metrics
- `GET /api/workflows/active` - Active workflows
- `GET /api/approvals/pending` - Pending approvals

### Agent Chat
- `POST /api/agents/sales/chat` - Sales agent conversation
- `POST /api/agents/marketing/chat` - Marketing agent conversation  
- `POST /api/agents/engineering/chat` - Engineering agent conversation

### User Management
- `POST /api/users/linkedin-credentials` - Store LinkedIn credentials

## Deployment

### Environment Variables (Production)
```env
DATABASE_URL=your_production_database_url
ANTHROPIC_API_KEY=your_anthropic_api_key
NODE_ENV=production
```

### Build Process
```bash
npm run build
```

### Recommended Platforms
- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Railway, Render, or any Node.js hosting
- **Database**: Neon, Supabase, or any PostgreSQL provider

## Security Notes

- LinkedIn credentials are stored in the database (encrypt in production)
- API keys are stored as environment variables
- All user inputs are validated using Zod schemas
- WebSocket connections are authenticated

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]

## Support

For questions or support, please [add your contact information or issue tracker link].