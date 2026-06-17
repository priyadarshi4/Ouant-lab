import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[MongoDB] Connected -> ${conn.connection.host}`);
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    console.error(
      "Make sure MONGO_URI is set in server/.env (see .env.example). " +
        "The server will keep running so you can fix the connection string, " +
        "but database routes will fail until it connects."
    );
  }
};

export default connectDB;
