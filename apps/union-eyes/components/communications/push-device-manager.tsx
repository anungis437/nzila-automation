'use client';

/**
 * Push Device Manager
 * 
 * Component for managing user devices registered for push notifications.
 * Allows admins to view, filter, and manage FCM device registrations.
 * 
 * Features:
 * - View all registered devices
 * - Filter by platform (iOS/Android), status, last active
 * - View device details (platform, app version, last seen)
 * - Remove stale/invalid devices
 * - Export device lists
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Smartphone, 
  Apple, 
  Download, 
  MoreVertical, 
  Search, 
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Device {
  id: string;
  userId: string;
  userName: string;
  fcmToken: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  isActive: boolean;
  lastActiveAt: Date;
  createdAt: Date;
}

interface PushDeviceManagerProps {
  devices?: Device[];
  onRemoveDevice?: (deviceId: string) => Promise<void>;
  onRemoveMultiple?: (deviceIds: string[]) => Promise<void>;
  onExport?: () => void;
}

// Mock data for development
const mockDevices: Device[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'John Doe',
    fcmToken: 'fcm_token_abc123...',
    platform: 'ios',
    appVersion: '2.3.1',
    osVersion: 'iOS 17.2',
    deviceModel: 'iPhone 14 Pro',
    isActive: true,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Jane Smith',
    fcmToken: 'fcm_token_def456...',
    platform: 'android',
    appVersion: '2.3.0',
    osVersion: 'Android 14',
    deviceModel: 'Samsung Galaxy S23',
    isActive: true,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Bob Johnson',
    fcmToken: 'fcm_token_ghi789...',
    platform: 'ios',
    appVersion: '2.2.5',
    osVersion: 'iOS 16.5',
    deviceModel: 'iPhone 13',
    isActive: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45), // 45 days ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180), // 180 days ago
  },
];

export function PushDeviceManager({
  devices = mockDevices,
  onRemoveDevice,
  onRemoveMultiple,
  onExport,
}: PushDeviceManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    const matchesSearch = 
      device.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.fcmToken.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform = 
      platformFilter === 'all' || device.platform === platformFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && device.isActive) ||
      (statusFilter === 'inactive' && !device.isActive);

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedDevices.size === filteredDevices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(filteredDevices.map(d => d.id)));
    }
  };

  const handleSelectDevice = (deviceId: string) => {
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
    } else {
      newSelected.add(deviceId);
    }
    setSelectedDevices(newSelected);
  };

  const handleRemoveSelected = async () => {
    if (onRemoveMultiple && selectedDevices.size > 0) {
      await onRemoveMultiple(Array.from(selectedDevices));
      setSelectedDevices(new Set());
    }
  };

  const getPlatformIcon = (platform: Device['platform']) => {
    switch (platform) {
      case 'ios':
        return <Apple className="h-4 w-4" />;
      case 'android':
        return <Smartphone className="h-4 w-4" />;
      case 'web':
        return <Smartphone className="h-4 w-4" />;
    }
  };

  const stats = {
    total: devices.length,
    active: devices.filter(d => d.isActive).length,
    ios: devices.filter(d => d.platform === 'ios').length,
    android: devices.filter(d => d.platform === 'android').length,
    web: devices.filter(d => d.platform === 'web').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">iOS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Apple className="h-5 w-5" />
              <div className="text-2xl font-bold">{stats.ios}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Android</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <div className="text-2xl font-bold">{stats.android}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Web</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.web}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registered Devices</CardTitle>
              <CardDescription>
                Manage FCM device registrations for push notifications
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedDevices.size > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleRemoveSelected}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove ({selectedDevices.size})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="android">Android</SelectItem>
                <SelectItem value="web">Web</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDevices.size === filteredDevices.length && filteredDevices.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No devices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDevices.has(device.id)}
                          onCheckedChange={() => handleSelectDevice(device.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{device.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {device.fcmToken.substring(0, 20)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(device.platform)}
                          <span className="capitalize">{device.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{device.deviceModel}</div>
                        <div className="text-xs text-muted-foreground">{device.osVersion}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{device.appVersion}</Badge>
                      </TableCell>
                      <TableCell>
                        {device.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(device.lastActiveAt, { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onRemoveDevice?.(device.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Device
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

