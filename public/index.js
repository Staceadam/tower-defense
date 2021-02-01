const canvas = document.getElementById('canvas1')
const ctx = canvas.getContext('2d')
canvas.width = 900
canvas.height = 600

// global variables
const CELL_SIZE = 100
const CELL_GAP = 3
let ENEMIES_INTERVAL = 600
let NUMBER_OF_RESOURCES = 300
let GAME_OVER = false
let PAUSE = true
let SCORE = 0
const WINNING_SCORE = 20

const gameGrid = []
const defenders = []
const enemies = []
const enemyPosition = []
const projectiles = []
const resources = []

let frame = 0

// mouse
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1
}

//get mouse position
let canvasPosition = canvas.getBoundingClientRect()
canvas.addEventListener('mousemove', (e) => {
    const { x, y } = e
    mouse.x = x - canvasPosition.left
    mouse.y = y - canvasPosition.top
})
canvas.addEventListener('mouseleave', () => {
    mouse.x = undefined
    mouse.y = undefined
})

canvas.addEventListener('click', (e) => {
    if (PAUSE) {
        PAUSE = !PAUSE
    } else {
        const gridPositionX = mouse.x - (mouse.x % CELL_SIZE) + CELL_GAP
        const gridPositionY = mouse.y - (mouse.y % CELL_SIZE) + CELL_GAP
        if (gridPositionY < CELL_SIZE) return
        for (const defender of defenders) {
            if (defender.x === gridPositionX && defender.y === gridPositionY) return
        }

        let defenderCost = 100
        if (NUMBER_OF_RESOURCES >= defenderCost) {
            defenders.push(new Defender(gridPositionX, gridPositionY))
            NUMBER_OF_RESOURCES -= defenderCost
        }
    }
})

// game board
const controlsBar = {
    width: canvas.width,
    height: CELL_SIZE
}

class Cell {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.width = CELL_SIZE
        this.height = CELL_SIZE
    }
    draw() {
        if (mouse.x && mouse.y && collision(this, mouse)) {
            ctx.strokeStyle = 'black'
            ctx.strokeRect(this.x, this.y, this.width, this.height)
        }
    }
}

function createGrid() {
    for (let y = CELL_SIZE; y < canvas.height; y += CELL_SIZE) {
        for (let x = 0; x < canvas.width; x += CELL_SIZE) {
            gameGrid.push(new Cell(x, y))
        }
    }
}
createGrid()

function handleGameGrid() {
    gameGrid.forEach((cell) => cell.draw())
}
// projectiles
class Projectile {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.width = 10
        this.height = 10
        this.power = 20
        this.speed = 5
    }
    update() {
        this.x += this.speed
    }
    draw() {
        ctx.fillStyle = 'black'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2)
        ctx.fill()
    }
}
function handleProjectiles() {
    projectiles.forEach((projectile, i) => {
        projectile.update()
        projectile.draw()

        enemies.forEach((enemy) => {
            if (enemy && projectile && collision(projectile, enemy)) {
                enemy.health -= projectile.power
                projectiles.splice(i, 1)
            }
        })

        if (projectile && projectile.x > canvas.width - CELL_SIZE) {
            projectiles.splice(i, 1)
        }
    })
}

// defenders
class Defender {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.width = CELL_SIZE - CELL_GAP * 2
        this.height = CELL_SIZE - CELL_GAP * 2
        this.shooting = false
        this.health = 100
        this.projectiles = []
        this.timer = 0
    }
    draw() {
        ctx.fillStyle = 'blue'
        ctx.fillRect(this.x, this.y, this.width, this.height)
        ctx.fillStyle = 'gold'
        ctx.font = '20px Orbitron'
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 15)
    }
    update() {
        if (this.shooting) {
            this.timer++
            if (this.timer % 100 === 0) {
                projectiles.push(new Projectile(this.x + 70, this.y + 50))
            }
        } else {
            this.timer = 0
        }
    }
}

function handleDefenders() {
    defenders.forEach((defender, i) => {
        defender.draw()
        defender.update()
        defender.shooting = enemyPosition.includes(defender.y)
        enemies.forEach((enemy) => {
            //if an enemy is colliding with defender
            if (collision(defender, enemy)) {
                //set its movement to 0
                enemy.movement = 0
                //start taking away its health every animation
                defender.health -= 0.2
            }
            //if the defenders health is 0
            if (defender && defender.health <= 0) {
                //remove it from the array
                defenders.splice(i, 1)
                //start the enemy up again
                enemy.movement = enemy.speed
            }
        })
    })
}

