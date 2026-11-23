import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, type Todo } from './api'

type Filter = 'all' | 'active' | 'completed'
const message = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.'
const formatDate = (date: string) => { const parsed = new Date(date); return Number.isNaN(parsed.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed) }

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<Todo | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Todo | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setTodos(await api.list()) } catch (e) { setError(message(e)) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const remaining = todos.filter(todo => !todo.isCompleted).length
  const completed = todos.length - remaining
  const visible = useMemo(() => todos.filter(todo => {
    const matchesFilter = filter === 'all' || (filter === 'completed' ? todo.isCompleted : !todo.isCompleted)
    const term = search.trim().toLocaleLowerCase()
    return matchesFilter && (!term || `${todo.title} ${todo.description ?? ''}`.toLocaleLowerCase().includes(term))
  }).sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted) || Date.parse(b.createdAt) - Date.parse(a.createdAt)), [todos, filter, search])
  const openForm = (todo?: Todo) => { setEditing(todo ?? null); setTitle(todo?.title ?? ''); setDescription(todo?.description ?? ''); setError(''); setFormOpen(true) }
  const closeForm = () => { if (!saving) { setFormOpen(false); setEditing(null) } }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) { setError('Please enter a task title.'); return }
    setSaving(true); setError(''); setNotice('')
    try {
      if (editing) {
        const input = { title: cleanTitle, description: description.trim() || null, isCompleted: editing.isCompleted }
        await api.update(editing.id, input)
        setTodos(current => current.map(todo => todo.id === editing.id ? { ...todo, ...input } : todo))
        setNotice('Task updated.')
      } else {
        await api.create({ title: cleanTitle, description: description.trim() || null })
        setFormOpen(false); setNotice('Task added.'); await load()
      }
      setFormOpen(false); setEditing(null)
    } catch (e) { setError(message(e)) } finally { setSaving(false) }
  }
  const toggle = async (todo: Todo) => {
    setBusy(todo.id); setError(''); setNotice('')
    try {
      await api.update(todo.id, { title: todo.title, description: todo.description, isCompleted: !todo.isCompleted })
      setTodos(current => current.map(item => item.id === todo.id ? { ...item, isCompleted: !item.isCompleted } : item))
    } catch (e) { setError(message(e)) } finally { setBusy(null) }
  }
  const remove = async () => {
    if (!deleting) return
    setBusy(deleting.id); setError(''); setNotice('')
    try { await api.remove(deleting.id); setTodos(current => current.filter(todo => todo.id !== deleting.id)); setDeleting(null); setNotice('Task deleted.') }
    catch (e) { setError(message(e)); setDeleting(null) } finally { setBusy(null) }
  }
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark" aria-hidden="true"><span /></span><span>daymark<span className="brand-period">.</span></span></div><span className="top-label">A LITTLE SPACE TO GET THINGS DONE</span></header>
    <main className="workspace">
      <div className="page-heading"><div><p className="eyebrow">YOUR PERSONAL WORKSPACE</p><h1>Make today count<span>.</span></h1><p>Everything you need to remember, in one place.</p></div><button className="primary add-button" onClick={() => openForm()}><span aria-hidden="true">+</span> New task</button></div>
      <div className="workspace-grid">
      <section className="list-section" aria-labelledby="tasks-heading"><div className="section-heading"><div><p className="eyebrow muted">YOUR LIST</p><h2 id="tasks-heading">Tasks <span>{todos.length}</span></h2></div><button className="text-button" onClick={() => void load()} disabled={loading || !!busy || saving}>Refresh</button></div>
        <div className="toolbar"><div className="tabs" aria-label="Filter tasks">{(['all', 'active', 'completed'] as const).map(item => <button key={item} className={filter === item ? 'selected' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item === 'all' ? 'All tasks' : item === 'active' ? 'To do' : 'Completed'} <span>{item === 'all' ? todos.length : item === 'active' ? remaining : completed}</span></button>)}</div><label className="search"><span className="search-icon" aria-hidden="true" /><span className="sr-only">Search tasks</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks" /></label></div>
        {error && <div className="alert" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
        {notice && <p className="notice" role="status">{notice}</p>}
        {loading ? <div className="empty"><div className="empty-icon">...</div><h3>Getting your tasks</h3><p>Just a moment.</p></div> : error && todos.length === 0 ? <div className="empty"><div className="empty-icon">!</div><h3>Couldn't load your tasks</h3><p>Check your connection and give it another try.</p><button className="secondary" onClick={() => void load()}>Try again</button></div> : visible.length === 0 ? <div className="empty"><div className="empty-icon">&#10003;</div><h3>{todos.length === 0 ? 'A clear space to begin' : 'Nothing here right now'}</h3><p>{todos.length === 0 ? 'Add your first task and take it from there.' : 'Try a different filter or search term.'}</p>{todos.length === 0 && <button className="secondary" onClick={() => openForm()}>Add your first task</button>}</div> :<ul className="task-list">{visible.map(todo => <li key={todo.id} className={todo.isCompleted ? 'task done' : 'task'}><button className="check" disabled={!!busy || saving} aria-label={`${todo.isCompleted ? 'Mark as not completed' : 'Complete'}: ${todo.title}`} onClick={() => void toggle(todo)}>{todo.isCompleted && '\u2713'}</button><div className="task-content"><h3>{todo.title}</h3>{todo.description && <p>{todo.description}</p>}<span className="task-date">Added {formatDate(todo.createdAt)}</span></div><div className="task-actions"><button disabled={!!busy || saving} onClick={() => openForm(todo)}>Edit</button><button disabled={!!busy || saving} onClick={() => setDeleting(todo)}>Delete</button></div>{busy === todo.id && <span className="sync" role="status">Saving…</span>}</li>)}</ul>}
        <div className="list-footer"><span>{visible.length} {visible.length === 1 ? 'task' : 'tasks'} shown</span><span>ONE THING AT A TIME</span></div>
      </section>
      <aside className="sidebar" aria-label="Task summary"><div className="summary-heading"><span>AT A GLANCE</span><span className="summary-mark" aria-hidden="true">/</span></div><div className="summary-total"><strong>{remaining}</strong><span>tasks left<br />to do</span></div><div className="summary-line" /><div className="summary-row"><span>Completed</span><strong>{completed}</strong></div><div className="summary-row"><span>Total tasks</span><strong>{todos.length}</strong></div><div className="progress" role="progressbar" aria-label="Tasks completed" aria-valuemin={0} aria-valuemax={todos.length || 1} aria-valuenow={completed}><span style={{ width: `${todos.length ? completed / todos.length * 100 : 0}%` }} /></div><p className="summary-caption">{todos.length ? `${Math.round(completed / todos.length * 100)}% complete` : 'Your progress will show up here.'}</p></aside>
      </div>
      <section className="about" aria-labelledby="about-heading"><div><p className="eyebrow">A LITTLE ABOUT DAYMARK</p><h2 id="about-heading">A clearer head starts with a list.</h2></div><div className="about-copy"><p>Daymark is a simple place to keep track of the things you want to get done, big or small.</p><p>Add a task and any notes you need, check it off when it's done, and use the filters or search to find it again.</p></div></section>
      <footer><span>DAYMARK / YOUR SPACE TO GET THINGS DONE</span><a href="#tasks-heading">Back to your list</a></footer>
    </main>
    {formOpen && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) closeForm() }}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="form-heading"><div className="dialog-top"><div><p className="eyebrow muted">{editing ? 'MAKE A CHANGE' : 'A FRESH START'}</p><h2 id="form-heading">{editing ? 'Edit task' : 'Add a task'}</h2></div><button className="close" onClick={closeForm} aria-label="Close" disabled={saving}>×</button></div><p className="dialog-intro">{editing ? 'Update the details below.' : 'Get it out of your head and onto the list.'}</p><form onSubmit={e => void submit(e)}><label>Task title <span>Required</span><input autoFocus maxLength={200} value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to get done?" required /></label><div className="counter">{title.length} / 200</div><label>Notes <span>Optional</span><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add a little more detail..." rows={4} /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="secondary" onClick={closeForm} disabled={saving}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add task'}</button></div></form></div></div>}
    {deleting && <div className="overlay"><div className="dialog confirm" role="dialog" aria-modal="true" aria-labelledby="delete-heading"><p className="eyebrow muted">DELETE TASK</p><h2 id="delete-heading">Let this one go?</h2><p className="dialog-intro">“{deleting.title}” will be permanently deleted.</p><div className="dialog-actions"><button className="secondary" onClick={() => setDeleting(null)} disabled={!!busy}>Cancel</button><button className="danger" onClick={() => void remove()} disabled={!!busy}>{busy ? 'Deleting…' : 'Delete task'}</button></div></div></div>}
  </div>
}
