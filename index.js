require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Session = require("express-session");

let id = 1;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
    Session({
        secret: process.env.SECRET,
        name: "quiz",
        saveUninitialized: false,
        resave: false
    })
);

// Connecting to MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(error => console.log(error));

// Importing Models
const Question = require("./models/Question");
const User = require("./models/User");

// Declaring constants
// let question,
//     questionList = [];
// let n = 5; // Number of questions
// let currentIndex;

// Handling REQUESTS
app.get("/", (req, res) => {
    res.redirect("login");
});

app.get("/home", (req, res) => {
    res.render("index");
});

app.get("/start", (req, res) => {
    // currentIndex = 0;
    let session = req.session;
    session.currentIndex = 0;
    session.n = 5;
    session.name = id;
    id++;
    Question.findRandom({}, {}, { limit: 5 }, (err, result) => {
        if (err) {
            console.log(error);
        } else {
            if (!result) {
                console.log("Error!");
            } else {
                let i = 0;
                session.questionList = [];
                result.forEach(ques => {
                    session.questionList.push({
                        index: i,
                        question: ques.question,
                        A: ques.A,
                        B: ques.B,
                        C: ques.C,
                        D: ques.D,
                        answer: ques.answer,
                        chosen: ""
                    });
                    // console.log(ques.question);
                    i++;
                });
                res.redirect("/question");
            }
        }
    });
});

app.get("/question", (req, res) => {
    let session = req.session;
    let question = { ...session.questionList[session.currentIndex] };

    res.render("question", { question });
});

app.post("/question", (req, res) => {
    let session = req.session;
    let option = req.body.option;
    let move = req.body.move;
    if (typeof option !== "undefined") {
        session.questionList[session.currentIndex].chosen = option;
    }
    if (move === "Prev") {
        if (session.currentIndex > 0) session.currentIndex--;
    } else if (move === "Next") {
        if (session.currentIndex < session.n - 1) session.currentIndex++;
    }
    res.redirect("/question");
});

app.get("/submit", (req, res) => {
    let session = req.session;
    let score = 0;
    let msg;
    session.questionList.forEach(question => {
        if (question.chosen === question.answer) {
            score++;
        }
    });
    if (score > 0.75 * session.n) msg = "You are awesome! :P";
    else if (score > 0.35 * session.n) msg = "Nice try! :)";
    else msg = "Better luck next time! ;(";
    res.render("score", { score, msg });
    req.session.destroy();
});

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        const { username, password } = req.body;
        const user = new User({
            username,
            password
        });
        user.save()
            .then(() => console.log("Saved"))
            .catch(error => console.log(error));
    });

app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        const { username, password } = req.body;
        User.findOne({ username: username }, (error, user) => {
            if (error) {
                console.log(error);
            } else {
                if (user) {
                    if (user.password === password) {
                        res.redirect("/home");
                    } else res.redirect("/login");
                }
            }
        });
    });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
