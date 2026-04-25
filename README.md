# Market Intelligence Suite 📊

A sophisticated agentic system for real-time market research and competitive analysis powered by Groq AI. This project combines a FastAPI backend with React frontend to deliver streaming intelligence analysis.

## 🎯 Features

- **Real-time Agent Thinking**: Stream live agent decision-making via Server-Sent Events (SSE)
- **Multi-Agent Architecture**: Specialized agents for research, analysis, compilation, and orchestration
- **Market Research Integration**: Tavily-powered market data collection
- **RAG (Retrieval-Augmented Generation)**: ChromaDB integration for knowledge management
- **Interactive Dashboard**: React frontend with live streaming updates
- **Fast API**: Production-ready backend with CORS support

## 🏗️ Project Structure

```
market-intel-groq/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── rag_ingest.py          # RAG pipeline
│   ├── requirements.txt        # Python dependencies
│   └── agents/
│       ├── orchestrator.py     # Main orchestrator agent
│       ├── researcher.py       # Research agent
│       ├── analyst.py          # Analysis agent
│       └── compiler.py         # Compilation agent
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── main.jsx           # React entry point
│   │   └── hooks/
│   │       └── useMarketResearch.js  # Custom hook for API calls
│   ├── index.html             # HTML template
│   ├── package.json           # Node dependencies
│   └── vite.config.js         # Vite configuration
└── README.md                   # This file
```

## 📋 Prerequisites

- **Node.js** 16+ (for frontend)
- **Python** 3.9+ (for backend)
- **API Keys**:
  - Groq API key
  - Google Generative AI key (optional)
  - Tavily API key (for market research)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Ragunath-Ravichandran/market.git
cd market-intel-groq
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API keys
echo GROQ_API_KEY=your_key_here > .env
echo GOOGLE_API_KEY=your_key_here >> .env
echo TAVILY_API_KEY=your_key_here >> .env

# Run the backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔌 API Endpoints

### Main Endpoints

- **POST `/api/query`** - Submit a market intelligence query
  - Request body: `{"query": "string", "params": {...}}`
  - Response: Server-Sent Events stream with agent thinking logs

- **GET `/health`** - Health check endpoint
  - Returns: `{"status": "healthy"}`

## 🔄 CI/CD Pipeline

Automated workflows run on every push:

- ✅ **Linting & Testing**: Python and JavaScript code quality checks
- 🏗️ **Build**: Frontend build verification
- 📦 **Deploy**: Automatic deployment to GitHub Pages and Render

## 📝 Environment Configuration

Create a `.env` file in the backend directory:

```env
# API Keys
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key
TAVILY_API_KEY=your_tavily_api_key

# Backend Config
BACKEND_URL=http://localhost:8000
DEBUG=False

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## 🛠️ Development

### Backend Development

```bash
# Format code
black backend/

# Type checking
mypy backend/

# Run tests
pytest backend/

# View API documentation
# Visit http://localhost:8000/docs
```

### Frontend Development

```bash
# Format code
npm run format

# Linting
npm run lint

# Preview production build
npm run preview
```

## 📚 Technologies Used

### Backend
- **FastAPI** - Modern web framework
- **Pydantic** - Data validation
- **LangChain** - LLM orchestration
- **ChromaDB** - Vector database
- **Tavily** - Market research API
- **Groq** - Fast LLM inference

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Recharts** - Charts & visualization
- **Axios** - HTTP client

## 🔒 Security

- Environment variables for sensitive data (never commit `.env`)
- CORS protection configured
- API key validation on backend
- HTTPS recommended for production
- Add GitHub Secrets for CI/CD deployments

## 📊 Performance

- Server-Sent Events for real-time streaming
- Async/await for non-blocking operations
- Vector embeddings caching in ChromaDB
- Frontend code splitting with Vite

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process
kill -9 <PID>
```

### CORS Issues
- Verify backend CORS settings in `main.py`
- Ensure frontend URL is in `allow_origins`
- Check browser console for specific errors

### Missing Dependencies
```bash
# Backend
pip install -r backend/requirements.txt --upgrade

# Frontend
npm install
npm audit fix
```

## 📞 Support & Contribution

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join GitHub Discussions
- **Pull Requests**: We welcome contributions!

## 📄 License

MIT License - see LICENSE file for details

## 🎓 Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [LangChain Documentation](https://python.langchain.com/)
- [React Documentation](https://react.dev/)
- [Groq Documentation](https://console.groq.com/docs)

---

**Made with ❤️ by Ragunath Ravichandran**

Visit: [GitHub Repository](https://github.com/Ragunath-Ravichandran/market)
