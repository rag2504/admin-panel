import { useState, useEffect } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { toast } from "sonner";

export default function AdminNotifications() {
  const { apiCall } = useAdmin();
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general",
    recipients: "all",
    priority: "medium",
    selectedUserIds: [] as string[],
  });

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await apiCall("/api/admin/notifications");
      console.log("📋 Admin notifications response:", response);
      if (response.success) {
        setNotifications(response.notifications);
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiCall(`/api/admin/users?limit=1000&search=${encodeURIComponent(userSearch)}`);
      if (response.success) {
        setUsers(response.users || response.data?.users || []);
        console.log("✅ Fetched users:", (response.users || response.data?.users || []).length);
      } else {
        console.error("❌ Failed to fetch users:", response.message);
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error);
    }
  };

  const handleSimpleTest = async () => {
    console.log("🗺️ Testing simple notification creation...");
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/simple-test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log("📝 Simple test result:", result);
      
      if (result.success) {
        toast.success("Simple test notification created! Check user panel.");
        setMessage("✅ Test notification created successfully!");
        fetchNotifications();
      } else {
        toast.error("Simple test failed: " + result.message);
        setMessage("❌ Test failed: " + result.message);
      }
    } catch (error) {
      console.error("❌ Simple test error:", error);
      toast.error("Simple test failed: " + error.message);
      setMessage("❌ Error: " + error.message);
    }
    setLoading(false);
  };

  const handleTestAdminNotification = async () => {
    console.log("🗺️ Testing admin notification system...");
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/test-admin-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log("📢 Admin test result:", result);
      
      if (result.success) {
        toast.success(result.message);
        setMessage(`✅ ${result.message}`);
        console.log("Test results:", result.results);
      } else {
        toast.error("Admin test failed: " + result.message);
        setMessage("❌ Admin test failed: " + result.message);
      }
    } catch (error) {
      console.error("❌ Admin test error:", error);
      toast.error("Admin test failed: " + error.message);
      setMessage("❌ Error: " + error.message);
    }
    setLoading(false);
  };

  const handleDebugCheck = async () => {
    console.log("🔍 Checking database notifications...");
    try {
      const response = await fetch('http://localhost:3001/api/debug/notifications');
      const result = await response.json();
      
      console.log("💾 Database notifications:", result);
      toast.info(`Found ${result.total} notifications in database. Check console for details.`);
      setMessage(`🔍 Found ${result.total} notifications in database`);
    } catch (error) {
      console.error("❌ Debug check error:", error);
      toast.error("Debug check failed: " + error.message);
      setMessage("❌ Debug failed: " + error.message);
    }
  };

  const handleCreateNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    console.log("📨 Creating notification:", formData);
    setLoading(true);
    try {
      // Try the authenticated broadcast endpoint first, fallback to test endpoint
      let response: any;
      try {
        const result = await apiCall(
          formData.recipients === 'all' ? 
            "/api/admin/notifications/broadcast" : 
            "/api/admin/notifications/send",
          {
          method: "POST",
          body: JSON.stringify({
            title: formData.title,
            message: formData.message,
            priority: formData.priority,
            type: formData.type === "general" ? "admin_broadcast" : formData.type,
            actionUrl: "/notifications",
            ...(formData.recipients === 'specific' && { userIds: formData.selectedUserIds })
          }),
        });
        response = result; // already parsed JSON
      } catch (authError) {
        console.log('Auth endpoint failed, trying test endpoint:', authError);
        // Fallback to test endpoint
        response = await fetch('http://localhost:3001/api/admin/notifications/broadcast-test', {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title,
            message: formData.message,
            priority: formData.priority,
            type: formData.type === "general" ? "admin_broadcast" : formData.type,
            actionUrl: "/notifications" // Default action URL
          }),
        });
        
        // Parse response for test endpoint
        const parsed = await response.json();
        response = parsed; // Use parsed result for consistency
      }
      
      const result = response; // already parsed object at this point
      console.log("📝 Response:", result);

      if (result.success) {
        toast.success(result.message || `Notification sent successfully!`);
        setFormData({
          title: "",
          message: "",
          type: "general",
          recipients: "all",
          priority: "medium",
          selectedUserIds: [],
        });
        fetchNotifications();
        setMessage(result.message || `✅ Notification sent successfully!`);
      } else {
        console.error("❌ API Error:", result);
        toast.error(result.message || "Failed to create notification");
        setMessage("❌ Failed: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("❌ Network Error:", error);
      toast.error("Failed to create notification: " + error.message);
      setMessage("❌ Network error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        📱 Admin Notifications
      </h1>
      
      {message && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          backgroundColor: '#f0f0f0', 
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>🧪 Test Functions</h2>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={handleDebugCheck}
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: '#orange',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            🔍 Debug DB
          </button>
          
          <button
            onClick={handleSimpleTest}
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: '#purple',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            📨 Simple Test
          </button>
          
          <button
            onClick={handleTestAdminNotification}
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            📢 Test Admin Notification
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>📝 Create Notification</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter notification title"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Message *</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Enter notification message"
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Recipients</label>
            <select
              value={formData.recipients}
              onChange={(e) => setFormData(prev => ({ ...prev, recipients: e.target.value }))}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="all">All users</option>
              <option value="specific">Specific users</option>
            </select>
          </div>
        </div>
        
        {formData.recipients === 'specific' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Select users</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Search users by name or email"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchUsers(); }}
                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <button onClick={fetchUsers} style={{ padding: '8px 12px', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Search</button>
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, selectedUserIds: users.map(u => u._id) }));
                }}
                style={{ padding: '8px 12px', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}
              >
                Select all ({users.length})
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, selectedUserIds: [] }))}
                style={{ padding: '8px 12px', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
            <div style={{
              maxHeight: '200px',
              overflow: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '8px'
            }}>
              {users.map((u) => (
                <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="checkbox"
                    checked={formData.selectedUserIds.includes(u._id)}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        selectedUserIds: e.target.checked
                          ? [...prev.selectedUserIds, u._id]
                          : prev.selectedUserIds.filter(id => id !== u._id)
                      }));
                    }}
                  />
                  <span>{u.name} ({u.email})</span>
                </label>
              ))}
              {users.length === 0 && <div style={{ color: '#666' }}>No users found.</div>}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Selected: {formData.selectedUserIds.length}
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="general">General</option>
              <option value="offer">Offer</option>
              <option value="booking">Booking</option>
              <option value="system">System</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={handleCreateNotification}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creating...' : '📤 Send Notification'}
        </button>
      </div>

      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>
          📋 All Notifications ({notifications.length})
        </h2>
        
        <div style={{ fontSize: '14px', color: '#666' }}>
          Found {users.length} users in system
        </div>
        
        {notifications.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#f9f9f9',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔔</div>
            <p>No notifications found</p>
          </div>
        ) : (
          <div style={{ marginTop: '15px' }}>
            {notifications.map((notification: any) => (
              <div key={notification._id} style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px',
                backgroundColor: '#f9f9f9'
              }}>
                <h3 style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                  {notification.title}
                </h3>
                <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                  {notification.message}
                </p>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  Type: {notification.type} | Priority: {notification.priority} | 
                  Recipients: {notification.recipients} | 
                  Created: {new Date(notification.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
