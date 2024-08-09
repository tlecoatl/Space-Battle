let keys = {ArrowLeft: false, ArrowUp: false, ArrowRight: false, a: false, w: false, d: false,
           " ": false};
let bullets = {};
const asteroids = {};
const rocks = {};
const crystals = {};
let highScore;
let highLevel;
let rate = 0;
let ship;
const stars = {};
const players = {};
const main = document.getElementsByName("main");
const instructions = document.getElementsByName("instructions");
const names = document.getElementsByName("name");
const title = document.getElementsByName("title");
const newGame1 = document.getElementsByName("startOver1");
const newGame2 = document.getElementsByName("startOver2");
const records = document.getElementsByName('records');
const hiScore = document.getElementsByName('hiScore');
const hiLevel = document.getElementsByName('hiLevel');
const enemies = document.getElementsByName('enemies');
const list = document.getElementsByTagName('list');
const eList = document.getElementById('eList');
let enemyA = false;
let enemyR = false;
let enemyC = false;

let currentHighScore = localStorage.getItem('highScore');
let currentHighLevel = localStorage.getItem('highLevel');
let enemiesCollection = localStorage.getItem('allEnemies')
let trigger = false;

// Creates an array of 450 'dots' with with random coordinates and radi. Used to create the star background.
for (let s = 0; s <= 450; s++){
    stars[s] ={
        randomX: Math.floor(Math.random() * 3000) + 1,
        randomY: Math.floor(Math.random() * 2000) + 1,
        starRadius: Math.floor(Math.random() * 3) + 1,
        starFirstAngle: 1,
        starLastAngle: 2*Math.PI
    }
}

// Client Initialization from the same domain
const socket = io();

// Listens for the 'screen' event and sends over an object containing the browser window's dimensions
socket.on('screen', () => {
    let dimensions = {playerWidth: canvasWidth, playerHeight: canvasHeight}
    socket.emit('canvas', dimensions);
})

// Listens for the 'players' event and sends over a list of updated players. Creates a new player and adds it to 
// the front end player list, updates player properties, and deletes player that is no longer in the backend.
socket.on('players', (serverPlayers) => {
    for (const id in serverPlayers) {
        const serverPlayer = serverPlayers[id];

        //Creates a new ship if the the player id is new. Otherwise updates the existing players information.
        if (!players[id]){
            players[id] = new Ship({
               xpos: serverPlayer.xpos,
               ypos: serverPlayer.ypos,
               color: serverPlayer.color,
               vulnerable: serverPlayer.vulnerable,
               name: serverPlayer.name
            })
        } else {
            players[id].angle = serverPlayer.angle;
            players[id].xspeed = serverPlayer.xspeed;
            players[id].yspeed = serverPlayer.yspeed;
            players[id].xpos = serverPlayer.xpos;
            players[id].ypos = serverPlayer.ypos;
            players[id].score = serverPlayer.score;
            players[id].lives = serverPlayer.lives;
            players[id].level = serverPlayer.level;
            players[id].vulnerable = serverPlayer.vulnerable;
        }
    }
    // Keeps the players synced in the front and backends. Displays a game over screen for any player that dies 
    // after losing all their lives. Updates player score and level in the achievements section
    for (const id in players) {
        if(!serverPlayers[id]){
            for(let g = 0; g < newGame1.length; g++){
                // before player deletion, the player's score is saved and the game over screen is displayed
                if (id == socket.id){
                    string = "Final Score: " + players[id].score.toString();
                    newGame1[g].innerHTML = string;
                    newGame1[g].style.display = 'flex';
                    newGame2[g].style.display = 'flex';

                    // Ensures that player's have an appropriate value for their locally saved score and level
                    // Uses this saved value to then update the values displayed in the achievements section
                    if (currentHighScore == null || players[id].score > currentHighScore){
                        localStorage.setItem('highScore', players[id].score);
                    }
        
                    if (currentHighLevel == null || players[id].level > currentHighLevel){
                        localStorage.setItem('highLevel', players[id].level)
                    }
        
                    let trueScore = localStorage.getItem('highScore');
                    let trueLevel = localStorage.getItem('highLevel');
        
                    let stringScore = " Hi-Score: " + trueScore.toString();
                    hiScore[0].innerHTML = stringScore;
                    let stringLevel = " Highest Level: " + trueLevel.toString();
                    hiLevel[0].innerHTML = stringLevel;
                }
            }

            delete players[id];
        }
    }
})

