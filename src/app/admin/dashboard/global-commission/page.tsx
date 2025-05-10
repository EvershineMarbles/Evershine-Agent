import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminLayout from '../../../components/layouts/AdminLayout';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import Loader from '../../../components/ui/Loader';

const GlobalCommissionSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    globalCommissionRate: null,
    overrideAgentCommissions: false,
    isActive: false
  });

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/settings/commission');
        setSettings(response.data.data);
      } catch (error) {
        console.error('Error fetching commission settings:', error);
        toast.error('Failed to load commission settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await axios.put('/api/admin/settings/commission', {
        globalCommissionRate: settings.globalCommissionRate,
        overrideAgentCommissions: settings.overrideAgentCommissions
      });
      
      setSettings(response.data.data);
      toast.success('Commission settings updated successfully');
      
      // Show feedback about affected agents
      if (response.data.data.updatedAgentsCount > 0) {
        toast.info(`Updated commission rate for ${response.data.data.updatedAgentsCount} agents`);
      }
    } catch (error) {
      console.error('Error updating commission settings:', error);
      toast.error('Failed to update commission settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value === '' ? null : Number(value)
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Global Commission Settings</h1>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <h2 className="text-xl font-semibold">Standard Commission Rate</h2>
            <p className="text-gray-600 text-sm mt-1">
              Set a standard commission rate for all agents. This can override individual agent commission rates.
            </p>
          </CardHeader>
          
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="globalCommissionRate">
                  Global Commission Rate (%)
                </label>
                <input
                  type="number"
                  id="globalCommissionRate"
                  name="globalCommissionRate"
                  value={settings.globalCommissionRate === null ? '' : settings.globalCommissionRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter commission rate (e.g., 10)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to disable global commission rate
                </p>
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="overrideAgentCommissions"
                    checked={settings.overrideAgentCommissions}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span>Override individual agent commission rates</span>
                </label>
                <p className="text-sm text-gray-500 mt-1 ml-6">
                  When enabled, this will apply the global rate to all agents, ignoring their individual rates
                </p>
              </div>
              
              <div className="bg-gray-100 p-4 rounded mb-4">
                <h3 className="font-medium mb-2">Current Status</h3>
                <p>
                  {settings.isActive 
                    ? '✅ Global commission rate is active and overriding individual agent rates' 
                    : '❌ Global commission rate is not active'}
                </p>
                {settings.globalCommissionRate !== null && (
                  <p className="mt-1">Current global rate: {settings.globalCommissionRate}%</p>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </CardBody>
          
          <CardFooter className="bg-gray-50 text-sm text-gray-600">
            <p>
              Note: When you enable the global commission rate override, it will update all agents' commission rates immediately.
            </p>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default GlobalCommissionSettings;