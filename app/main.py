# app/main.py
from fastapi.middleware.cors import CORSMiddleware
from app.core.rag_engine import RAGEngine  # 修改：导入你的类
import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse, SourceDocument
from app.schemas.api import APIQueryRequest, APIQueryResponse

# 初始化 App
app = FastAPI(
    title="DocuMind API",
    description="A RAG-powered document question-answering engine.",
    version="0.1.0",
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 允许所有来源，方便局域网访问
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 【关键】实例化 RAG 引擎（全局单例，避免每次请求都重新初始化）
rag_engine = RAGEngine()


@app.get("/")
async def root():
    """根路径检查"""
    return {"message": "DocuMind API is running", "status": "active"}


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok"}


# 临时文件存储目录
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    上传 PDF 或 TXT 文件并建立索引
    """
    try:
        # 0. 验证文件大小 (50MB = 50 * 1024 * 1024 bytes)
        MAX_FILE_SIZE = 50 * 1024 * 1024
        file.file.seek(0, 2)  # 移动到文件末尾
        file_size = file.file.tell()  # 获取当前位置（即文件大小）
        file.file.seek(0)  # 重置回文件开头，否则后面读取不到内容
        
        if file_size > MAX_FILE_SIZE:
             raise HTTPException(400, detail="File size too large. Max limit is 50MB.")

        # 1. 验证文件类型
        supported_types = [
            "application/pdf", 
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/markdown"
        ]
        
        # 还要检查文件扩展名，因为有些客户端传 MIME type 不准
        filename = file.filename.lower()
        if file.content_type not in supported_types and not filename.endswith((".pdf", ".txt", ".docx", ".xlsx", ".md")):
            raise HTTPException(400, detail="Unsupported file type. Supported: PDF, TXT, DOCX, XLSX, MD")

        # 2. 保存文件到临时目录
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. 调用 RAG 引擎处理文件
        num_chunks = await rag_engine.ingest_file(file_path, file.content_type)

        # 4. 清理临时文件
        os.remove(file_path)

        return {
            "message": f"Successfully ingested {file.filename}",
            "chunks_created": num_chunks,
        }

    except Exception as e:
        print(f"Error in /upload: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(500, detail=str(e))


@app.get("/documents")
async def list_documents():
    """
    列出所有已建立索引的文档
    """
    try:
        docs = rag_engine.list_documents()
        return {"documents": docs, "count": len(docs)}
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@app.delete("/documents")
async def delete_document(filename: str):
    """
    删除指定文档（通过文件名）
    注意：这里需要传完整路径或文件名，取决于 metadata 中是怎么存的
    """
    try:
        # 尝试匹配文件名（因为 Chroma 存的是绝对路径）
        # 这里做一个简单的模糊匹配逻辑：如果传入的是 "test.txt"，就删除所有路径以 "test.txt" 结尾的记录
        all_docs = rag_engine.list_documents()
        target_path = None
        for path in all_docs:
            if path.endswith(filename) or path == filename:
                target_path = path
                break
        
        if not target_path:
            raise HTTPException(404, detail="Document not found")
            
        rag_engine.delete_document(target_path)
        return {"message": f"Successfully deleted document: {filename}"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@app.post("/api/query", response_model=APIQueryResponse)
async def api_query_endpoint(request: APIQueryRequest):
    """
    [纯 API 模式] 给第三方调用使用的问答接口
    返回格式更精简，适合程序集成
    """
    try:
        # 复用 RAG 引擎的逻辑，但可以根据 top_k 参数调整
        # 注意：这里我们临时修改一下 search_kwargs，或者在 rag_engine 里加参数支持
        # 为了简单，目前先复用默认逻辑 (k=3)
        result = await rag_engine.answer(request.query)

        # 提取纯文本来源路径
        source_paths = list(set([doc.metadata.get("source", "unknown") for doc in result["sources"]]))

        return APIQueryResponse(
            answer=result["answer"],
            sources=source_paths
        )
    except Exception as e:
        print(f"Error in /api/query: {e}")
        raise HTTPException(500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    与 AI 对话的基础接口
    """
    try:
        # 调用新版 RAG 逻辑
        result = await rag_engine.answer(request.query)

        # 格式化来源
        sources = [
            SourceDocument(
                source=doc.metadata.get("source", "unknown"),
                page_content=doc.page_content[:200] + "...",  # 只展示前200字预览
            )
            for doc in result["sources"]
        ]

        return ChatResponse(answer=result["answer"], sources=sources)
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(500, detail=str(e))