// Keeps the bullets in the front and backend synced. Deletes any bullet object that no longer exists in the backend
socket.on('bullets', (serverBullets) => {
    for (const id in serverBullets) {
        const serverBullet = serverBullets[id];

        if (!bullets[id]){
            bullets[id] = new Bullet({
                xpos: serverBullet.xpos,
                ypos: serverBullet.ypos,
                width: serverBullet.width,
                height: serverBullet.height,
                color: serverBullet.color,
            })
        } else {
            bullets[id].xpos = serverBullet.xpos
            bullets[id].ypos = serverBullet.ypos;
            bullets[id].width = serverBullet.width;
            bullets[id].height = serverBullet.height;
            bullets[id].color = serverBullet.color;
        }
    }

    for (const id in bullets) {
        if(!serverBullets[id]){
            delete bullets[id];
        }
    }
})

// Keeps the asteroids in the front and backend synced. Deletes any asteroid object that no longer exists in the 
// backend
socket.on('asteroids', (serverAsteroids) => {
    for (const id in serverAsteroids) {
        const serverAsteroid = serverAsteroids[id];

        if (!asteroids[id]){
            asteroids[id] = new Asteroid({
                xpos: serverAsteroid.xpos,
                ypos: serverAsteroid.ypos,
                width: serverAsteroid.width,
                height: serverAsteroid.height,
                radius: serverAsteroid.radius,
            })
        } else {
            asteroids[id].xpos = serverAsteroid.xpos
            asteroids[id].ypos = serverAsteroid.ypos;
            asteroids[id].width = serverAsteroid.width;
            asteroids[id].height = serverAsteroid.height;
            asteroids[id].radius = serverAsteroid.radius;
        }
    }

    for (const id in asteroids) {
        if(!serverAsteroids[id]){
            delete asteroids[id];
        }
    }
})

socket.on('rocks', (serverRocks) => {
    for (const ab in serverRocks) {
        const serverRock = serverRocks[ab];

        if (!rocks[ab]){
            rocks[ab] = new Rock({
                xpos: serverRock.xpos,
                ypos: serverRock.ypos,
                radius: serverRock.radius,
                length: serverRock.length
            })
        } else {
            rocks[ab].xpos = serverRock.xpos
            rocks[ab].ypos = serverRock.ypos;
            rocks[ab].length = serverRock.length;
            rocks[ab].radius = serverRock.radius;
        }
    }

    for (const id in rocks) {
        if(!serverRocks[id]){
            delete rocks[id];
        }
    }
})

socket.on('crystals', (serverCrystals) => {
    for (const ac in serverCrystals) {
        const serverCrystal = serverCrystals[ac];

        if (!crystals[ac]){
            crystals[ac] = new Crystal({
                xpos: serverCrystal.xpos,
                ypos: serverCrystal.ypos,
                radius: serverCrystal.radius,
                length: serverCrystal.length,
                angle: serverCrystal.angle
            })
        } else {
            crystals[ac].xpos = serverCrystal.xpos
            crystals[ac].ypos = serverCrystal.ypos;
            crystals[ac].length = serverCrystal.length;
            crystals[ac].radius = serverCrystal.radius;
        }
    }

    for (const id in crystals) {
        if(!serverCrystals[id]){
            delete crystals[id];
        }
    }
})

