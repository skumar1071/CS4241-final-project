import { useState } from 'react'

const emptyEnemy = { name: '', description: '', minHp: '', maxHp: '', minDamage: '', maxDamage: '' }

export default function EnemyManager({ enemies, disabled, onSave, onDelete, onSpawn, onRollDamage }) {
  const [draft, setDraft] = useState(emptyEnemy)
  const [editing, setEditing] = useState(null)
  const [spawned, setSpawned] = useState({})

  function reset() {
    setEditing(null)
    setDraft(emptyEnemy)
  }

  async function spawn(enemy) {
    const result = await onSpawn(enemy.id)
    if (result) setSpawned(current => ({ ...current, [enemy.id]: result }))
  }

  async function rollDamage(enemy) {
    const result = await onRollDamage(enemy.id)
    if (result) setSpawned(current => ({ ...current, [enemy.id]: { ...current[enemy.id], lastDamage: result.damage } }))
  }

  return (
    <section className="card p-3 p-md-4 mt-4" aria-labelledby="enemies-heading">
      <h2 id="enemies-heading" className="h3">Custom enemies</h2>
      <form className="row g-3 mb-4" onSubmit={async event => {
        event.preventDefault()
        if (await onSave(editing, draft)) reset()
      }}>
        <div className="col-md-4">
          <label className="form-label" htmlFor="enemy-name">Enemy name</label>
          <input id="enemy-name" className="form-control" required maxLength={100} disabled={disabled} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
        </div>
        <div className="col-md-8">
          <label className="form-label" htmlFor="enemy-description">Description (optional)</label>
          <textarea id="enemy-description" className="form-control" maxLength={1000} disabled={disabled} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
        </div>
        {[['minHp', 'Minimum HP'], ['maxHp', 'Maximum HP'], ['minDamage', 'Minimum damage'], ['maxDamage', 'Maximum damage']].map(([key, label]) => (
          <div className="col-6 col-md-3" key={key}>
            <label className="form-label" htmlFor={`enemy-${key}`}>{label}</label>
            <input id={`enemy-${key}`} className="form-control" type="number" min="1" step="1" required disabled={disabled} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} />
          </div>
        ))}
        <div className="col-12 d-flex gap-2">
          <button className="btn btn-primary" disabled={disabled}>{editing ? 'Update enemy' : 'Create enemy'}</button>
          {editing && <button type="button" className="btn btn-outline-secondary" disabled={disabled} onClick={reset}>Cancel enemy editing</button>}
        </div>
      </form>
      {enemies.length === 0 && <p>No custom enemies yet.</p>}
      <ul className="list-group">
        {enemies.map(enemy => {
          const instance = spawned[enemy.id]
          return <li className="list-group-item" key={enemy.id}>
            <strong>{enemy.name}</strong>
            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{enemy.description}</p>
            <p>HP: {enemy.minHp}–{enemy.maxHp}; Damage: {enemy.minDamage}–{enemy.maxDamage}</p>
            {instance && <p className="mb-2">Spawned HP: {instance.hp}{instance.lastDamage !== undefined && <>; Last damage roll: {instance.lastDamage}</>}</p>}
            <button type="button" className="btn btn-sm btn-success me-2" disabled={disabled} onClick={() => spawn(enemy)}>Spawn</button>
            <button type="button" className="btn btn-sm btn-outline-success me-2" disabled={disabled || !instance} onClick={() => rollDamage(enemy)}>Roll damage</button>
            <button type="button" className="btn btn-sm btn-outline-dark me-2" disabled={disabled} aria-label={`Edit enemy: ${enemy.name}`} onClick={() => { setEditing(enemy.id); setDraft({ name: enemy.name, description: enemy.description, minHp: enemy.minHp, maxHp: enemy.maxHp, minDamage: enemy.minDamage, maxDamage: enemy.maxDamage }) }}>Edit</button>
            <button type="button" className="btn btn-sm btn-danger" disabled={disabled} aria-label={`Delete enemy: ${enemy.name}`} onClick={async () => { if (await onDelete(enemy) && editing === enemy.id) reset() }}>Delete</button>
          </li>
        })}
      </ul>
    </section>
  )
}
