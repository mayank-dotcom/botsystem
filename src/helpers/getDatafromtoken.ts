import { NextRequest } from "next/server";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

// Enhanced to return full token data or specific properties
export const getDatafromtoken = (request: NextRequest, property?: string) => {
    try {
        const token = request.cookies.get('token')?.value || "";
        if (!token) {
            throw new Error("No token found");
        }
        
        const decodedToken: any = jwt.verify(token, process.env.TOKEN_SECRET!);
        
        // Return specific property if requested, otherwise return the full decoded token
        if (property && property in decodedToken) {
            return decodedToken[property];
        } else if (property) {
            console.warn(`Property ${property} not found in token`);
        }
        
        // Default to returning id if no property specified
        return property ? null : decodedToken.id;
    } catch (error: any) {
        console.error("Token error:", error.message);
        throw new Error(`Invalid token: ${error.message}`);
    }
}