// Displays the current score player score and repositions it as necessary
function ScoreDisplay (){
    let score = 0;
    let color = 'white';
    let xpoint = 100;            //was originally 25 but shifted because of highScoreDisplay()
    let ypoint = 50;

    for(let id in players){
        if (id == socket.id){
            score = players[id].score;
            color = players[id].color;

            if (score >= 10){
                xpoint += 14;
            } else if (score >= 100){
                xpoint += 14;
            } else if (score >= 1000){
                xpoint += 14;
            } else if (score >= 10000){
                xpoint += 14;
            } else if (score >=100000){
                xpoint += 14;
            }
            
            ctx.fillStyle = color;
            ctx.font = "40px Comic Sans MS";
            ctx.fillText("Score: " + score.toString(), xpoint, ypoint);
        }
    }
}

// Displays the score and name of the three highest scoring players to all other players
function highScoreDisplay (){
    let top3 = [];
    let fontSize = 40;

    // Stores information on all players in objects and then places those objects in an array
    for (let rr in players){
        let power = new Object();

        power.color = players[rr].color;
        power.name = players[rr].name;
        power.score = players[rr].score;
        power.id = socket.id;

        top3.push(power);
    }

    // Sorts objects in array by highest score
    top3.sort(({score:a}, {score:b}) => b-a);

    let xshift = 120;
    let yshift = 160;
    let name = '';
    
    // Is used to find the player with the longest name 
    for (let t = 0; t < top3.length; t++){
        let newName = name;
        name = top3[t].name;

        if (newName.length > name.length){
            name = newName;
        }
    }

    // Shifts the position of the display by adding additional space for every character in the longest name
    if (name.length >= 1){
        xshift += (14 * name.length);
    }

    let xpoint = canvasWidth - xshift;
    let ypoint = canvasHeight - yshift;

    // Shifts the position of the display by adding additional space once the length of the highest reaches a 
    // certain threshold
    if (top3.length >= 1){
        if (top3[0].score >= 9999 & xshift === 285){
            xpoint -= 40;
            xshift += 40; 
        }
        
        if (top3[0].score >= 99999 & xshift === 325){
            xpoint -= 40;
            xshift += 40;
        }
        
        if (top3[0].score <= 9991 & xshift === 285){
            xpoint += 40;
        }
    }
    
    // Places each player name and score in the appropriate location. Also adjusts font size accordingly. 
    for (let dd in players){
        if (dd === socket.id){
            if (top3.length === 1){
                for (let s = 0; s < 3; s++){

                    ypoint += 45;
                    xpoint += 10;

                    ctx.fillStyle = top3[0].color;
                    ctx.textAlign = 'center';
                    ctx.font = fontSize.toString() + "px Comic Sans MS";
                    ctx.fillText(top3[0].name + " - " + top3[0].score.toString(), xpoint, ypoint);

                    fontSize -= 5;
                }
            }

            if (top3.length === 2){
                for (let s = 0; s < 2; s++){

                    ypoint += 45;
                    xpoint += 10;

                    ctx.fillStyle = top3[0].color;
                    ctx.font = fontSize.toString() + "px Comic Sans MS";
                    ctx.fillText(top3[0].name + " - " + top3[0].score.toString(), xpoint, ypoint);

                    fontSize -= 5;
                }

                    
                    ypoint += 45;
                    xpoint += 10;
                    ctx.fillStyle = top3[1].color;
                    ctx.textAlign = 'center';
                    ctx.font = fontSize.toString() + "px Comic Sans MS";
                    ctx.fillText(top3[1].name + " - " + top3[1].score.toString(), xpoint, ypoint);
            }

            if (top3.length >= 3){
                for (let s = 0; s < 3; s++){

                    ypoint += 45;
                    xpoint += 10;

                    ctx.fillStyle = top3[s].color;
                    ctx.textAlign = 'center';
                    ctx.font = fontSize.toString() + "px Comic Sans MS";
                    ctx.fillText(top3[s].name + " - " + top3[s].score.toString(), xpoint, ypoint);

                    fontSize -= 5;
                }
            }
        }
    }
}

