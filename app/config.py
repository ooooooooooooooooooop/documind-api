# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # 全局默认配置
    OPENAI_API_KEY: str
    OPENAI_API_BASE: str = "https://api.openai.com/v1"

    # LLM (推理模型) 配置
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_API_KEY: Optional[str] = None
    LLM_API_BASE: Optional[str] = None

    # Embedding (向量模型) 配置
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_API_KEY: Optional[str] = None
    EMBEDDING_API_BASE: Optional[str] = None

    @property
    def effective_llm_api_key(self):
        return self.LLM_API_KEY or self.OPENAI_API_KEY

    @property
    def effective_llm_api_base(self):
        return self.LLM_API_BASE or self.OPENAI_API_BASE

    @property
    def effective_embedding_api_key(self):
        return self.EMBEDDING_API_KEY or self.OPENAI_API_KEY

    @property
    def effective_embedding_api_base(self):
        return self.EMBEDDING_API_BASE or self.OPENAI_API_BASE

    class Config:
        env_file = ".env"
        extra = "ignore"  # 忽略多余的环境变量


settings = Settings()
