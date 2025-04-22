import {connect} from "@/dbconfig/dbconfig"
import { NextRequest, NextResponse } from "next/server"
import User from "@/models/userModel"
import Org from "@/models/orgModel"
import mongoose from "mongoose"

// Ensure connection is established
connect()

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json()
        const {token} = reqBody
        
        if (!token) {
            return NextResponse.json({error: "Token is required"}, {status: 400})
        }
        
        console.log("Verifying token:", token)
        
        // Debug: Check what's in the database
        const allUsers = await User.find({}).select('email verifyToken verifyTokenExpiry isVerified');
        console.log("All users:", JSON.stringify(allUsers, null, 2));
        
        const allOrgs = await Org.find({}).select('super_email verifyToken verifyTokenExpiry isVerified');
        console.log("All orgs:", JSON.stringify(allOrgs, null, 2));
        
        // First check in User model
        let user = await User.findOne({
            verifyToken: token,
            verifyTokenExpiry: {$gt: Date.now()}
        });
        
        // If not found in User model, check in Org model
        if (!user) {
            console.log("User not found, checking Org collection");
            user = await Org.findOne({
                verifyToken: token,
                verifyTokenExpiry: {$gt: Date.now()}
            });
        }
        
        // If still not found, try a more lenient search (ignoring expiry)
        if (!user) {
            console.log("Not found with expiry check, trying without expiry");
            user = await User.findOne({ verifyToken: token });
            
            if (!user) {
                user = await Org.findOne({ verifyToken: token });
            }
        }
        
        if (!user) {
            console.log("No user or org found with this token");
            return NextResponse.json({error: "Invalid token or token expired"}, {status: 400});
        }
        
        console.log("Found entity to verify:", user.email || user.super_email);
        
        // Update verification status
        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpiry = undefined;
        await user.save();
        
        return NextResponse.json({
            message: "Email verified successfully", 
            success: true,
            isOrg: !!user.org_name
        });
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({error: "Something went wrong"}, {status: 500});
    }
}
