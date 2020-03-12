require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Session = require("express-session");
const passport = require("passport");

const app = express();
app.use(express.urlencoded({ extended: true }));

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
app.use(passport.initialize());
app.use(passport.session());

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

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Handling REQUESTS
app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("index");
    } else {
        res.redirect("/login");
    }
});

app.get("/start", (req, res) => {
    let session = req.session;
    session.currentIndex = 0;
    session.n = 5;
    session.isStrated = true;
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
                    i++;
                });
                res.redirect("/question");
            }
        }
    });
});

app.get("/question", (req, res) => {
    let session = req.session;
    if (session.isStrated) {
        let question = { ...session.questionList[session.currentIndex] };
        res.render("question", { question });
    } else {
        res.redirect("/");
    }
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
    req.session.isStrated = false;
});

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        const { username, password } = req.body;
        User.register({ username: username }, password, error => {
            if (error) {
                console.log(error);
                res.redirect("/register");
            } else res.redirect("/login");
        });
    });

app.get("/login", (req, res) => {
    res.render("login");
});

app.post(
    "/login",
    passport.authenticate("local", { failureRedirect: "/login" }),
    function(req, res) {
        res.redirect("/");
    }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
