import mongoose from "mongoose";
const orgSchema = new mongoose.Schema({
    org_name:{
        type:String,
        required:[true,"Please enter an organization name"], 
    },
    super_email:{
        type:String,
        required:[true,"Please enter an email"],
        unique:true 
    },
    super_password:{
        type:String,
        required:[true,"Please enter a password"],
    },
    isSuper:{
        type:Boolean,
        required:true,
        default:true,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifyToken: {
        type: String,
        index: true  // Add index for faster queries
    },
    verifyTokenExpiry: {
        type: Date,
        index: true  // Add index for faster queries
    },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date
}, { timestamps: true });  // Add timestamps for better tracking

// Add a method to check if a token is valid
orgSchema.methods.isTokenValid = function(token) {
    return this.verifyToken === token && this.verifyTokenExpiry > Date.now();
};

// Using Mongoose approach
const Org = mongoose.models.org_collection || mongoose.model("org_collection", orgSchema);
export default Org;