import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useApi } from '@/hooks/useApi';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  ArrowLeft,
  Save,
  X,
  Globe
} from 'lucide-react';

interface Location {
  _id?: string;
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  popular: boolean;
}

export default function AdminLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<Partial<Location>>({});
  const { get, post, put, delete: del } = useApi();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const response = await get('/admin/locations');
      if (response.success) {
        setLocations(response.data.locations || []);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingLocation) {
        response = await put(`/admin/locations/${editingLocation.id}`, formData);
      } else {
        response = await post('/admin/locations', formData);
      }

      if (response.success) {
        loadLocations();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData(location);
    setShowForm(true);
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    try {
      const response = await del(`/admin/locations/${locationId}`);
      if (response.success) {
        loadLocations();
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingLocation(null);
    setFormData({
      id: '',
      name: '',
      state: '',
      latitude: 0,
      longitude: 0,
      popular: false
    });
  };

  if (showForm) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={resetForm}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Locations
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {editingLocation ? 'Edit Location' : 'Add New Location'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
            <CardDescription>
              Fill in the details for the city/location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Location ID *
                  </label>
                  <Input
                    value={formData.id || ''}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    placeholder="e.g., mumbai, delhi"
                    required
                    disabled={!!editingLocation}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unique identifier (lowercase, no spaces)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Location Name *
                  </label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Mumbai, Delhi"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    State *
                  </label>
                  <Input
                    value={formData.state || ''}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    placeholder="e.g., Maharashtra, Delhi"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.popular || false}
                    onCheckedChange={(checked) => setFormData({...formData, popular: checked})}
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Popular Location
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Latitude *
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value) || 0})}
                    placeholder="e.g., 19.076"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Longitude *
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value) || 0})}
                    placeholder="e.g., 72.8777"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {editingLocation ? 'Update Location' : 'Add Location'}
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
          <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
          <p className="text-gray-600 mt-1">Manage cities and locations for cricket grounds</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadLocations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Locations</p>
                <p className="text-3xl font-bold text-blue-600">{locations.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Popular Locations</p>
                <p className="text-3xl font-bold text-green-600">
                  {locations.filter(l => l.popular).length}
                </p>
              </div>
              <Globe className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">States Covered</p>
                <p className="text-3xl font-bold text-purple-600">
                  {new Set(locations.map(l => l.state)).size}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Locations ({locations.length})</CardTitle>
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
          ) : locations.length > 0 ? (
            <div className="space-y-4">
              {locations.map((location) => (
                <div key={location.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{location.name}</h3>
                        {location.popular && (
                          <Badge className="bg-yellow-100 text-yellow-800">Popular</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span>ID: {location.id}</span>
                          <span>State: {location.state}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>Latitude: {location.latitude}</span>
                          <span>Longitude: {location.longitude}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(location)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(location.id)}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations found</h3>
              <p className="text-gray-600 mb-4">Start by adding your first location.</p>
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add First Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
