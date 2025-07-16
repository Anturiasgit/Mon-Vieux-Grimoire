const mongoose = require('mongoose');

const  ratingsSchema = mongoose.Schema({
userId:  { type: String, required: true },
grade: { type: Number, required: true },
});

module.exports = mongoose.model('Ratings', ratingsSchema);