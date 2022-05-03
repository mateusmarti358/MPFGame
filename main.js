console.clear()
const { time } = require('console')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const players = []
const fruits = []
const timeStop = {
  isStopped: false,
  canStopTime: true,
  who: { nickname: '', id: 0 }
}

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
  fruits.forEach(fruit => {
    if(players[id].x == fruit.x && players[id].y == fruit.y) {
      players[id].score += 1
      fruits.splice(fruits.indexOf(fruit), 1)
    }
  })
}

app.use('/', express.static('public'))

io.on('connection', socket => {
  let id = players.length
  socket.on('new player', nickname => {
    if(contains(players, player => player.nickname == nickname)) socket.emit('error', 'Nickname already taken')
    else if(nickname == '') socket.emit('error', 'Nickname cannot be empty')
    else {
      players.push({ nickname: nickname, x: Math.ceil(Math.random()*50), y: Math.ceil(Math.random()*50), score: 0 })
      console.log(`${players[id].nickname} connected`)
      io.emit('render', players, fruits, timeStop)
      io.emit('score', sortScores())
    } 
  })

  // ACTION PLAYER
  socket.on('action', action => {
    if(!timeStop.isStopped || timeStop.who.id == id) {
      switch(action) {
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
        

        case 'time stop':
          if(players[id].score >= 10 && timeStop.canStopTime) {
            timeStop.isStopped = true
            timeStop.who.nickname = players[id].nickname; timeStop.who.id = id
            timeStop.canStopTime = false
            players[id].score -= 10
            setTimeout(() => {
              timeStop.isStopped = false
              timeStop.who.id = -1
              timeStop.who.nickname = ''
            }, 5000)
            setTimeout(() => { canStopTime = true }, 10000)
          }
          break
      }
    }

    checkFruitsCollision(id)
    io.emit('render', players, fruits, timeStop)
    io.emit('score', sortScores())
    console.log(players)
    console.log(timeStop)
  })

  socket.on('disconnect', () => {
    try { console.log(`${players[id].nickname} disconnected`) }
    catch(ignore) {}
    players.splice(id, 1)
    socket.broadcast.emit('render', players, fruits, timeStop)
    socket.broadcast.emit('score', sortScores())
  })
})

http.listen(3000, () => { 
  console.log('HTTP listen on port 3000\nAccess: http://localhost:3000')
  setInterval(() => {
    if(players.length > 0 && fruits.length < 1000 && !timeStop.isStopped) {
      let newFruit = { x: Math.round(Math.random()*50), y: Math.round(Math.random()*50) }

      while(contains(fruits, fruit => fruit.x == newFruit.x && fruit.y == newFruit.y) ||
            contains(players, player => player.x == newFruit.x && player.y == newFruit.y))
        newFruit = { x: Math.round(Math.random()*50), y: Math.round(Math.random()*50) }

      fruits.push(newFruit)
      io.emit('render', players, fruits, timeStop)
    }
    if(fruits.length != 0 && players.length == 0 ) fruits.splice(0, fruits.length-1)
  }, 2000) // FRUIT GENERATION
  setInterval(() => {
    console.clear()
    console.log('HTTP listen on port 3000\nAccess: http://localhost:3000')
  }, 25000) // CONSOLE CLEAR
})