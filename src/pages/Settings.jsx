import React from "react";

function Settings() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-gray-600">
          Configure dashboard preferences and system settings
        </p>
      </div>
      <div class="chart-container p-6 rounded-xl shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          System Information
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Version</span>
            <span class="text-sm font-medium">v2.1.0</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Last Update</span>
            <span class="text-sm font-medium">Sep 20, 2025</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Database Status</span>
            <span class="text-sm font-medium text-green-600">Connected</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">API Status</span>
            <span class="text-sm font-medium text-green-600">Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
