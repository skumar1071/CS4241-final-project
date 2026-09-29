const classes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard']
const species = ['Aasimar', 'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Goliath', 'Halfling', 'Human', 'Orc', 'Tiefling']
const fields = [
  { key: 'name', id: 'name', label: 'Name', type: 'text' },
  { key: 'class', id: 'class', label: 'Class', options: classes },
  { key: 'species', id: 'species', label: 'Species', options: species },
  { key: 'level', id: 'level', label: 'Level', type: 'number', min: 1, max: 20 },
  { key: 'currHp', id: 'curr-hp', label: 'Current HP', type: 'number', min: 0 },
  { key: 'maxHp', id: 'max-hp', label: 'Maximum HP', type: 'number', min: 1 },
]

export const emptyCharacter = () => ({ name: '', class: '', species: '', level: '', currHp: '', maxHp: '' })

export default function CharacterForm({ draft, editing, disabled, onChange, onSave, onCancel, nameRef, submitRef }) {
  return (
    <section id="form-section" className="card p-3 p-md-4 mb-4" aria-labelledby="form-heading">
      <h2 id="form-heading" className="h3">{editing ? `Edit ${editing.name}` : 'Add Character'}</h2>
      <p id="character-help" className="text-body-secondary">All fields are required. Level must be 1–20, and current HP cannot exceed maximum HP.</p>
      <form id="character-form" className="row g-3" aria-describedby="character-help app-error" onSubmit={(event) => { event.preventDefault(); onSave() }}>
        {fields.map(({ key, id, label, options, ...inputProps }) => {
          const props = { id, name: key, required: true, disabled, value: draft[key], onChange: (event) => onChange(key, event.target.value) }
          return (
            <div className="col-12 col-sm-6 col-lg-4" key={key}>
              <label className="form-label" htmlFor={id}>{label}</label>
              {options ? (
                <><input {...props} list={`${id}-suggestions`} className="form-control" placeholder={`Choose or enter a ${label.toLowerCase()}`} />
                  <datalist id={`${id}-suggestions`}>{options.map(option => <option key={option} value={option} />)}</datalist></>
              ) : <input {...props} {...inputProps} ref={key === 'name' ? nameRef : undefined} className="form-control" />}
            </div>
          )
        })}
        <div className="col-12 d-flex flex-wrap gap-2">
          <button ref={submitRef} disabled={disabled} type="submit" id="submit-button" className="btn btn-primary">{editing ? 'Update Character' : 'Add Character'}</button>
          {editing && <button disabled={disabled} type="button" id="cancel-edit" className="btn btn-outline-secondary" onClick={onCancel}>Cancel editing</button>}
        </div>
      </form>
    </section>
  )
}