// enemies
class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width
        this.y = verticalPosition
        this.width = CELL_SIZE - CELL_GAP * 2
        this.height = CELL_SIZE - CELL_GAP * 2
        //TODO: dont want this to be random, should be based on enemy type
        this.speed = Math.random() * 0.2 + 0.4
        this.movement = this.speed
        this.health = 100
        this.maxHealth = this.health
    }
    update() {
        this.x -= this.movement
    }
    draw() {
        ctx.fillStyle = 'red'
        ctx.fillRect(this.x, this.y, this.width, this.height)
        ctx.fillStyle = 'black'
        ctx.font = '20px Orbitron'
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 15)
    }
}
function handleEnemies() {
    enemies.forEach((enemy, i) => {
        enemy.update()
        enemy.draw()
        if (enemy.x < 0) GAME_OVER = true
        if (enemy.health <= 0) {
            let gainedResources = enemy.maxHealth / 10
            NUMBER_OF_RESOURCES += gainedResources
            SCORE += gainedResources
            const enemyPositionIndex = enemyPosition.indexOf(enemy.y)
            enemyPosition.splice(enemyPositionIndex, 1)
            enemies.splice(i, 1)
            console.log(enemyPosition)
        }
    })
    if (frame % ENEMIES_INTERVAL === 0 && SCORE < WINNING_SCORE) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * CELL_SIZE + CELL_GAP
        enemies.push(new Enemy(verticalPosition))
        enemyPosition.push(verticalPosition)
        //THIS IS GIVIGN THE USER A LITTLE TIME TO SETUP
        if (ENEMIES_INTERVAL > 120) ENEMIES_INTERVAL -= 100
    }
}
// resources
const amounts = [20, 30, 40]
class Resource {
    constructor() {
        this.x = Math.random() * (canvas.width - CELL_SIZE)
        this.y = (Math.floor(Math.random() * 5) + 1) * CELL_SIZE + 25
        this.width = CELL_SIZE * 0.6
        this.height = CELL_SIZE * 0.6
        this.amount = amounts[Math.floor(Math.random() * amounts.length)]
    }
    draw() {
        ctx.fillStyle = 'yellow'
        ctx.fillRect(this.x, this.y, this.width, this.height)
        ctx.fillStyle = 'black'
        ctx.font = '20px Orbitron'
        ctx.fillText(this.amount, this.x + 15, this.y + 25)
    }
}
function handleResources() {
    if (frame % 500 === 0 && SCORE < WINNING_SCORE) {
        resources.push(new Resource())
    }
    resources.forEach((resource, i) => {
        resource.draw()
        if (resource && mouse.x && mouse.y && collision(resource, mouse)) {
            NUMBER_OF_RESOURCES += resource.amount
            resources.splice(i, 1)
        }
    })
}
// utilities
function handleGameStatus() {
    ctx.fillStyle = 'gold'
    ctx.font = '30px Orbitron'
    ctx.fillText(`Score: ${SCORE}`, 20, 40)
    ctx.fillText(`Resources: ${NUMBER_OF_RESOURCES}`, 20, 80)
    if (GAME_OVER) {
        ctx.fillStyle = 'black'
        ctx.font = '90px Orbitron'
        ctx.fillText('GAME OVER', 135, 330)
    }
    if (SCORE >= WINNING_SCORE && enemies.length === 0) {
        ctx.fillStyle = 'black'
        ctx.font = '60px Orbitron'
        ctx.fillText('LEVEL COMPLETE', 130, 300)
        ctx.font = '30px Orbitron'
        ctx.fillText(`You win with ${SCORE} points!`, 134, 340)
    }
}

function animate() {
    //this fills the entire canvas rectangle
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height)
    // this is going to recursivly call the animate function to
    // create an animation loop
    if (PAUSE) {
        ctx.fillStyle = 'black'
        ctx.font = '60px Orbitron'
        ctx.fillText('PLAY', 350, 350)
    } else {
        handleGameGrid()
        handleResources()
        handleDefenders()
        handleProjectiles()
        handleEnemies()
        handleGameStatus()
        frame++
    }

    if (!GAME_OVER || !PAUSE) requestAnimationFrame(animate)
}

animate()

function collision(first, second) {
    //rewrite this with a single return
    if (
        !(
            first.x > second.x + second.width ||
            first.x + first.width < second.x ||
            first.y > second.y + second.height ||
            first.y + first.height < second.y
        )
    ) {
        return true
    }
}

window.addEventListener('resize', () => {
    canvasPosition = canvas.getBoundingClientRect()
})
