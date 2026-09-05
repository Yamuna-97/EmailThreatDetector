from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, description="User question or forensic query")
    email_id: Optional[str] = Field(None, description="Optional UUID of scanned email for context grounding")
    top_k: Optional[int] = Field(5, ge=1, le=10, description="Number of knowledge base passages to retrieve")

class RAGSourceSnippet(BaseModel):
    doc_name: str
    page: int
    snippet: str

class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[RAGSourceSnippet] = []
    collection: str
    email_referenced: bool = False
    email_id: Optional[str] = None
    model: str = "gemini-2.5-flash"

class RAGStatusResponse(BaseModel):
    status: str
    is_initialized: bool
    user_chunks_count: int
    investigator_chunks_count: int
    user_documents: List[str]
    investigator_documents: List[str]
