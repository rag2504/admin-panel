import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rag123456:rag123456@cluster0.qipvo.mongodb.net/boxcricket?retryWrites=true&w=majority';
const JWT_SECRET = process.env.JWT_SECRET || 'adminpanel_secret';

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'ground_owner'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const groundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  location: {
    address: String,
    cityId: String,
    cityName: String,
    state: String,
    latitude: Number,
    longitude: Number,
    pincode: String
  },
  price: {
    perHour: Number,
    currency: { type: String, default: 'INR' },
    discount: { type: Number, default: 0 },
    ranges: [{
      start: String,
      end: String,
      perHour: Number
    }]
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  amenities: [String],
  features: {
    pitchType: String,
    capacity: Number,
    lighting: Boolean,
    parking: Boolean,
    changeRoom: Boolean,
    washroom: Boolean,
    cafeteria: Boolean,
    equipment: Boolean
  },
  owner: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    contact: String,
    email: String,
    verified: { type: Boolean, default: false }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    reviews: []
  },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ground', required: true },
  bookingDate: { type: Date, required: true },
  timeSlot: {
    startTime: String,
    endTime: String,
    duration: Number
  },
  playerDetails: {
    teamName: String,
    playerCount: Number,
    contactPerson: {
      name: String,
      phone: String,
      email: String
    },
    requirements: String
  },
  pricing: {
    baseAmount: Number,
    discount: Number,
    convenienceFee: Number,
    totalAmount: Number,
    currency: { type: String, default: 'INR' }
  },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  payment: {
    method: String,
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    transactionId: String,
    paymentDate: Date,
    gatewayResponse: Object
  }
}, { timestamps: true });

const locationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  state: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  popular: { type: Boolean, default: false }
}, { timestamps: true });

// Models
const User = mongoose.model('User', userSchema);
const Ground = mongoose.model('Ground', groundSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Location = mongoose.model('Location', locationSchema);

// Admin Auth Middleware
const adminAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') throw new Error('Not admin');
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check for hardcoded admin first
    if (email === 'admin@boxcric.com' && password === 'admin123') {
      const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ 
        success: true, 
        token, 
        admin: { email, role: 'admin' } 
      });
    }

    // Check database for admin users
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ 
      id: admin._id, 
      email: admin.email, 
      role: admin.role 
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      success: true, 
      token, 
      admin: { 
        id: admin._id, 
        email: admin.email, 
        name: admin.name, 
        role: admin.role 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Dashboard Stats
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalGrounds,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      totalRevenue,
      monthlyRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      Ground.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.aggregate([
        { $match: { status: 'confirmed', 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ]),
      Booking.aggregate([
        { 
          $match: { 
            status: 'confirmed', 
            'payment.status': 'completed',
            createdAt: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
            }
          } 
        },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ])
    ]);

    const recentBookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('groundId', 'name')
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
        recentBookings
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// User Management
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    
    const query: any = { role: 'user' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
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
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

app.patch('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const { isActive, isVerified } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive, isVerified },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Financial Management
app.get('/api/admin/financial', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;
    
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };
    }

    const [
      totalRevenue,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      revenueByPeriod
    ] = await Promise.all([
      Booking.aggregate([
        { $match: { ...dateFilter, status: 'confirmed', 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ]),
      Booking.countDocuments({ ...dateFilter, 'payment.status': 'completed' }),
      Booking.countDocuments({ ...dateFilter, 'payment.status': 'pending' }),
      Booking.countDocuments({ ...dateFilter, 'payment.status': 'failed' }),
      Booking.countDocuments({ ...dateFilter, 'payment.status': 'refunded' }),
      Booking.aggregate([
        { $match: { ...dateFilter, status: 'confirmed', 'payment.status': 'completed' } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              ...(period === 'day' && { day: { $dayOfMonth: '$createdAt' } })
            },
            revenue: { $sum: '$pricing.totalAmount' },
            bookings: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    ]);

    const recentTransactions = await Booking.find({
      ...dateFilter,
      'payment.status': 'completed'
    })
      .populate('userId', 'name email')
      .populate('groundId', 'name')
      .sort({ 'payment.paymentDate': -1 })
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
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Financial data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch financial data' });
  }
});

// Grounds Management
app.get('/api/admin/grounds', adminAuth, async (req, res) => {
  try {
    const grounds = await Ground.find()
      .populate('owner.userId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, grounds });
  } catch (error) {
    console.error('Grounds fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch grounds' });
  }
});

app.post('/api/admin/grounds', adminAuth, async (req, res) => {
  try {
    const ground = new Ground(req.body);
    await ground.save();
    res.json({ success: true, ground });
  } catch (error) {
    console.error('Ground creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ground' });
  }
});

app.put('/api/admin/grounds/:id', adminAuth, async (req, res) => {
  try {
    const ground = await Ground.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ground) {
      return res.status(404).json({ success: false, message: 'Ground not found' });
    }
    res.json({ success: true, ground });
  } catch (error) {
    console.error('Ground update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ground' });
  }
});

