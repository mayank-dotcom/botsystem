import mongoose from "mongoose";

const orgSchema = new mongoose.Schema({
    org_name: {
        type: String,
        required: [true, "Please enter an organization name"],
    },
    org_Id: {
        type: String,
     
    },
    super_email: {
        type: String,
        required: [true, "Please enter an email"],
        unique: true
    },
    super_password: {
        type: String,
        required: [true, "Please enter a password"],
    },
    email: {
        type: String,
        unique: true,
        sparse: true // Allows null/undefined values to not trigger uniqueness constraint
    },
    password: {
        type: String,
    },
    isSuper: {
        type: Boolean,
        required: true,
        default: true,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifyToken: {
        type: String,
        index: true
    },
    verifyTokenExpiry: {
        type: Date,
        index: true
    },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date
}, { timestamps: true });

const Org = mongoose.models.org_collection || mongoose.model("org_collection", orgSchema);
export default Org;