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

const minFollowersSchema = new Schema({
    followers: { type: Number, required: true },
    price: { type: Number, required: true }
})


const busWordsSchema = new Schema({

    offer: { type: Number, required: true },

    minFollowers: [
        minFollowersSchema
    ],

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



    definers: [{
        price: { type: Number, required: true },
        user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    }],

    date: { type: String, required: true },

    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },


})


module.exports = mongoose.model("BusWords", busWordsSchema)