const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/scatch');

const userSchema = mongoose.Schema ({
    fullname: String,
    email: String,
    password: String,
    cart: [{
        product: {type: mongoose.Schema.Types.ObjectId, ref: "product"},
        quantity: { type: Number, default: 1 }
    }],
    orders: {
        type: Array,
        default: []
    },
    contact: Number,
    profileImage: {
        data: Buffer,
        contentType: String
      }
      
    
});

module.exports = mongoose.model('user', userSchema);