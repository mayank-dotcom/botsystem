import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToMongoDB } from '@/lib/mongoose';

export async function POST(request: Request) {
  try {
    await connectToMongoDB();
    const body = await request.json();
    
    // Get the Feedback model
    const Feedback = mongoose.models.Feedback || 
      mongoose.model('Feedback', require('@/models/feedbackModel').schema);
    
    // Create new feedback document
    const feedback = new Feedback({
      userId: body.userId,
      conversationId: body.conversationId,
      messageId: body.messageId,
      feedbackTypes: body.feedbackTypes,
      reportReason: body.reportReason,
      retryCount: body.retryCount,
      botResponse: body.botResponse,
      userQuestion: body.userQuestion,
      timestamp: new Date()
    });
    
    // Save to database with a timeout option
    await feedback.save({ timeout: 30000 });
    
    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({
      success: false,
      message: 'Error submitting feedback',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}