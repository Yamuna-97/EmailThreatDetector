const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export class ApiError extends Error {
  status: number
  data: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('vaultshield_token')
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`
      let errorData = null

      try {
        errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch {
        errorMessage = await response.text().catch(() => errorMessage)
      }

      throw new ApiError(errorMessage, response.status, errorData)
    }

    if (response.status === 204) {
      return {} as T
    }

    // Check if response is blob / pdf
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/pdf')) {
      return (await response.blob()) as unknown as T
    }

    return await response.json()
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err
    }
    throw new ApiError(err.message || 'Network connection to FastAPI failed', 0)
  }
}

export default request