app.delete('/api/admin/grounds/:id', adminAuth, async (req, res) => {
  try {
    const ground = await Ground.findByIdAndDelete(req.params.id);
    if (!ground) {
      return res.status(404).json({ success: false, message: 'Ground not found' });
    }
    res.json({ success: true, message: 'Ground deleted successfully' });
  } catch (error) {
    console.error('Ground deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ground' });
  }
});

// Bookings Management
app.get('/api/admin/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email phone')
      .populate('groundId', 'name location')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

app.post('/api/admin/bookings', adminAuth, async (req, res) => {
  try {
    const { groundId, bookingDate, timeSlot, playerDetails, requirements } = req.body;
    
    const [startTime, endTime] = timeSlot.split('-');
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({ success: false, message: 'Ground not found' });
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
      status: 'confirmed',
      payment: { status: 'completed', method: 'admin', paymentDate: new Date() }
    });

    await booking.save();
    await booking.populate('groundId', 'name location');

    res.json({ success: true, booking });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

app.patch('/api/admin/bookings/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('userId', 'name email')
      .populate('groundId', 'name');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error('Booking update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

app.delete('/api/admin/bookings/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Booking deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
});

// Locations Management
app.get('/api/admin/locations', adminAuth, async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    res.json({ success: true, locations });
  } catch (error) {
    console.error('Locations fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch locations' });
  }
});

app.post('/api/admin/locations', adminAuth, async (req, res) => {
  try {
    const location = new Location(req.body);
    await location.save();
    res.json({ success: true, location });
  } catch (error) {
    console.error('Location creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create location' });
  }
});

app.put('/api/admin/locations/:id', adminAuth, async (req, res) => {
  try {
    const location = await Location.findOneAndUpdate(
      { id: req.params.id }, 
      req.body, 
      { new: true }
    );
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    res.json({ success: true, location });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
});

app.delete('/api/admin/locations/:id', adminAuth, async (req, res) => {
  try {
    const location = await Location.findOneAndDelete({ id: req.params.id });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Location deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete location' });
  }
});

// Auto-populate locations
const indianCities = [
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777, popular: true },
  { id: "delhi", name: "Delhi", state: "Delhi", latitude: 28.7041, longitude: 77.1025, popular: true },
  { id: "bangalore", name: "Bangalore", state: "Karnataka", latitude: 12.9716, longitude: 77.5946, popular: true },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana", latitude: 17.385, longitude: 78.4867, popular: true },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu", latitude: 13.0827, longitude: 80.2707, popular: true },
  { id: "kolkata", name: "Kolkata", state: "West Bengal", latitude: 22.5726, longitude: 88.3639, popular: true },
  { id: "pune", name: "Pune", state: "Maharashtra", latitude: 18.5204, longitude: 73.8567, popular: true },
  { id: "ahmedabad", name: "Ahmedabad", state: "Gujarat", latitude: 23.0225, longitude: 72.5714, popular: true }
];

async function initializeData() {
  try {
    const locationCount = await Location.countDocuments();
    if (locationCount === 0) {
      await Location.insertMany(indianCities);
      console.log('✅ Locations initialized');
    }

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@boxcric.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin',
        email: 'admin@boxcric.com',
        phone: '9999999999',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        isActive: true
      });
      console.log('✅ Admin user created');
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    await initializeData();
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ Admin server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
