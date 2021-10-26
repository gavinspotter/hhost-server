const mongoose = require("mongoose")



const Schema = mongoose.Schema

const receiver = new Schema({
    contracted: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    tookContract: { type: Boolean },
    contractedPost: { type: String },
    date: { type: String }



})


const busPostSchema = new Schema({


    exactWords: { type: String },
    post: { type: String },
    keyWords: [{ type: String, required: true }],
    keyPhrases: [{ type: String, required: true }],
    price: { type: Number, required: true },
    date: { type: String },

    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    receiver: [
        receiver
    ],



})




module.exports = mongoose.model("BusPost", busPostSchema)