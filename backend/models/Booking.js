const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    facility: { type: mongoose.Schema.ObjectId, ref: "Facility", required: true },
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    bookingDate: { type: Date, required: [true, "Please add a booking date"] },
    startTime: { type: String, required: [true, "Please add a start time"] },
    durationHours: { type: Number, required: [true, "Please add a duration"], min: 0.5, max: 2 },
    startMinutes: { type: Number, required: true, min: 0, max: 1439 },
    endMinutes: { type: Number, required: true, min: 1, max: 1440 },
  },
  { timestamps: true }
);

BookingSchema.index({ facility: 1, bookingDate: 1, startMinutes: 1, endMinutes: 1 });
BookingSchema.index({ user: 1, bookingDate: 1, startMinutes: 1, endMinutes: 1 });

module.exports = mongoose.model("Booking", BookingSchema);
