import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    org_name:{
        type:String,
        required:[true,"Please enter an organization name"],
    },
    username:{
        type:String,
        required:[true,"Please enter a username"],
        trim:true
    },
    email:{
        type:String,
        required:[true,"Please enter a email address"],
        unique:true,
    },
    password:{
        type:String,
        required:[true,"Please enter a password"],
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    isSuperadmin:{
        type:Boolean,
        default:true
    },
    forgotPasswordToken:String,
    forgotPasswordTokenExpiry:Date,
    verifyToken:String,
    verifyTokenExpiry:Date
})
// Changed the collection name from "users" to "admin_collection"
const User = mongoose.models.admin_collection || mongoose.model("admin_collection", userSchema);
export default User;