import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useApi } from "@/hooks/useApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Filter,
  RefreshCw,
  Trash2,
  Shield,
  ShieldOff,
  Eye,
  Clock,
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface UsersPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState<UsersPagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const { get, patch, delete: del } = useApi();

  useEffect(() => {
    loadUsers();
  }, [pagination.page, search, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await get(
        `/admin/users?page=${pagination.page}&limit=${pagination.limit}&search=${search}&status=${statusFilter}`,
      );
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (
    userId: string,
    field: "isActive" | "isVerified",
    value: boolean,
  ) => {
    try {
      const response = await patch(`/admin/users/${userId}`, {
        [field]: value,
      });
      if (response.success) {
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, [field]: value } : user,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await del(`/admin/users/${userId}`);
      if (response.success) {
        setUsers(users.filter((user) => user._id !== userId));
        // Update pagination if needed
        if (users.length - 1 === 0 && pagination.page > 1) {
          setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
        }
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const blockUser = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? "block" : "unblock";
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    await updateUserStatus(userId, "isActive", !currentStatus);
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
    setLoadingBookings(true);
    setUserBookings([]);
    try {
      const response = await get("/admin/bookings");
      if (response.success) {
        const bookings = response.data.bookings || [];
        const filtered = bookings.filter((b: any) => b.userId?._id === user._id || b.userId === user._id);
        setUserBookings(filtered);
      }
    } catch (error) {
      console.error("Failed to load user bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleDeleteUserFromModal = async () => {
    if (!selectedUser) return;
    await deleteUser(selectedUser._id, selectedUser.name);
    setIsDetailsOpen(false);
    setSelectedUser(null);
  };

  const handleBlockToggleFromModal = async () => {
    if (!selectedUser) return;
    await blockUser(selectedUser._id, selectedUser.isActive);
    setSelectedUser(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
    // Reload users list to keep list in sync
    loadUsers();
  };

  const handleVerifyToggleFromModal = async (checked: boolean) => {
    if (!selectedUser) return;
    await updateUserStatus(selectedUser._id, "isVerified", checked);
    setSelectedUser(prev => prev ? { ...prev, isVerified: checked } : null);
    // Reload users list to keep list in sync
    loadUsers();
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(date));
  };

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return (
        <Badge variant="destructive" className="text-xs">
          Inactive
        </Badge>
      );
    }
    if (!user.isVerified) {
      return (
        <Badge variant="secondary" className="text-xs">
          Unverified
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="text-xs">
        Active
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">
                  {pagination.total}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Active Users
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter((u) => u.isActive).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Inactive Users
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {users.filter((u) => !u.isActive).length}
                </p>
              </div>
              <UserX className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
          <CardDescription>
            Showing {users.length} of {pagination.total} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-4"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h3 
                          className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 hover:underline"
                          onClick={() => handleViewDetails(user)}
                        >
                          {user.name}
                        </h3>
                        {getStatusBadge(user)}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{user.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            Joined {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                      {user.lastLogin ? (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          Last login:{" "}
                          {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "medium",
                          }).format(new Date(user.lastLogin))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 mt-1">
                          Never logged in
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        Verified
                      </span>
                      <Switch
                        checked={user.isVerified}
                        onCheckedChange={(checked) =>
                          updateUserStatus(user._id, "isVerified", checked)
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Details</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => blockUser(user._id, user.isActive)}
                        className={
                          user.isActive
                            ? "text-orange-600 hover:text-orange-700"
                            : "text-green-600 hover:text-green-700"
                        }
                      >
                        {user.isActive ? (
                          <>
                            <ShieldOff className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Block</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Unblock</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user._id, user.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Profile Details
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Profile Overview Card */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedUser.name}</h2>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedUser)}
                      <Badge variant="outline" className="capitalize text-xs">
                        {selectedUser.role.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2 mr-4">
                    <span className="text-xs font-medium text-gray-600">Verified:</span>
                    <Switch
                      checked={selectedUser.isVerified}
                      onCheckedChange={handleVerifyToggleFromModal}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBlockToggleFromModal}
                    className={
                      selectedUser.isActive
                        ? "text-orange-600 hover:text-orange-700"
                        : "text-green-600 hover:text-green-700"
                    }
                  >
                    {selectedUser.isActive ? (
                      <>
                        <ShieldOff className="h-4 w-4 mr-1" />
                        Block
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-1" />
                        Unblock
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteUserFromModal}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-500">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedUser.phone || "No phone number listed"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-500">Account Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Registered: {formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400 text-green-600" />
                      <span>
                        Last Login:{" "}
                        {selectedUser.lastLogin
                          ? new Intl.DateTimeFormat("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(selectedUser.lastLogin))
                          : "Never logged in"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Booking History Section */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Booking History ({userBookings.length})
                </h3>

                {loadingBookings ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : userBookings.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-2">Booking ID</th>
                          <th className="px-4 py-2">Ground</th>
                          <th className="px-4 py-2">Date & Time</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {userBookings.map((booking: any) => (
                          <tr key={booking._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono font-semibold text-xs">{booking.bookingId}</td>
                            <td className="px-4 py-2">{booking.groundId?.name || "Unknown Ground"}</td>
                            <td className="px-4 py-2">
                              {new Intl.DateTimeFormat("en-IN", { dateStyle: "short" }).format(new Date(booking.bookingDate))}
                              <div className="text-xs text-gray-500">
                                {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-emerald-600">
                              ₹{booking.pricing?.totalAmount || 0}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Badge className={
                                booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                                booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                booking.status === "cancelled" ? "bg-red-100 text-red-800" :
                                "bg-blue-100 text-blue-800"
                              }>
                                {booking.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-gray-50 text-gray-400">
                    No bookings found for this user.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
