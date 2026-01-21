# DocuMind API

[English](README.md) | [简体中文](README_CN.md)

DocuMind is a lightweight, high-performance RAG (Retrieval-Augmented Generation) engine built with FastAPI and LangChain. It enables users to upload documents (PDF/TXT/Word/Excel/MD) and ask questions based on their content, similar to ChatPDF.

## 🚀 Features

- **Document Ingestion**: Supports **PDF, TXT, Word (.docx), Excel (.xlsx), and Markdown (.md)** file uploads.
- **Modern UI**: Built-in Next.js frontend with file management and chat interface.
- **RAG Pipeline**: Automated text chunking, embedding, and vector storage.
- **Smart Retrieval**: Uses semantic search to find relevant context for answers.
- **LLM Integration**: Powered by OpenAI (or compatible) models for high-quality responses.
- **Docker Ready**: Fully containerized for easy deployment.
- **WAF Bypass**: Built-in mechanisms to handle API proxy restrictions (e.g., User-Agent spoofing).

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI
- **RAG & Orchestration**: LangChain
- **Vector Database**: ChromaDB (Persistent)
- **Embeddings**: OpenAI / Gemini (via compatible API)

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI

## 📂 Project Structure

```text
documind-api/
├── app/                     # Backend Source Code
│   ├── core/
│   │   ├── rag_engine.py    # Core RAG logic
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── chat.py          # API Pydantic models
│   │   └── __init__.py
│   ├── main.py              # FastAPI entry point
│   └── ...
├── web/                     # Frontend Source Code (Next.js)
│   ├── app/
│   │   └── page.tsx         # Main chat interface
│   └── ...
├── chroma_db/               # Persisted vector database storage
├── temp_uploads/            # Temporary storage for file processing
├── .dockerignore
├── .env                     # Environment variables (GitIgnored)
├── Dockerfile
├── requirements.txt
└── README.md
```

## ⚡ Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- An OpenAI API Key (or compatible provider key).
- Node.js 18+ (if running frontend locally without Docker).

### 🐳 Running with Docker Compose (Recommended)

This will start both the backend (API) and frontend (UI) in containers.

1.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```env
    # Global Config
    OPENAI_API_KEY=sk-your-api-key
    OPENAI_API_BASE=https://api.openai.com/v1
    ```

2.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```

3.  **Access Application**:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 🔧 Manual Installation (Dev Mode)

If you prefer running without Docker:

## 📚 API Usage

### 1. Upload Document
- **Endpoint**: `POST /upload`
- **Supported Formats**: PDF, TXT, DOCX, XLSX, MD
- **Description**: Upload a file to index its content.

### 2. Chat (Full Context)
- **Endpoint**: `POST /chat`
- **Body**:
    ```json
    {
      "query": "What is the main topic of the document?"
    }
    ```

### 3. Query (Pure API)
- **Endpoint**: `POST /api/query`
- **Description**: Lightweight endpoint for 3rd-party integration (returns only answer and source paths).
- **Body**:
    ```json
    {
      "query": "Summarize the contract.",
      "top_k": 3
    }
    ```

## 📄 License

This project is open-source and available under the MIT License.