// Displays the player's current level on their screen
function LevelDisplay (){
    let level = 0;
    let color = 'white';
    const xpos = 100;
    const ypos = canvasHeight - 50;

    for(let id in players){
        if (id == socket.id){
            level = players[id].level;
            color = players[id].color

            

            ctx.fillStyle = color;
            ctx.font = "40px Comic Sans MS";
            ctx.fillText("Level: " + level.toString(), xpos, ypos);
        }
    }
}

// Displays the player's lives as small ships in a uniform fashion
function Lives (){
    let lives = 0;
    let color = 'white';
    let xpos = canvasWidth - 210;
    let ypos = 50;

    for(let id in players){
        if (id == socket.id){
            lives = players[id].lives;
            color = players[id].color

            ctx.fillStyle = color;
            ctx.font = "40px Comic Sans MS";
            ctx.fillText("Lives:",xpos,ypos);
        
            ctx.strokeStyle = color;
        
            if (lives != 0){
                for (let x = 0; x < lives; x++){
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(xpos + 75, ypos + 4);
                ctx.lineTo(xpos + 86, ypos - 30);
                ctx.lineTo(xpos + 97, ypos + 4);
                ctx.closePath();
                ctx.stroke();
        
                xpos += 32;
                }
            }
        }
    } 
}

// Identifies the type of enemy and updates the "Enemies" in the achievement section
function setEnemies(){
    let allEnemies = "";
    let enemyNames = ["Asteroid", "Rock", "Crystal"];
    let enemyAppear = [];

    // Checks to see if enemy objects exist 
    if (Object.keys(asteroids).length != 0){
        enemyAppear.push(true);
    }

    if (Object.keys(rocks).length != 0){
        enemyAppear.push(true);
    }

    if (Object.keys(crystals).length !=0){
        enemyAppear.push(true);
    }

    // Makes sure that the local storage variable has a type string for its value
    if (enemiesCollection === null){
        localStorage.setItem("allEnemies", allEnemies);
    }

    // Converts the value located in the local storage into a accessible string 
    let trueEnemies = localStorage.getItem('allEnemies');

    // Verifies an enemy encounter and adds enemy to enemy list if the ecounter is new
    for (let n = 0; n < enemyNames.length; n++){
        if (!trueEnemies.includes(enemyNames[n])){
            if (enemyAppear[n]){
                allEnemies += enemyNames[n]
                localStorage.setItem("allEnemies", allEnemies);
                trueEnemies = localStorage.getItem("allEnemies");
            }
        }
    }

    // Sets the names of the enemy objects in the Enemies segment of the Achievements section
    if (trueEnemies.includes("Asteroid") & enemyA === false){
        enemyA = true;
        let newSpan = document.createElement('span');
        newSpan.textContent = 'Asteroids';
        newSpan.classList.add('info1');
        let bar = document.createElement('br');
        newSpan.appendChild(bar);
        eList.appendChild(newSpan);
    }

    if (trueEnemies.includes("Rock") & enemyR === false){
        enemyR = true;
        let newSpan = document.createElement('span');
        newSpan.textContent = 'Rocks';
        newSpan.classList.add('info2');
        let bar = document.createElement('br');
        newSpan.appendChild(bar);
        eList.appendChild(newSpan);
    }

    if (trueEnemies.includes("Crystal") & enemyC === false){
        enemyC = true;
        let newSpan = document.createElement('span');
        newSpan.textContent = 'Crystals';
        newSpan.classList.add('info3');
        let bar = document.createElement('br');
        newSpan.appendChild(bar);
        eList.appendChild(newSpan);
    }
}

// Retrieves the player high score and level and displays them in the achievement section
function saveAchievements() {    
    if (currentHighScore == null){
        localStorage.setItem('highScore', '0');
    }

    if (currentHighLevel == null){
        localStorage.setItem('highLevel', '0')
    }

    let trueScore = localStorage.getItem('highScore');
    let trueLevel = localStorage.getItem('highLevel');

    let stringScore = " Hi-Score: " + trueScore.toString();
    hiScore[0].innerHTML = stringScore;
    let stringLevel = " Highest Level: " + trueLevel.toString();
    hiLevel[0].innerHTML = stringLevel;
 }

