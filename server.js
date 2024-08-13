const express = require('express');
const app = express();

const http = require ('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server (server, {pingInterval: 2000, pingTimeout: 5000});

const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) =>{
    res.sendFile(__dirname + '/public/front.html');
})

const socketID = {};
const serverPlayers = {};
const serverBullets = {};
const serverAsteroids = {};
const serverRocks = {};
const serverCrystals = {};

let bulletID = 0;
let asteroidID = 0;
let rocksID = 0;
let rockTotal = 0;
let crystalsID = 0;
let crystalTotal = 0;

let maxWidth = 3000;
let maxHeight = 2000;
let level = 1;

io.on('connection', (socket) => {
    //Collects socket.id for use in emitting events
    let holder = socket.id;
    socketID[socket.id] = {
        id: holder,
        width: 1400,
        height: 900
    }

    //In conjuction with the socket.on 'canvas' event attempts to preemptively set the canvas width and height
    for (const id in socketID){
        io.to(socketID[id].id).emit('screen');
    }

    socket.on('canvas', (dimensions) =>{
        socketID[socket.id].width = dimensions.playerWidth;
        socketID[socket.id].height = dimensions.playerHeight;
    })

    // Emits an updated list of players to all players 
    io.emit('players', serverPlayers);

    // identifies the reason someone left the server and deletes that person from the backend player array
    socket.on('disconnect', (reason) => {
        console.log(reason);
        delete serverPlayers[socket.id];
        delete socketID[socket.id];

        // Once again emits an updated list of players to all players
        io.emit('players', serverPlayers);
    })

    // Once a name is submitted, a player object is created with all of the necessary information
    socket.on('start', (e) => {
        serverPlayers [socket.id] = {
            xpos: Math.floor(Math.random()*(900-400+1) + 400),
            ypos: Math.floor(Math.random()*(600-300+1) + 300),
            angle: 1.575,
            rotate: .06,
            acc: .08,
            xspeed: 0,
            yspeed: 0,
            width: socketID[socket.id].width || 1400,
            height: socketID[socket.id].height || 900,
            radius: 30,
            keys: {ArrowLeft: false, ArrowUp: false, ArrowRight: false, a: false, w: false,
                  d: false, " ": false},
            rate: 0,
            fireRate: 10,
            vulnerable: false,
            lives: 3,
            score: 0,
            level: 0,
            color: `hsl(${360 * Math.random()}, 100%, 50%)`,
            timer: 0,
            name: e
        }
    })

    // Once a key down event is triggered, this receives the new keys object and updates the ships key object
    socket.on('keydown', (e) => {
        if (e != undefined & serverPlayers[socket.id] !== null & serverPlayers[socket.id] !== "undefined"
            & serverPlayers[socket.id].keys !== null & serverPlayers[socket.id].keys !== "undefined"){
            serverPlayers[socket.id].keys = e;
        }
    })

    // Once a key down event is triggered, this receives the new keys object and updates the ships key object
    socket.on('keyup', (e) => {
        if (e !== undefined & serverPlayers[socket.id] !== null & serverPlayers[socket.id] !== "undefined" 
            & serverPlayers[socket.id].keys !== null & serverPlayers[socket.id].keys !== "undefined"){
            serverPlayers[socket.id].keys = e;
        }
    })
})

