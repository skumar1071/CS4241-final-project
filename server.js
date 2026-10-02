const express = require('express')
const path = require('path')
const { ObjectId, MongoError } = require('mongodb')
const { connectDatabase } = require('./db')
const { setupAuth, validateSessionSecret } = require('./auth')
const port = 3000

function getStatus(currHp, maxHp) {
  if (currHp <= 0) {
    return 'Dead'
  } else if (currHp <= maxHp / 2) {
    return 'Bloodied'
  }

  return 'Alive'
}

function invalidInput(message) {
  return Object.assign(new Error(message), { status: 400 })
}

function parseNumber(value, label) {
  if (
    !['string', 'number'].includes(typeof value) ||
    String(value).trim() === '' ||
    !Number.isFinite(Number(value))
  ) {
    throw invalidInput(`${label} must be a valid number.`)
  }
  return Number(value)
}

function parsePositiveInteger(value, label) {
  const number = parseNumber(value, label)
  if (!Number.isInteger(number) || number <= 0) {
    throw invalidInput(`${label} must be a positive integer.`)
  }
  return number
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function parseId(id) {
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) {
    throw invalidInput('Invalid record ID.')
  }
  return new ObjectId(id)
}

function parseCharacter(data) {
  const name = String(data.name || '').trim()
  const characterClass = String(data.class || '').trim()
  const species = String(data.species || '').trim()
  const level = parseNumber(data.level, 'Level')
  const currHp = parseNumber(data.currHp, 'Current HP')
  const maxHp = parseNumber(data.maxHp, 'Maximum HP')
  const equippedItemId = String(data.equippedItemId).trim()

  if (!name || !characterClass || !species) {
    throw invalidInput('Name, class, and species are required.')
  }

  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw invalidInput('Level must be an int from 1 to 20.')
  }

  if (!Number.isFinite(currHp) || !Number.isFinite(maxHp) || maxHp < 1) {
    throw invalidInput('Current HP and max HP must be valid numbers.')
  }

  if (currHp < 0 || currHp > maxHp) {
    throw invalidInput('Current HP must be between 0 and max HP.')
  }

  return {
    name,
    class: characterClass,
    species,
    level,
    currHp,
    maxHp,
    equippedItemId
  }
}

