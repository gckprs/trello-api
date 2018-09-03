const express = require('express')
const bodyParser = require('body-parser')

const {mongoose} = require('./db/mongoose')
const {ObjectID} = require('mongodb')
const {Todo} = require('./models/todo')
const {User} = require('./models/user')

const app = express()

app.use(bodyParser.json())

app.post('/todos', (req, res) => {
    const todo = new Todo({
        text: req.body.text
    })

    todo.save().then((doc) => {
        res.send(doc)
    }, (err) => {
        res.status(400).send(err)
    })
})

app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send({
            todos
        })
    }, (err) => {
        res.send({
            err
        })
    })
})

app.get('/todos/:id', (req, res) => {
    const id = req.params.id

    if (!ObjectID.isValid(id)) {
        return res
            .status(404)
            .send({})
    }

    Todo.findById(id).then((todo) => {
        if (todo) {
            return res
                .send({
                    todo
                })
                .status(200)
        }
        res
            .status(404)
            .send()
    }).catch((err) => {
        res
            .status(400)
            .send()
    })
})

app.listen(3000, () => {
    console.log('Started on port 3000')
})

module.exports = {app}