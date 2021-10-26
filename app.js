const express = require("express");
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const path = require("path")
const httpServer = require("http").createServer();
const session = require('cookie-session');
const cookieParser = require('cookie-parser');
const io = require("socket.io")(httpServer, {
    cors: {
        origin: "ec2-54-237-225-45.compute-1.amazonaws.com",
        methods: ["GET", "POST"]
    }
})


const userRoutes = require("./routes/users-routes")

const HttpError = require("./models/HttpError")

const app = express();

app.use(bodyParser.json())

app.use("/uploads/images", express.static(path.join('uploads', 'images')))

app.use(express.static(path.join('public')))




app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

    next();
});

app.use(cookieParser("gavin"));
app.use(
    session({
        cookie: { maxAge: 60000 },
        secret: "gavin",
        signed: true,
        resave: true,
    })
);


app.use("/api/user", userRoutes)

app.use((req, res, next) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
})

// app.use((req, res, next) => {
//     const error = new HttpError("could not find this route", 404);
//     throw error;
// });

app.use((error, req, res, next) => {
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || "an unknown error occured" });
});

io.on("connection", socket => {
    
    socket.on("update", update => {
       
        io.emit("update", update)
    })
})


io.listen(8001)

// app.listen(process.env.PORT || 5000);

mongoose
    .connect(
        `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.d3tnt.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
    )
    .then(() => {
        app.listen(process.env.PORT || 8000);
    })
    .catch((err) => {
        console.log(err);
    });