import { NextResponse } from "next/server";

export async function GET(){
    try {
        const response = NextResponse.json({message:"Logged out successfully",success:true})

        // Clear the token cookie
        response.cookies.set("token","",{httpOnly:true,expires:new Date(0)})
        response.cookies.set("org_token","",{httpOnly:true,expires:new Date(0)})

        console.log(response,"logged out successfully")
        return response
    } catch (error) {
        return NextResponse.json("Something went wrong while logging out")
    }
}