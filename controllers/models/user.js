const mongoose = require("mongoose")



const Schema = mongoose.Schema

const dictionarysSchema = new Schema({
    dictionaryName: { type: String, required: true },
    words: [{ type: mongoose.Types.ObjectId, required: true, ref: "Word" }],
    secretWords: [{ type: mongoose.Types.ObjectId, required: true, ref: "SecretWord" }],
    followers: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }]
})

const accoladesSchema = new Schema({
    accolades: { type: String, required: true },
    WordComments: [{ type: String, required: true }],
    SecretWordComments: [{ type: String, required: true }],
    PostComments: [{ type: String, required: true }],
})









const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dictionarys: [
        dictionarysSchema
    ],
    following: [{ type: mongoose.Types.ObjectId, required: true, ref: "Dictionary" }],
    accolades: [
        accoladesSchema
    ],
    followingCurrent: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
    followersCurrent: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
    posts: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }],
    businessPosts: [{ type: mongoose.Types.ObjectId, required: true, ref: "BusPost" }],
    sponsorAPost: [{ type: mongoose.Types.ObjectId, required: true, ref: "BusPost" }],
    businessWords: [{ type: mongoose.Types.ObjectId, required: true, ref: "BusWords" }],
    postHearts: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }],
    stripeCustomerId: { type: String },
    stripeBusinessId: { type: String }


})

// userSchema.plugin(beautifyUnique)
// dictionarysSchema.plugin(beautifyUnique)

module.exports = mongoose.model("User", userSchema), mongoose.model("Dictionary", dictionarysSchema)