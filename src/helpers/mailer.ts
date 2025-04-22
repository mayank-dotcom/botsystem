import mongoose from "mongoose";
import { NextResponse } from "next/server";
import User from '@/models/userModel';
import Org from '@/models/orgModel';
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";

// Add a connection function to ensure MongoDB is connected
const ensureDbConnection = async () => {
    if (mongoose.connection.readyState !== 1) {
        try {
            await mongoose.connect(process.env.MONGODB_URI!);
            console.log("MongoDB connected in mailer");
        } catch (error) {
            console.error("MongoDB connection error:", error);
            throw new Error("Failed to connect to database");
        }
    }
    
    // Check if db is defined
    if (!mongoose.connection.db) {
        throw new Error("Database not initialized");
    }
    
    return mongoose.connection;
};

export const sendEmail = async ({ email, emailType, userId, isOrg = false }: any) => {
    try {
        // Generate a simpler token for better compatibility
        const hashedToken = await bcryptjs.hash(userId.toString(), 10);
        
        console.log(`Sending ${emailType} email to ${email} (isOrg: ${isOrg})`);
        console.log(`User ID: ${userId}`);
        console.log(`Generated token: ${hashedToken}`);

        // Choose model based on isOrg flag
        const Model = isOrg ? Org : User;
        
        // Ensure database connection before operations
        const connection = await ensureDbConnection();
        
        // Force update the document directly in the database
        if (emailType === "VERIFY") {
            const updateData = {
                $set: {
                    verifyToken: hashedToken,
                    verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                }
            };
            
            console.log("Updating with verify token data:", JSON.stringify(updateData));
            
            // Use direct MongoDB update to ensure fields are set - with non-null assertion
            const result = await connection.db!.collection(
                isOrg ? 'org_collections' : 'users'
            ).updateOne(
                { _id: new mongoose.Types.ObjectId(userId) },
                updateData
            );
            
            console.log("Direct DB update result:", result);
        } else if (emailType === "RESET") {
            const updateData = {
                $set: {
                    forgotPasswordToken: hashedToken,
                    forgotPasswordTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                }
            };
            
            console.log("Updating with reset token data:", JSON.stringify(updateData));
            
            // Use Mongoose model instead of direct DB update
            const user = await Model.findByIdAndUpdate(
                userId,
                updateData,
                { new: true }
            );
            
            if (!user) {
                throw new Error("User not found during token update");
            }
            
            console.log("Updated user:", user);
        }

        // Remove the verification query as we already have the updated user
        const updatedDoc = await connection.db!.collection(
            isOrg ? 'org_collections' : 'users'
        ).findOne({ _id: new mongoose.Types.ObjectId(userId) });
        
        console.log("Updated document from DB:", updatedDoc ? JSON.stringify(updatedDoc) : "Not found");

        // Configure Gmail transporter
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD,
            },
        });

        const verifyUrl = `${process.env.DOMAIN}/verified?token=${hashedToken}`;
        // Define the reset URL to point to the changepassword page
        const resetUrl = `${process.env.DOMAIN}/changepassword?token=${hashedToken}`;
        
        console.log(`${emailType} URL:`, emailType === "VERIFY" ? verifyUrl : resetUrl);

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: emailType === "VERIFY" ? "Email Verification" : "Reset Password",
            html: `<p>Click ${emailType === "VERIFY" ? 
                ` <a href="${verifyUrl}">here</a>` : 
                ` <a href="${resetUrl}">here</a>`} 
                to${emailType === "VERIFY" ? " verify email" : " reset your password"} </p>`,
        };

        const mailResponse = await transport.sendMail(mailOptions);
        console.log("Email sent:", mailResponse.messageId);

        return mailResponse;
    } catch (error) {
        console.error("Email sending error:", error);
        return NextResponse.json({ error });
    }
};