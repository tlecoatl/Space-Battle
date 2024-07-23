//have to premtively set window screen dimensions. This seems like a lost cause right now so it would be best to abandon it
//right now. This also includes the resizing issue where sometimes it works and sometimes it doesn't. My only solution right
//now appears to decrease the time between each interval but that doesn't seem very practical

//The asteroid boundary appears to be resolved but now all thats left is to rework the logic so that when a larger player
//appears and the smaller player is gone there is a switch of some sort.

//const colors = ['blue', 'red', 'green','yellow', 'orange', 'purple'] do this after the canvaswidth



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

let bulletID = 0;
let asteroidID = 0;
let rocksID = 0;

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

    //In conjuction with the socket.on 'canvas' even attempts to preemptively set the canvas width and height
    for (const id in socketID){
        io.to(socketID[id].id).emit('screen');
    }

    socket.on('canvas', (dimensions) =>{
        socketID[socket.id].width = dimensions.playerWidth;
        socketID[socket.id].height = dimensions.playerHeight;
    })

    io.emit('players', serverPlayers);

    socket.on('disconnect', (reason) => {
        console.log(reason);
        delete serverPlayers[socket.id];
        delete socketID[socket.id];

        io.emit('players', serverPlayers);
    })

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
            keys: {},
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

    socket.on('keydown', (e) => {
        let s = serverPlayers[socket.id];
        s.keys = e;
    })

    socket.on('keyup', (e) => {
        let s = serverPlayers[socket.id];
        s.keys = e;
    })
})

setInterval(() =>{
    for (const id in socketID){
        io.to(socketID[id].id).emit('screen');
    }

    if(Object.keys(serverPlayers).length === 0){
        level = 1;
    }

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

    for (const id in socketID){
        if (serverPlayers[id]){
            serverPlayers[id].width = socketID[id].width;
            serverPlayers[id].height = socketID[id].height;
            serverPlayers[id].level = level;
        }
    }

    io.emit('players', serverPlayers);
    io.emit('bullets', serverBullets);
    io.emit('asteroids', serverAsteroids);
    io.emit('rocks', serverRocks);

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
                                //console.log(serverPlayers[aa].lives);
                            } else if (p.lives === 0){
                                delete serverPlayers[aa];
                            }
                    }
                }
            }
        }
    }

    if (Object.keys(serverRocks).length > 0 && Object.keys(serverBullets).length > 0) {
        for (const bb in serverRocks){
            const a = serverRocks[bb];
            for(const id in serverBullets){
                const b = serverBullets[id];
                // Upon collision adjusts the dimensions of the asteroid and
                // deletes the bullet object
                if(Collision(a.xpos, a.ypos, a.radius, b.xpos, b.ypos, b.radius)){
                    let finalBullet = b.player;
                    delete serverBullets[id];
                    a.radius -= 5;
                    // Adds two new asteroid objects after a certain size, 
                    // adds to score, and deletes asteroid object.
                    if(serverRocks[bb].radius == 45){
                        let finalX = a.xpos;
                        let finalY = a.ypos;
                        delete serverRocks[bb];
                        for (let rr = 0; rr < 2; rr++) {
                            serverRocks [rocksID] = {
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
                            rocksID++;
                            serverPlayers[finalBullet].score += 20;
                        }
                    }
                    // Adds to score and deletes asteroid
                    else if (a.radius == 25){
                        serverPlayers[finalBullet].score += 20;
                        delete serverRocks[bb];
                    }
                }
            }
        }
    }

    if (Object.keys(serverRocks).length == 0){
        level++;
        let multi = 2 + level;
        for (let z = 0; z < multi; z++){
            serverRocks[rocksID] = {
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
            rocksID++;
        }
    }

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

                            if (p.lives !=0){
                                serverPlayers[dd].lives--;
                                serverPlayers[dd].vulnerable = false;
                                //console.log(serverPlayers[dd].lives);
                            } else if (p.lives === 0){
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
        for (const dd in serverAsteroids){
            const a = serverAsteroids[dd];
            for(const id in serverBullets){
                const b = serverBullets[id];
                // Upon collision adjusts the dimensions of the asteroid and
                // deletes the bullet object
                if(Collision(a.xpos, a.ypos, a.radius, b.xpos, b.ypos, b.radius)){
                    let finalBullet = b.player;
                    delete serverBullets[id];
                    a.radius -= 5;
                    // Adds two new asteroid objects after a certain size, 
                    // adds to score, and deletes asteroid object.
                    if(serverAsteroids[dd].radius == 45){
                        let finalX = a.xpos;
                        let finalY = a.ypos;
                        delete serverAsteroids[dd];
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
                            asteroidID++;
                            serverPlayers[finalBullet].score += 20;
                        }
                    }
                    // Adds to score and deletes asteroid
                    else if (a.radius == 25){
                        serverPlayers[finalBullet].score += 20;
                        delete serverAsteroids[dd];
                    }
                }
            }
        }
    }

    if (Object.keys(serverAsteroids).length == 0){
        level++;
        let multi = 2 + level;
        for (let z = 0; z < multi; z++){
            serverAsteroids [asteroidID] = {
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
            asteroidID++;
        }
    }

    //Converts the object into an array
    if (Object.keys(serverPlayers).length != 0){
        let widthArray = [];
        let heightArray = [];
        for (const id in serverPlayers){
            widthArray.push(serverPlayers[id].width);
            heightArray.push(serverPlayers[id].height)
        }

        maxWidth = Math.max(...widthArray);
        maxHeight = Math.max(...heightArray);
    }

    //Sets the asteroid's boundaries to a reasonable height and width
    if (maxWidth > 2500 || maxWidth < 0){
        maxWidth = 2500;
    }
    if (maxHeight > 1400 || maxHeight < 0){
        maxHeight = 1400;
    }

    //Sorts through the asteroid objects and repositions them if they exceed the set boundaries
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

    //Sets the asteroid's boundaries to a reasonable height and width
    if (maxWidth > 2500 || maxWidth < 0){
        maxWidth = 2500;
    }
    if (maxHeight > 1400 || maxHeight < 0){
        maxHeight = 1400;
    }

    //Sorts through the asteroid objects and repositions them if they exceed the set boundaries
    for (const id in serverRocks){
        const a = serverRocks[id];

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
    
    for (const id in serverBullets){
        const b = serverBullets[id];

        if (b.timer >= 60){
            delete serverBullets[id];
        } else{
            b.xpos -= Math.cos(b.angle) * b.speed * (b.timer / 2);
            b.ypos -= Math.sin(b.angle) * b.speed * (b.timer / 2);
        }

        b.timer++;
    }

    for (const id in serverPlayers) {
        const s = serverPlayers[id];

        s.xspeed = s.xspeed *.99;
        s.yspeed = s.yspeed *.99;
        s.xpos -= s.xspeed;
        s.ypos -= s.yspeed;

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

        if(s.keys[' ']){
            bulletID++;
            s.rate++;

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