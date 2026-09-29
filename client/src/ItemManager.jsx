import { useState } from 'react'

export default function ItemManager({ items, disabled, onSave, onDelete }) {
  const [draft, setDraft] = useState({ name: '', description: '' })
  const [editing, setEditing] = useState(null)
  function reset() {
    setEditing(null)
    setDraft({ name: '', description: '' })
  }
  return (
    <section className="card p-3 p-md-4 mt-4" aria-labelledby="items-heading">
      <h2 id="items-heading" className="h3">Custom items</h2>
      <p>Create reusable items, then equip one per character in the Party table. Items currently don't change character stats. Deleting an item unequips it from every character.</p>
      <form className="row g-3 mb-4" onSubmit={async event => {
        event.preventDefault()
        if (await onSave(editing, draft)) reset()
      }}>
        <div className="col-md-4">
          <label className="form-label" htmlFor="item-name">Item name</label>
          <input id="item-name" className="form-control" required maxLength={100} disabled={disabled} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
        </div>
        <div className="col-md-8">
          <label className="form-label" htmlFor="item-description">Description (optional)</label>
          <textarea id="item-description" className="form-control" maxLength={1000} disabled={disabled} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
        </div>
        <div className="col-12 d-flex gap-2">
          <button className="btn btn-primary" disabled={disabled}>{editing ? 'Update item' : 'Create item'}</button>
          {editing && <button type="button" className="btn btn-outline-secondary" disabled={disabled} onClick={reset}>Cancel item editing</button>}
        </div>
      </form>
      {items.length === 0 && <p>No custom items yet.</p>}
      <ul className="list-group">
        {items.map(item => <li className="list-group-item" key={item.id}>
          <strong>{item.name}</strong><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.description}</p>
          <button type="button" className="btn btn-sm btn-outline-dark me-2" disabled={disabled} aria-label={`Edit item: ${item.name}`} onClick={() => { setEditing(item.id); setDraft({ name: item.name, description: item.description }) }}>Edit</button>
          <button type="button" className="btn btn-sm btn-danger" disabled={disabled} aria-label={`Delete item: ${item.name}`} onClick={async () => { if (await onDelete(item) && editing === item.id) reset() }}>Delete</button>
        </li>)}
      </ul>
    </section>
  )
}
