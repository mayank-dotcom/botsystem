const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  conversationId: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    required: true
  },
  // Change from single feedbackType to multiple feedback types
  feedbackTypes: {
    like: {
      type: Boolean,
      default: false
    },
    dislike: {
      type: Boolean,
      default: false
    },
    report: {
      type: Boolean,
      default: false
    },
    retry: {
      type: Boolean,
      default: false
    }
  },
  reportReason: {
    type: String,
    required: function() {
      return this.feedbackTypes.report === true;
    }
  },
  retryCount: {
    type: Number,
    min: 1,
    max: 5,
    required: function() {
      return this.feedbackTypes.retry === true;
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  botResponse: {
    type: String,
    required: true
  },
  userQuestion: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);