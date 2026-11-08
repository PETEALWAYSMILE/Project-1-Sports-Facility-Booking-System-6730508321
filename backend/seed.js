const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");
const Facility = require("./models/Facility");
const Booking = require("./models/Booking");

dotenv.config({ path: path.join(__dirname, "config/config.env") });

const getUtcDateString = (daysOffset = 0) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString().slice(0, 10);
};

const seedDatabase = async ({ force = false } = {}) => {
  const existingFacilities = await Facility.countDocuments();
  const existingUsers = await User.countDocuments();

  if (!force && (existingFacilities > 0 || existingUsers > 0)) {
    console.log(
      `Seed skipped: database already contains ${existingUsers} users and ${existingFacilities} facilities.`
    );
    return;
  }

  if (force) {
    await Booking.deleteMany({});
    await Facility.deleteMany({});
    await User.deleteMany({});
    console.log("Cleared existing users, facilities, and bookings.");
  }

  const users = await User.create([
    {
      name: "Suphanat Admin",
      email: "admin@sportbooking.com",
      tel: "081-234-5678",
      role: "admin",
      password: "password123",
    },
    {
      name: "Somchai Member",
      email: "member1@sportbooking.com",
      tel: "089-111-2222",
      role: "member",
      password: "password123",
    },
    {
      name: "Nattapong Athlete",
      email: "member2@sportbooking.com",
      tel: "089-333-4444",
      role: "member",
      password: "password123",
    },
  ]);

  const [, member1, member2] = users;

  const facilities = await Facility.create([
    {
      name: "Badminton Court A (Indoor Pro)",
      sportType: "Badminton",
      location: "Main Sports Complex, Floor 2, Court A",
      capacity: 4,
      hourlyRate: 180,
      isActive: true,
    },
    {
      name: "Badminton Court B (Standard)",
      sportType: "Badminton",
      location: "Main Sports Complex, Floor 2, Court B",
      capacity: 4,
      hourlyRate: 150,
      isActive: true,
    },
    {
      name: "Center Tennis Court 1 (Hard Court)",
      sportType: "Tennis",
      location: "Outdoor Tennis Arena, Zone A",
      capacity: 4,
      hourlyRate: 300,
      isActive: true,
    },
    {
      name: "Premier Futsal Pitch 1 (Turf)",
      sportType: "Futsal",
      location: "Indoor Arena Building B, Pitch 1",
      capacity: 14,
      hourlyRate: 800,
      isActive: true,
    },
    {
      name: "Elite Fitness & Gym Studio",
      sportType: "Gym",
      location: "Wellness Center, Floor 3, Room 301",
      capacity: 20,
      hourlyRate: 120,
      isActive: true,
    },
    {
      name: "Championship Basketball Court",
      sportType: "Basketball",
      location: "Main Gymnasium Hall 1",
      capacity: 12,
      hourlyRate: 600,
      isActive: true,
    },
  ]);

  const todayStr = getUtcDateString(0);
  const tomorrowStr = getUtcDateString(1);
  const dayAfterStr = getUtcDateString(2);

  const todayDate = new Date(`${todayStr}T00:00:00.000Z`);
  const tomorrowDate = new Date(`${tomorrowStr}T00:00:00.000Z`);
  const dayAfterDate = new Date(`${dayAfterStr}T00:00:00.000Z`);

  await Booking.create([
    {
      facility: facilities[0]._id, // Badminton Court A
      user: member1._id,
      bookingDate: todayDate,
      startTime: "10:00",
      durationHours: 1.5,
      startMinutes: 10 * 60,
      endMinutes: 11 * 60 + 30,
    },
    {
      facility: facilities[2]._id, // Tennis Court 1
      user: member1._id,
      bookingDate: tomorrowDate,
      startTime: "16:00",
      durationHours: 2,
      startMinutes: 16 * 60,
      endMinutes: 18 * 60,
    },
    {
      facility: facilities[0]._id, // Badminton Court A (booked by member2 today 14:00-16:00)
      user: member2._id,
      bookingDate: todayDate,
      startTime: "14:00",
      durationHours: 2,
      startMinutes: 14 * 60,
      endMinutes: 16 * 60,
    },
    {
      facility: facilities[3]._id, // Futsal Pitch 1
      user: member2._id,
      bookingDate: tomorrowDate,
      startTime: "18:00",
      durationHours: 2,
      startMinutes: 18 * 60,
      endMinutes: 20 * 60,
    },
    {
      facility: facilities[4]._id, // Gym Studio
      user: member1._id,
      bookingDate: dayAfterDate,
      startTime: "09:00",
      durationHours: 1,
      startMinutes: 9 * 60,
      endMinutes: 10 * 60,
    },
  ]);

  console.log("Database seeded successfully with 3 users, 6 facilities, and 5 bookings.");
};

if (require.main === module) {
  const force = process.argv.includes("--force");
  connectDB()
    .then(() => seedDatabase({ force }))
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
