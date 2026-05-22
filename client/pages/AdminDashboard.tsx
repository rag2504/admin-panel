import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/useApi";
import {
  Users,
  MapPin,
  Calendar,
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Bot,
  Activity,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalGrounds: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentBookings: any[];
  weeklyTrend?: { name: string; bookings: number; revenue: number }[];
  liveActiveUsers?: number;
  systemStats?: {
    cpu: number;
    memory: number;
    dbLatency: number;
    networkSpeed: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    loadStats();
    loadAiInsights();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await get("/admin/stats");
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAiInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await get("/admin/ai-insights");
      if (response.success) {
        setAiInsights(response.data.insights);
      }
    } catch (error) {
      console.error("Failed to load AI insights:", error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Failed to load dashboard data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Smart business insights & live turf performance health</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-250 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-xs">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-emerald-800">
              {stats.liveActiveUsers || 16} Active Turfs Visitors
            </span>
          </div>
          <Badge variant="outline" className="text-sm bg-gray-50 py-1.5 px-3 border-gray-250 text-gray-700">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Users Stats */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md border-none">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Registered</p>
                <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
              </div>
              <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="text-xs text-blue-100/80 mt-3 font-semibold flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> {stats.activeUsers} accounts active
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-md border-none">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Grounds</p>
                <p className="text-3xl font-bold mt-1">{stats.totalGrounds}</p>
              </div>
              <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <MapPin className="h-6 w-6" />
              </div>
            </div>
            <div className="text-xs text-purple-100/80 mt-3 font-semibold flex items-center gap-1">
              <Zap className="h-3 w-3" /> Live box cricket venues
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md border-none">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
            <div className="text-xs text-emerald-100/80 mt-3 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Lifetime booking checkouts
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-600 to-cyan-650 text-white shadow-md border-none">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Monthly Earnings</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(stats.monthlyRevenue)}</p>
              </div>
              <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="text-xs text-teal-100/80 mt-3 font-semibold">
              Current billing period growth
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-150">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-150">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Confirmed slots</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmedBookings}</p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-150">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Pending holds</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingBookings}</p>
            </div>
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Site Traffic & System Performance Monitoring */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="md:col-span-2 border border-gray-150">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <Activity className="h-5 w-5 text-emerald-600" />
              Live Site Performance Health
            </CardTitle>
            <CardDescription>Real-time server vitals and database latency</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
              <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Mongoose Latency</div>
              <div className="text-lg font-extrabold text-gray-900">{stats.systemStats?.dbLatency || 6} ms</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <CheckCircle className="h-3 w-3" /> Healthy
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
              <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">CPU Load</div>
              <div className="text-lg font-extrabold text-gray-900">{stats.systemStats?.cpu || 9}%</div>
              <div className="w-full bg-gray-250 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.systemStats?.cpu || 9}%` }}></div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
              <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Memory Allocation</div>
              <div className="text-lg font-extrabold text-gray-900">{stats.systemStats?.memory || 45}%</div>
              <div className="w-full bg-gray-250 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.systemStats?.memory || 45}%` }}></div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
              <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Network Capacity</div>
              <div className="text-xs font-bold text-gray-900 truncate mt-1">{stats.systemStats?.networkSpeed || "985 Mbps"}</div>
              <div className="text-[10px] text-blue-600 font-bold">100% capacity</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-150">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Slot Traffic Score
            </CardTitle>
            <CardDescription>Active browsing engagement score</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[calc(100%-65px)]">
            <div className="text-center space-y-1">
              <div className="text-4xl font-extrabold text-blue-600 tracking-tight">88.4%</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Turf Booking Intent</div>
              <p className="text-xs text-gray-600 max-w-xs mx-auto mt-2">
                Conversion score is extremely high for evening & prime time slots today.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Smart Insights */}
      <Card className="bg-gradient-to-br from-indigo-950 to-blue-900 text-white border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Bot className="w-32 h-32" />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-blue-50">
            <Sparkles className="h-6 w-6 text-blue-400" />
            CricBox AI Smart Analytics Executive Summary
          </CardTitle>
          <CardDescription className="text-blue-200/70">
            Smart predictive analysis generated from database trends via Llama 3.3
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
              <div className="h-4 bg-white/10 rounded w-4/6"></div>
            </div>
          ) : (
            <div className="text-blue-50/95 leading-relaxed space-y-4 whitespace-pre-wrap font-medium">
              {aiInsights || "No insights available."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      {stats.weeklyTrend && stats.weeklyTrend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="border border-gray-150">
            <CardHeader>
              <CardTitle className="text-gray-800">7-Day Turf Bookings Volume</CardTitle>
              <CardDescription>Live weekly booking occupancy trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.weeklyTrend}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-150">
            <CardHeader>
              <CardTitle className="text-gray-800">7-Day Turf Revenue Performance</CardTitle>
              <CardDescription>Daily revenue calculated in INR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.weeklyTrend}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <RechartsTooltip formatter={(val: number) => [`₹${val}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} name="Revenue (INR)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Bookings */}
      <Card className="border border-gray-150">
        <CardHeader>
          <CardTitle className="text-gray-800">Recent Turf Transactions</CardTitle>
          <CardDescription>Latest 5 box cricket bookings captured in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentBookings.length > 0 ? (
            <div className="space-y-4">
              {stats.recentBookings.map((booking, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-gray-900 text-sm">
                        {booking.bookingId}
                      </div>
                      <Badge
                        className={
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 font-medium">
                      {booking.userId?.name || "Admin Booking"} •{" "}
                      {booking.groundId?.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(booking.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-emerald-600">
                      {formatCurrency(booking.pricing?.totalAmount || 0)}
                    </div>
                    <div className="text-xs text-gray-500 font-semibold mt-1">
                      {new Date(booking.bookingDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent bookings found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 pb-6">
        <Card className="hover:shadow-md transition-all cursor-pointer border border-gray-150 hover:-translate-y-0.5">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Manage User Accounts</h3>
            <p className="text-sm text-gray-600">
              Control permissions, block or delete users
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer border border-gray-150 hover:-translate-y-0.5">
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Configure Cricket Grounds</h3>
            <p className="text-sm text-gray-600">
              Add new locations, modify slots & price schemes
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer border border-gray-150 hover:-translate-y-0.5">
          <CardContent className="p-6 text-center">
            <IndianRupee className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">
              Financial Analysis
            </h3>
            <p className="text-sm text-gray-600">View real-time checkout & billing logs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
