const mongoose = require("mongoose");
const mongooseRandom = require("mongoose-simple-random");

const QuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    A: {
        type: String,
        required: true
    },
    B: {
        type: String,
        required: true
    },
    C: {
        type: String,
        required: true
    },
    D: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    }
});

QuestionSchema.plugin(mongooseRandom);

module.exports = mongoose.model("Question", QuestionSchema);