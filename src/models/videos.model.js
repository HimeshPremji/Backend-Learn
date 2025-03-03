import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // we are using cloudinary url
      required: [true, 'Video not found'],
    },
    thumbnail: {
      type: String, // we are using cloudinary url
      required: [true, 'Thumbnail not found'],
    },
    title: {
      type: String,
      required: [true, 'Title not found'],
    },
    description: {
      type: String,
      required: [true, 'Description not found'],
    },
    duration: {
      type: Number, // we are using cloudinary url
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model('Video', videoSchema);