// Determines the pace at which everything in the game occurs
setInterval(() =>{
    // This emit event triggers a request for the player's current window dimensions to update the canvas dimensions
    for (const id in socketID){
        io.to(socketID[id].id).emit('screen');
    }

    // As soon as there are no players left to continue the game, the level is reset to level 1
    if(Object.keys(serverPlayers).length === 0){
        level = 1;
    }

    // Checks a player's timer and vulnerable property to determine the duration of the invulnerability state
    for (const id in serverPlayers){
        if(serverPlayers[id].vulnerable === false){
            serverPlayers[id].timer++;
            if(serverPlayers[id].timer === 300){
                serverPlayers[id].vulnerable = true;
                serverPlayers[id].timer = 0;

            }
        } else if (serverPlayers[id].vulnerable === true & serverPlayers[id].timer != 0){
            serverPlayers[id].timer = 0;
        }
    }

    // This updates all of the players canvas dimensions and level on a regular basis
    for (const id in socketID){
        if (serverPlayers[id]){
            serverPlayers[id].width = socketID[id].width;
            serverPlayers[id].height = socketID[id].height;
            serverPlayers[id].level = level;
        }
    }

    // Constantly emits information on object arrays in the backend to the frontend
    io.emit('players', serverPlayers);
    io.emit('bullets', serverBullets);
    io.emit('asteroids', serverAsteroids);
    io.emit('rocks', serverRocks);
    io.emit('crystals', serverCrystals);

    // Detects collisions between ships and crystals. Sets game parameters accordingly
    if (Object.keys(serverCrystals).length != 0) {
        // Collisions will only occur if the ship is vulnerable
        for (const mm in serverPlayers){
            let pm = serverPlayers[mm];
            if (pm.vulnerable){
                for(const nn in serverCrystals){
                    let am = serverCrystals[nn];
                    // Resets ship to original position upon collision
                    if(Collision(pm.xpos, pm.ypos, pm.radius, 
                        am.xpos, am.ypos, am.radius)){
                            pm.xpos = pm.width/2;
                            pm.ypos = pm.height/2;
                            pm.xspeed = 0;
                            pm.yspeed = 0;

                            if (pm.lives !=0){
                                serverPlayers[mm].lives--;
                                serverPlayers[mm].vulnerable = false;
                            } else if (pm.lives === 0){
                                for (let bID in serverBullets) {
                                    if (serverBullets[bID].player === mm){
                                        delete serverBullets[bID];
                                    }
                                }
                                delete serverPlayers[mm];
                            }
                    }
                }
            }
        }
    }

    // Detects collisions between crystals and bullets and adjusts game parameters accordingly
    if (Object.keys(serverCrystals).length > 0 && Object.keys(serverBullets).length > 0) {
        for (const oo in serverCrystals){
            const am = serverCrystals[oo];
            for(const idm in serverBullets){
                const bm = serverBullets[idm];
                // Upon collision adjusts the dimensions of the rock and
                // deletes the bullet object
                if(Collision(am.xpos, am.ypos, am.radius, bm.xpos, bm.ypos, bm.radius)){
                    delete serverBullets[idm];
                    am.radius -= 2.5
                    am.length -= 2.5; 
                    // adds 200 to score and deletes rock object after a certain size.
                    if(serverCrystals[oo].radius == 25 & serverPlayers[bm.player] !== null & 
                        serverPlayers[bm.player] !== "undefined" & typeof serverPlayers[bm.player].score !== "undefined"){
                        delete serverCrystals[oo];
                        serverPlayers[bm.player].score += 100;
                        crystalTotal--;
                    }
                }
            }
        }
    }

    // Generates crystal objects in the corners of the screen and locates player to serve as
    // the crystal's target
    if (Object.keys(serverCrystals).length == 0 || crystalTotal < ((level/2))){
        let multim = (level/2);
        // The coordinates for the corners of the game
        let xC = [120, maxWidth - 120, 120, maxWidth - 120];
        let yC = [120, 120, maxHeight - 120, maxHeight - 120];
        // Makes sure to generate enemies on odd level and when crystals reach set minimum
        if ((level - 2) % 2 == 1 & crystalTotal < multim){
            for(let ammo = 0; ammo < 4; ammo++){

                let attackX = maxWidth/2;
                let attackY = maxHeight/2;

                // When there is a player change the target from the screen center to the player
                if (Object.keys(serverPlayers).length != 0){ 
                    for (const value in serverPlayers){
                        attackX = serverPlayers[value].xpos;
                        attackY = serverPlayers[value].ypos;
                        break;
                    }
                }

                serverCrystals[crystalsID] = {
                    xpos: xC[ammo],
                    ypos: yC[ammo],
                    // Gives the rock object movement and physical attributes
                    xspeed: Math.cos(Math.atan2(attackY - yC[ammo], attackX - xC[ammo])),
                    yspeed: -Math.sin(Math.atan2(attackY - yC[ammo], attackX - xC[ammo])),
                    radius: 40,
                    length: 40,
                    angle: .02
                }
                crystalsID++;
                crystalTotal++;
            }
        }
    }

    // This ship/rock collision is identical for all other ship/enemy collisions
    if (Object.keys(serverRocks).length != 0) {
        // Collisions will only occur if the ship is vulnerable
        for (const aa in serverPlayers){
            let p = serverPlayers[aa];
            if (p.vulnerable){
                for(const zz in serverRocks){
                    let a = serverRocks[zz];
                    // Resets ship to original position upon collision
                    if(Collision(p.xpos, p.ypos, p.radius, 
                        a.xpos, a.ypos, a.radius)){
                            p.xpos = p.width/2;
                            p.ypos = p.height/2;
                            p.xspeed = 0;
                            p.yspeed = 0;

                            if (p.lives !=0){
                                serverPlayers[aa].lives--;
                                serverPlayers[aa].vulnerable = false;
                            } else if (p.lives === 0){
                                for (let bID2 in serverBullets) {
                                    if (serverBullets[bID2].player === aa){
                                        delete serverBullets[bID2];
                                    }
                                }
                                delete serverPlayers[aa];
                            }
                    }
                }
            }
        }
    }

    // Detects collisions between rocks and bullets and adjusts game parameters accordingly
    if (Object.keys(serverRocks).length > 0 && Object.keys(serverBullets).length > 0) {
        for (const bb in serverRocks){
            const a = serverRocks[bb];
            for(const id in serverBullets){
                const b = serverBullets[id];
                // Upon collision adjusts the dimensions of the rock and
                // deletes the bullet object
                if(Collision(a.xpos, a.ypos, a.radius, b.xpos, b.ypos, b.radius)){
                    delete serverBullets[id];
                    a.radius -= 2.5;
                    a.length -= 2.5; 
                    // adds 200 to score and deletes rock object after a certain size.
                    if(serverRocks[bb].radius == 20 & serverPlayers[b.player] !== null & 
                        serverPlayers[b.player] !== "undefined" & serverPlayers[b.player].score !== null & 
                        typeof serverPlayers[b.player].score !== "undefined"){
                        delete serverRocks[bb];
                        serverPlayers[b.player].score += 200;
                        rockTotal--;
                    }
                }
            }
        }
    }

    // Generates rock objects
    if (Object.keys(serverRocks).length == 0 || rockTotal < ((level/2))){
        let multi = (level/2);
        // Generates rock objects on even levels and when rock objects reach a minimum amount
        if (level % 2 == 0 & rockTotal < multi){
            serverRocks[rocksID] = {
                xpos: Math.floor(Math.random() * maxWidth),
                ypos: Math.floor(Math.random() * maxHeight),
                // Gives the rock object movement and physical attributes
                xspeed: 1.5,
                yspeed: -1.5,
                radius: 50,
                length: 80
            }
            rocksID++;
            rockTotal++;
        }
    }

    // Detects collisions between ships and asteroids and adjusts game parameters accordingly
    if (Object.keys(serverAsteroids).length != 0) {
        // Collisions will only occur if the ship is vulnerable
        for (const dd in serverPlayers){
            let p = serverPlayers[dd];
            if (p.vulnerable){
                for(const id in serverAsteroids){
                    let a = serverAsteroids[id];
                    // Resets ship to original position upon collision
                    if(Collision(p.xpos, p.ypos, p.radius, 
                        a.xpos, a.ypos, a.radius)){
                            p.xpos = p.width/2;
                            p.ypos = p.height/2;
                            p.xspeed = 0;
                            p.yspeed = 0;

                            // While the player still has lives they can lose a life and enter a invulnerable state
                            // otherwise they enter a 'game over' state and their ship is deleted
                            if (p.lives !=0){
                                serverPlayers[dd].lives--;
                                serverPlayers[dd].vulnerable = false;
                            } else if (p.lives === 0){
                                for (let bID3 in serverBullets) {
                                    if (serverBullets[bID3].player === dd){
                                        delete serverBullets[bID3];
                                    }
                                }
                                delete serverPlayers[dd];
                            }
                    }
                }
            }
        }
    }

    //I don't know why but writing out serverAsteroids[dd] works but using the const a doesn't.
    //Same thing for bullet. It will bypass the radius restrictions otherwise
    if (Object.keys(serverAsteroids).length > 0 && Object.keys(serverBullets).length > 0) {
        for (const dz in serverAsteroids){
            const a = serverAsteroids[dz];
            for(const id in serverBullets){
                const bc = serverBullets[id];
                // Upon collision adjusts the dimensions of the asteroid and
                // deletes the bullet object
                if(Collision(a.xpos, a.ypos, a.radius, bc.xpos, bc.ypos, bc.radius)){
                    delete serverBullets[id];
                    serverAsteroids[dz].radius -= 5;
                    // Adds two new asteroid objects after a certain size, 
                    // adds to score, and deletes asteroid object.
                    if(serverAsteroids[dz] !== null & typeof serverAsteroids[dz] !== "undefined" & typeof serverAsteroids[dz].radius !== "undefined"){
                        if(serverAsteroids[dz].radius == 45 & serverPlayers[bc.player] !== null & typeof serverPlayers[bc.player] !== "undefined"){
                            if (serverPlayers[bc.player].score !== null & typeof serverPlayers[bc.player].score !== "undefined"){
                                let finalX = a.xpos;
                                let finalY = a.ypos;
                                delete serverAsteroids[dz];
                                for (let rr = 0; rr < 2; rr++) {
                                    serverAsteroids [asteroidID] = {
                                        xpos: finalX,
                                        ypos: finalY,
                                        // Gives the asteroid a random orientation and speed
                                        xspeed: Math.cos(Math.random()*Math.PI*2) * 2,
                                        yspeed: Math.sin(Math.random()*Math.PI*2) * 2,
                                        width: 35,
                                        height: 35,
                                        radius: 35,
                                        color: "white"
                                    }

                                    // Adds score to player that fired the bullet
                                    asteroidID++;
                                    serverPlayers[bc.player].score += 20;
                                }
                            }
                        }

                        // Adds to score and deletes asteroid
                        else if (a.radius == 25 & serverPlayers[bc.player] !== null & serverPlayers[bc.player] !== "undefined"
                            & serverPlayers[bc.player].score !== null & typeof serverPlayers[bc.player].score !== "undefined"
                        ){
                            serverPlayers[bc.player].score += 20;
                            delete serverAsteroids[dz];
                        }
                    }
                }
            }
        }
    }

    // If there are no asteroids the next level starts and the appropriate amount of asteroids are created 
    if (Object.keys(serverAsteroids).length == 0){
        level++;
        let multi = level;
        
        if (level != 1){
            for (const id in serverPlayers){
                serverPlayers[id].vulnerable = false;
                serverPlayers[id].timer = 250;
            }
        }

        for (let z = 0; z < multi; z++){
            serverAsteroids [asteroidID] = {
                // Places the asteroid in a random location
                xpos: Math.floor(Math.random() * maxWidth),
                ypos: Math.floor(Math.random() * maxHeight),
                // Gives the asteroid a random orientation
                xspeed: Math.cos(Math.random()*Math.PI*2) * 1.8,
                yspeed: Math.sin(Math.random()*Math.PI*2) * 1.8,
                width: 55,
                height: 55,
                radius: 55,
                color: "white"
            }
            // Increases the ID value for the next asteroid object
            asteroidID++;
        }
    }

    // Converts the object into an array
    if (Object.keys(serverPlayers).length != 0){
        let widthArray = [];
        let heightArray = [];
        for (const id in serverPlayers){
            widthArray.push(serverPlayers[id].width);
            heightArray.push(serverPlayers[id].height)
        }

        // Is used to determine the player with the greates width and height
        maxWidth = Math.max(...widthArray);
        maxHeight = Math.max(...heightArray);
    }

    // Sets the asteroid's boundaries to a reasonable height and width. Sets game boundaries to 
    // the largest boundaries of existing players (while less than 2500 width and 1400 height)
    if (maxWidth > 2500 || maxWidth < 0){
        maxWidth = 2500;
    }
    if (maxHeight > 1400 || maxHeight < 0){
        maxHeight = 1400;
    }

    // Sorts through the asteroid objects and repositions them if they exceed the set boundaries
    for (const id in serverAsteroids){
        const a = serverAsteroids[id];

        a.xpos -= a.xspeed;
        a.ypos -= a.yspeed;

        if (a.radius > a.xpos){
            a.xpos = maxWidth - a.radius;
        }

        if (a.xpos > maxWidth){
            a.xpos = a.radius;
        }

        if (a.radius > a.ypos){
            a.ypos = maxHeight - a.radius;
        }

        if (a.ypos > maxHeight){
            a.ypos = a.radius;
        }
    }

    //Sorts through the rocks objects and repositions them if they exceed the set boundaries
    for (const id in serverRocks){
        const an = serverRocks[id];

        an.xpos -= an.xspeed;
        an.ypos -= an.yspeed;

        if (an.radius > an.xpos){
            an.xpos = maxWidth - an.radius;
        }

        if (an.xpos > maxWidth){
            an.xpos = an.radius;
        }

        if (an.radius > an.ypos){
            an.ypos = maxHeight - an.radius;
        }

        if (an.ypos > maxHeight){
            an.ypos = an.radius;
        }
    }
    
    //Sorts through the crystal objects and repositions them if they exceed the set boundaries
    for (const uu in serverCrystals){
        const amc = serverCrystals[uu];

        amc.xpos += amc.xspeed;
        amc.ypos += amc.yspeed;

        // Updates the crystals movement to create a homing effect
        if (Object.keys(serverPlayers).length != 0){ 
            for (const move in serverPlayers){
                let newX = serverPlayers[move].xpos;
                let newY = serverPlayers[move].ypos;

                amc.xspeed = 1.25*Math.cos(Math.atan2(newY - amc.ypos, newX - amc.xpos));
                amc.yspeed = 1.25*Math.sin(Math.atan2(newY - amc.ypos, newX - amc.xpos));
                break;
            }
        }

        if (amc.radius > amc.xpos){
            amc.xpos = maxWidth - amc.radius;
        }

        if (amc.xpos > maxWidth){
            amc.xpos = amc.radius;
        }

        if (amc.radius > amc.ypos){
            amc.ypos = maxHeight - amc.radius;
        }

        if (amc.ypos > maxHeight){
            amc.ypos = amc.radius;
        }
    }

    // Looks at the timer property of a bullet object to determine if they are up for deletion. If they aren't then
    // the bullets trajector is updated
    for (const id in serverBullets){
        const b = serverBullets[id];

        if (b.timer >= 70){
            delete serverBullets[id];
        } else{
            b.xpos -= Math.cos(b.angle) * b.speed * (b.timer / 2);
            b.ypos -= Math.sin(b.angle) * b.speed * (b.timer / 2);
        }

        b.timer++;
    }

    // Is used to update the trajectory of each player's ship
    for (const id in serverPlayers) {
        const s = serverPlayers[id];

        // This represents some form of decceleration of the ship
        s.xspeed = s.xspeed *.99;
        s.yspeed = s.yspeed *.99;
        s.xpos -= s.xspeed;
        s.ypos -= s.yspeed;

        // Repositions the ship object if they exceed the established boundaries
        if (s.radius > s.xpos){
            s.xpos = s.width - s.radius;
        }

        if (s.xpos > s.width){
            s.xpos = s.radius;
        }

        if (s.radius > s.ypos){
            s.ypos = s.height - s.radius;
        }

        if (s.ypos > s.height){
            s.ypos = s.radius;
        }

        // The control scheme for the ship that takes the player's keystrokes and translates them into movement
        if (s.keys['d'] || s.keys['ArrowRight']){
            s.angle += s.rotate;
        }

        if (s.keys['a'] || s.keys['ArrowLeft']){
            s.angle -= s.rotate;
        }

        if (s.keys['w'] || s.keys['ArrowUp']){
            s.xspeed += Math.cos(s.angle) * s.acc;
            s.yspeed += Math.sin(s.angle) * s.acc;
            s.xpos -= s.xspeed;
            s.ypos -= s.yspeed;
        }

        // When a player uses the spacebar a bullet object is created using the ships position and angle
        if(s.keys[' ']){
            bulletID++;
            s.rate++;

            // Keeps track of how long the player has held down the spacebar and uses that information to 
            // set the appropriate rate of fire (the rate at which bullets are generated)
            if (s.rate % s.fireRate == 0){
                serverBullets[bulletID] = {
                    angle: s.angle,
                    xpos: (s.xpos) - (30 * Math.cos(s.angle)),
                    ypos: (s.ypos) - (30 * Math.sin(s.angle)),
                    speed: 2,
                    width: 8,
                    height: 8,
                    radius: 8,
                    timer: 0,
                    color: s.color,
                    player: id
                }
            }
        }
    }
}, 15)


server.listen(port, () =>{
    console.log('Example app listening on port', port);
})

// Determines if the positions of two objects have overlapped
function Collision(x1, y1, r1, x2, y2, r2){
    const xD = x1 - x2;
    const yD = y1 - y2;
    let displacement = Math.sqrt((xD * xD) + (yD * yD));
 
     // Returns true when objects are in contact with another
     if (displacement <= r1 + r2){
         return true;
     } else {
         return false;
     }
 }