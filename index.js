require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static("public"));


// Connecting to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(error => console.log(error));


// Importing Models
const Question = require("./models/Question");

// Declaring constants
let question, questionList = [];
let n = 5; // Number of questions
let currentIndex;


// Handling REQUESTS
app.get("/", (req, res) => {
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
                    i++;
                })
                res.redirect("/question");
            }
        }
    });
});

app.get("/question", (req, res) => {
    question = { ...questionList[currentIndex] }
    res.render("question", { question });
});

app.post("/question", (req, res) => {
    let option = req.body.option;
    let move = req.body.move;
    if (typeof option != "undefined") {
        questionList[currentIndex].chosen = option;
    }
    if (move === "Prev") {
        if (currentIndex > 0)
            currentIndex--;
    } else if (move === "Next") {
        if (currentIndex < n - 1)
            currentIndex++;
    }
    res.redirect("/question");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});