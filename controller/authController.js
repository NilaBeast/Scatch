const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const {generateToken} = require('../utils/generateToken');


module.exports.registerUser = async (req, res) => {
    try{
        let {email, password, fullname} = req.body;

        let user = await userModel.findOne({email: email});
        if(user) return res.status(401).send("User already registered");

        bcrypt.genSalt(10, function (err, salt){
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) return res.send(err.messege);
                else {
                    let user = await userModel.create({
                    email,
                    password: hash,
                    fullname
                });
                let token = generateToken(user);
                res.cookie("token", token);
                req.flash('success', 'User registered successfully');
                res.redirect('/');
                
                }

          });
        });

    } 
    catch(err){
        res.send(err.message);
    };
};

module.exports.loginUser = async (req, res) => {
    let {email, password} = req.body;

    let user = await userModel.findOne({email: email});
    if(!user) return res.status(401).send("Email or password is incorrect");

    bcrypt.compare(password, user.password, function(err, result) {
        if(result){
            let token = generateToken(user);
            res.cookie("token", token);
            res.redirect('/shop')
        } else {
            res.status(401).send("Email or password is incorrect");
        }
    });
};
module.exports.upload =  async (req, res) => {
    if (!req.file) {
        req.flash('error', 'No file uploaded');
        return res.redirect('/profile');
    }

    const user = await userModel.findById(req.user._id);
    user.profileImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype
    };
    await user.save();

    req.flash('success', 'Profile picture updated!');
    res.redirect('/profile');
};

module.exports.logout = (req, res) => {
    res.cookie("token", "");
    res.redirect("/");
}