import { request } from './api'

export interface RAGSourceSnippet {
  doc_name: string
  page: number
  snippet: string
}

export interface RAGQueryRequest {
  query: string
  email_id?: string
  top_k?: number
}

export interface RAGQueryResponse {
  query: string
  answer: string
  sources: RAGSourceSnippet[]
  collection: 'user' | 'investigator'
  email_referenced: boolean
  email_id?: string
  model: string
}

export interface RAGStatusResponse {
  status: string
  is_initialized: boolean
  user_chunks_count: number
  investigator_chunks_count: number
  user_documents: string[]
  investigator_documents: string[]
}

export const ragApi = {
  queryUserRAG: async (query: string, emailId?: string, topK: number = 5): Promise<RAGQueryResponse> => {
    return request<RAGQueryResponse>('/rag/user-query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        email_id: emailId || undefined,
        top_k: topK
      })
    })
  },

  queryInvestigatorRAG: async (query: string, emailId?: string, topK: number = 5): Promise<RAGQueryResponse> => {
    return request<RAGQueryResponse>('/rag/investigator-query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        email_id: emailId || undefined,
        top_k: topK
      })
    })
  },

  getStatus: async (): Promise<RAGStatusResponse> => {
    return request<RAGStatusResponse>('/rag/status')
  },

  reindex: async (): Promise<{ message: string }> => {
    return request<{ message: string }>('/rag/reindex', {
      method: 'POST'
    })
  }
}
