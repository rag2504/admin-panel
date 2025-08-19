import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://rag123456:rag123456@cluster0.qipvo.mongodb.net/boxcricket?retryWrites=true&w=majority";
const JWT_SECRET = process.env.JWT_SECRET || "adminpanel_secret";

// MongoDB Schemas
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin", "ground_owner"],
      default: "user",
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const groundSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      cityId: { type: String, required: true },
      cityName: { type: String, required: true },
      state: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      pincode: { type: String, required: true },
    },
    price: {
      perHour: Number,
      currency: { type: String, default: "INR" },
      discount: { type: Number, default: 0 },
      ranges: [
        {
          start: String,
          end: String,
          perHour: Number,
        },
      ],
    },
    images: [
      {
        url: String,
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    amenities: [String],
    features: {
      pitchType: String,
      capacity: Number,
      lighting: Boolean,
      parking: Boolean,
      changeRoom: Boolean,
      washroom: Boolean,
      cafeteria: Boolean,
      equipment: Boolean,
    },
    availability: {
      timeSlots: [String],
      blockedDates: [Date],
      weeklySchedule: {
        monday: { isOpen: Boolean, slots: [String] },
        tuesday: { isOpen: Boolean, slots: [String] },
        wednesday: { isOpen: Boolean, slots: [String] },
        thursday: { isOpen: Boolean, slots: [String] },
        friday: { isOpen: Boolean, slots: [String] },
        saturday: { isOpen: Boolean, slots: [String] },
        sunday: { isOpen: Boolean, slots: [String] },
      },
    },
    owner: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      contact: { type: String, required: true },
      email: { type: String, required: true },
      verified: { type: Boolean, default: false },
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      reviews: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          rating: { type: Number, required: true, min: 1, max: 5 },
          comment: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "active",
    },
    totalBookings: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
    verificationDocuments: {
      groundLicense: String,
      ownershipProof: String,
      identityProof: String,
    },
    policies: {
      cancellation: String,
      rules: [String],
      advanceBooking: { type: Number, default: 30 },
    },
  },
  { timestamps: true },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    groundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ground",
      required: true,
    },
    bookingDate: { type: Date, required: true },
    timeSlot: {
      startTime: String,
      endTime: String,
      duration: Number,
    },
    playerDetails: {
      teamName: String,
      playerCount: Number,
      contactPerson: {
        name: String,
        phone: String,
        email: String,
      },
      requirements: String,
    },
    pricing: {
      baseAmount: Number,
      discount: Number,
      convenienceFee: Number,
      totalAmount: Number,
      currency: { type: String, default: "INR" },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    payment: {
      method: String,
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paymentDate: Date,
      gatewayResponse: Object,
    },
  },
  { timestamps: true },
);

const locationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    state: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    popular: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Models
const User = mongoose.model("User", userSchema);
const Ground = mongoose.model("Ground", groundSchema);
const Booking = mongoose.model("Booking", bookingSchema);
const Location = mongoose.model("Location", locationSchema);

