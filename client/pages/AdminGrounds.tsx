import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useApi } from '@/hooks/useApi';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  RefreshCw,
  Eye,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';

interface Ground {
  _id: string;
  name: string;
  description: string;
  location: {
    address: string;
    cityId: string;
    cityName: string;
    state: string;
    pincode: string;
  };
  price: {
    perHour?: number;
    ranges?: Array<{
      start: string;
      end: string;
      perHour: number;
    }>;
    discount: number;
  };
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  features: {
    pitchType: string;
    capacity: number;
    lighting: boolean;
    parking: boolean;
    changeRoom: boolean;
    washroom: boolean;
    cafeteria: boolean;
    equipment: boolean;
  };
  rating: {
    average: number;
    count: number;
  };
  status: string;
  owner: {
    name: string;
    email: string;
    contact: string;
  };
}

interface Location {
  id: string;
  name: string;
  state: string;
}

export default function AdminGrounds() {
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGround, setEditingGround] = useState<Ground | null>(null);
  const [formData, setFormData] = useState<Partial<Ground>>({});
  const { get, post, put, delete: del } = useApi();

  useEffect(() => {
    loadGrounds();
    loadLocations();
  }, []);

  const loadGrounds = async () => {
    setLoading(true);
    try {
      const response = await get('/admin/grounds');
      if (response.success) {
        setGrounds(response.data.grounds);
      }
    } catch (error) {
      console.error('Failed to load grounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await get('/admin/locations');
      if (response.success) {
        setLocations(response.data.locations);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingGround) {
        response = await put(`/admin/grounds/${editingGround._id}`, formData);
      } else {
        response = await post('/admin/grounds', formData);
      }

      if (response.success) {
        loadGrounds();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save ground:', error);
    }
  };

  const handleEdit = (ground: Ground) => {
    setEditingGround(ground);
    setFormData(ground);
    setShowForm(true);
  };

  const handleDelete = async (groundId: string) => {
    if (!confirm('Are you sure you want to delete this ground?')) return;
    
    try {
      const response = await del(`/admin/grounds/${groundId}`);
      if (response.success) {
        loadGrounds();
      }
    } catch (error) {
      console.error('Failed to delete ground:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingGround(null);
    setFormData({
      name: '',
      description: '',
      location: {
        address: '',
        cityId: '',
        cityName: '',
        state: '',
        pincode: ''
      },
      price: {
        ranges: [
          { start: '06:00', end: '18:00', perHour: 500 },
          { start: '18:00', end: '06:00', perHour: 700 }
        ],
        discount: 0
      },
      images: [],
      features: {
        pitchType: '',
        capacity: 22,
        lighting: false,
        parking: false,
        changeRoom: false,
        washroom: false,
        cafeteria: false,
        equipment: false
      },
      owner: {
        name: '',
        email: '',
        contact: ''
      }
    });
  };

  const formatPrice = (ground: Ground) => {
    if (ground.price.ranges && ground.price.ranges.length > 0) {
      return ground.price.ranges.map(range => 
        `${range.start}-${range.end}: ₹${range.perHour}`
      ).join(', ');
    }
    return ground.price.perHour ? `₹${ground.price.perHour}/hr` : 'No pricing';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (showForm) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={resetForm}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Grounds
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {editingGround ? 'Edit Ground' : 'Add New Ground'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ground Information</CardTitle>
            <CardDescription>
              Fill in the details for the cricket ground
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Ground Name *
                    </label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter ground name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Capacity (Players) *
                    </label>
                    <Input
                      type="number"
                      value={formData.features?.capacity || 22}
                      onChange={(e) => setFormData({
                        ...formData, 
                        features: {...formData.features, capacity: Number(e.target.value)}
                      })}
                      min="2"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the ground..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      City *
                    </label>
                    <Select 
                      value={formData.location?.cityId || ''}
                      onValueChange={(value) => {
                        const selectedLocation = locations.find(loc => loc.id === value);
                        setFormData({
                          ...formData, 
                          location: {
                            ...formData.location,
                            cityId: value,
                            cityName: selectedLocation?.name || '',
                            state: selectedLocation?.state || ''
                          }
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}, {location.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Pincode *
                    </label>
                    <Input
                      value={formData.location?.pincode || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        location: {...formData.location, pincode: e.target.value}
                      })}
                      placeholder="Enter pincode"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Address *
                  </label>
                  <Input
                    value={formData.location?.address || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      location: {...formData.location, address: e.target.value}
                    })}
                    placeholder="Enter full address"
                    required
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing</h3>
                <div className="space-y-3">
                  {formData.price?.ranges?.map((range, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Start Time
                        </label>
                        <Input
                          type="time"
                          value={range.start}
                          onChange={(e) => {
                            const newRanges = [...(formData.price?.ranges || [])];
                            newRanges[index] = {...range, start: e.target.value};
                            setFormData({
                              ...formData, 
                              price: {...formData.price, ranges: newRanges}
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          End Time
                        </label>
                        <Input
                          type="time"
                          value={range.end}
                          onChange={(e) => {
                            const newRanges = [...(formData.price?.ranges || [])];
                            newRanges[index] = {...range, end: e.target.value};
                            setFormData({
                              ...formData, 
                              price: {...formData.price, ranges: newRanges}
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Price per Hour (₹)
                        </label>
                        <Input
                          type="number"
                          value={range.perHour}
                          onChange={(e) => {
                            const newRanges = [...(formData.price?.ranges || [])];
                            newRanges[index] = {...range, perHour: Number(e.target.value)};
                            setFormData({
                              ...formData, 
                              price: {...formData.price, ranges: newRanges}
                            });
                          }}
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Lighting</label>
                    <Switch
                      checked={formData.features?.lighting || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        features: {...formData.features, lighting: checked}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Parking</label>
                    <Switch
                      checked={formData.features?.parking || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        features: {...formData.features, parking: checked}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Change Room</label>
                    <Switch
                      checked={formData.features?.changeRoom || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        features: {...formData.features, changeRoom: checked}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Washroom</label>
                    <Switch
                      checked={formData.features?.washroom || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        features: {...formData.features, washroom: checked}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Cafeteria</label>
                    <Switch
                      checked={formData.features?.cafeteria || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        features: {...formData.features, cafeteria: checked}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Equipment</label>
                    <Switch
                      checked={formData.features?.equipment || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData, 
                        features: {...formData.features, equipment: checked}
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Owner Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Owner Name *
                    </label>
                    <Input
                      value={formData.owner?.name || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        owner: {...formData.owner, name: e.target.value}
                      })}
                      placeholder="Enter owner name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Owner Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.owner?.email || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        owner: {...formData.owner, email: e.target.value}
                      })}
                      placeholder="Enter owner email"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Owner Contact *
                    </label>
                    <Input
                      value={formData.owner?.contact || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        owner: {...formData.owner, contact: e.target.value}
                      })}
                      placeholder="Enter contact number"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Owner Password *
                    </label>
                    <Input
                      type="password"
                      value={formData.owner?.password || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        owner: {...formData.owner, password: e.target.value}
                      })}
                      placeholder="Enter owner password"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Rating and Reviews */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rating & Reviews</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Average Rating (0-5) *
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating?.average || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        rating: {...formData.rating, average: parseFloat(e.target.value) || 0}
                      })}
                      placeholder="e.g., 4.2"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Rating out of 5 stars</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Number of Reviews *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.rating?.count || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        rating: {...formData.rating, count: parseInt(e.target.value) || 0}
                      })}
                      placeholder="e.g., 25"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Total number of reviews</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {editingGround ? 'Update Ground' : 'Add Ground'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ground Management</h1>
          <p className="text-gray-600 mt-1">Manage cricket grounds and facilities</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadGrounds} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Ground
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Grounds</p>
                <p className="text-3xl font-bold text-blue-600">{grounds.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Grounds</p>
                <p className="text-3xl font-bold text-green-600">
                  {grounds.filter(g => g.status === 'active').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Average Rating</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {grounds.length > 0 
                    ? (grounds.reduce((sum, g) => sum + (g.rating?.average || 0), 0) / grounds.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grounds List */}
      <Card>
        <CardHeader>
          <CardTitle>All Grounds ({grounds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : grounds.length > 0 ? (
            <div className="space-y-4">
              {grounds.map((ground) => (
                <div key={ground._id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{ground.name}</h3>
                        {getStatusBadge(ground.status)}
                        {ground.rating && ground.rating.average > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">
                              {ground.rating.average.toFixed(1)} ({ground.rating.count})
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {ground.location?.cityName}, {ground.location?.state}
                          </span>
                          <span>Capacity: {ground.features?.capacity} players</span>
                        </div>
                        <div>Price: {formatPrice(ground)}</div>
                        <div>Owner: {ground.owner?.name} ({ground.owner?.contact})</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(ground)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(ground._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No grounds found</h3>
              <p className="text-gray-600 mb-4">Start by adding your first cricket ground.</p>
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add First Ground
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
