let socket = io()
let nickname = new URLSearchParams(window.location.search).get('nickname').trim()
const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')

function contains(array, func) {
  let result = false
  array.forEach(element => { if(func(element)) result = true })
  return result
}

// Keyboard events
var keyMap = {};
onkeydown = onkeyup = event => {
  keyMap[event.key] = event.type == 'keydown';

  if(keyMap['ArrowUp']||keyMap['W']||keyMap['w']) socket.emit('action', 'up')
  if(keyMap['ArrowDown']||keyMap['S']||keyMap['s']) socket.emit('action', 'down')
  if(keyMap['ArrowLeft']||keyMap['A']||keyMap['a']) socket.emit('action', 'left')
  if(keyMap['ArrowRight']||keyMap['D']||keyMap['d']) socket.emit('action', 'right')
  if(keyMap['T']||keyMap['t']) socket.emit('action', 'time stop')
}

socket.emit('new player', nickname)
socket.on('error', () => window.location.href = '/fail.html')

socket.on('render', (players, fruits, timeStop) => {
  context.clearRect(0, 0, canvas.width, canvas.height)
  fruits.forEach(fruit => {
    context.fillStyle = "rgba(255, 255, 0, 1)"
    context.fillRect(fruit.x, fruit.y, 1, 1)
  })

  players.forEach(player => {
    if(player.nickname == nickname) {
      context.fillStyle = "rgba(0, 255, 0, 1)"
      if(timeStop.isStopped && timeStop.who.nickname != nickname) context.fillStyle = "rgba(0, 255, 0, 0.5)"
    } else {
      context.fillStyle = "rgba(0, 0, 0, 0.3)"
      if(timeStop.isStopped) {
        if(timeStop.who.nickname == player.nickname) context.fillStyle = "rgba(0, 0, 40, 0.5)"
        else context.fillStyle = "rgba(0, 0, 50, 0.3)"
      }
    }
    context.fillRect(player.x, player.y, 1, 1)
  })
})

socket.on('score', players => {
  let score = document.querySelector('.score')
  score.innerHTML = 'Scores <br>'
  players.forEach(player => score.innerHTML += `${player.nickname}: ${player.score}<br>`)
})