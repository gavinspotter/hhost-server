const mongoose = require("mongoose")


const Schema = mongoose.Schema

const definitionSchema = new Schema({
    partOfSpeach: { type: String },
    aDefinition: { type: String, required: true },
    sentence: { type: String }
})

const alternativesSchema = new Schema({
    alt: { type: String }
})

const commentsSchema = new Schema({
    comment: { type: String, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" }
})

const wordSchema = new Schema({

    word: {
        definiteWord: { type: String, required: true },
        alternatives: [
            alternativesSchema
        ]

    },

    definition: [
        definitionSchema
    ],
    etymology: { type: String, required: true },
    dictionary: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    date: { type: String, required: true },

    comments: [commentsSchema]

})


module.exports = mongoose.model("Word", wordSchema), mongoose.model("Definition", definitionSchema), mongoose.model("WordComment", commentsSchema)