import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/dbConnect';
import mongoose from 'mongoose';

// Define a more explicit interface for feedback data
export interface FeedbackData {
  type: string;
  reason?: string;
  retryCount?: number;
}

interface FeedbackMap {
  [key: string]: FeedbackData;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const messageId = searchParams.get('messageId');
    
    if (!userId && !messageId) {
      return NextResponse.json(
        { success: false, error: 'Either User ID or Message ID is required' }, 
        { status: 400 }
      );
    }
    
    const Feedback = mongoose.models.Feedback || 
      mongoose.model('Feedback', require('@/models/feedbackModel').schema);
    
    // Create a query that handles both formats
    const query: any = {};
    if (userId) query.userId = userId;
    
    if (messageId) {
      // Only remove suffixes if they exist, otherwise use the original ID
      // This ensures we're using the same ID format throughout the application
      const baseMessageId = messageId.includes('_user') || messageId.includes('_bot') 
        ? messageId.replace(/_user$|_bot$/, '')
        : messageId;
      query.messageId = baseMessageId;
      console.log('Searching for feedback with messageId:', baseMessageId);
    }

    const feedbacks = await Feedback.find(query);
    console.log('Feedbacks found:', feedbacks.length);
    
    // Create a map using messageId as the key
    const feedbackMap: FeedbackMap = {};
    
    feedbacks.forEach(feedback => {
      // Ensure we're working with a proper document
      const feedbackDoc = feedback.toObject ? feedback.toObject() : feedback;
      console.log('Processing feedback for messageId:', feedbackDoc.messageId);
      
      // Determine feedback type based on either feedbackTypes object or legacy feedbackType field
      let feedbackType = '';
      let retryCount = undefined;
      
      if (feedbackDoc.feedbackTypes) {
        // New structure with feedbackTypes object
        if (feedbackDoc.feedbackTypes.like) feedbackType = 'like';
        else if (feedbackDoc.feedbackTypes.dislike) feedbackType = 'dislike';
        else if (feedbackDoc.feedbackTypes.report) feedbackType = 'report';
        else if (feedbackDoc.feedbackTypes.retry) feedbackType = 'retry';
      } else if (feedbackDoc.feedbackType) {
        // Legacy structure with single feedbackType field
        feedbackType = feedbackDoc.feedbackType;
      }
      
      feedbackMap[feedbackDoc.messageId] = {
        type: feedbackType,
        ...(feedbackType === 'report' && { reason: feedbackDoc.reportReason }),
        ...(feedbackType === 'retry' && { retryCount: feedbackDoc.retryCount })
      };
    });
    
    console.log('Feedback map created:', Object.keys(feedbackMap).length);
    return NextResponse.json({ success: true, feedbackMap });
  } catch (error) {
    console.error('Error fetching feedback data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback data' }, 
      { status: 500 }
    );
  }
}