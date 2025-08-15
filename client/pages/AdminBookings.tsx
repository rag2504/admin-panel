import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/hooks/useApi';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  IndianRupee
} from 'lucide-react';

interface Booking {
  _id: string;
  bookingId: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  groundId: {
    _id: string;
    name: string;
    location: {
      cityName: string;
      state: string;
    };
  };
  bookingDate: string;
  timeSlot: {
    startTime: string;
    endTime: string;
    duration: number;
  };
  playerDetails: {
    teamName?: string;
    playerCount: number;
    contactPerson: {
      name: string;
      phone: string;
      email?: string;
    };
    requirements?: string;
  };
  pricing: {
    baseAmount: number;
    discount: number;
    convenienceFee: number;
    totalAmount: number;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment: {
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    method?: string;
    transactionId?: string;
    paymentDate?: string;
  };
  createdAt: string;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const { get, patch, delete: del } = useApi();

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, paymentFilter]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get('/admin/bookings');
      if (response.success) {
        setBookings(response.data.bookings || []);
        setError(null);
      } else {
        setError(response.error || 'Failed to load bookings');
        setBookings([]);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setError('Network error: Unable to connect to server');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.groundId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.playerDetails?.contactPerson?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(booking => booking.payment?.status === paymentFilter);
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await patch(`/admin/bookings/${bookingId}`, { status });
      if (response.success) {
        loadBookings();
      }
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    try {
      const response = await del(`/admin/bookings/${bookingId}`);
      if (response.success) {
        loadBookings();
      }
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium'
    }).format(new Date(date));
  };

  const formatTime = (time: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(`2000-01-01 ${time}`));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-100 text-purple-800">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-1">Manage cricket ground bookings and reservations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadBookings} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-blue-600">{bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Confirmed</p>
                <p className="text-3xl font-bold text-green-600">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(
                    bookings
                      .filter(b => b.payment?.status === 'completed')
                      .reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0)
                  )}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by booking ID, user, ground, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="completed">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
          <CardDescription>
            {filteredBookings.length !== bookings.length && 
              `Showing ${filteredBookings.length} of ${bookings.length} bookings`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Bookings</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadBookings} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div key={booking._id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{booking.bookingId}</h3>
                        {getStatusBadge(booking.status)}
                        {getPaymentBadge(booking.payment?.status || 'pending')}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-1">
                          <div><strong>User:</strong> {booking.userId?.name || 'Admin Booking'}</div>
                          <div><strong>Contact:</strong> {booking.playerDetails?.contactPerson?.name || 'N/A'} ({booking.playerDetails?.contactPerson?.phone || 'N/A'})</div>
                          <div><strong>Players:</strong> {booking.playerDetails?.playerCount || 0}</div>
                          {booking.playerDetails?.teamName && (
                            <div><strong>Team:</strong> {booking.playerDetails.teamName}</div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div><strong>Ground:</strong> {booking.groundId?.name || 'Unknown Ground'}</div>
                          <div><strong>Location:</strong> {booking.groundId?.location?.cityName || 'Unknown'}, {booking.groundId?.location?.state || 'Unknown'}</div>
                          <div><strong>Date:</strong> {formatDate(booking.bookingDate)}</div>
                          <div><strong>Time:</strong> {formatTime(booking.timeSlot?.startTime)} - {formatTime(booking.timeSlot?.endTime)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(booking.pricing?.totalAmount || 0)}
                        </div>
                        <div className="text-gray-500">
                          Created: {formatDate(booking.createdAt)}
                        </div>
                        {booking.payment?.paymentDate && (
                          <div className="text-gray-500">
                            Paid: {formatDate(booking.payment.paymentDate)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {booking.status === 'pending' && (
                        <Button 
                          size="sm"
                          onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingStatus(booking._id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}

                      <Select 
                        value={booking.status} 
                        onValueChange={(value) => updateBookingStatus(booking._id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteBooking(booking._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Bookings will appear here once customers start making reservations.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
