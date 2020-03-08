require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
    session({
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
let question,
    questionList = [];
let n = 5; // Number of questions
let currentIndex;

// Handling REQUESTS
app.get("/", (req, res) => {
    res.redirect("login");
});

app.get("/home", (req, res) => {
    res.render("index");
});

app.get("/start", (req, res) => {
    currentIndex = 0;
    Question.findRandom({}, {}, { limit: n }, (err, result) => {
        if (err) {
            console.log(error);
        } else {
            if (!result) {
                console.log("Error!");
            } else {
                let i = 0;
                questionList = [];
                result.forEach(ques => {
                    questionList.push({
                        index: i,
                        question: ques.question,
                        A: ques.A,
                        B: ques.B,
                        C: ques.C,
                        D: ques.D,
                        answer: ques.answer,
                        chosen: ""
                    });
                    console.log(ques.question);
                    i++;
                });
                res.redirect("/question");
            }
        }
    });
});

app.get("/question", (req, res) => {
    question = { ...questionList[currentIndex] };

    res.render("question", { question });
});

app.post("/question", (req, res) => {
    let option = req.body.option;
    let move = req.body.move;
    if (typeof option != "undefined") {
        questionList[currentIndex].chosen = option;
    }
    if (move === "Prev") {
        if (currentIndex > 0) currentIndex--;
    } else if (move === "Next") {
        if (currentIndex < n - 1) currentIndex++;
    }
    res.redirect("/question");
});

app.get("/submit", (req, res) => {
    let score = 0;
    let msg;
    questionList.forEach(question => {
        if (question.chosen === question.answer) {
            score++;
        }
    });
    if (score > 0.75 * n) msg = "You are awesome! :P";
    else if (score > 0.35 * n) msg = "Nice try! :)";
    else msg = "Better luck next time! ;(";
    res.render("score", { score, msg });
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
