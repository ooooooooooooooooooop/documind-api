# Create Pydantic Schemas for Chat API

To ensure professional API definition and beautiful Swagger documentation, I will implement the Pydantic models for the chat functionality.

## Implementation Steps

1.  **Create Directory Structure**
    - Create directory `app/schemas` since it doesn't exist.
    - Create `app/schemas/__init__.py` to make it a Python package.

2.  **Implement `app/schemas/chat.py`**
    - Define `ChatRequest` model:
        - `query`: The user's input string (required).
        - `history`: List of previous message dictionaries (optional, default empty).
        - Use `pydantic.Field` to add descriptions and examples for Swagger UI.
    - Define `ChatResponse` model:
        - `answer`: The AI's response string.
        - `sources`: Optional list of source documents (for future RAG context).

## Code Preview

**app/schemas/chat.py**:
```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    query: str = Field(..., description="用户的问题", example="请总结这篇文档")
    history: List[Dict[str, str]] = Field(
        default=[], 
        description="对话历史", 
        example=[{"role": "user", "content": "你好"}, {"role": "assistant", "content": "你好！有什么我可以帮你的吗？"}]
    )

class ChatResponse(BaseModel):
    answer: str = Field(..., description="AI 的回答")
    sources: List[str] = Field(default=[], description="参考的文档来源")
```