// Export createServer function for Vite integration
export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Admin Auth Middleware
  const adminAuth = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.role !== "admin") throw new Error("Not admin");
      req.admin = decoded;
      next();
    } catch {
      res.status(401).json({ message: "Invalid token" });
    }
  };

  // Admin Login
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;

    console.log("Login attempt:", {
      email,
      password: password ? "***" : "empty",
    });

    try {
      // Check for hardcoded admin first
      if (email === "admin@boxcric.com" && password === "admin123") {
        console.log("Hardcoded admin login successful");
        const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, {
          expiresIn: "7d",
        });
        return res.json({
          success: true,
          token,
          admin: { email, role: "admin" },
        });
      }

      // Check database for admin users
      const admin = await User.findOne({ email, role: "admin" });
      if (!admin) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: admin.role,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      res.json({
        success: true,
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  // Dashboard Stats
  app.get("/api/admin/stats", adminAuth, async (req, res) => {
    try {
      const [
        totalUsers,
        activeUsers,
        totalGrounds,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        totalRevenue,
        monthlyRevenue,
      ] = await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "user", isActive: true }),
        Ground.countDocuments(),
        Booking.countDocuments(),
        Booking.countDocuments({ status: "pending" }),
        Booking.countDocuments({ status: "confirmed" }),
        Booking.aggregate([
          { $match: { status: "confirmed", "payment.status": "completed" } },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } },
        ]),
        Booking.aggregate([
          {
            $match: {
              status: "confirmed",
              "payment.status": "completed",
              createdAt: {
                $gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1,
                ),
              },
            },
          },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } },
        ]),
      ]);

      const recentBookings = await Booking.find()
        .populate("userId", "name email")
        .populate("groundId", "name")
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        stats: {
          totalUsers,
          activeUsers,
          totalGrounds,
          totalBookings,
          pendingBookings,
          confirmedBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          recentBookings,
        },
      });
    } catch (error) {
      console.error("Stats error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch stats" });
    }
  });

  // User Management
  app.get("/api/admin/users", adminAuth, async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status = "all" } = req.query;

      const query: any = { role: "user" };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      if (status !== "all") {
        query.isActive = status === "active";
      }

      const users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Users fetch error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", adminAuth, async (req, res) => {
    try {
      const { isActive, isVerified } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive, isVerified },
        { new: true },
      ).select("-password");

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error("User update error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", adminAuth, async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Prevent deleting admin users
      if (user.role === "admin") {
        return res
          .status(403)
          .json({ success: false, message: "Cannot delete admin users" });
      }

      await User.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("User deletion error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete user" });
    }
  });

  // Financial Management
  app.get("/api/admin/financial", adminAuth, async (req, res) => {
    try {
      const { startDate, endDate, period = "month" } = req.query;

      let dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          },
        };
      }

      const [
        totalRevenue,
        completedPayments,
        pendingPayments,
        failedPayments,
        refundedPayments,
        revenueByPeriod,
      ] = await Promise.all([
        Booking.aggregate([
          {
            $match: {
              ...dateFilter,
              status: "confirmed",
              "payment.status": "completed",
            },
          },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } },
        ]),
        Booking.countDocuments({
          ...dateFilter,
          "payment.status": "completed",
        }),
        Booking.countDocuments({ ...dateFilter, "payment.status": "pending" }),
        Booking.countDocuments({ ...dateFilter, "payment.status": "failed" }),
        Booking.countDocuments({ ...dateFilter, "payment.status": "refunded" }),
        Booking.aggregate([
          {
            $match: {
              ...dateFilter,
              status: "confirmed",
              "payment.status": "completed",
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                ...(period === "day" && { day: { $dayOfMonth: "$createdAt" } }),
              },
              revenue: { $sum: "$pricing.totalAmount" },
              bookings: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        ]),
      ]);

      const recentTransactions = await Booking.find({
        ...dateFilter,
        "payment.status": "completed",
      })
        .populate("userId", "name email")
        .populate("groundId", "name")
        .sort({ "payment.paymentDate": -1 })
        .limit(10);

      res.json({
        success: true,
        financial: {
          totalRevenue: totalRevenue[0]?.total || 0,
          completedPayments,
          pendingPayments,
          failedPayments,
          refundedPayments,
          revenueByPeriod,
          recentTransactions,
        },
      });
    } catch (error) {
      console.error("Financial data error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch financial data" });
    }
  });

  // Public Grounds Endpoint (for users)
  app.get("/api/grounds", async (req, res) => {
    try {
      const { city, search, limit = 20, page = 1 } = req.query;

      const query: any = { status: "active" };

      if (city) {
        query["location.cityId"] = city;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { "location.address": { $regex: search, $options: "i" } },
        ];
      }

      const grounds = await Ground.find(query)
        .select("-owner.password") // Exclude sensitive owner data
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Ground.countDocuments(query);

      res.json({
        success: true,
        grounds,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error("Public grounds fetch error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch grounds" });
    }
  });

  // Get single ground by ID (public)
  app.get("/api/grounds/:id", async (req, res) => {
    try {
      const ground = await Ground.findOne({
        _id: req.params.id,
        status: "active"
      }).select("-owner.password");

      if (!ground) {
        return res
          .status(404)
          .json({ success: false, message: "Ground not found" });
      }

      res.json({ success: true, ground });
    } catch (error) {
      console.error("Ground fetch error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch ground" });
    }
  });

  // Grounds Management
  app.get("/api/admin/grounds", adminAuth, async (req, res) => {
    try {
      const grounds = await Ground.find()
        .populate("owner.userId", "name email")
        .sort({ createdAt: -1 });
      res.json({ success: true, grounds });
    } catch (error) {
      console.error("Grounds fetch error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch grounds" });
    }
  });

  app.post("/api/admin/grounds", adminAuth, async (req, res) => {
    try {
      // Find or create owner user
      let ownerUser;
      const { owner } = req.body;

      if (owner && owner.email) {
        // Try to find existing user by email
        ownerUser = await User.findOne({ email: owner.email });

        if (!ownerUser) {
          // Create new user if not found
          const hashedPassword = await bcrypt.hash('defaultpassword123', 10);
          ownerUser = new User({
            name: owner.name || 'Ground Owner',
            email: owner.email,
            phone: owner.contact || '0000000000',
            password: hashedPassword,
            role: 'ground_owner',
            isVerified: true
          });
          await ownerUser.save();
        }
      } else {
        // Create a default admin user if no owner provided
        const hashedPassword = await bcrypt.hash('defaultpassword123', 10);
        ownerUser = new User({
          name: 'Admin User',
          email: 'admin@boxcricket.com',
          phone: '9999999999',
          password: hashedPassword,
          role: 'ground_owner',
          isVerified: true
        });
        await ownerUser.save();
      }

      // Get location coordinates from cityId
      let locationData = req.body.location;
      if (locationData && locationData.cityId) {
        const city = await Location.findOne({ id: locationData.cityId });
        if (city) {
          locationData = {
            ...locationData,
            cityName: city.name,
            state: city.state,
            latitude: city.latitude,
            longitude: city.longitude
          };
        } else {
          return res.status(400).json({ success: false, message: 'Invalid cityId provided' });
        }
      } else {
        return res.status(400).json({ success: false, message: 'Location with cityId is required' });
      }

      // Prepare ground data with proper owner and defaults
      const groundData = {
        ...req.body,
        // Use the updated location data with coordinates
        location: locationData,
        // Ensure proper owner object with userId
        owner: {
          userId: ownerUser._id,
          name: owner?.name || ownerUser.name,
          contact: owner?.contact || ownerUser.phone,
          email: owner?.email || ownerUser.email,
          verified: true
        },
        // Default availability schedule
        availability: req.body.availability || {
          timeSlots: ["06:00-07:00","07:00-08:00","08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00","18:00-19:00","19:00-20:00","20:00-21:00","21:00-22:00"],
          blockedDates: [],
          weeklySchedule: {
            monday: { isOpen: true, slots: ["06:00-07:00","07:00-08:00","08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00","18:00-19:00","19:00-20:00","20:00-21:00","21:00-22:00"] },
            tuesday: { isOpen: true, slots: ["06:00-07:00","07:00-08:00","08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00","18:00-19:00","19:00-20:00","20:00-21:00","21:00-22:00"] },
            wednesday: { isOpen: true, slots: ["06:00-07:00","07:00-08:00","08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00","18:00-19:00","19:00-20:00","20:00-21:00","21:00-22:00"] },
            thursday: { isOpen: true, slots: ["06:00-07:00","07:00-08:00","08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00","18:00-19:00","19:00-20:00","20:00-21:00","21:00-22:00"] },
            friday: { isOpen: true, slots: ["06:00-07:00","07:00-08:00","08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00","18:00-19:00","19:00-20:00","20:00-21:00","21:00-22:00"] },
            saturday: { isOpen: true, slots: ["06:00-07:00","07:00-08:00","08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00","18:00-19:00","19:00-20:00","20:00-21:00","21:00-22:00"] },
            sunday: { isOpen: true, slots: ["06:00-07:00","07:00-08:00","08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00","18:00-19:00","19:00-20:00","20:00-21:00","21:00-22:00"] }
          }
        },
        // Ensure these critical fields are set for visibility in public API
        status: 'active',
        isVerified: true,
        totalBookings: 0,
        policies: req.body.policies || {
          cancellation: "Free cancellation up to 24 hours before booking",
          rules: [],
          advanceBooking: 30
        },
        // Ensure amenities is an array
        amenities: req.body.amenities || [],
        // Default rating if not provided
        rating: req.body.rating || {
          average: 4.5,
          count: 50,
          reviews: []
        }
      };

      const ground = new Ground(groundData);
      await ground.save();
      res.json({ success: true, ground });
    } catch (error) {
      console.error("Ground creation error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to create ground", error: (error as Error).message });
    }
  });

  app.put("/api/admin/grounds/:id", adminAuth, async (req, res) => {
    try {
      const ground = await Ground.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!ground) {
        return res
          .status(404)
          .json({ success: false, message: "Ground not found" });
      }
      res.json({ success: true, ground });
    } catch (error) {
      console.error("Ground update error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update ground" });
    }
  });

  app.delete("/api/admin/grounds/:id", adminAuth, async (req, res) => {
    try {
      const ground = await Ground.findByIdAndDelete(req.params.id);
      if (!ground) {
        return res
          .status(404)
          .json({ success: false, message: "Ground not found" });
      }
      res.json({ success: true, message: "Ground deleted successfully" });
    } catch (error) {
      console.error("Ground deletion error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete ground" });
    }
  });

  // Bookings Management
  app.get("/api/admin/bookings", adminAuth, async (req, res) => {
    try {
      const bookings = await Booking.find()
        .populate("userId", "name email phone")
        .populate("groundId", "name location")
        .sort({ createdAt: -1 });
      res.json({ success: true, bookings });
    } catch (error) {
      console.error("Bookings fetch error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/admin/bookings", adminAuth, async (req, res) => {
    try {
      const { groundId, bookingDate, timeSlot, playerDetails, requirements } =
        req.body;

      const [startTime, endTime] = timeSlot.split("-");
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const ground = await Ground.findById(groundId);
      if (!ground) {
        return res
          .status(404)
          .json({ success: false, message: "Ground not found" });
      }

      const baseAmount = (ground.price?.perHour || 500) * duration;
      const discount = ground.price?.discount || 0;
      const convenienceFee = Math.round(baseAmount * 0.02);
      const totalAmount = baseAmount - discount + convenienceFee;

      const bookingId = `BC${Date.now().toString(36).toUpperCase()}`;

      const booking = new Booking({
        bookingId,
        groundId,
        bookingDate: new Date(bookingDate),
        timeSlot: { startTime, endTime, duration },
        playerDetails,
        pricing: { baseAmount, discount, convenienceFee, totalAmount },
        status: "confirmed",
        payment: {
          status: "completed",
          method: "admin",
          paymentDate: new Date(),
        },
      });

      await booking.save();
      await booking.populate("groundId", "name location");

      res.json({ success: true, booking });
    } catch (error) {
      console.error("Booking creation error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to create booking" });
    }
  });

  app.patch("/api/admin/bookings/:id", adminAuth, async (req, res) => {
    try {
      const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      })
        .populate("userId", "name email")
        .populate("groundId", "name");

      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }

      res.json({ success: true, booking });
    } catch (error) {
      console.error("Booking update error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update booking" });
    }
  });

  app.delete("/api/admin/bookings/:id", adminAuth, async (req, res) => {
    try {
      const booking = await Booking.findByIdAndDelete(req.params.id);
      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }
      res.json({ success: true, message: "Booking deleted successfully" });
    } catch (error) {
      console.error("Booking deletion error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete booking" });
    }
  });

  // Locations Management
  app.get("/api/admin/locations", adminAuth, async (req, res) => {
    try {
      const locations = await Location.find().sort({ name: 1 });
      res.json({ success: true, locations });
    } catch (error) {
      console.error("Locations fetch error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch locations" });
    }
  });

  app.post("/api/admin/locations", adminAuth, async (req, res) => {
    try {
      const location = new Location(req.body);
      await location.save();
      res.json({ success: true, location });
    } catch (error) {
      console.error("Location creation error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to create location" });
    }
  });

  app.put("/api/admin/locations/:id", adminAuth, async (req, res) => {
    try {
      const location = await Location.findOneAndUpdate(
        { id: req.params.id },
        req.body,
        { new: true },
      );
      if (!location) {
        return res
          .status(404)
          .json({ success: false, message: "Location not found" });
      }
      res.json({ success: true, location });
    } catch (error) {
      console.error("Location update error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update location" });
    }
  });

  app.delete("/api/admin/locations/:id", adminAuth, async (req, res) => {
    try {
      const location = await Location.findOneAndDelete({ id: req.params.id });
      if (!location) {
        return res
          .status(404)
          .json({ success: false, message: "Location not found" });
      }
      res.json({ success: true, message: "Location deleted successfully" });
    } catch (error) {
      console.error("Location deletion error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete location" });
    }
  });

  return app;
}

