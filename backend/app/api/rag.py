import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from app.schemas.rag import RAGQueryRequest, RAGQueryResponse, RAGStatusResponse
from app.schemas.auth import UserResponse
from app.dependencies import get_current_user
from app.services.rag_service import rag_service, USER_RAG_DIR, INVESTIGATOR_RAG_DIR

logger = logging.getLogger("vaultshield.api.rag")
router = APIRouter(prefix="/rag", tags=["Dual RAG System"])


@router.post("/user-query", response_model=RAGQueryResponse)
async def query_user_rag(
    request: RAGQueryRequest,
    current_user: Optional[UserResponse] = Depends(get_current_user)
):
    """
    RAG 1: User Security Advisor RAG.
    Answers user cybersecurity questions grounded in official guidance and their own scanned emails.
    """
    try:
        user_id = current_user.id if current_user else None
        result = await rag_service.query_user_rag(
            query=request.query,
            email_id=request.email_id,
            user_id=user_id,
            top_k=request.top_k or 5
        )
        return result
    except Exception as e:
        logger.error(f"Error executing User RAG query: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User RAG query failed: {str(e)}"
        )


@router.post("/investigator-query", response_model=RAGQueryResponse)
async def query_investigator_rag(
    request: RAGQueryRequest,
    current_user: Optional[UserResponse] = Depends(get_current_user)
):
    """
    RAG 2: SOC & Forensic Investigator RAG.
    Answers forensic and incident response queries grounded in SOC playbooks, RFC standards,
    MITRE ATT&CK techniques, and detailed email telemetry.
    """
    try:
        user_id = current_user.id if current_user else None
        result = await rag_service.query_investigator_rag(
            query=request.query,
            email_id=request.email_id,
            user_id=user_id,
            top_k=request.top_k or 5
        )
        return result
    except Exception as e:
        logger.error(f"Error executing Investigator RAG query: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Investigator RAG query failed: {str(e)}"
        )


@router.get("/status", response_model=RAGStatusResponse)
async def get_rag_status():
    """Get indexing and document status for both RAG knowledge bases."""
    user_docs = [f.name for f in USER_RAG_DIR.glob("**/*") if f.is_file() and not f.name.startswith(".")]
    inv_docs = [f.name for f in INVESTIGATOR_RAG_DIR.glob("**/*") if f.is_file() and not f.name.startswith(".")]

    return RAGStatusResponse(
        status="ready" if rag_service.is_initialized else "initializing",
        is_initialized=rag_service.is_initialized,
        user_chunks_count=len(rag_service.user_kb.get("chunks", [])),
        investigator_chunks_count=len(rag_service.investigator_kb.get("chunks", [])),
        user_documents=user_docs,
        investigator_documents=inv_docs
    )


@router.post("/reindex")
async def reindex_rag(background_tasks: BackgroundTasks):
    """Force re-indexing of both knowledge bases in background."""
    background_tasks.add_task(rag_service.initialize, force_reindex=True)
    return {"message": "Re-indexing triggered in background."}
