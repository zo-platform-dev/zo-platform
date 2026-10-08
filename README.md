# ZO Platform

<div align="center">

![ZO Platform](https://img.shields.io/badge/ZO-Platform-black?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?style=for-the-badge&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**A Powerful Self-Hosted Web Scraping & Automation Platform**

Alternative to Apify • n8n Integration • Bilingual UI (Arabic/English) • Free Hosting Compatible

</div>

---

## 🌟 Features

### Core Functionality
- **🕷️ Web Scraping Engine**
  - Multiple methods: Puppeteer, Playwright, Cheerio, Axios
  - JavaScript rendering capability
  - Proxy rotation support
  - CAPTCHA handling options
  - Rate limiting & anti-bot detection

- **⚙️ Automation Workflows**
  - Create, schedule, and run automated tasks
  - Support for multiple data sources
  - Custom JavaScript/Python code execution
  - Task monitoring and logs

- **📊 Data Processing**
  - Clean and transform scraped data
  - Export formats: JSON, CSV, Excel, XML
  - Data validation and quality checks
  - Automatic daily data refresh

- **📅 Task Management**
  - Schedule recurring tasks (cron-based)
  - Manual task triggers
  - Error handling and retry mechanisms
  - Task monitoring and logs

### Integration
- **🔗 n8n Integration**
  - Complete REST API for n8n workflows
  - Webhook support for real-time notifications
  - API documentation (OpenAPI/Swagger)
  - OAuth2 and API key authentication

### User Interface
- **🎨 Minimalist Black & White Design**
  - Clean, modern interface
  - Responsive design (mobile-first)
  - Fast loading times

- **🌍 Bilingual Support**
  - English (LTR) & Arabic (RTL)
  - Language switcher
  - Full translation support

### Data Freshness
- **🔄 Automatic Data Updates**
  - Daily refresh mechanism
  - Data validation pipeline
  - Version control for scraped data
  - Comparison with previous scrapes

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 7.0+
- Redis 7.0+
- Docker & Docker Compose (optional)

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/zo-platform.git
cd zo-platform
```

#### 2. Install dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zo-platform
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
API_KEY_SECRET=your-api-key-secret
FRONTEND_URL=http://localhost:3000
```

#### 4. Start the application

```bash
# Start all services (backend + frontend)
npm run dev

# Or start separately:
# Backend
npm run dev:backend

# Frontend
npm run dev:frontend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

---

## 🐳 Docker Installation

### Using Docker Compose (Recommended)

```bash
# Create .env file with your settings
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services included:
- MongoDB (port 27017)
- Redis (port 6379)
- Backend API (port 5000)
- Frontend (port 3000)

---

## 📚 Documentation

### API Documentation

Once the server is running, visit http://localhost:5000/api-docs for interactive API documentation.

### Key API Endpoints

#### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login - Login
GET  /api/auth/me - Get current user
```

#### Tasks
```
GET    /api/tasks - List all tasks
POST   /api/tasks - Create new task
GET    /api/tasks/:id - Get task details
PUT    /api/tasks/:id - Update task
DELETE /api/tasks/:id - Delete task
POST   /api/tasks/:id/run - Run task
GET    /api/tasks/:id/results - Get task results
```

#### Templates
```
GET  /api/templates - List all templates
POST /api/templates - Create template
GET  /api/templates/:id - Get template
POST /api/templates/:id/use - Create task from template
```

#### API Keys
```
GET    /api/api-keys - List API keys
POST   /api/api-keys - Create API key
DELETE /api/api-keys/:id - Delete API key
PUT    /api/api-keys/:id/rotate - Rotate API key
```

---

## 🔗 n8n Integration

### Setup n8n Integration

1. **Generate API Key** in ZO Platform (Settings > API Keys)
2. **Configure n8n HTTP Request Node**:
   - URL: `http://your-zo-platform.com/api/tasks`
   - Authentication: Bearer Token
   - Token: Your API Key

### Example n8n Workflow

```json
{
  "nodes": [
    {
      "parameters": {
        "url": "http://localhost:5000/api/tasks",
        "authentication": "headerAuth",
        "method": "POST",
        "body": {
          "name": "Daily News Scrape",
          "type": "scrape",
          "method": "cheerio",
          "config": {
            "url": "https://example.com",
            "selectors": {
              "title": ".article-title",
              "content": ".article-content"
            }
          }
        }
      },
      "name": "Create Scraping Task",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}
```

### Webhook Notifications

Configure webhooks in ZO Platform to receive notifications:

```javascript
// n8n Webhook Node
{
  "path": "zo-webhook",
  "method": "POST"
}
```

---

## ☁️ Deployment

### Free Hosting Options

#### Railway.app (Recommended)

1. Fork this repository
2. Create new project on Railway
3. Connect GitHub repository
4. Add MongoDB and Redis services
5. Set environment variables
6. Deploy

#### Render.com

```yaml
# render.yaml
services:
  - type: web
    name: zo-platform
    env: node
    buildCommand: npm install && cd frontend && npm install && npm run build
    startCommand: node backend/server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        fromDatabase:
          name: mongodb
          property: connectionString
```

#### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Set secrets
fly secrets set JWT_SECRET=your-secret
fly secrets set MONGODB_URI=your-mongo-uri

# Deploy
fly deploy
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
API_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/zo-platform
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-super-secure-jwt-secret-change-this
API_KEY_SECRET=your-api-key-secret-change-this
AUTO_REFRESH_ENABLED=true
AUTO_REFRESH_CRON=0 0 * * *
```

---

## 🛠️ Development

### Project Structure

```
zo-platform/
├── backend/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── cron/          # Scheduled tasks
│   ├── middleware/    # Express middleware
│   ├── models/        # MongoDB models
│   ├── queue/         # Bull queue processor
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   └── server.js      # Entry point
├── frontend/
│   ├── public/        # Static files
│   └── src/
│       ├── components/  # React components
│       ├── locales/     # i18n translations
│       ├── pages/       # Page components
│       ├── store/       # Zustand stores
│       ├── App.js       # Main app component
│       └── index.js     # Entry point
├── .env.example       # Environment template
├── docker-compose.yml # Docker configuration
├── Dockerfile         # Docker build file
└── package.json       # Dependencies
```

### Tech Stack

**Backend:**
- Node.js + Express
- MongoDB (Mongoose)
- Bull (Task Queue)
- Redis (Caching)
- Puppeteer (Web Scraping)
- JWT (Authentication)

**Frontend:**
- React 18
- React Router
- Zustand (State Management)
- i18next (Internationalization)
- Axios (HTTP Client)
- Recharts (Charts)
- React Hot Toast (Notifications)

---

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd frontend && npm test
```

---

## 📖 User Guide

### Creating Your First Task

1. **Login** to ZO Platform
2. Navigate to **Tasks** > **Create Task**
3. Fill in task details:
   - Name: "My First Scrape"
   - Type: "Web Scrape"
   - Method: "Cheerio"
   - URL: "https://example.com"
4. Click **Create** and **Run**
5. View results in the task details page

### Scheduling Tasks

1. Edit your task
2. Enable **Schedule**
3. Enter cron expression: `0 9 * * *` (daily at 9 AM)
4. Save changes

### Exporting Data

1. Go to task results
2. Click **Export**
3. Choose format: JSON, CSV, or Excel
4. Download file

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/zo-platform/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/zo-platform/wiki)
- **Email**: support@zo-platform.com

---

## 🙏 Acknowledgments

- Inspired by Apify
- Built for the open-source community
- Special thanks to all contributors

---

<div align="center">

**Made with ❤️ by the ZO Platform Team**

[Website](https://zo-platform.com) • [Documentation](https://docs.zo-platform.com) • [Community](https://community.zo-platform.com)

</div>