// Auto-populate locations
const indianCities = [
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    latitude: 19.076,
    longitude: 72.8777,
    popular: true,
  },
  {
    id: "delhi",
    name: "Delhi",
    state: "Delhi",
    latitude: 28.7041,
    longitude: 77.1025,
    popular: true,
  },
  {
    id: "bangalore",
    name: "Bangalore",
    state: "Karnataka",
    latitude: 12.9716,
    longitude: 77.5946,
    popular: true,
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    latitude: 17.385,
    longitude: 78.4867,
    popular: true,
  },
  {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    latitude: 13.0827,
    longitude: 80.2707,
    popular: true,
  },
  {
    id: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    latitude: 22.5726,
    longitude: 88.3639,
    popular: true,
  },
  {
    id: "pune",
    name: "Pune",
    state: "Maharashtra",
    latitude: 18.5204,
    longitude: 73.8567,
    popular: true,
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    latitude: 23.0225,
    longitude: 72.5714,
    popular: true,
  },
];

async function initializeData() {
  try {
    const locationCount = await Location.countDocuments();
    if (locationCount === 0) {
      await Location.insertMany(indianCities);
      console.log("✅ Locations initialized");
    }

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: "admin@boxcric.com" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Admin",
        email: "admin@boxcric.com",
        phone: "9999999999",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        isActive: true,
      });
      console.log("✅ Admin user created");
    }
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

// Connect to MongoDB and start server only in production
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose
    .connect(MONGODB_URI)
    .then(async () => {
      console.log("✅ Connected to MongoDB");
      await initializeData();

      const app = createServer();
      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => {
        console.log(`✅ Admin server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("❌ MongoDB connection error:", error);
      process.exit(1);
    });
}

// Initialize MongoDB connection for development
const connectToMongoDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log("✅ Connected to MongoDB (dev mode)");
      await initializeData();
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};

// Auto-connect in development
if (process.env.NODE_ENV !== "production") {
  connectToMongoDB();
}

export default createServer;
