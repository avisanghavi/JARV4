# Development Guide

## Getting Started

### Local Development Setup

1. **Clone and Install**
```bash
git clone <your-repo>
cd heyjarvis
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Database Setup**
```bash
# Create database (if using local PostgreSQL)
createdb heyjarvis

# Push schema to database
npm run db:push

# Optional: View database in Drizzle Studio
npm run db:studio
```

4. **Start Development**
```bash
npm run dev
```

## Architecture

### Frontend Structure
```
client/src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── chat-interface.tsx  # Main chat component
│   ├── sidebar.tsx         # Navigation sidebar
│   └── linkedin-credentials-form.tsx
├── pages/                  # Route components
│   ├── dashboard.tsx
│   ├── sales-agent.tsx     # Conversational sales interface
│   ├── marketing-agent.tsx # Conversational marketing interface
│   └── engineering-agent.tsx # Conversational engineering interface
├── hooks/
│   ├── use-toast.ts        # Toast notifications
│   └── use-websocket.ts    # Real-time updates
└── lib/
    ├── queryClient.ts      # TanStack Query setup
    └── utils.ts            # Utilities
```

### Backend Structure
```
server/
├── services/
│   ├── openai.ts           # Anthropic Claude integration
│   ├── leadScoring.ts      # AI lead scoring
│   └── orchestration.ts   # Workflow automation
├── routes.ts               # API endpoints
├── storage.ts              # Data access layer
├── index.ts                # Server entry point
└── vite.ts                 # Development server setup
```

### Database Schema
```
shared/schema.ts            # Drizzle ORM schema
├── users                   # User accounts + LinkedIn credentials
├── leads                   # Imported prospects
├── workflows               # Automation definitions
├── approvals               # Human-in-the-loop approvals
├── outreachCampaigns      # Sales campaigns
├── marketingCampaigns     # Marketing campaigns
├── generatedSites         # Engineering outputs
└── activities             # Audit log
```

## Key Features

### AI Agent System
- **Conversational Interface**: Chat-based interaction instead of traditional forms
- **Domain Specialization**: Separate agents for Sales, Marketing, and Engineering
- **Context Awareness**: Agents understand user intent and provide relevant responses
- **Fallback Handling**: Graceful degradation when AI services are unavailable

### Real-time Features
- **WebSocket Integration**: Live updates for workflows and approvals
- **Progress Tracking**: Real-time workflow progress monitoring
- **Notifications**: Instant alerts for important events

### Security & Authentication
- **Credential Storage**: Secure LinkedIn credential management
- **API Key Management**: Environment-based secret handling
- **Input Validation**: Zod schema validation on all inputs

## Development Workflow

### Adding New Features

1. **Database Changes**
```bash
# Update shared/schema.ts
# Generate migration
npm run db:generate
# Apply changes
npm run db:push
```

2. **API Endpoints**
```bash
# Add routes in server/routes.ts
# Update storage layer in server/storage.ts
# Add service logic in server/services/
```

3. **Frontend Integration**
```bash
# Create/update page components
# Add API calls using TanStack Query
# Update navigation in sidebar.tsx
```

### Testing

#### Manual Testing
- Test each agent at `/sales-agent`, `/marketing-agent`, `/engineering-agent`
- Verify real-time updates work across browser tabs
- Test LinkedIn credential storage flow
- Validate all API endpoints with curl

#### API Testing Examples
```bash
# Test agent chat
curl -X POST http://localhost:5173/api/agents/sales/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Help me with lead qualification"}'

# Test dashboard stats
curl http://localhost:5173/api/dashboard/stats

# Test LinkedIn credentials
curl -X POST http://localhost:5000/api/users/linkedin-credentials \
  -H "Content-Type: application/json" \
  -d '{"linkedinEmail":"test@example.com","linkedinPassword":"password"}'
```

## Common Issues & Solutions

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string format
# postgresql://username:password@host:port/database
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

### API Key Issues
```bash
# Verify environment variables are loaded
echo $ANTHROPIC_API_KEY

# Check .env file exists and has correct format
cat .env
```

## Performance Optimization

### Frontend
- Components are optimized with React.memo where appropriate
- TanStack Query handles caching and background updates
- Vite provides fast development builds

### Backend
- Express middleware for efficient request handling
- Connection pooling for database operations
- WebSocket optimization for real-time features

### Database
- Proper indexing on frequently queried fields
- Efficient queries using Drizzle ORM
- Connection pooling for concurrent requests

## Deployment Considerations

### Environment Variables
```bash
# Production environment should include:
DATABASE_URL=          # Production database
ANTHROPIC_API_KEY=     # Production API key
NODE_ENV=production    # Production mode
```

### Build Process
```bash
# Frontend build
npm run build

# Server runs from TypeScript files in production
# Use tsx for production deployment or compile to JavaScript
```

### Database Migrations
```bash
# Always backup before migrations
pg_dump $DATABASE_URL > backup.sql

# Apply schema changes
npm run db:push
```

## Monitoring & Logging

### Application Logs
- Express middleware logs all requests
- Error handling with proper status codes
- WebSocket connection logging

### Database Monitoring
- Drizzle Studio for development: `npm run db:studio`
- Query performance monitoring in production
- Connection pool monitoring

### AI Service Monitoring
- Anthropic API usage tracking
- Fallback activation monitoring
- Response time tracking

## Contributing Guidelines

1. **Code Style**
   - Use TypeScript for all new code
   - Follow existing naming conventions
   - Add proper error handling

2. **Database Changes**
   - Always update schema.ts first
   - Test migrations on development data
   - Document breaking changes

3. **API Changes**
   - Maintain backward compatibility
   - Update relevant frontend components
   - Add proper validation

4. **Testing**
   - Test all agent interfaces manually
   - Verify real-time features work
   - Test error scenarios