function createApp(db, authOptions) {
  const app = express()
  const characters = db.collection('characters')
  const items = db.collection('items')
  const enemies = db.collection('enemies')

  function parseItem(data) {
    const name = typeof data.name === 'string' ? data.name.trim() : ''
    const description = typeof data.description === 'string' ? data.description.trim() : ''
    const modifierType = typeof data.modifierType === 'string' ? data.modifierType.trim() : ''
    const modifier = typeof data.modifier === 'number' ? data.modifier : 0
    if (!name || name.length > 100 || description.length > 1000) {
      throw invalidInput('Item name is required (up to 100 characters); description must be at most 1000 characters.')
    }
    return { name, description, modifierType, modifier }
  }

  function parseEnemy(data) {
    const name = typeof data.name === 'string' ? data.name.trim() : ''
    const description = typeof data.description === 'string' ? data.description.trim() : ''
    const minHp = parsePositiveInteger(data.minHp, 'Minimum HP')
    const maxHp = parsePositiveInteger(data.maxHp, 'Maximum HP')
    const minDamage = parsePositiveInteger(data.minDamage, 'Minimum damage')
    const maxDamage = parsePositiveInteger(data.maxDamage, 'Maximum damage')

    if (!name || name.length > 100 || description.length > 1000) {
      throw invalidInput('Enemy name is required (up to 100 characters); description must be at most 1000 characters.')
    }
    if (minHp > maxHp) throw invalidInput('Minimum HP must not exceed maximum HP.')
    if (minDamage > maxDamage) throw invalidInput('Minimum damage must not exceed maximum damage.')

    return { name, description, minHp, maxHp, minDamage, maxDamage }
  }

  async function listItems(ownerId) {
    return (await items.find({ ownerId }).sort({ _id: 1 }).toArray())
      .map(({ _id, name, description, modifierType, modifier}) => ({ id: _id.toHexString(), name, description, modifierType, modifier }))
  }

  async function listEnemies(ownerId) {
    return (await enemies.find({ ownerId }).sort({ _id: 1 }).toArray())
      .map(({ _id, name, description, minHp, maxHp, minDamage, maxDamage }) => ({
        id: _id.toHexString(), name, description, minHp, maxHp, minDamage, maxDamage
      }))
  }

  async function listCharacters(ownerId) {
    const records = await characters.find({ ownerId }).sort({ _id: 1 }).toArray()
    const ownedItems = await listItems(ownerId)
    return records.map(({ _id, name, class: characterClass, species, level, currHp, maxHp, equippedItemId }) => ({
      id: _id.toHexString(),
      name,
      class: characterClass,
      species,
      level,
      currHp,
      maxHp,
      equippedItemId: ownedItems.some(item => item.id === equippedItemId) ? equippedItemId : null,
      status: getStatus(currHp, maxHp)
    }))
  }

  app.use(express.json({ limit: '16kb' }))
  const { requireUser, requireCsrf } = setupAuth(app, db, authOptions)
  app.use(
    ['/data', '/add', '/update', '/delete', '/hp', '/items', '/enemies', '/equip'],
    requireUser,
    (request, response, next) => {
      response.set('Cache-Control', 'no-store')
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method))
        return requireCsrf(request, response, next)
      next()
    }
  )

  function requireJsonObject(request, response, next) {
    if (!request.is('application/json')) {
      return response.status(415).json({ error: 'Content-Type must be application/json.' })
    }

    if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
      return response.status(400).json({ error: 'Request body must be a JSON object.' })
    }

    next()
  }

  app.get('/data', async (request, response) => {
    response.json(await listCharacters(request.user._id))
  })

  app.get('/items', async (request, response) => {
    response.json(await listItems(request.user._id))
  })

  app.get('/enemies', async (request, response) => {
    response.json(await listEnemies(request.user._id))
  })

  app.post('/items/add', requireJsonObject, async (request, response) => {
    await items.insertOne({ ...parseItem(request.body), ownerId: request.user._id })
    response.json(await listItems(request.user._id))
  })

  app.post('/items/update', requireJsonObject, async (request, response) => {
    const result = await items.updateOne(
      { _id: parseId(request.body.id), ownerId: request.user._id },
      { $set: parseItem(request.body) }
    )
    if (!result.matchedCount) return response.status(404).json({ error: 'Item not found.' })
    response.json(await listItems(request.user._id))
  })

  app.post('/items/delete', requireJsonObject, async (request, response) => {
    const _id = parseId(request.body.id)
    const result = await items.deleteOne({ _id, ownerId: request.user._id })
    if (!result.deletedCount) return response.status(404).json({ error: 'Item not found.' })
    // Reads also hide missing items, including during concurrent equipment changes.
    await characters.updateMany({ ownerId: request.user._id, equippedItemId: _id.toHexString() },
      { $unset: { equippedItemId: '' } })
    response.json(await listItems(request.user._id))
  })

  app.post('/enemies/add', requireJsonObject, async (request, response) => {
    await enemies.insertOne({ ...parseEnemy(request.body), ownerId: request.user._id })
    response.json(await listEnemies(request.user._id))
  })

  app.post('/enemies/update', requireJsonObject, async (request, response) => {
    const result = await enemies.updateOne(
      { _id: parseId(request.body.id), ownerId: request.user._id },
      { $set: parseEnemy(request.body) }
    )
    if (!result.matchedCount) return response.status(404).json({ error: 'Enemy not found.' })
    response.json(await listEnemies(request.user._id))
  })

  app.post('/enemies/delete', requireJsonObject, async (request, response) => {
    const result = await enemies.deleteOne({ _id: parseId(request.body.id), ownerId: request.user._id })
    if (!result.deletedCount) return response.status(404).json({ error: 'Enemy not found.' })
    response.json(await listEnemies(request.user._id))
  })

  app.post('/enemies/spawn', requireJsonObject, async (request, response) => {
    const enemy = await enemies.findOne({ _id: parseId(request.body.id), ownerId: request.user._id })
    if (!enemy) return response.status(404).json({ error: 'Enemy not found.' })
    response.json({
      id: enemy._id.toHexString(),
      name: enemy.name,
      description: enemy.description,
      hp: randomInteger(enemy.minHp, enemy.maxHp)
    })
  })

  app.post('/enemies/roll-damage', requireJsonObject, async (request, response) => {
    const enemy = await enemies.findOne({ _id: parseId(request.body.id), ownerId: request.user._id })
    if (!enemy) return response.status(404).json({ error: 'Enemy not found.' })
    response.json({ id: enemy._id.toHexString(), damage: randomInteger(enemy.minDamage, enemy.maxDamage) })
  })

  app.post('/equip', requireJsonObject, async (request, response) => {
    const _id = parseId(request.body.id)
    const itemId = request.body.itemId
    if (itemId !== null) {
      const item = await items.findOne({ _id: parseId(itemId), ownerId: request.user._id })
      if (!item) return response.status(404).json({ error: 'Item not found.' })
    }
    const result = await characters.updateOne({ _id, ownerId: request.user._id },
      { $set: { equippedItemId: itemId === null ? null : parseId(itemId).toHexString() } })
    if (!result.matchedCount) return response.status(404).json({ error: 'Character not found.' })
    response.json(await listCharacters(request.user._id))
  })

  app.post('/add', requireJsonObject, async (request, response) => {
    await characters.insertOne({ ...parseCharacter(request.body), ownerId: request.user._id })
    response.json(await listCharacters(request.user._id))
  })

  app.post('/update', requireJsonObject, async (request, response) => {
    const _id = parseId(request.body.id)
    const fields = parseCharacter(request.body)
    const result = await characters.updateOne({ _id, ownerId: request.user._id }, { $set: fields })
    if (result.matchedCount === 0) {
      return response.status(404).json({ error: 'Character not found.' })
    }

    response.json(await listCharacters(request.user._id))
  })

  app.post('/delete', requireJsonObject, async (request, response) => {
    const result = await characters.deleteOne({
      _id: parseId(request.body.id),
      ownerId: request.user._id
    })
    if (result.deletedCount === 0) {
      return response.status(404).json({ error: 'Character not found.' })
    }

    response.json(await listCharacters(request.user._id))
  })

  app.post('/hp', requireJsonObject, async (request, response) => {
    const _id = parseId(request.body.id)
    const amount = parseNumber(request.body.amount, 'HP amount')
    const result = await characters.updateOne({ _id, ownerId: request.user._id }, [
      {
        $set: { currHp: { $max: [0, { $min: ['$maxHp', { $add: ['$currHp', amount] }] }] } }
      }
    ])
    if (result.matchedCount === 0) {
      return response.status(404).json({ error: 'Character not found.' })
    }
    response.json(await listCharacters(request.user._id))
  })

  app.all(['/data', '/add', '/update', '/delete', '/hp', '/items', '/items/add', '/items/update', '/items/delete', '/enemies', '/enemies/add', '/enemies/update', '/enemies/delete', '/enemies/spawn', '/enemies/roll-damage', '/equip'], (request, response) => {
    response.status(405).json({ error: 'Method not allowed.' })
  })

  app.get('/css/bootstrap.min.css', (request, response) => {
    response.sendFile(require.resolve('bootstrap/dist/css/bootstrap.min.css'))
  })
  app.use(express.static(path.join(__dirname, 'dist')))

  app.use((request, response) => {
    if (
      (request.method !== 'GET' && request.method !== 'HEAD') ||
      request.path === '/api' ||
      request.path.startsWith('/api/') ||
      request.path.startsWith('/auth/') ||
      request.is('application/json') ||
      request.get('accept')?.includes('application/json')
    ) {
      return response.status(404).json({ error: 'API endpoint not found.' })
    }
    response.status(404).type('text').send('404 Error: File Not Found')
  })

  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error)

    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'Invalid JSON.' })
    }
    if (error.type === 'entity.too.large') {
      return response.status(413).json({ error: 'Request body exceeds the 16 KB limit.' })
    }

    if (error instanceof MongoError) {
      return response.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
    }

    const status = error.status >= 400 && error.status < 500 ? error.status : 500
    response.status(status).json({
      error:
        status === 500
          ? 'Internal server error.'
          : status === 400
            ? error.message
            : 'Invalid request.'
    })
  })

  return app
}

async function startServer() {
  validateSessionSecret(process.env.SESSION_SECRET)
  const { client, db } = await connectDatabase()
  const app = createApp(db)
  let server
  try {
    server = app.listen(process.env.PORT || port)
    console.log("Connected to the server hosting: http://localhost:"+(process.env.PORT || port)+"/login.html");
  } catch {
    await client.close()
    throw new Error('Unable to start HTTP server. Check that PORT is valid and available.')
  }
  server.on('error', async () => {
    console.error('Unable to start HTTP server. Check that PORT is valid and available.')
    await client.close()
    process.exitCode = 1
  })
  
  let stopping = false
  const shutdown = () => {
    if (stopping) return
    stopping = true
    const timeout = setTimeout(() => process.exit(1), 10000)
    timeout.unref()
    server.close(async () => {
      await client.close()
      clearTimeout(timeout)
    })
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}

module.exports = { createApp }