// Determines if two objects have collided based on their position and radius
function Collision(x1, y1, r1, x2, y2, r2){
   const xD = x1 - x2;
   const yD = y1 - y2;
   const displacement = Math.sqrt((xD * xD) + (yD * yD));

    // Returns true when objects are in contact with another
    if (displacement <= r1 + r2){
        return true;
    } else {
        return false;
    }
}

// Registers key strokes for the game and transmits them to the backend as an object
function keyDown(e){
    // Preventative measure to stop undefined key error on server 
        if (trigger === true){
            e.preventDefault();
            if (e.repeat) {return};

            keys[e.key] = true;
    
            if (players[socket.id]){
                socket.emit('keydown', keys);
            }
        }

        if (trigger === false){
            if (e.repeat) {return};
            keys[e.key] = true;
    
            if (players[socket.id]){
                socket.emit('keydown', keys);
            }
        }
}

// Detects key up event and transmits new keystroke object to the backend
function keyUp(e){
    e.preventDefault();
    if (e.repeat) {return};
    keys[e.key] = false;

    if (players[socket.id]){
        socket.emit('keyup', keys);
    }
}

// Takes the dot array created before and uses it generate a starry background upon the canvas
function star(){
    for(const id in stars){
        const s = stars[id];
        
        ctx.beginPath();
        ctx.arc(s.randomX, s.randomY, s.starRadius, s.starFirstAngle, s.starLastAngle);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    }
}

// Rearranges the start screen to display the instruction section 
function how() {
    for(h = 0; h < main.length; h++){
        main[h].style.display = 'none';
    }

    for(i = 0; i < instructions.length; i++){
        instructions[i].style.display = 'flex';
    }
}

// Rearranges the start screen to display the achievement section
function record() {
    for(h = 0; h < main.length; h++){
        main[h].style.display = 'none';
    }

    for(i = 0; i < records.length; i++){
        records[i].style.display = 'flex';
    }
}

// Rearranges the start screen to hide the instruction section and display the starting screen
function home1() {
    for(let h = 0; h < main.length; h++){
        main[h].style.display = 'flex';
    }

    for(let i = 0; i < instructions.length; i++){
        instructions[i].style.display = 'none';
    }

}

// Rearranges the start screen to hide the achievements section and display the starting screen
function home2() {
    for(let h = 0; h < main.length; h++){
        main[h].style.display = 'flex';
    }

    for(let i = 0; i < records.length; i++){
        records[i].style.display = 'none';
    }

}

// Displays the title and start screen after hiding the elements of the game over section
function tryAgain() {
    trigger = false;
    for(let h = 0; h < newGame1.length; h++){
        newGame1[h].style.display = 'none';
    }

    for(let h = 0; h < newGame2.length; h++){
        newGame2[h].style.display = 'none';
    }
    
    for(let t=0; t < title.length; t++){
        title[t].style.display = 'flex';
    }

    for(let i = 0; i < main.length; i++){
        main[i].style.display = 'flex';
    }

}

// Rearranges the start screen section to display the naming section
function begin() {
    for(h = 0; h < main.length; h++){
        main[h].style.display = 'none';
    }

    for(let n = 0; n < names.length; n++){
        names[n].style.display = 'flex';
    }
}

// Alters the value of the trigger variable to alter the keydown event listener, transmits the name to the backend,
// and hides all screen elements to display the game to the player
function submit(e) {
    e.preventDefault();
    let userNames = document.querySelector('#nameInput').value;
    trigger = true;

    socket.emit('start', userNames);

    for(let n = 0; n < names.length; n++){
        names[n].style.display = 'none';
    }

    for(let t=0; t < title.length; t++){
        title[t].style.display = 'none';
    }

}