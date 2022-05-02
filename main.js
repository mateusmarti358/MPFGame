console.clear()
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const players = []
const fruits = []

function contains(array, func) {
  let result = false
  array.forEach(element => { if(func(element)) result = true })
  return result
}
function sortScores() {
  let tmp = []
  players.forEach(player => tmp.push(player))
  tmp.sort((a, b) => a.nickname.toLowerCase().localeCompare(b.nickname.toLowerCase()))
  tmp.sort((a, b) => b.score - a.score)
  return tmp
}

function checkFruitsCollision(id) {
  let collided = false
  fruits.forEach(fruit => {
    if(players[id].x == fruit.x && players[id].y == fruit.y) {
      players[id].score += 1
      fruits.splice(fruits.indexOf(fruit), 1)
      collided = true
    }
  })
  return collided
}

app.use('/', express.static('public'))

io.on('connection', socket => {
  let id = players.length
  socket.on('new player', nickname => {
    if(!contains(players, player => player.nickname == nickname)) {
      players.push({ nickname: nickname, x: Math.ceil(Math.random()*50), y: Math.ceil(Math.random()*50), score: 0 })
      console.log(`${players[id].nickname} connected`)
      io.emit('render', players, fruits)
      io.emit('score', sortScores())
    } else socket.emit('error', 'Nickname already taken')
  })

  // MOVE PLAYER
  socket.on('move', direction => { 
    switch(direction) {
      case 'up':
        if(players[id].y > 0 && !contains(players, player => { 
          return player.nickname != players[id].nickname && player.y == players[id].y-1 && player.x == players[id].x
        })) players[id].y--
        break

      case 'down':
        if(players[id].y+1 < 50 && !contains(players, player => { 
          return player.nickname != players[id].nickname && player.y == players[id].y+1 && player.x == players[id].x
        })) players[id].y++
        break

      case 'left':
        if(players[id].x > 0 && !contains(players, player => { 
          return player.nickname != players[id].nickname && player.y == players[id].y && player.x == players[id].x-1
        })) players[id].x--
        break

      case 'right':
        if(players[id].x+1 < 50 && !contains(players, player => { 
          return player.nickname != players[id].nickname && player.y == players[id].y && player.x == players[id].x+1
        })) players[id].x++
        break
    }

    io.emit('render', players, fruits)
    if(checkFruitsCollision(id)) io.emit('score', sortScores())
  })

  socket.on('disconnect', () => {
    try { console.log(`${players[id].nickname} disconnected`) }
    catch(ignore) {}
    players.splice(id, 1)
    socket.broadcast.emit('render', players, fruits)
    socket.broadcast.emit('score', sortScores())
  })
})

http.listen(3000, () => { 
  console.log('HTTP listen on port 3000\nAccess: http://localhost:3000')
  setInterval(() => {
    if(players.length > 0 && fruits.length < 5) {
      fruits.push({ x: Math.ceil(Math.random()*50), y: Math.ceil(Math.random()*50) })
      io.emit('render', players, fruits)
    }
    if(fruits.length != 0 && players.length == 0 ) fruits.splice(0, fruits.length-1)
  }, 2000)
  setInterval(() => console.log(players), 5000)
  setInterval(() => {
    console.clear()
    console.log('HTTP listen on port 3000\nAccess: http://localhost:3000')
  }, 25000)
})