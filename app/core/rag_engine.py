# app/core/rag_engine.py
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader, UnstructuredExcelLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.config import settings

# 向量数据库持久化路径
PERSIST_DIRECTORY = "./chroma_db"


class RAGEngine:
    def __init__(self):
        # 1. 初始化 Embeddings 模型 (用于将文本转化为向量)
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.effective_embedding_api_key,
            openai_api_base=settings.effective_embedding_api_base,
            model=settings.EMBEDDING_MODEL,
            check_embedding_ctx_length=False,  # 禁用上下文长度检查
            chunk_size=100,  # 限制批处理大小，避免超过 API 限制 (at most 100 requests in one batch)
            # dimensions=768,  # 移除强制维度，允许自动探测
            default_headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
        )

        # 2. 初始化 LLM
        self.llm = ChatOpenAI(
            openai_api_key=settings.effective_llm_api_key,
            openai_api_base=settings.effective_llm_api_base,
            model=settings.LLM_MODEL,
            temperature=0,
        )

        # 3. 初始化/加载 Vector Store
        self.vector_store = Chroma(
            persist_directory=PERSIST_DIRECTORY, embedding_function=self.embeddings
        )

        # 4. 初始化 Text Splitter (切片器)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200
        )

    async def ingest_file(self, file_path: str, file_type: str):
        """
        处理上传文件：加载 -> 切片 -> 存入向量库
        """
        # A. 加载文档
        if file_type == "application/pdf":
            loader = PyPDFLoader(file_path)
        elif file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            loader = Docx2txtLoader(file_path)
        elif file_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            loader = UnstructuredExcelLoader(file_path)
        elif file_type == "text/markdown" or file_path.endswith(".md"):
            loader = TextLoader(file_path, encoding="utf-8")
        else:
            # 默认尝试用文本方式加载
            loader = TextLoader(file_path, encoding="utf-8")
            
        documents = loader.load()

        # B. 切分文档
        chunks = self.text_splitter.split_documents(documents)

        # C. 存入 ChromaDB (自动计算向量)
        # 注意：这里可能会有些慢，取决于文件大小
        self.vector_store.add_documents(chunks)
        # ChromaDB 自动持久化，无需手动 save

        return len(chunks)

    async def answer(self, query: str):
        """
        RAG 核心逻辑：检索 -> 增强 -> 生成
        """
        # 1. 创建检索器 (Retriever)
        # k=3 表示只找最相似的3个片段
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})

        # 2. 检索相关文档
        docs = retriever.invoke(query)

        # 3. 构建 Prompt
        # 将检索到的 docs 拼接到 prompt 中
        context_text = "\n\n".join([doc.page_content for doc in docs])

        system_prompt = """你是一个专业的文档助手。
        请基于以下提供的【上下文】来回答用户的问题。
        如果【上下文】中没有相关信息，请直接回答“根据提供的文档，我无法回答这个问题”，不要编造信息。
        
        【上下文】：
        {context}
        """

        prompt = ChatPromptTemplate.from_messages(
            [("system", system_prompt), ("user", "{question}")]
        )

        # 4. 生成回答
        chain = prompt | self.llm | StrOutputParser()
        answer = await chain.ainvoke({"context": context_text, "question": query})

        # 5. 返回结果 + 来源
        return {"answer": answer, "sources": docs}

    def clear_db(self):
        """清空数据库 (调试用)"""
        self.vector_store.delete_collection()

    def list_documents(self):
        """列出所有已建立索引的文档"""
        # ChromaDB 默认没有简单的“列出所有源文件”的 API
        # 这里我们通过 get() 获取所有 metadata，然后去重提取 source
        data = self.vector_store.get()
        sources = set()
        if data and "metadatas" in data:
            for metadata in data["metadatas"]:
                if metadata and "source" in metadata:
                    sources.add(metadata["source"])
        return list(sources)
    
    def delete_document(self, source_path: str):
        """删除指定文档的所有切片"""
        # 根据 metadata 中的 source 字段进行删除
        self.vector_store.delete(where={"source": source_path})
        return True
