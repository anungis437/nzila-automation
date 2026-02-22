/**
 * DeadlinesList Component
 * 
 * Displays a filterable table of deadlines with actions
 * - Traffic light status indicators
 * - Sortable columns
 * - Filter by status, priority, date range
 * - Complete and extend actions
 */

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Deadline {
  id: string;
  claimId: string;
  claimNumber?: string;
  deadlineName: string;
  deadlineType: string;
  currentDeadline: string;
  status: 'pending' | 'completed' | 'missed' | 'extended' | 'waived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isOverdue: boolean;
  daysUntilDue?: number;
  daysOverdue: number;
  extensionCount: number;
  completedAt?: string;
  completedBy?: string;
}

interface DeadlinesListProps {
  deadlines: Deadline[];
  loading?: boolean;
  onComplete?: (deadlineId: string) => void;
  onExtend?: (deadlineId: string) => void;
  onViewClaim?: (claimNumber: string) => void;
}

type SortKey = 'currentDeadline' | 'priority' | 'status' | 'deadlineName';
type SortDirection = 'asc' | 'desc';

export function DeadlinesList({
  deadlines,
  loading = false,
  onComplete,
  onExtend,
  onViewClaim,
}: DeadlinesListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('currentDeadline');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Get traffic light status
  const getDeadlineStatus = (deadline: Deadline) => {
    if (deadline.status !== 'pending') {
      return { color: 'green', label: 'Completed', severity: 'safe' };
    }
    if (deadline.isOverdue) {
      return { 
        color: 'black', 
        label: `${deadline.daysOverdue} days overdue`, 
        severity: 'overdue' 
      };
    }
    const daysUntil = deadline.daysUntilDue || 0;
    if (daysUntil === 0) {
      return { color: 'red', label: 'Due today', severity: 'urgent' };
    }
    if (daysUntil <= 1) {
      return { color: 'red', label: 'Due tomorrow', severity: 'urgent' };
    }
    if (daysUntil <= 3) {
      return { color: 'yellow', label: `Due in ${daysUntil} days`, severity: 'warning' };
    }
    return { color: 'green', label: `Due in ${daysUntil} days`, severity: 'safe' };
  };

  // Filter and sort deadlines
  const filteredDeadlines = useMemo(() => {
    let filtered = [...deadlines];

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        filtered = filtered.filter(d => d.isOverdue);
      } else if (statusFilter === 'due-soon') {
        filtered = filtered.filter(d => !d.isOverdue && (d.daysUntilDue || 0) <= 3);
      } else {
        filtered = filtered.filter(d => d.status === statusFilter);
      }
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(d => d.priority === priorityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortKey) {
        case 'currentDeadline':
          comparison = new Date(a.currentDeadline).getTime() - new Date(b.currentDeadline).getTime();
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'deadlineName':
          comparison = a.deadlineName.localeCompare(b.deadlineName);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [deadlines, statusFilter, priorityFilter, sortKey, sortDirection]);

  // Handle sort
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Get status badge
  const getStatusBadge = (deadline: Deadline) => {
    const status = getDeadlineStatus(deadline);
    const colorClasses: Record<string, string> = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      black: 'bg-gray-900 text-white border-gray-900',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[status.color]}`}>
        <span className={`w-2 h-2 rounded-full mr-1.5 ${status.color === 'green' ? 'bg-green-500' : status.color === 'yellow' ? 'bg-yellow-500' : status.color === 'red' ? 'bg-red-500' : 'bg-gray-900'}`} />
        {status.label}
      </span>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const colorClasses = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[priority as keyof typeof colorClasses]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="overdue">Overdue</option>
              <option value="due-soon">Due Soon (≤ 3 days)</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="extended">Extended</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <span>
            Showing <strong className="text-gray-900">{filteredDeadlines.length}</strong> of <strong className="text-gray-900">{deadlines.length}</strong> deadlines
          </span>
          <span className="flex items-center gap-1">
            <XCircleIcon className="h-4 w-4 text-red-600" />
            <strong className="text-red-600">{deadlines.filter(d => d.isOverdue).length}</strong> overdue
          </span>
          <span className="flex items-center gap-1">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
            <strong className="text-yellow-600">{deadlines.filter(d => !d.isOverdue && (d.daysUntilDue || 0) <= 3 && d.status === 'pending').length}</strong> due soon
          </span>
          <span className="flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <strong className="text-green-600">{deadlines.filter(d => d.status === 'completed').length}</strong> completed
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('deadlineName')}
                >
                  <div className="flex items-center gap-1">
                    Deadline
                    {sortKey === 'deadlineName' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('currentDeadline')}
                >
                  <div className="flex items-center gap-1">
                    Due Date
                    {sortKey === 'currentDeadline' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortKey === 'status' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-1">
                    Priority
                    {sortKey === 'priority' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extensions
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeadlines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="font-medium">No deadlines found</p>
                    <p className="mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredDeadlines.map((deadline) => (
                  <tr key={deadline.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {deadline.deadlineName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {deadline.deadlineType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {deadline.claimNumber && onViewClaim ? (
                        <button
                          onClick={() => onViewClaim(deadline.claimNumber!)}
                          className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {deadline.claimNumber}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {deadline.claimNumber || 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(deadline.currentDeadline), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(deadline.currentDeadline), 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(deadline)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(deadline.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deadline.extensionCount > 0 ? (
                        <span className="text-orange-600 font-medium">
                          {deadline.extensionCount}x
                        </span>
                      ) : (
                        <span>None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {deadline.status === 'pending' && onComplete && (
                          <button
                            onClick={() => onComplete(deadline.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as complete"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        {deadline.status === 'pending' && onExtend && (
                          <button
                            onClick={() => onExtend(deadline.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Request extension"
                          >
                            <ClockIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

