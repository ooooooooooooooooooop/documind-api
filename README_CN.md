# DocuMind API

[English](README.md) | [简体中文](README_CN.md)

DocuMind 是一个轻量级、高性能的 RAG（检索增强生成）引擎，基于 FastAPI 和 LangChain 构建。它允许用户上传文档（PDF/TXT/Word/Excel/MD）并基于其内容进行提问，功能类似 ChatPDF。

## 🚀 功能特性

- **多格式文档支持**：支持 **PDF, TXT, Word (.docx), Excel (.xlsx), Markdown (.md)** 文件上传与解析。
- **现代化 UI**：内置基于 Next.js 的现代化前端，支持文件管理、实时聊天、Markdown 渲染。
- **RAG 流程**：自动完成文本切片、向量化和存储。
- **智能检索**：利用语义搜索查找与问题最相关的上下文。
- **LLM 集成**：支持 OpenAI 及兼容模型（如 DeepSeek/Gemini），提供高质量回答。
- **Docker 支持**：完全容器化，支持一键部署。
- **WAF 绕过**：内置反爬虫绕过机制（如 User-Agent 伪装），可顺利连接各类 API 代理。

## 🛠️ 技术栈

### 后端
- **框架**: FastAPI
- **RAG & 编排**: LangChain
- **向量数据库**: ChromaDB (持久化存储)
- **嵌入模型**: OpenAI / Gemini (通过兼容 API)

### 前端
- **框架**: Next.js (React)
- **样式**: Tailwind CSS
- **组件库**: Shadcn UI

## 📂 项目结构

```text
documind-api/
├── app/                     # 后端源代码
│   ├── core/
│   │   ├── rag_engine.py    # RAG 核心逻辑
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── chat.py          # API Pydantic 模型
│   │   └── __init__.py
│   ├── main.py              # FastAPI 入口
│   └── ...
├── web/                     # 前端源代码 (Next.js)
│   ├── app/
│   │   └── page.tsx         # 聊天主界面
│   └── ...
├── chroma_db/               # 向量数据库持久化文件
├── temp_uploads/            # 临时文件存储目录
├── .dockerignore
├── .env                     # 环境变量配置文件 (GitIgnored)
├── Dockerfile
├── requirements.txt
└── README.md
```

## ⚡ 快速开始

### 前置要求

- 安装并运行 [Docker Desktop](https://www.docker.com/products/docker-desktop/)。
- 拥有一个 OpenAI API Key（或兼容服务商的 Key）。
- Node.js 18+ (如果需要本地运行前端)。

### 🐳 使用 Docker Compose 运行 (推荐)

这将同时启动后端 (API) 和前端 (UI) 容器。

1.  **配置环境**:
    在项目根目录创建一个 `.env` 文件：
    ```env
    # 全局默认配置
    OPENAI_API_KEY=sk-your-api-key
    OPENAI_API_BASE=https://api.openai.com/v1

    # 可选：分别为 LLM 和 Embedding 指定不同模型/接口
    # EMBEDDING_MODEL=text-embedding-ada-002
    ```

2.  **启动服务**:
    ```bash
    docker-compose up -d --build
    ```

3.  **访问应用**:
    - **前端页面**: [http://localhost:3000](http://localhost:3000)
    - **后端文档**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 🔧 手动开发模式

如果你想在本地分别运行：

## 📚 API 使用说明

### 1. 上传文档
- **接口**: `POST /upload`
- **支持格式**: PDF, TXT, DOCX, XLSX, MD
- **描述**: 上传文件以建立索引。

### 2. 对话 (完整模式)
- **接口**: `POST /chat`
- **描述**: 前端 UI 使用的接口，返回答案及详细的上下文片段。
- **请求体**:
    ```json
    {
      "query": "这份文档的主要内容是什么？"
    }
    ```

### 3. 查询 (纯 API 模式)
- **接口**: `POST /api/query`
- **描述**: 专为第三方集成设计的轻量级接口，只返回答案和源文件路径列表。
- **请求体**:
    ```json
    {
      "query": "总结一下合同条款。",
      "top_k": 3
    }
    ```

## 📄 许可证

本项目开源并遵循 MIT 许可证。
