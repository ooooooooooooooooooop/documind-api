# DocuMind API 项目架构详解

当前项目是一个基于 **FastAPI** 和 **LangChain** 的 AI 对话后端服务。虽然名为 "DocuMind" (暗示文档理解)，目前实现的是一个基础的 **Chat API**，已配置好生产级规范，但尚未接入向量检索（RAG）逻辑。

## 1. 核心架构图

```mermaid
graph LR
    User[用户/前端] -->|POST /chat| Main[app.main: FastAPI App]
    Main -->|验证数据| Schema[app.schemas: Pydantic Models]
    Main -->|调用引擎| Engine[app.core: RAGEngine]
    Engine -->|读取配置| Config[app.config: Settings]
    Config -->|加载环境变量| Env[.env]
    Engine -->|调用 LLM| OpenAI[OpenAI API (x666.me)]
```

## 2. 模块详解与设计理由

### A. 配置管理 (`app/config.py` & `.env`)

* **实现**：使用 `pydantic-settings` 读取 `.env` 文件。

* **为什么**：这是现代 Python 后端的最佳实践。

  * **安全**：API Key 不写死在代码里，防泄露。

  * **灵活**：不同环境（开发/生产）只需切换 `.env` 文件，无需改代码。

  * **自动验证**：Pydantic 会检查类型（如必须是 `str`），如果配置缺失，启动时就会报错，避免运行时崩溃。

### B. 数据规范 (`app/schemas/chat.py`)

* **实现**：定义 `ChatRequest` (输入) 和 `ChatResponse` (输出) 类。

* **为什么**：

  * **契约优先**：明确告诉前端传什么、收什么，Swagger 文档自动生成。

  * **自动校验**：如果前端传了 `int` 而不是 `str`，FastAPI 会自动拦截并返回 422 错误，保护后端逻辑。

  * **解耦**：内部逻辑变化不影响 API 接口定义。

### C. 核心引擎 (`app/core/rag_engine.py`)

* **实现**：封装 `RAGEngine` 类，内部持有 `ChatOpenAI` 实例。

* **为什么**：

  * **单例模式**：LLM 客户端（连接池等）初始化开销大，在 `main.py` 中只实例化一次 (`rag_engine = RAGEngine()`)，所有请求复用，性能高。

  * **抽象层**：现在是直接调 LLM，未来加入 RAG（查向量库、重排序）时，只需修改这个类，外部 `main.py` 无需感知，符合**开闭原则**。

  * **LangChain 集成**：使用 LangChain 而不是原生 OpenAI SDK，方便未来无缝切换模型（如 Claude/DeepSeek）或接入 Agent 流程。

### D. API 入口 (`app/main.py`)

* **实现**：FastAPI 路由定义，CORS 配置，依赖注入。

* **为什么**：

  * **CORS**：已配置允许跨域，方便前端开发调试。

  * **异常处理**：`try-except` 捕获所有错误并返回 500，防止后端崩溃细节暴露给前端。

  * **异步 (async)**：全链路异步（`async def` + `await`），能处理高并发请求，适合 I/O 密集型（等待 LLM 响应）场景。

## 3. 当前状态与下一步

* **当前**：一个标准的 "Hello World" 级 AI 聊天后端，架构骨架已搭好。

* **缺失**：RAG 核心逻辑（文档解析、向量存储、检索）。

* **下一步建议**：实现文档上传接口，引入向量数据库（如 Chroma/Qdrant）。

