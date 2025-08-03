# TruthLens Backend API

A powerful fact-checking API that combines AI-powered analysis with real-time web search to verify claims and detect misinformation.

## 🚀 Features

- **Background Task Processing**: UUID-based asynchronous fact-checking with real-time status updates
- **Hybrid AI Analysis**: Uses both Groq (Llama) and OpenAI (GPT) models for optimal performance and accuracy
- **Web Search Integration**: Google Custom Search API for retrieving relevant sources
- **Comprehensive Data Storage**: Saves original content, summaries, and complete fact-check results
- **RESTful API**: Clean, documented endpoints with proper error handling
- **CORS Support**: Ready for frontend integration

## 🛠️ Tech Stack

- **Framework**: FastAPI with async/await support
- **AI Models**:
  - Groq (Llama 3-8B) for summarization and search query generation
  - OpenAI (GPT-4o-mini) for fact-checking analysis
- **Database**: MongoDB with Motor async driver
- **Task Processing**: Background task queue with status tracking
- **Validation**: Pydantic models for request/response validation

## 📋 Prerequisites

- Python 3.12+
- MongoDB (local or cloud)
- Poetry for dependency management
- API Keys:
  - Groq API Key
  - OpenAI API Key
  - Google API Key + Custom Search Engine ID

## 🔧 Installation

1. **Clone and navigate to the project**:
   ```bash
   cd TruthLens/backend
   ```

2. **Install dependencies**:
   ```bash
   poetry install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your API keys:
   ```env
   ENV=dev
   PORT=8000
   MONGO_URI=mongodb://localhost:27017
   GROQ_API_KEY=your_groq_api_key
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_CSE_ID=your_custom_search_engine_id
   ```

4. **Start the server**:
   ```bash
   poetry run python run.py
   ```

The API will be available at `http://localhost:8000`

## 📚 API Endpoints

### Health Check
```http
GET /api/health/
```
Check API and database connectivity.

### Fact-Checking (Background Task)
```http
POST /api/verify/text/
```
**Request Body**:
```json
{
  "content": "The claim you want to fact-check",
  "url": "https://optional-source-url.com"
}
```
**Response**:
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Task created and queued for processing"
}
```

### Task Status
```http
GET /api/task/{task_id}/status
```
**Response**:
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "message": "Fact check completed successfully",
  "result": {
    "url": "https://source-url.com",
    "label": "misleading",
    "summary": "Summarized claim...",
    "response": "Detailed fact-check analysis...",
    "isSafe": false,
    "archive": "https://web.archive.org/...",
    "references": ["https://source1.com", "https://source2.com"],
    "updatedAt": "2025-08-03T10:30:00Z"
  },
  "created_at": "2025-08-03T10:30:00Z",
  "updated_at": "2025-08-03T10:32:15Z"
}
```

### All Tasks
```http
GET /api/tasks/
```
**Query Parameters**:
- `limit` (optional): Max tasks to return (default: 50, max: 100)
- `skip` (optional): Tasks to skip for pagination (default: 0)
- `status` (optional): Filter by status (`pending`, `processing`, `summarizing`, `fact_checking`, `completed`, `failed`)

**Examples**:
```bash
# Get all tasks
GET /api/tasks/

# Get only completed tasks
GET /api/tasks/?status=completed

# Pagination
GET /api/tasks/?skip=50&limit=25
```

## 🔄 Task Processing Flow

1. **PENDING** → Task created and queued
2. **PROCESSING** → Task started
3. **SUMMARIZING** → Content being summarized and translated
4. **FACT_CHECKING** → AI analysis in progress
5. **COMPLETED** → Results available
6. **FAILED** → Error occurred

## 📊 Fact Check Labels

- **CORRECT**: The claim is factually accurate
- **INCORRECT**: The claim is false or inaccurate
- **MISLEADING**: The claim is partially true or lacks context

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI        │    │   Background    │
│                 │◄──►│   API Routes     │◄──►│   Tasks         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   MongoDB        │    │   AI Services   │
                       │   (Tasks & Cache)│    │   Groq + OpenAI │
                       └──────────────────┘    └─────────────────┘
```

## 🎯 Usage Examples

### Python Client
```python
import httpx
import asyncio

async def fact_check_claim():
    async with httpx.AsyncClient() as client:
        # Start fact-checking
        response = await client.post(
            "http://localhost:8000/api/verify/text/",
            json={"content": "The Earth is flat"}
        )
        task_data = response.json()
        task_id = task_data["task_id"]

        # Poll for results
        while True:
            status_response = await client.get(
                f"http://localhost:8000/api/task/{task_id}/status"
            )
            status_data = status_response.json()

            if status_data["status"] == "completed":
                print(f"Result: {status_data['result']['label']}")
                break
            elif status_data["status"] == "failed":
                print(f"Failed: {status_data['message']}")
                break

            await asyncio.sleep(2)  # Wait 2 seconds before next poll

asyncio.run(fact_check_claim())
```

### cURL Examples
```bash
# Start fact-checking
curl -X POST "http://localhost:8000/api/verify/text/" \
  -H "Content-Type: application/json" \
  -d '{"content": "Climate change is a hoax"}'

# Check task status
curl "http://localhost:8000/api/task/your-task-id/status"

# Get all completed tasks
curl "http://localhost:8000/api/tasks/?status=completed"
```

## 🔧 Development

### Project Structure
```
app/
├── api/routes.py          # API endpoints
├── config.py             # Configuration settings
├── dependencies.py       # Dependency injection
└── main.py              # FastAPI application

core/
├── db.py                # Database operations
├── fact.py              # Fact-checking logic
├── tasks.py             # Background task processing
├── preprocessors.py     # Text preprocessing
└── postprocessors.py    # Result processing

schemas/
└── schemas.py           # Pydantic models
```

### Running Tests
```bash
poetry run pytest
```

### Code Formatting
```bash
poetry run black .
```

## 🚀 Deployment

### Docker (Recommended)
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --no-dev
COPY . .
CMD ["poetry", "run", "python", "run.py"]
```

### Environment Variables for Production
```env
ENV=prod
PORT=8000
MONGO_URI=mongodb://your-mongo-cluster
GROQ_API_KEY=your_production_groq_key
OPENAI_API_KEY=your_production_openai_key
GOOGLE_API_KEY=your_production_google_key
GOOGLE_CSE_ID=your_production_cse_id
```

## 📝 API Documentation

Once running, visit:
- **Interactive Docs**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
