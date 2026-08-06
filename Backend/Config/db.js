const mongoose = require("mongoose");

// Cleans up indexes that no longer match the current User schema.
// The "hotelId_1_username_1" unique index is a leftover from an older
// schema version (hotelId/username fields were removed from UserModels.js).
// Because it's still a unique compound index, every doc missing those
// fields is treated as { hotelId: null, username: null }, so the SECOND
// such insert (e.g. a new Google OAuth signup) fails with E11000.
const dropStaleIndexes = async () => {
  try {
    const usersCollection = mongoose.connection.collection("users");
    const indexes = await usersCollection.indexes();

    const staleIndex = indexes.find(
      (idx) => idx.name === "hotelId_1_username_1"
    );

    if (staleIndex) {
      await usersCollection.dropIndex("hotelId_1_username_1");
      console.log("Dropped stale index: hotelId_1_username_1");
    }
  } catch (error) {
    // Non-fatal: log and continue so the server still starts.
    console.error("Could not check/drop stale indexes:", error.message);
  }
};

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");

    await dropStaleIndexes();
  } catch (error) {
    console.error("MongoDB Error:");
    console.error(error);
  }
};

module.exports = connectDB;