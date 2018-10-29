require('./config/config')

const express = require('express')
const bodyParser = require('body-parser')
const _ = require('lodash')

const {mongoose} = require('./db/mongoose')
const {ObjectID} = require('mongodb')
const {Todo} = require('./models/todo')
const {User} = require('./models/user')
const {authenticate} = require('./middleware/authenticate')

const app = express()
const port = process.env.PORT

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
            .send()
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

app.delete('/todos/:id', (req, res) => {
    const id = req.params.id

    if (!ObjectID.isValid(id)) {
        return res
            .status(404)
            .send()
    }

    Todo.findByIdAndDelete(id).then((todo) => {
        if (!todo) {
            return res
                .status(404)
                .send()
        }
        res
            .status(200)
            .send({
                todo
            })
    }).catch((err) => {
        res
            .status(400)
            .send()
    })
})

app.patch('/todos/:id', (req, res) => {
    const id = req.params.id
    const body = _.pick(req.body, ['text', 'completed'])

    if (!ObjectID.isValid(id)) {
        return res
            .status(404)
            .send()
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime()
    } else {
        body.completed = false
        body.completedAt = null
    }

    Todo.findByIdAndUpdate(id, {
        $set: body
    }, {
        new: true
    }).then((todo) => {
        if (!todo) {
            return res
                .status(404)
                .send()
        }
        res
            .status(200) 
            .send({
            todo
        })
    }).catch((err) => {
        res
            .status(400)
            .send()
    })
})

app.post('/users', (req, res) => {
    const user = new User(_.pick(req.body, ['email', 'password']))
    user.save().then(() => {
        return user.generateAuthToken()
    }).then((token) => {
        res.header('x-auth', token).send(_.pick(user, ['_id', 'email']))
    }).catch((err) => {
        res.status(400).send(err)
    })
})

app.get('/users/me', authenticate, (req, res) => {
    res.send(_.pick(req.user, ['_id', 'email']))
})

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password'])

    User.findByCredentials(body.email, body.password).then((user) => {
        user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(_.pick(user, ['_id', 'email']))
        })
    }).catch((e) => {
        res.status(400).send()
    })  
})

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send()
    }, () => {
        res.status(400).send()
    })
})

app.listen(port, () => {
    console.log(`Started on port ${port}`)
})

module.exports = {app}