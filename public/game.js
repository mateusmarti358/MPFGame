let socket = io()
let nickname = new URLSearchParams(window.location.search).get('nickname').trim()

socket.emit('new player', nickname)
socket.on('error', error => window.location.href = `/fail.html?error=${error}`)

const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')

function contains(array, func) {
  let result = false
  array.forEach(element => { if(func(element)) result = true })
  return result
}

// Keyboard events
let actions = {
  'arrowup': () => socket.emit('action', 'up'),
  'arrowdown': () => socket.emit('action', 'down'),
  'arrowleft': () => socket.emit('action', 'left'),
  'arrowright': () => socket.emit('action', 'right'),
  't': () => socket.emit('action', 'time stop')
}
onkeydown = event => actions[event.key.toLowerCase()]()

socket.on('render', (players, fruits, timeStop) => {
  context.clearRect(0, 0, canvas.width, canvas.height)
  fruits.forEach(fruit => {
    context.fillStyle = "#ffff00"
    context.fillRect(fruit.x, fruit.y, 1, 1)
  })

  players.forEach(player => {
    if(player.nickname == nickname) {
      context.fillStyle = "#00ffff"
      if(timeStop.isStopped && timeStop.who.nickname != nickname) context.fillStyle = "#00ffff"
    } else {
      context.fillStyle = "rgba(0, 0, 0, 0.3)"
      if(timeStop.isStopped) {
        if(timeStop.who.nickname == player.nickname) context.fillStyle = "#000028"
        else context.fillStyle = "#000032"
      }
    }
    context.fillRect(player.x, player.y, 1, 1)
  })
})

socket.on('score', players => {
  let score = document.querySelector('.score')
  score.innerHTML = '<thead class="text-white border-2 border-black"><tr><td class="text-white border-r-2 border-black pl-2 pr-2">Nickname</td>'+
                    '<td class="text-white border-2 border-black pl-2 pr-2">Score</td></tr></thead><tbody>'
  for(let index = 0; index < players.length && index < 10; index++) {
    score.innerHTML += `<tr><td class="text-white border-2 border-black">${players[index].nickname}</td>`+
                      `<td class="text-white border-2 border-black">${players[index].score}</td></tr>`
  }
  score.innerHTML += '</tbody>'
})