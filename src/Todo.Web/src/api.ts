export type Todo = { id: string; title: string; description: string | null; isCompleted: boolean; createdAt: string }
export type TodoInput = { title: string; description: string | null; isCompleted: boolean }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try { response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } }) }
  catch { throw new Error('Could not reach the server. Check that the API is running and try again.') }
  if (!response.ok) {
    let message = `The server could not complete the request (${response.status}).`
    try {
      const body = await response.json() as { title?: string; detail?: string; errors?: Record<string, string[]> }
      const errors = body.errors && Object.values(body.errors).flat().join(' ')
      message = errors || body.detail || body.title || message
    } catch { /* The API may return an empty or non-JSON error. */ }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return await response.json() as T
}
export const api = {
  list: () => request<Todo[]>('/api/todos'),
  create: (data: Pick<TodoInput, 'title' | 'description'>) => request<{ id: string }>('/api/todos', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: TodoInput) => request<void>(`/api/todos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/api/todos/${id}`, { method: 'DELETE' }),
}
