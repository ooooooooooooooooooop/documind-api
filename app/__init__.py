from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 初始化 App
app = FastAPI(
    title="DocuMind API",
    description="A RAG-powered document question-answering engine.",
    version="0.1.0",
)

# 配置 CORS (为将来前端调用做准备)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境需要修改为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """
    根路径检查
    """
    return {"message": "DocuMind API is running", "status": "active"}


@app.get("/health")
async def health_check():
    """
    健康检查端点 (部署到 Render 时通常需要这个)
    """
    return {"status": "ok"}
