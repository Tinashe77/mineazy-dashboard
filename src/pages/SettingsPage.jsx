import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Button, Card, Input, Alert } from '../components/ui';
import { Server, Settings, Trash2, HeartPulse } from 'lucide-react';
import api from '../services/api';

const SettingsCard = ({ title, icon, children }) => (
  <Card>
    <div className="p-6">
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  </Card>
);

const ConfigItem = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm text-gray-800">{String(value)}</span>
  </div>
);

export const SettingsPage = () => {
  const [config, setConfig] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [configRes, healthRes] = await Promise.all([
          api.getSystemConfig(),
          api.getSystemHealth(),
        ]);
        setConfig(configRes.config);
        setHealth(healthRes.health);

        // Initialize form with updatable business config
        if (configRes.config && configRes.config.business) {
          setFormData(configRes.config.business);
        }

      } catch (err) {
        setError(err.message || 'Failed to load system data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleUpdateConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await api.updateSystemConfig(formData);
      setSuccess('Configuration updated successfully!');
      // Refresh config after update
      const configRes = await api.getSystemConfig();
      setConfig(configRes.config);
    } catch (err) {
      setError(err.message || 'Failed to update configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to clear the system cache?')) {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        await api.clearCache();
        setSuccess('System cache cleared successfully!');
      } catch (err) {
        setError(err.message || 'Failed to clear cache.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Configure system parameters and monitor application health"
      />

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>}

      {loading && !config ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Column 1: System Config & Maintenance */}
          <div className="lg:col-span-2 space-y-6">
            <SettingsCard title="Business Configuration" icon={<Settings className="h-6 w-6 mr-3 text-primary-600" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Tax Rate (%)" name="taxRate" type="number" value={formData.taxRate || ''} onChange={handleInputChange} />
                <Input label="Free Shipping Threshold" name="freeShippingThreshold" type="number" value={formData.freeShippingThreshold || ''} onChange={handleInputChange} />
                <Input label="Default Shipping Cost" name="defaultShippingCost" type="number" value={formData.defaultShippingCost || ''} onChange={handleInputChange} />
                <Input label="Default Currency" name="defaultCurrency" value={formData.defaultCurrency || ''} onChange={handleInputChange} />
                <Input label="Secondary Currency" name="secondaryCurrency" value={formData.secondaryCurrency || ''} onChange={handleInputChange} />
                <Input label="USD to ZWG Rate" name="usdToZwgRate" type="number" value={formData.usdToZwgRate || ''} onChange={handleInputChange} />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleUpdateConfig} disabled={loading}>{loading ? 'Saving...' : 'Save Configuration'}</Button>
              </div>
            </SettingsCard>

            <SettingsCard title="System Maintenance" icon={<Trash2 className="h-6 w-6 mr-3 text-primary-600" />}>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Clear the application's internal cache.</p>
                <Button variant="destructive" onClick={handleClearCache} disabled={loading}>{loading ? 'Clearing...' : 'Clear Cache'}</Button>
              </div>
            </SettingsCard>
          </div>

          {/* Column 2: System Health */}
          <div className="space-y-6">
            <SettingsCard title="System Health" icon={<HeartPulse className="h-6 w-6 mr-3 text-primary-600" />}>
              {health ? (
                <>
                  <ConfigItem label="Status" value={health.status} />
                  <ConfigItem label="Uptime (sec)" value={health.uptime?.toFixed(2)} />
                  <ConfigItem label="Node.js Version" value={health.nodeVersion} />
                  <ConfigItem label="Platform" value={health.platform} />
                  <ConfigItem label="Memory Usage" value={`${(health.memory?.rss / 1024 / 1024).toFixed(2)} MB`} />
                  <ConfigItem label="MongoDB Status" value={health.database?.mongodb} />
                  <ConfigItem label="Redis Status" value={health.database?.redis} />
                </>
              ) : <p>Health data not available.</p>}
            </SettingsCard>

            <SettingsCard title="Server Environment" icon={<Server className="h-6 w-6 mr-3 text-primary-600" />}>
              {config ? (
                <>
                  <ConfigItem label="Environment" value={config.environment} />
                  <ConfigItem label="Port" value={config.port} />
                  <ConfigItem label="CORS Origin" value={config.security?.corsOrigin} />
                  <ConfigItem label="JWT Expires In" value={config.security?.jwtExpiresIn} />
                  <ConfigItem label="Max File Size" value={`${config.limits?.maxFileSize / 1024 / 1024} MB`} />
                </>
              ) : <p>Configuration data not available.</p>}
            </SettingsCard>
          </div>

        </div>
      )}
    </div>
  );
};