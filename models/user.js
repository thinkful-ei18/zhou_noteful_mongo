const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  fullname:{type:String, default:''},
  username:{type:String, required:true, unique:true},
  password:{type:String, required:true}
})

userSchema.set('toObject',{
  transform:function(doc, ret){
    ret.id = ret._id
    delete ret.__v
    delete ret._id
    delete ret.password
  }
})

userSchema.methods.serialize = function () {
  return {
    id: this.id,
    userName: this.userName,
    fullName: this.fullName
  }
}

userSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password,10)
}
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password)
}

const User = mongoose.model('User', userSchema)
module.exports = User