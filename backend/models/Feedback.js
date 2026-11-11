
import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Anonymous'
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number from 1 to 5.'
      }
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'hidden'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

feedbackSchema.index({
  status: 1,
  createdAt: -1
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
