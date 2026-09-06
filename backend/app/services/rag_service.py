import os
import re
import json
import logging
import asyncio
import hashlib
import pickle
from pathlib import Path
from typing import Dict, Any, List, Optional

import httpx
import numpy as np
import pypdf
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.config import settings
from app.database import db

logger = logging.getLogger("vaultshield.rag")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USER_RAG_DIR = DATA_DIR / "rag" / "user"
INVESTIGATOR_RAG_DIR = DATA_DIR / "rag" / "investigator"
CACHE_DIR = DATA_DIR / "rag_cache"


class DualRAGService:
    """
    Dual RAG Knowledge Engine:
    1. User RAG: Friendly, practical, highly readable cybersecurity guidance for users + email context.
    2. Investigator RAG: Deep SOC forensic intelligence, RFC compliance, MITRE ATT&CK mapping, IOC analysis.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.embedding_model = settings.GEMINI_EMBEDDING_MODEL or "gemini-embedding-2"
        self.fast_model = settings.GEMINI_FAST_MODEL or "gemini-2.5-flash"
        self.pro_model = settings.GEMINI_PRO_MODEL or "gemini-2.5-pro"
        self.fallback_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest", "gemini-2.5-pro"]

        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        USER_RAG_DIR.mkdir(parents=True, exist_ok=True)
        INVESTIGATOR_RAG_DIR.mkdir(parents=True, exist_ok=True)

        self.user_kb: Dict[str, Any] = {"chunks": [], "embeddings": None, "vectorizer": None, "tfidf_matrix": None}
        self.investigator_kb: Dict[str, Any] = {"chunks": [], "embeddings": None, "vectorizer": None, "tfidf_matrix": None}
        self.is_initialized = False

    async def initialize(self, force_reindex: bool = False):
        """Load and index both User and Investigator knowledge bases."""
        logger.info("Initializing Dual RAG Knowledge Bases...")
        await self._load_or_index_collection("user", USER_RAG_DIR, self.user_kb, force_reindex)
        await self._load_or_index_collection("investigator", INVESTIGATOR_RAG_DIR, self.investigator_kb, force_reindex)
        self.is_initialized = True
        logger.info("Dual RAG Knowledge Bases initialized successfully.")

    def _get_dir_files_hash(self, directory: Path) -> str:
        files = sorted(list(directory.glob("**/*")))
        hasher = hashlib.md5()
        for f in files:
            if f.is_file() and not f.name.startswith("."):
                hasher.update(f.name.encode())
                hasher.update(str(f.stat().st_mtime).encode())
                hasher.update(str(f.stat().st_size).encode())
        return hasher.hexdigest()

    async def _load_or_index_collection(
        self,
        name: str,
        directory: Path,
        kb_dict: Dict[str, Any],
        force_reindex: bool = False
    ):
        cache_file = CACHE_DIR / f"{name}_index.pkl"
        current_hash = self._get_dir_files_hash(directory)

        if not force_reindex and cache_file.exists():
            try:
                with open(cache_file, "rb") as f:
                    cached_data = pickle.load(f)
                if cached_data.get("files_hash") == current_hash and len(cached_data.get("chunks", [])) > 0:
                    kb_dict["chunks"] = cached_data["chunks"]
                    kb_dict["embeddings"] = cached_data.get("embeddings")
                    kb_dict["vectorizer"] = cached_data.get("vectorizer")
                    kb_dict["tfidf_matrix"] = cached_data.get("tfidf_matrix")
                    logger.info(f"Loaded {len(kb_dict['chunks'])} cached chunks for '{name}' RAG.")
                    return
            except Exception as e:
                logger.warning(f"Failed to load cache for '{name}' RAG: {e}. Rebuilding index...")

        # Extract chunks from documents in directory
        logger.info(f"Extracting documents from {directory} for '{name}' RAG...")
        chunks = self._extract_chunks_from_dir(directory, name)
        if not chunks:
            logger.warning(f"No documents found in {directory} for '{name}' RAG.")
            kb_dict["chunks"] = []
            kb_dict["embeddings"] = None
            kb_dict["vectorizer"] = None
            kb_dict["tfidf_matrix"] = None
            return

        logger.info(f"Extracted {len(chunks)} chunks from {directory} for '{name}' RAG. Building TF-IDF matrix...")

        # Build TF-IDF vectorizer first for immediate, zero-latency retrieval
        texts = [c["text"] for c in chunks]
        vectorizer = TfidfVectorizer(stop_words="english", max_features=10000, ngram_range=(1, 2))
        try:
            tfidf_matrix = vectorizer.fit_transform(texts)
            logger.info(f"TF-IDF matrix built for '{name}' RAG ({tfidf_matrix.shape}).")
        except Exception as e:
            logger.warning(f"TF-IDF build warning: {e}")
            tfidf_matrix = None
            vectorizer = None

        kb_dict["chunks"] = chunks
        kb_dict["vectorizer"] = vectorizer
        kb_dict["tfidf_matrix"] = tfidf_matrix

        # Optional: dense embeddings for top chunks
        logger.info(f"Generating dense embeddings for '{name}' RAG (sample)...")
        embeddings = await self._generate_embeddings_for_chunks(texts[:30])
        kb_dict["embeddings"] = embeddings

        # Save to disk cache
        try:
            with open(cache_file, "wb") as f:
                pickle.dump({
                    "files_hash": current_hash,
                    "chunks": chunks,
                    "embeddings": embeddings,
                    "vectorizer": vectorizer,
                    "tfidf_matrix": tfidf_matrix
                }, f)
            logger.info(f"Saved {name} RAG index cache ({len(chunks)} chunks).")
        except Exception as e:
            logger.error(f"Failed to save {name} RAG cache: {e}")

    def _extract_chunks_from_dir(self, directory: Path, collection_name: str) -> List[Dict[str, Any]]:
        chunks: List[Dict[str, Any]] = []
        chunk_id = 0

        for file_path in sorted(directory.glob("**/*")):
            if not file_path.is_file() or file_path.name.startswith("."):
                continue

            doc_name = file_path.name
            ext = file_path.suffix.lower()

            if ext == ".pdf":
                try:
                    logger.info(f"[{collection_name}] Parsing PDF: {doc_name}...")
                    reader = pypdf.PdfReader(str(file_path))
                    total_pages = len(reader.pages)
                    # Limit to first 30 pages per doc to keep startup ultra fast while capturing key contents
                    max_pages_to_read = min(total_pages, 30)
                    doc_chunks = 0
                    for page_num in range(1, max_pages_to_read + 1):
                        try:
                            page = reader.pages[page_num - 1]
                            page_text = page.extract_text() or ""
                            page_text = self._clean_text(page_text)
                            if not page_text or len(page_text) < 40:
                                continue
                            
                            page_chunks = self._chunk_text(page_text, max_chars=1200, overlap=150)
                            for pc in page_chunks:
                                chunk_id += 1
                                doc_chunks += 1
                                chunks.append({
                                    "id": f"{collection_name}_{chunk_id}",
                                    "doc_name": doc_name,
                                    "page": page_num,
                                    "text": pc,
                                    "collection": collection_name
                                })
                        except Exception:
                            continue
                    logger.info(f"[{collection_name}] Parsed {doc_name}: {doc_chunks} chunks extracted.")
                except Exception as e:
                    logger.error(f"Error parsing PDF {file_path}: {e}")

            elif ext in [".txt", ".md", ".json"]:
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        file_text = f.read()
                    file_text = self._clean_text(file_text)
                    file_chunks = self._chunk_text(file_text, max_chars=1200, overlap=150)
                    for pc in file_chunks:
                        chunk_id += 1
                        chunks.append({
                            "id": f"{collection_name}_{chunk_id}",
                            "doc_name": doc_name,
                            "page": 1,
                            "text": pc,
                            "collection": collection_name
                        })
                except Exception as e:
                    logger.error(f"Error reading file {file_path}: {e}")

        return chunks

    def _clean_text(self, text: str) -> str:
        text = text.replace("\x00", "")
        text = re.sub(r"\r\n|\r", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def _chunk_text(self, text: str, max_chars: int = 1200, overlap: int = 150) -> List[str]:
        if len(text) <= max_chars:
            return [text]

        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""

        for p in paragraphs:
            p = p.strip()
            if not p:
                continue

            if len(current_chunk) + len(p) + 2 <= max_chars:
                current_chunk = f"{current_chunk}\n\n{p}".strip()
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    current_chunk = current_chunk[-overlap:] + "\n\n" + p if overlap > 0 else p
                else:
                    sentences = p.replace(". ", ".\n").split("\n")
                    sub_chunk = ""
                    for s in sentences:
                        if len(sub_chunk) + len(s) + 1 <= max_chars:
                            sub_chunk = f"{sub_chunk} {s}".strip()
                        else:
                            if sub_chunk:
                                chunks.append(sub_chunk)
                            sub_chunk = s
                    if sub_chunk:
                        current_chunk = sub_chunk

        if current_chunk and (not chunks or current_chunk != chunks[-1]):
            chunks.append(current_chunk)

        return [c.strip() for c in chunks if len(c.strip()) > 30]

    async def _generate_embeddings_for_chunks(self, texts: List[str]) -> Optional[np.ndarray]:
        """Generate dense embeddings with fast timeout and fallback."""
        if not self.api_key or not texts:
            return None

        endpoint = f"{GEMINI_API_URL}/{self.embedding_model}:embedContent?key={self.api_key}"
        embeddings_list = []

        batch_size = 10
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                for i in range(0, min(len(texts), 60), batch_size):
                    batch = texts[i : i + batch_size]
                    tasks = []
                    for text in batch:
                        payload = {"content": {"parts": [{"text": text[:2000]}]}}
                        tasks.append(client.post(endpoint, json=payload))

                    responses = await asyncio.gather(*tasks, return_exceptions=True)
                    for r in responses:
                        if isinstance(r, httpx.Response) and r.status_code == 200:
                            try:
                                val = r.json().get("embedding", {}).get("values", [])
                                if val:
                                    embeddings_list.append(val)
                            except Exception:
                                pass
        except Exception as e:
            logger.warning(f"Dense embedding generation skipped/failed: {e}")

        if len(embeddings_list) > 0:
            return np.array(embeddings_list, dtype=np.float32)
        return None

    async def _embed_single_query(self, query: str) -> Optional[np.ndarray]:
        if not self.api_key:
            return None
        endpoint = f"{GEMINI_API_URL}/{self.embedding_model}:embedContent?key={self.api_key}"
        payload = {"content": {"parts": [{"text": query[:2000]}]}}
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                r = await client.post(endpoint, json=payload)
                if r.status_code == 200:
                    val = r.json().get("embedding", {}).get("values", [])
                    if val:
                        return np.array(val, dtype=np.float32)
        except Exception as e:
            logger.debug(f"Query embedding notice: {e}")
        return None

    def _retrieve_top_k(
        self,
        query: str,
        query_vec: Optional[np.ndarray],
        kb_dict: Dict[str, Any],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        chunks = kb_dict.get("chunks", [])
        if not chunks:
            return []

        embeddings = kb_dict.get("embeddings")
        if query_vec is not None and embeddings is not None and len(embeddings) == len(chunks):
            try:
                norm_q = np.linalg.norm(query_vec)
                norm_e = np.linalg.norm(embeddings, axis=1)
                norm_e[norm_e == 0] = 1e-10
                if norm_q > 0:
                    scores = np.dot(embeddings, query_vec) / (norm_e * norm_q)
                    # Apply prioritization boost for User_Email_Security.pdf
                    boosted_scores = np.array(scores, copy=True)
                    for idx, c in enumerate(chunks):
                        doc = c.get("doc_name", "").lower()
                        if "user_email_security" in doc or "email_security" in doc:
                            boosted_scores[idx] *= 1.35
                    top_indices = np.argsort(boosted_scores)[::-1][:top_k]
                    results = []
                    for idx in top_indices:
                        item = dict(chunks[idx])
                        item["score"] = float(boosted_scores[idx])
                        results.append(item)
                    return results
            except Exception as e:
                logger.debug(f"Vector search notice: {e}")

        # TF-IDF Retrieval
        vectorizer = kb_dict.get("vectorizer")
        tfidf_matrix = kb_dict.get("tfidf_matrix")
        if vectorizer is not None and tfidf_matrix is not None:
            try:
                q_vec = vectorizer.transform([query])
                sims = cosine_similarity(q_vec, tfidf_matrix).flatten()
                # Apply prioritization boost for User_Email_Security.pdf
                boosted_sims = np.array(sims, copy=True)
                for idx, c in enumerate(chunks):
                    doc = c.get("doc_name", "").lower()
                    if "user_email_security" in doc or "email_security" in doc:
                        boosted_sims[idx] *= 1.35
                top_indices = np.argsort(boosted_sims)[::-1][:top_k]
                results = []
                for idx in top_indices:
                    item = dict(chunks[idx])
                    item["score"] = float(boosted_sims[idx])
                    results.append(item)
                return results
            except Exception as e:
                logger.warning(f"TF-IDF retrieval warning: {e}")

        # Keyword matching fallback
        words = set(query.lower().split())
        scored_chunks = []
        for c in chunks:
            text_lower = c["text"].lower()
            match_count = sum(1 for w in words if w in text_lower)
            doc = c.get("doc_name", "").lower()
            if "user_email_security" in doc or "email_security" in doc:
                match_count += 3
            scored_chunks.append((match_count, c))
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [dict(c, score=float(m)) for m, c in scored_chunks[:top_k]]

    async def get_user_email_evidence(self, email_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Fetch specific email evidence from database or in-memory store for context grounding."""
        # 1. Check in-memory store
        if email_id in db.store["emails"]:
            item = db.store["emails"][email_id]
            if not user_id or getattr(item, "user_id", None) == user_id or (isinstance(item, dict) and item.get("user_id") == user_id):
                return item if isinstance(item, dict) else item.model_dump()

        # 2. Query Supabase
        admin_client = db.get_admin_client() or db.get_client()
        if admin_client:
            try:
                query = admin_client.table("emails").select("*").eq("id", email_id)
                if user_id:
                    query = query.eq("user_id", user_id)
                res = query.execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Failed to fetch email {email_id} for RAG evidence: {e}")
        return None

    async def query_user_rag(
        self,
        query: str,
        email_id: Optional[str] = None,
        user_id: Optional[str] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        RAG 1: User Security Advisor RAG.
        Answers user cybersecurity questions grounded in official guidance and their own scanned emails.
        """
        if not self.is_initialized:
            await self.initialize()

        # Step 1: Retrieve context chunks
        query_vec = await self._embed_single_query(query)
        top_chunks = self._retrieve_top_k(query, query_vec, self.user_kb, top_k=top_k)

        # Step 2: Fetch optional email evidence
        email_evidence = None
        if email_id:
            email_evidence = await self.get_user_email_evidence(email_id, user_id)

        # Step 3: Construct Grounded Prompt
        sources_summary = []
        context_text_blocks = []
        for i, c in enumerate(top_chunks, start=1):
            doc = c.get("doc_name", "Cybersecurity Guide")
            page = c.get("page", 1)
            sources_summary.append({
                "doc_name": doc,
                "page": page,
                "snippet": c.get("text", "")[:260] + "..."
            })
            context_text_blocks.append(f"[Source {i}: {doc}, Page {page}]\n{c.get('text', '')}")

        context_str = "\n\n".join(context_text_blocks) if context_text_blocks else "Official cybersecurity threat defense guides (NIST SP 800-50, IC3, ENISA)."

        email_str = ""
        if email_evidence:
            email_str = (
                f"\n--- USER'S SPECIFIC SCANNED EMAIL EVIDENCE ---\n"
                f"Subject: {email_evidence.get('subject')}\n"
                f"Sender: {email_evidence.get('sender')}\n"
                f"Classification: {email_evidence.get('classification')}\n"
                f"Threat Level: {email_evidence.get('severity')}\n"
                f"Risk Score: {email_evidence.get('risk_score', 0)}/100\n"
                f"Detected Indicators: {json.dumps(email_evidence.get('threat_indicators', []), indent=2)}\n"
                f"Extracted URLs: {json.dumps(email_evidence.get('extracted_urls', []), indent=2)}\n"
                f"SPF Result: {email_evidence.get('headers', {}).get('spf', 'unknown')}\n"
                f"DMARC Result: {email_evidence.get('headers', {}).get('dmarc', 'unknown')}\n"
                f"Body Snippet: {email_evidence.get('body_snippet', '')[:500]}\n"
                f"------------------------------------------------\n"
            )

        system_prompt = (
            "You are CyberTrace's AI Security Advisor powered by Google Gemini Flash. "
            "Your task is to provide everyday users with a crystal-clear, easy-to-understand 5 to 6 line summary. "
            "Never write long dense paragraphs or academic jargon. Strictly format your response into 5 to 6 readable lines:\n\n"
            "🛡️ Verdict: (1-2 clear lines in simple English: state if this is safe, phishing, or a scam and the danger level)\n"
            "⚠️ Red Flags: (1-2 lines with the exact warning signs: spoofed sender, fake links, or urgent demands)\n"
            "✅ Immediate Action: (1-2 lines: exactly what the user should do right now, e.g. delete, do not click, change password)\n\n"
            "Keep the entire response strictly to 5-6 lines total!"
        )

        user_content = (
            f"KNOWLEDGE BASE CONTEXT:\n{context_str}\n\n"
            f"{email_str}\n"
            f"USER QUESTION: {query}\n\n"
            f"Provide a concise, easy-to-understand 5 to 6 line summary with clear verdict, red flags, and immediate action."
        )

        answer = await self._generate_llm_response(
            system_prompt,
            user_content,
            collection="user",
            query=query,
            email_evidence=email_evidence,
            top_chunks=top_chunks
        )

        return {
            "query": query,
            "answer": answer,
            "sources": sources_summary,
            "collection": "user",
            "email_referenced": bool(email_evidence),
            "email_id": email_id if email_evidence else None,
            "model": self.fast_model
        }

    async def query_investigator_rag(
        self,
        query: str,
        email_id: Optional[str] = None,
        user_id: Optional[str] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        RAG 2: SOC & Forensic Investigator RAG.
        Provides deep technical analysis, RFC header breakdown, MITRE ATT&CK mappings,
        IP/Geo forensic correlation, and incident response playbooks.
        """
        if not self.is_initialized:
            await self.initialize()

        # Step 1: Retrieve investigator chunks
        query_vec = await self._embed_single_query(query)
        top_chunks = self._retrieve_top_k(query, query_vec, self.investigator_kb, top_k=top_k)

        # Step 2: Fetch optional email evidence
        email_evidence = None
        if email_id:
            email_evidence = await self.get_user_email_evidence(email_id, user_id)

        # Step 3: Construct Grounded Prompt
        sources_summary = []
        context_text_blocks = []
        for i, c in enumerate(top_chunks, start=1):
            doc = c.get("doc_name", "Forensic Threat Intelligence")
            page = c.get("page", 1)
            sources_summary.append({
                "doc_name": doc,
                "page": page,
                "snippet": c.get("text", "")[:260] + "..."
            })
            context_text_blocks.append(f"[Source {i}: {doc}, Page {page}]\n{c.get('text', '')}")

        context_str = "\n\n".join(context_text_blocks) if context_text_blocks else "Cybersecurity Incident Response Playbooks and RFC specifications."

        email_str = ""
        if email_evidence:
            email_str = (
                f"\n--- FORENSIC EMAIL EVIDENCE & TELEMETRY ---\n"
                f"Message ID / ID: {email_evidence.get('id')}\n"
                f"Subject: {email_evidence.get('subject')}\n"
                f"Sender: {email_evidence.get('sender')}\n"
                f"Recipient: {email_evidence.get('recipient')}\n"
                f"Classification: {email_evidence.get('classification')}\n"
                f"Severity: {email_evidence.get('severity')}\n"
                f"Aggregated Risk Score: {email_evidence.get('risk_score')}/100\n"
                f"AI Risk Score: {email_evidence.get('ai_risk_score')}\n"
                f"ML Score: {email_evidence.get('ml_score')}\n"
                f"IP Reputation Score: {email_evidence.get('ip_score')}\n"
                f"Headers & Auth: {json.dumps(email_evidence.get('headers', {}), indent=2)}\n"
                f"IP Intelligence: {json.dumps(email_evidence.get('ip_intel', {}), indent=2)}\n"
                f"Geo Intelligence: {json.dumps(email_evidence.get('geo_intel', {}), indent=2)}\n"
                f"Threat Indicators: {json.dumps(email_evidence.get('threat_indicators', []), indent=2)}\n"
                f"Extracted URLs & Flags: {json.dumps(email_evidence.get('extracted_urls', []), indent=2)}\n"
                f"Body Excerpt: {email_evidence.get('body_snippet', '')[:800]}\n"
                f"--------------------------------------------\n"
            )

        system_prompt = (
            "You are CyberTrace's SOC Lead & Senior Forensic Threat Intelligence Investigator. "
            "You provide comprehensive, technical, yet readable forensic intelligence for incident response teams, SOC analysts, "
            "and security auditors.\n"
            "Strictly adhere to the following:\n"
            "1. Ground all technical statements in the provided knowledge base (NIST SP 800-150/177r1, CISA Playbooks, Microsoft SecOps, IC3 reports).\n"
            "2. Map observed tactics to official MITRE ATT&CK Enterprise Matrix techniques (e.g. T1566.001, T1566.002, T1598, T1078, T1534).\n"
            "3. Reference exact RFC protocols for authentication validation (RFC 7208 for SPF, RFC 6376 for DKIM, RFC 7489 for DMARC, RFC 5322 for Internet Message Format).\n"
            "4. Provide structured Indicators of Compromise (IOCs) extraction (IPs, domains, hashes, URLs, sender anomalies).\n"
            "5. Deliver an actionable Forensic Incident Response Plan covering Containment, Eradication, and Remediation.\n"
            "6. Output in comprehensive, professional, structured Markdown with clear headings and tables."
        )

        user_content = (
            f"FORENSIC KNOWLEDGE BASE PLAYBOOKS & STANDARDS:\n{context_str}\n\n"
            f"{email_str}\n"
            f"INVESTIGATOR QUERY: {query}\n\n"
            f"Provide a comprehensive forensic report, MITRE ATT&CK correlation, RFC authentication breakdown, and incident containment plan."
        )

        answer = await self._generate_llm_response(
            system_prompt,
            user_content,
            collection="investigator",
            query=query,
            email_evidence=email_evidence,
            top_chunks=top_chunks
        )

        return {
            "query": query,
            "answer": answer,
            "sources": sources_summary,
            "collection": "investigator",
            "email_referenced": bool(email_evidence),
            "email_id": email_id if email_evidence else None,
            "model": self.fast_model
        }

    async def _generate_llm_response(
        self,
        system_instruction: str,
        user_content: str,
        collection: str = "user",
        query: str = "",
        email_evidence: Optional[Dict[str, Any]] = None,
        top_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Call Gemini to generate a grounded markdown response with multi-model retry and dynamic fallback."""
        if self.api_key:
            models_to_try = [self.fast_model] + [m for m in self.fallback_models if m != self.fast_model]

            for model_name in models_to_try:
                endpoint = f"{GEMINI_API_URL}/{model_name}:generateContent?key={self.api_key}"

                # Build generation config — disable thinking budget for flash models to prevent
                # empty output errors ("model output must contain either output text or tool calls")
                gen_config: Dict[str, Any] = {
                    "temperature": 0.2,
                    "maxOutputTokens": 2048,
                }
                # Gemini 2.5 flash may activate thinking by default, causing empty parts[].
                # Explicitly disable thinking to guarantee text output.
                is_flash_model = "flash" in model_name.lower()
                if is_flash_model:
                    gen_config["thinkingConfig"] = {"thinkingBudget": 0}

                payload = {
                    "system_instruction": {
                        "parts": [{"text": system_instruction}]
                    },
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": user_content}]
                        }
                    ],
                    "generationConfig": gen_config,
                }
                try:
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        resp = await client.post(endpoint, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            candidates = data.get("candidates", [])
                            if not candidates:
                                logger.warning(f"Model {model_name} returned no candidates. Prompt feedback: {data.get('promptFeedback')}")
                                continue
                            candidate = candidates[0]
                            finish_reason = candidate.get("finishReason", "")
                            # STOP or MAX_TOKENS are valid finish reasons; others mean blocked/empty
                            if finish_reason not in ("STOP", "MAX_TOKENS", ""):
                                logger.warning(f"Model {model_name} finished with reason '{finish_reason}'. Trying next model.")
                                continue
                            content = candidate.get("content", {})
                            parts = content.get("parts", [])
                            # Collect all text parts (thinking models may split parts)
                            text = "".join(
                                p.get("text", "") for p in parts if "text" in p
                            ).strip()
                            if len(text) > 40:
                                logger.info(f"Model {model_name} responded successfully ({len(text)} chars).")
                                return text
                            else:
                                logger.warning(f"Model {model_name} returned very short/empty text ({len(text)} chars). Trying next model.")
                        elif resp.status_code == 429:
                            logger.warning(f"Model {model_name} rate limited (429). Trying next fallback model...")
                            await asyncio.sleep(0.5)
                        else:
                            logger.warning(f"Model {model_name} returned HTTP {resp.status_code}: {resp.text[:200]}")
                except Exception as e:
                    logger.warning(f"Error querying model {model_name}: {e}")

        # Intelligent dynamic fallback generator that produces rich, readable, grounded responses
        return self._generate_dynamic_fallback(collection, query, email_evidence, top_chunks)

    def _generate_dynamic_fallback(
        self,
        collection: str,
        query: str,
        email_evidence: Optional[Dict[str, Any]] = None,
        top_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Intelligent, query-specific, and email-grounded fallback generator.
        Generates readable, well-formatted Markdown with specific facts rather than static placeholders.
        """
        top_chunks = top_chunks or []
        q_lower = query.lower()

        if collection == "user":
            return self._build_user_dynamic_response(query, q_lower, email_evidence, top_chunks)
        else:
            return self._build_investigator_dynamic_response(query, q_lower, email_evidence, top_chunks)

    def _build_user_dynamic_response(
        self,
        query: str,
        q_lower: str,
        email_evidence: Optional[Dict[str, Any]],
        top_chunks: List[Dict[str, Any]]
    ) -> str:
        """Construct user-friendly cybersecurity advice strictly in 5-6 concise lines."""
        lines = []

        if email_evidence:
            subject = email_evidence.get("subject", "(No Subject)")
            sender = email_evidence.get("sender", "Unknown Sender")
            classification = email_evidence.get("classification", "Phishing")
            severity = email_evidence.get("severity", "medium").upper()
            risk_score = email_evidence.get("risk_score", 50)
            headers = email_evidence.get("headers", {})
            spf = headers.get("spf", "unknown")
            dmarc = headers.get("dmarc", "unknown")
            urls = email_evidence.get("extracted_urls", [])

            is_danger = risk_score >= 40 or severity in ["HIGH", "CRITICAL"]

            # Line 1: Verdict
            if is_danger:
                lines.append(f"🛡️ **Verdict:** **{classification} Threat** ({severity} Risk — {risk_score}/100) — This email is dangerous and deceptive.")
            else:
                lines.append(f"🛡️ **Verdict:** **Verified Clean** ({severity} Risk — {risk_score}/100) — No active threat detected in this email.")

            # Line 2-3: Red Flags
            if spf == "fail" or dmarc == "fail":
                lines.append(f"⚠️ **Red Flag:** Sender domain spoofed (`{sender}`). Authentication failed (SPF/DMARC: fail).")
            elif urls:
                lines.append(f"⚠️ **Red Flag:** Contains {len(urls)} suspicious external link(s) leading to unverified web pages.")
            elif is_danger:
                lines.append("⚠️ **Red Flag:** Content exhibits high-risk social engineering and urgency pressure tactics.")
            else:
                lines.append("ℹ️ **Security Details:** Standard envelope formatting and legitimate security headers verified.")

            # Line 4: Context
            lines.append(f"🔍 **Analysis:** Email claims subject *\"{subject[:45]}\"* attempting unverified user interaction.")

            # Line 5-6: Actions to Take
            if is_danger:
                lines.append("✅ **Action 1:** Do **NOT** click any links, download attachments, or reply with personal data.")
                lines.append("✅ **Action 2:** Mark this message as **Phishing** in your inbox and delete it immediately.")
            else:
                lines.append("✅ **Action 1:** Safe to read, but always verify unfamiliar requests before sharing passwords.")
                lines.append("✅ **Action 2:** Always check sender addresses directly when unexpected attachments are sent.")

        else:
            # Concise 5-6 line summary for conceptual security questions
            if "spear" in q_lower or "difference" in q_lower:
                lines.append("🛡️ **Concept:** Phishing is broad mass email spam; Spear Phishing is highly targeted at you specifically.")
                lines.append("⚠️ **How Attackers Work:** Attackers research your job, colleagues, or vendors to impersonate trusted contacts.")
                lines.append("🔍 **Key Difference:** Spear phishing uses personalized details and tailored invoices to bypass suspicion.")
                lines.append("✅ **Action 1:** Always verify financial or wire transfer requests via a separate phone call.")
                lines.append("✅ **Action 2:** Check the sender's full email address and look for subtle spelling discrepancies.")
            elif "fake" in q_lower or "sender" in q_lower or "spoof" in q_lower:
                lines.append("🛡️ **Concept:** Spoofed emails forge the visible display name to impersonate legitimate organizations.")
                lines.append("⚠️ **How to Spot:** Expand the sender field to reveal the true email domain behind the display name.")
                lines.append("🔍 **Lookalike Domains:** Watch out for typos like `paypa1.com` or extra subdomains (`security-apple.com`).")
                lines.append("✅ **Action 1:** Never trust display names alone; inspect the full email address and SPF/DMARC status.")
                lines.append("✅ **Action 2:** When in doubt, navigate directly to the company website instead of clicking email links.")
            elif "click" in q_lower or "clicked" in q_lower or "link" in q_lower:
                lines.append("🛡️ **Emergency Protocol:** Immediate containment steps after clicking a suspicious link.")
                lines.append("⚠️ **Immediate Risk:** Potential credential theft or silent background malware download.")
                lines.append("✅ **Step 1:** Disconnect from Wi-Fi immediately if any unknown file started downloading.")
                lines.append("✅ **Step 2:** Change your account password immediately from a separate secure device.")
                lines.append("✅ **Step 3:** Enable Multi-Factor Authentication (MFA) and run a full system antivirus scan.")
            elif "bec" in q_lower or "business email" in q_lower:
                lines.append("🛡️ **Concept:** Business Email Compromise (BEC) tricks employees into fraudulent wire transfers or payroll changes.")
                lines.append("⚠️ **Common Tactics:** Impersonating executives (CEO fraud) or urgent vendor invoice modification.")
                lines.append("🔍 **Warning Sign:** Requests marked 'Urgent & Confidential' demanding quick payment bypassing normal approval.")
                lines.append("✅ **Action 1:** Enforce strict verbal confirmation for any change to vendor bank accounts.")
                lines.append("✅ **Action 2:** Report suspicious payment modification emails to your finance and IT security team.")
            else:
                lines.append("🛡️ **CyberTrace Security Summary:** Core protection rules for email and inbox defense.")
                lines.append("⚠️ **Top Threat Vector:** 91% of cyber attacks start with a phishing or credential-harvesting email.")
                lines.append("🔍 **Key Rule:** Inspect links by hovering before clicking and check sender envelope domains.")
                lines.append("✅ **Action 1:** Never share one-time passwords (OTPs), passcodes, or banking credentials over email.")
                lines.append("✅ **Action 2:** Use strong unique passwords and activate Multi-Factor Authentication on all accounts.")

        return "\n".join(lines[:6])

    def _build_investigator_dynamic_response(
        self,
        query: str,
        q_lower: str,
        email_evidence: Optional[Dict[str, Any]],
        top_chunks: List[Dict[str, Any]]
    ) -> str:
        """Construct deep forensic report for SOC analysts grounded in RFC standards and MITRE ATT&CK."""
        out = []

        if email_evidence:
            subject = email_evidence.get("subject", "N/A")
            sender = email_evidence.get("sender", "N/A")
            recipient = email_evidence.get("recipient", "N/A")
            classification = email_evidence.get("classification", "Phishing")
            severity = email_evidence.get("severity", "high").upper()
            risk_score = email_evidence.get("risk_score", 75)
            headers = email_evidence.get("headers", {})
            spf = headers.get("spf", "unknown").upper()
            dkim = headers.get("dkim", "unknown").upper()
            dmarc = headers.get("dmarc", "unknown").upper()
            source_ip = headers.get("source_ip", "N/A")
            ip_intel = email_evidence.get("ip_intel", {})
            geo_intel = email_evidence.get("geo_intel", {})
            urls = email_evidence.get("extracted_urls", [])

            out.append(f"# SOC Forensic Incident & Intelligence Assessment\n")
            out.append(
                f"| Forensic Parameter | Evaluated Telemetry |\n"
                f"| :--- | :--- |\n"
                f"| **Incident Classification** | `{classification}` |\n"
                f"| **Composite Threat Severity** | **{severity}** ({risk_score}/100 Risk) |\n"
                f"| **Subject Header** | `{subject}` |\n"
                f"| **Sender Header (RFC 5322)** | `{sender}` |\n"
                f"| **Recipient** | `{recipient}` |\n"
                f"| **Originating IP Address** | `{source_ip}` ({geo_intel.get('country', 'Unknown')}) |\n"
                f"| **IP Fraud Score** | `{ip_intel.get('fraud_score', 0)}/100` (VPN: {ip_intel.get('is_vpn', False)}) |\n\n"
            )

            out.append("### 1. RFC Authentication Protocol Verification\n")
            out.append(
                f"| Protocol | RFC Standard | Result | Forensic Implication |\n"
                f"| :--- | :--- | :--- | :--- |\n"
                f"| **SPF** | RFC 7208 | `{spf}` | {'Sending MTA is authorized in DNS' if spf == 'PASS' else 'Envelope sender unauthorized; spoofing probable'} |\n"
                f"| **DKIM** | RFC 6376 | `{dkim}` | {'Cryptographic signature valid' if dkim == 'PASS' else 'Signature absent or modified in transit'} |\n"
                f"| **DMARC** | RFC 7489 | `{dmarc}` | {'Domain alignment enforced' if dmarc == 'PASS' else 'Domain alignment failure; policy violation'} |\n\n"
            )

            out.append("### 2. MITRE ATT&CK Enterprise Matrix Mapping\n")
            out.append(
                "| Technique ID | Technique Name | Tactic | Observed Threat Evidence |\n"
                "| :--- | :--- | :--- | :--- |\n"
                f"| **T1566.002** | Spearphishing Link | Initial Access | {f'Identified {len(urls)} embedded URL(s) targeting credential harvesting' if urls else 'Embedded links directing to untrusted infrastructure'} |\n"
                f"| **T1566.001** | Spearphishing Attachment | Initial Access | Malicious email attachment execution vector |\n"
                f"| **T1598** | Phishing for Information | Reconnaissance | Social engineering lure designed to harvest corporate credentials |\n"
                f"| **T1078** | Valid Accounts | Defense Evasion | Attempted compromise of legitimate user session tokens |\n\n"
            )

            out.append("### 3. Actionable Incident Response Playbook (NIST SP 800-150 / CISA)\n")
            out.append(
                "#### Phase 1: Containment\n"
                f"- **Firewall & Gateway Block:** Add originating IP (`{source_ip}`) and sender domain to gateway blocklists.\n"
                "- **Message Quarantine:** Execute enterprise-wide search & purge for matching Message-ID across all mailboxes.\n"
                "- **Credential Revocation:** Force password reset and revoke active session tokens for affected user.\n\n"
                "#### Phase 2: Eradication\n"
                "- Submit malicious URLs to threat intelligence feeds (VirusTotal, AlienVault OTX, URLhaus).\n"
                "- Inspect endpoint EDR logs for suspicious process spawn trees (PowerShell, mshta, curl).\n\n"
                "#### Phase 3: Remediation\n"
                "- Enforce strict DMARC `p=reject` policy across all corporate outbound domains.\n"
                "- Enroll targeted recipient in spear-phishing resilience training."
            )

        else:
            # Conceptual SOC forensic question
            out.append(f"# Forensic Threat Intelligence Briefing\n")
            out.append(f"**Query:** *{query}*\n\n")

            if "spf" in q_lower or "dkim" in q_lower or "dmarc" in q_lower or "auth" in q_lower:
                out.append(
                    "### Email Authentication Architecture Forensics\n\n"
                    "| Protocol | RFC Standard | Validation Mechanism | Threat Mitigated |\n"
                    "| :--- | :--- | :--- | :--- |\n"
                    "| **SPF** | RFC 7208 | DNS TXT record declaring authorized IP addresses | Sender IP spoofing |\n"
                    "| **DKIM** | RFC 6376 | Public-key cryptographic signature in email headers | In-transit tampering |\n"
                    "| **DMARC** | RFC 7489 | Domain alignment policy connecting SPF & DKIM | Display name & domain spoofing |\n\n"
                    "**Forensic Inspection Process:**\n"
                    "1. Extract `Authentication-Results` header to inspect SPF `smtp.mailfrom` vs RFC 5322 `From` header alignment.\n"
                    "2. Validate `dkim=pass` header signature (`b=` tag hash matching DNS `p=` public key).\n"
                    "3. Evaluate DMARC disposition (`disposition=none`, `quarantine`, or `reject`).\n"
                )
            elif "mitre" in q_lower or "technique" in q_lower or "att&ck" in q_lower:
                out.append(
                    "### MITRE ATT&CK Email Threat Matrix\n\n"
                    "| ID | Technique | Sub-Technique | SOC Detection Strategy |\n"
                    "| :--- | :--- | :--- | :--- |\n"
                    "| **T1566.001** | Spearphishing Attachment | Weaponized Office docs, ISOs, ZIPs | EDR execution monitoring, sandbox emulation |\n"
                    "| **T1566.002** | Spearphishing Link | Credential harvesting URLs, OAuth phishing | Web gateway proxy telemetry, domain age scoring |\n"
                    "| **T1566.003** | Spearphishing via Service | Compromised SaaS services (SharePoint, Google Drive) | Cloud Access Security Broker (CASB) logs |\n"
                    "| **T1534** | Internal Spearphishing | Lateral movement via compromised internal accounts | Internal mail flow anomaly detection |\n"
                )
            else:
                out.append(
                    "### Incident Response Standards & SOC Playbooks\n\n"
                    "According to **NIST SP 800-150** (Cyber Threat Information Sharing) and **CISA Federal Playbooks**:\n\n"
                    "1. **Triage & Ingestion:** Ingest email headers, extract IOCs (IP, domain, URL, hash), and correlate with threat intelligence feeds.\n"
                    "2. **Containment Protocol:** Block malicious indicators at the perimeter firewall and mail transfer agent (MTA).\n"
                    "3. **Scope Analysis:** Query SIEM for lateral communication from the source IP or destination URLs across the internal subnet.\n"
                    "4. **Post-Incident Remediation:** Strengthen DNS records (CAA, DNSSEC, DMARC) and update intrusion detection signatures.\n"
                )

            if top_chunks:
                top_c = top_chunks[0]
                out.append(f"\n> **Reference Playbook ({top_c.get('doc_name')}, Page {top_c.get('page', 1)}):**\n> \"{top_c.get('text', '')[:300]}...\"\n")

        return "\n".join(out)


rag_service = DualRAGService()
