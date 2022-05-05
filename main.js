console.clear()
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

function checkCollision(posX1, posX2, posY1, posY2) {
  if(posX1 == posX2 && posY1 == posY2) return true
  return false
}

function pushPlayers(id1, id2, direction) {
  let res = false
  switch(direction) {
    case 'up':
      if(players[id2].y-1 < 0) {
        if(!players[id1].littlePushTimeout) {
          players[id1].score += 5
          players[id1].littlePushTimeout = true
          setTimeout(() => { players[id1].littlePushTimeout = false }, 500)
        }
        return false
      }
      else if(players[id2].score < players[id1].score) {
        players.forEach((player, index) => {
          if(index != id2 && index != id1 && !res) {
            if(checkCollision(player.x, players[id2].x, player.y, players[id2].y - 1)) pushPlayers(id1, index, 'up')
          }
        })
        players[id2].y--
        res = true
      }
      else return false
      break
    case 'down':
      if(players[id2].y+2 > 50) {
        if(!players[id1].littlePushTimeout) {
          players[id1].score += 5
          players[id1].littlePushTimeout = true
          setTimeout(() => { players[id1].littlePushTimeout = false }, 500)
        }
        return false
      }
      else if(players[id2].score < players[id1].score) {
        players.forEach((player, index) => {
          if(index != id2 && index != id1 && !res) {
            if(checkCollision(player.x, players[id2].x, player.y, players[id2].y + 1)) pushPlayers(id1, index, 'down')
          }
        })
        players[id2].y++
        res = true
      }
      else return false
      break
    case 'left':
      if(players[id2].x-1 < 0) {
        if(!players[id1].littlePushTimeout) {
          players[id1].score += 5
          players[id1].littlePushTimeout = true
          setTimeout(() => { players[id1].littlePushTimeout = false }, 500)
        }
        return false
      }
      else if(players[id2].score < players[id1].score) {
        players.forEach((player, index) => {
          if(index != id2 && index != id1 && !res) {
            if(checkCollision(player.x - 1, players[id2].x, player.y, players[id2].y)) pushPlayers(id1, index, 'left')
          }
        })
        players[id2].x--
        res = true
      }
      else return false
      break
    case 'right':
      if(players[id2].x+2 > 50) {
        if(!players[id1].littlePushTimeout) {
          players[id1].score += 5
          players[id1].littlePushTimeout = true
          setTimeout(() => { players[id1].littlePushTimeout = false }, 500)
        }
        return false
      }
      else if(players[id2].score < players[id1].score) {
        players.forEach((player, index) => {
          if(index != id2 && index != id1 && !res) {
            if(checkCollision(player.x + 1, players[id2].x, player.y, players[id2].y)) pushPlayers(id1, index, 'right')
          }
        })
        players[id2].x++
        res = true
      }
      else return false
      break
  }
  return res
}

app.use('/', express.static('public'))

io.on('connection', socket => {
  let myId = () => {}
  socket.on('new player', nickname => {
    if(contains(players, player => player.nickname == nickname)) socket.emit('error', 'Nickname already taken')
    else if(nickname == '') socket.emit('error', 'Nickname cannot be empty')
    else {
      players.push({ nickname: nickname, x: Math.ceil(Math.random()*50), y: Math.ceil(Math.random()*50), score: 0, littlePushTimeout: false })
      myId = () => { return players.findIndex(player => player.nickname == nickname) }
      console.log(`${players[myId()].nickname} connected`)
      io.emit('render', players, fruits, timeStop)
      io.emit('score', sortScores())
    } 
  })

  // ACTION PLAYER
  socket.on('action', action => {
    if(!timeStop.isStopped || timeStop.who.id == myId()) {
      switch(action) {
        case 'up':
          if(players[myId()].y > 0) {
            let res = true
            players.forEach((player, otherId) => {
              if(myId() != otherId && checkCollision(players[myId()].x, player.x, players[myId()].y-1, player.y)) 
                res = pushPlayers(myId(), otherId, 'up')
            })
            if(res) players[myId()].y--
          }
          break

        case 'down':
          if(players[myId()].y+1 < 50) {
            let res = true
            players.forEach((player, otherId) => {
              if(myId() != otherId && checkCollision(players[myId()].x, player.x, players[myId()].y+1, player.y))
                res = pushPlayers(myId(), otherId, 'down')
            })
            if(res) players[myId()].y++
          }
          break

        case 'left':
          if(players[myId()].x > 0) {
            let res = true
            players.forEach((player, otherId) => {
              if(myId() != otherId && checkCollision(players[myId()].x-1, player.x, players[myId()].y, player.y))
                res = pushPlayers(myId(), otherId, 'left')
            })
            if(res) players[myId()].x--
          }
          break

        case 'right':
          if(players[myId()].x+1 < 50) {
            let res = true
            players.forEach((player, otherId) => {
              if(myId() != otherId && checkCollision(players[myId()].x+1, player.x, players[myId()].y, player.y))
                res = pushPlayers(myId(), otherId, 'right')
            })
            if(res) players[myId()].x++
          }
          break
        

        case 'time stop':
          if(players[myId()].score >= 10 && timeStop.canStopTime) {
            timeStop.isStopped = true
            timeStop.who.nickname = players[myId()].nickname; timeStop.who.id = myId()
            timeStop.canStopTime = false
            players[myId()].score -= 10
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

    for(let i = 0; i < fruits.length; i++) {
      if(checkCollision(players[myId()].x, fruits[i].x, players[myId()].y, fruits[i].y)) {
        players[myId()].score++
        fruits.splice(i, 1)
      }
    }

    io.emit('render', players, fruits, timeStop)
    io.emit('score', sortScores())
    console.log('myId(): ' + myId())
    console.log(players)
  })

  socket.on('disconnect', () => {
    try { console.log(`${players[myId()].nickname} disconnected`) }
    catch(ignore) {}
    players.splice(myId(), 1)
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
  }, 30000) // CONSOLE CLEAR
})