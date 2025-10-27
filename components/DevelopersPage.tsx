import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, ClockIcon, XIcon } from 'lucide-react';
import { CheckIcon } from './Icons';

interface UpdateItem {
  id: string;
  type: 'maintenance' | 'incident';
  status: 'completed' | 'resolved' | 'scheduled';
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  affectedServices: string[];
  impact: string;
}

const DevelopersPage: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UpdateItem>>({
    type: 'maintenance',
    status: 'scheduled',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    affectedServices: [],
    impact: ''
  });

  // Load updates from localStorage or API
  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const response = await fetch('/api/updates');
        if (response.ok) {
          const data = await response.json();
          setUpdates(data.updates || []);
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem('systemUpdates');
          if (stored) {
            setUpdates(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.error('Failed to load updates:', error);
        const stored = localStorage.getItem('systemUpdates');
        if (stored) {
          setUpdates(JSON.parse(stored));
        }
      }
    };
    loadUpdates();
  }, []);

  // Save updates to localStorage and API
  const saveUpdates = async (newUpdates: UpdateItem[]) => {
    setUpdates(newUpdates);
    localStorage.setItem('systemUpdates', JSON.stringify(newUpdates));

    // Try to save to API
    try {
      await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: newUpdates })
      });
    } catch (error) {
      console.error('Failed to save to API:', error);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      type: 'maintenance',
      status: 'scheduled',
      title: '',
      description: '',
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1 hour later
      affectedServices: [],
      impact: ''
    });
  };

  const handleEdit = (update: UpdateItem) => {
    setIsAdding(true);
    setEditingId(update.id);
    setFormData({ ...update });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this update?')) {
      const newUpdates = updates.filter(u => u.id !== id);
      await saveUpdates(newUpdates);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const update: UpdateItem = {
      id: editingId || Date.now().toString(),
      type: formData.type!,
      status: formData.status!,
      title: formData.title!,
      description: formData.description!,
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      affectedServices: formData.affectedServices || [],
      impact: formData.impact!
    };

    let newUpdates;
    if (editingId) {
      newUpdates = updates.map(u => u.id === editingId ? update : u);
    } else {
      newUpdates = [...updates, update];
    }

    await saveUpdates(newUpdates);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ArrowLeftIcon
        className="w-6 h-6 cursor-pointer hover:text-brand-accent transition-colors mb-4"
        onClick={() => onNavigate('/status')}
      />

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Developer Panel</h1>
            <p className="text-gray-600">Manage system updates and maintenance notifications</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Update
          </button>
        </div>

        {isAdding && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Update' : 'Add New Update'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'maintenance' | 'incident' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="incident">Incident</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'completed' | 'resolved' | 'scheduled' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affected Services (comma-separated)</label>
                <input
                  type="text"
                  value={formData.affectedServices?.join(', ')}
                  onChange={(e) => setFormData({ ...formData, affectedServices: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="e.g., API, Database, Web App"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
                <select
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Impact</option>
                  <option value="none">None</option>
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'} Update
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Current Updates</h2>
            <p className="text-gray-600 mt-1">Manage existing system updates</p>
          </div>

          <div className="p-6">
            {updates.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Updates</h3>
                <p className="text-gray-600">Add your first system update to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {update.type === 'maintenance' ? (
                          <ClockIcon className="w-5 h-5 text-blue-500 mt-1" />
                        ) : (
                          <XIcon className="w-5 h-5 text-red-500 mt-1" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{update.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              update.status === 'completed' ? 'bg-green-100 text-green-800' :
                              update.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{update.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Affected: {update.affectedServices.join(', ')}</span>
                            <span>Impact: {update.impact}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span>Started: {new Date(update.startTime).toLocaleString()}</span>
                            <span>Ended: {new Date(update.endTime).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(update)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(update.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevelopersPage;
