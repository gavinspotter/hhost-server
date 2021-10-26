const mongoose = require("mongoose")



const Schema = mongoose.Schema



const postsSchema = new Schema({

    post: { type: String, required: true },
    date: { type: String, required: true },
    busPost: { type: Boolean },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    hearts: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
    reply: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }]
})

module.exports = mongoose.model("Post", postsSchema)