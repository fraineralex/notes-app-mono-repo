const NotesRouter = require('express').Router()
const Note = require('../models/Note')
const User = require('../models/User')
const userExtractor = require('../middleware/userExtractor')

NotesRouter.get('/', async (request, response) => {
  const notes = await Note.find({}).populate('user', {
    username: 1,
    name: 1
  })
  response.json(notes)
})

NotesRouter.get('/:id', (request, response, next) => {
  const { id } = request.params

  Note.findById(id)
    .then(note => {
      if (note) return response.json(note)
      response.status(404).end()
    })
    .catch(err => next(err))
})

NotesRouter.put('/:id', userExtractor, (request, response, next) => {
  const { id } = request.params
  const { content, important } = request.body

  const newNoteInfo = {
    content,
    important
  }

  console.log(id, newNoteInfo)

  Note.findByIdAndUpdate(id, newNoteInfo, { new: true })
    .then(result => {
      console.log(result)
      response.json(result)
    })
    .catch(next)
})

NotesRouter.delete('/:id', userExtractor, async (request, response, next) => {
  const { id } = request.params
  // const note = await Note.findById(id)
  // if (!note) return response.sendStatus(404)

  const res = await Note.findByIdAndDelete(id)
  if (res === null) return response.sendStatus(404)

  response.status(204).end()
})

NotesRouter.post('/', userExtractor, async (request, response, next) => {
  const {
    content,
    important = false
  } = request.body

  // sacar userId de request
  const { userId } = request

  const user = await User.findById(userId)

  if (!content) {
    return response.status(400).json({
      error: 'required "content" field is missing'
    })
  }

  const newNote = new Note({
    content,
    date: new Date(),
    important,
    user: user._id
  })

  // newNote.save().then(savedNote => {
  //   response.json(savedNote)
  // }).catch(err => next(err))

  try {
    const savedNote = await newNote.save()

    user.notes = user.notes.concat(savedNote._id)
    await user.save()

    response.json(savedNote)
  } catch (error) {
    next(error)
  }
})

module.exports = NotesRouter
