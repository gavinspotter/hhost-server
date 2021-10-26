const mongoose = require("mongoose")


const Schema = mongoose.Schema

const commentsSchema = new Schema({

    comment: { type: String, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" }
})

const secretWordSchema = new Schema({
    word: { type: String, required: true },
    definition: [{ type: String, required: true }],
    date: { type: String, required: true },
    dictionary: { type: mongoose.Types.ObjectId, required: true, ref: "User" },

    comments: [commentsSchema]

})



module.exports = mongoose.model("SecretWord", secretWordSchema), mongoose.model("SecretWordComment", commentsSchema)