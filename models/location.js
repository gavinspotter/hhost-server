const mongoose = require("mongoose")



const Schema = mongoose.Schema

const stateOrProvinceSchema = new Schema({



})

const countrySchema = new Schema({
    toggleCountryLocation: { type: Boolean, required: true },
    countryName: { type: String, required: true },
    stateOrProvince: []
})

const areaSchema = new Schema({
    country: []
})


const locationSchema = new Schema({
    locationToggle: { type: Boolean, required: true },




})