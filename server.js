require('dotenv').config()

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const server = require("http").createServer(app);
const cors = require('cors');
const socketio = require('socket.io');

app.use(express.json());
app.use(cors());


// Sqlite ting
const db = new sqlite3.Database('./db.sqlite');

db.serialize(function() {
  db.run('create table if not exists users (user_id integer primary key, username text not null, password text not null)');
  db.run('create table if not exists messages (message_id integer primary key, username text not null, message text)');
});

// views mappen sættes som den der skal hentes filer fra
app.use(express.static(path.join(__dirname, 'views')))

app.get('/chat', function(req, res){
  res.sendFile(path.join(__dirname, '/views/chat.html'));
});

// funktion til at tiføje brugere til databasen 
const addUserToDatabase = (username, password) => {
  bcrypt.hash(password, 10, function(err, hash) {
  db.run(
    'insert into users (username, password) values (?, ?)', 
    [username, hash], 
    function(err) {
      if (err) {
        console.error(err);
      }
    }
  );
})
};

// funktion til at finde bruger i databasen
const getUserByUsername = (userName) => {
  // Smart måde at konvertere fra callback til promise:
  return new Promise((resolve, reject) => {  
    db.all(
      'select * from users where userName=(?)',
      [userName], 
      (err, rows) => {
        if (err) {
          console.error(err);
          return reject(err);
        }
        return resolve(rows);
      }
    );
  })
}

/*
const addMessageToDatabase = (message) => {
  db.run(
    'insert into messages (username, message) values (?, ?)', 
    [message.username, message.message], 
    function(err) {
      if (err) {
        console.error(err);
      }
    }
  );
}
*/

/*
const getAllMessages = () => {
  // Smart måde at konvertere fra callback til promise:
  return new Promise((resolve, reject) => {  
    db.all('select * from messages', (err, rows) => {
      if (err) {
        console.error(err);
        return reject(err);
      }
      return resolve(rows);
    });
  })
}
*/

// på indexsiden: hvis brugeren er logget ind og har en session så sendes man videre til dashboard, hvis ikke så sendes man videre til loginsiden 
app.get("/", (req, res) => {
    res.sendFile("login.html", { root: path.join(__dirname, "views") });
});

app.post("/authenticate", bodyParser.urlencoded(), async (req, res) => {
  
  // Henter vi brugeren ud fra databasen
  const user = await getUserByUsername(req.body.username);
  const token = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET);

  // console.log(token);

  if(user.length === 0) {
    console.log('no user found');
    return res.redirect("/");
  }

  // Tjekker om brugeren findes i databasen og om passwordet er korrekt
  let match = bcrypt.compareSync(req.body.password, user[0].password)

  if (match === true) {
    res.cookie("token", token, {
      httpOnly: true,
      // secure: true
      maxAge: 2592000,
      // signed: true
    }).redirect('/chat') 
    
    
  } else {
    // Sender en error 401 (unauthorized) til klienten
    console.log('fejl')
    return  res.sendStatus(401);
  }
});
/*
function ensureToken(req, res , next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== 'undefined' ) {
      const bearer = bearerHeader.split(" "); 
      const bearerToken = bearer[1]; 
      req.token = bearerToken; 
      console.log(req.token)
      next() 
  } else {
      res.sendStatus(403); 
      console.log('den fejlede')

  }
}
*/


app.get("/logout", (req, res) => {
  req.session.destroy((err) => {});
  return res.send("Thank you! Visit again");
});


app.get("/signup", (req, res) => {
  
      return res.sendFile("signup.html", { root: path.join(__dirname, "views") });

});

app.post("/signup", bodyParser.urlencoded(), async (req, res) => {
  const user = await getUserByUsername(req.body.username)
  if (user.length > 0) {
    return res.send('Username already exists');
  }

  addUserToDatabase(req.body.username, req.body.password);
  res.redirect('/');
})  




/*
console.log(socket.handshake.headers.cookie.split('=')[1])

  let token = socket.handshake.headers.cookie.split('=')[1]

  let info = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

  let brugernavn = (info.user[0].username)

  console.log(brugernavn)
*/


// socket IO ting
const io = socketio(server)
  


io.use((socket, next) => {
  let token = socket.handshake.headers.cookie.split('=')[1]
  console.log(token)
  let info = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  console.log(info)
  if (info){
    next()
  }
})


io.on("connection", function(socket) {
console.log("a user has joined the chat")
    socket.on("user_join", function(data) {
        this.username = data;
        console.log(this.username)
        socket.broadcast.emit("user_join", data);

    });

    socket.on("chat_message", function(data) {
      console.log(data)
      // addMessageToDatabase({message: data, username: this.username});
        data.username = this.username;
        socket.broadcast.emit("chat_message", data);
    });

    socket.on("disconnect", function(data) {
      console.log(this.username)
        socket.broadcast.emit("user_leave", this.username);
    });
});


server.listen(port, () => {
  console.log("Website is running");
});

