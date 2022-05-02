let socket = io()
let nickname = new URLSearchParams(window.location.search).get('nickname')
const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')

// Keyboard events
var keyMap = {};
onkeydown = onkeyup = event => {
  keyMap[event.key] = event.type == 'keydown';

  if(keyMap['ArrowUp']) socket.emit('move', 'up')
  if(keyMap['ArrowDown']) socket.emit('move', 'down')
  if(keyMap['ArrowLeft']) socket.emit('move', 'left')
  if(keyMap['ArrowRight']) socket.emit('move', 'right')
}

socket.emit('new player', nickname)
socket.on('error', () => window.location.href = '/fail.html')

socket.on('render', (players, fruits) => {
  context.clearRect(0, 0, canvas.width, canvas.height)
  fruits.forEach(fruit => {
    context.fillStyle = "#FFFF00"
    context.fillRect(fruit.x, fruit.y, 1, 1)
  })
  players.forEach(player => {
    if(player.nickname == nickname) context.fillStyle = "#00FF00"
    else context.fillStyle = "rgba(0, 0, 0, 0.3)"
    context.fillRect(player.x, player.y, 1, 1)
  })
})

socket.on('score', players => {
  let score = document.querySelector('.score')
  score.innerHTML = 'Scores <br>'
  players.forEach(player => score.innerHTML += `${player.nickname}: ${player.score}<br>`)
})