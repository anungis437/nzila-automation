"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  MessageSquare,
  Bell,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  UserX,
  Calendar,
  Download,
  BarChart3,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";

// Types
type CommunicationChannel = "email" | "sms" | "push" | "all";
type TimeGranularity = "daily" | "weekly" | "monthly";

interface ChannelMetrics {
  channel: CommunicationChannel;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalOptedOut: number;
  deliveryRate: number;
  openRate: number;
  clickThroughRate: number;
  optOutRate: number;
}

interface SegmentMetrics {
  segmentName: string;
  memberCount: number;
  totalSent: number;
  openRate: number;
  clickThroughRate: number;
  engagementScore: number;
}

interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  channel: CommunicationChannel;
  sentDate: string;
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickThroughRate: number;
  optOutRate: number;
}

interface TimeSeriesDataPoint {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

interface BestTimeToSend {
  dayOfWeek: string;
  hour: number;
  openRate: number;
}

// Sample data
const CHANNEL_METRICS: ChannelMetrics[] = [
  {
    channel: "email",
    totalSent: 15420,
    totalDelivered: 15180,
    totalOpened: 9870,
    totalClicked: 2450,
    totalOptedOut: 42,
    deliveryRate: 98.4,
    openRate: 65.0,
    clickThroughRate: 24.8,
    optOutRate: 0.27,
  },
  {
    channel: "sms",
    totalSent: 8920,
    totalDelivered: 8850,
    totalOpened: 7540,
    totalClicked: 1820,
    totalOptedOut: 28,
    deliveryRate: 99.2,
    openRate: 85.2,
    clickThroughRate: 24.1,
    optOutRate: 0.31,
  },
  {
    channel: "push",
    totalSent: 12340,
    totalDelivered: 11980,
    totalOpened: 5890,
    totalClicked: 1180,
    totalOptedOut: 156,
    deliveryRate: 97.1,
    openRate: 49.2,
    clickThroughRate: 20.0,
    optOutRate: 1.30,
  },
];

const SEGMENT_METRICS: SegmentMetrics[] = [
  { segmentName: "Active Members", memberCount: 2840, totalSent: 12650, openRate: 78.5, clickThroughRate: 32.4, engagementScore: 88 },
  { segmentName: "New Members", memberCount: 420, totalSent: 1890, openRate: 72.3, clickThroughRate: 28.1, engagementScore: 76 },
  { segmentName: "Stewards", memberCount: 156, totalSent: 890, openRate: 85.2, clickThroughRate: 41.5, engagementScore: 94 },
  { segmentName: "At-Risk", memberCount: 380, totalSent: 1250, openRate: 42.8, clickThroughRate: 12.3, engagementScore: 38 },
  { segmentName: "Office Staff", memberCount: 520, totalSent: 2340, openRate: 68.9, clickThroughRate: 25.7, engagementScore: 72 },
  { segmentName: "Field Workers", memberCount: 1840, totalSent: 8450, openRate: 62.4, clickThroughRate: 22.8, engagementScore: 68 },
];

const CAMPAIGN_METRICS: CampaignMetrics[] = [
  {
    campaignId: "1",
    campaignName: "Contract Ratification Vote Reminder",
    channel: "email",
    sentDate: "2025-12-01",
    totalSent: 2840,
    deliveryRate: 98.9,
    openRate: 82.5,
    clickThroughRate: 45.2,
    optOutRate: 0.14,
  },
  {
    campaignId: "2",
    campaignName: "Holiday Safety Training",
    channel: "sms",
    sentDate: "2025-11-28",
    totalSent: 1920,
    deliveryRate: 99.5,
    openRate: 88.4,
    clickThroughRate: 31.8,
    optOutRate: 0.21,
  },
  {
    campaignId: "3",
    campaignName: "Dues Payment Reminder",
    channel: "push",
    sentDate: "2025-11-25",
    totalSent: 3240,
    deliveryRate: 96.8,
    openRate: 52.3,
    clickThroughRate: 18.9,
    optOutRate: 1.52,
  },
  {
    campaignId: "4",
    campaignName: "Monthly Newsletter",
    channel: "email",
    sentDate: "2025-11-20",
    totalSent: 4120,
    deliveryRate: 98.2,
    openRate: 68.7,
    clickThroughRate: 24.5,
    optOutRate: 0.29,
  },
  {
    campaignId: "5",
    campaignName: "Grievance Workshop Invitation",
    channel: "email",
    sentDate: "2025-11-15",
    totalSent: 1560,
    deliveryRate: 99.1,
    openRate: 75.3,
    clickThroughRate: 38.6,
    optOutRate: 0.19,
  },
];

const TIME_SERIES_DATA: TimeSeriesDataPoint[] = [
  { date: "Nov 1", sent: 1240, delivered: 1220, opened: 780, clicked: 195 },
  { date: "Nov 8", sent: 1580, delivered: 1550, opened: 1020, clicked: 255 },
  { date: "Nov 15", sent: 1820, delivered: 1790, opened: 1180, clicked: 295 },
  { date: "Nov 22", sent: 1340, delivered: 1310, opened: 850, clicked: 210 },
  { date: "Nov 29", sent: 1690, delivered: 1660, opened: 1090, clicked: 270 },
  { date: "Dec 6", sent: 1450, delivered: 1420, opened: 920, clicked: 230 },
];

const DEVICE_BREAKDOWN: DeviceBreakdown = {
  desktop: 42.5,
  mobile: 48.8,
  tablet: 8.7,
};

const BEST_TIME_TO_SEND: BestTimeToSend[] = [
  { dayOfWeek: "Monday", hour: 9, openRate: 72.5 },
  { dayOfWeek: "Tuesday", hour: 10, openRate: 75.8 },
  { dayOfWeek: "Wednesday", hour: 14, openRate: 68.9 },
  { dayOfWeek: "Thursday", hour: 9, openRate: 71.2 },
  { dayOfWeek: "Friday", hour: 11, openRate: 65.4 },
];

export default function CommunicationAnalyticsDashboard() {
  const [activeChannel, setActiveChannel] = useState<CommunicationChannel>("all");
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>("weekly");
  const [dateRange, setDateRange] = useState("last_30_days");

  // Calculate overall metrics
  const overallMetrics = CHANNEL_METRICS.reduce(
    (acc, channel) => ({
      totalSent: acc.totalSent + channel.totalSent,
      totalDelivered: acc.totalDelivered + channel.totalDelivered,
      totalOpened: acc.totalOpened + channel.totalOpened,
      totalClicked: acc.totalClicked + channel.totalClicked,
      totalOptedOut: acc.totalOptedOut + channel.totalOptedOut,
    }),
    { totalSent: 0, totalDelivered: 0, totalOpened: 0, totalClicked: 0, totalOptedOut: 0 }
  );

  const overallDeliveryRate = (overallMetrics.totalDelivered / overallMetrics.totalSent) * 100;
  const overallOpenRate = (overallMetrics.totalOpened / overallMetrics.totalDelivered) * 100;
  const overallClickThroughRate = (overallMetrics.totalClicked / overallMetrics.totalOpened) * 100;
  const overallOptOutRate = (overallMetrics.totalOptedOut / overallMetrics.totalSent) * 100;

  // Get channel icon
  const getChannelIcon = (channel: CommunicationChannel) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "push":
        return <Bell className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  // Get channel color
  const getChannelColor = (channel: CommunicationChannel) => {
    switch (channel) {
      case "email":
        return "bg-blue-500";
      case "sms":
        return "bg-green-500";
      case "push":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get device icon
  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "desktop":
        return <Monitor className="h-5 w-5" />;
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance across email, SMS, and push notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_90_days">Last 90 Days</SelectItem>
              <SelectItem value="last_365_days">Last 365 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">Total Sent</span>
          </div>
          <div className="text-2xl font-bold">{overallMetrics.totalSent.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Across all channels</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Delivery Rate</span>
          </div>
          <div className="text-2xl font-bold">{overallDeliveryRate.toFixed(1)}%</div>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
            <TrendingUp className="h-3 w-3" />
            <span>+1.2% vs last period</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Open Rate</span>
          </div>
          <div className="text-2xl font-bold">{overallOpenRate.toFixed(1)}%</div>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
            <TrendingUp className="h-3 w-3" />
            <span>+3.4% vs last period</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MousePointer className="h-4 w-4" />
            <span className="text-sm">Click-Through Rate</span>
          </div>
          <div className="text-2xl font-bold">{overallClickThroughRate.toFixed(1)}%</div>
          <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
            <TrendingDown className="h-3 w-3" />
            <span>-0.8% vs last period</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <UserX className="h-4 w-4" />
            <span className="text-sm">Opt-Out Rate</span>
          </div>
          <div className="text-2xl font-bold">{overallOptOutRate.toFixed(2)}%</div>
          <div className="text-xs text-muted-foreground mt-1">{overallMetrics.totalOptedOut} members</div>
        </Card>
      </div>

      {/* Channel Comparison Tabs */}
      <Tabs value={activeChannel} onValueChange={(value) => setActiveChannel(value as CommunicationChannel)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Channels</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="push">Push Notifications</TabsTrigger>
        </TabsList>

        {/* All Channels Tab */}
        <TabsContent value="all" className="space-y-6">
          {/* Channel Performance Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Channel Performance Comparison</h3>
            <div className="space-y-4">
              {CHANNEL_METRICS.map((channel) => (
                <div key={channel.channel} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getChannelColor(channel.channel)} text-white`}>
                        {getChannelIcon(channel.channel)}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{channel.channel}</div>
                        <div className="text-sm text-muted-foreground">
                          {channel.totalSent.toLocaleString()} sent
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <div className="text-muted-foreground">Delivery</div>
                        <div className="font-semibold">{channel.deliveryRate.toFixed(1)}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Open</div>
                        <div className="font-semibold">{channel.openRate.toFixed(1)}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Click</div>
                        <div className="font-semibold">{channel.clickThroughRate.toFixed(1)}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Opt-Out</div>
                        <div className="font-semibold">{channel.optOutRate.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Funnel Visualization */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-6 rounded ${getChannelColor(channel.channel)}`}
                          style={{ width: `${channel.deliveryRate}%` }}
                        />
                        <span className="text-xs text-muted-foreground">Delivered</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-6 rounded ${getChannelColor(channel.channel)} opacity-75`}
                          style={{ width: `${(channel.openRate / 100) * channel.deliveryRate}%` }}
                        />
                        <span className="text-xs text-muted-foreground">Opened</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-6 rounded ${getChannelColor(channel.channel)} opacity-50`}
                          style={{
                            width: `${((channel.clickThroughRate / 100) * (channel.openRate / 100) * channel.deliveryRate)}%`,
                          }}
                        />
                        <span className="text-xs text-muted-foreground">Clicked</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Time Series Trends */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Performance Over Time</h3>
              <Select value={timeGranularity} onValueChange={(value) => setTimeGranularity(value as TimeGranularity)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-6">
              {TIME_SERIES_DATA.map((dataPoint, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{dataPoint.date}</span>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Sent: {dataPoint.sent}</span>
                      <span>Delivered: {dataPoint.delivered}</span>
                      <span>Opened: {dataPoint.opened}</span>
                      <span>Clicked: {dataPoint.clicked}</span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(dataPoint.delivered / dataPoint.sent) * 100}%` }}
                      title={`Delivered: ${((dataPoint.delivered / dataPoint.sent) * 100).toFixed(1)}%`}
                    />
                    <div
                      className="bg-green-500"
                      style={{ width: `${(dataPoint.opened / dataPoint.sent) * 100}%` }}
                      title={`Opened: ${((dataPoint.opened / dataPoint.sent) * 100).toFixed(1)}%`}
                    />
                    <div
                      className="bg-purple-500"
                      style={{ width: `${(dataPoint.clicked / dataPoint.sent) * 100}%` }}
                      title={`Clicked: ${((dataPoint.clicked / dataPoint.sent) * 100).toFixed(1)}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Individual Channel Tabs (simplified for brevity) */}
        {["email", "sms", "push"].map((channel) => {
          const channelData = CHANNEL_METRICS.find((m) => m.channel === channel);
          if (!channelData) return null;

          return (
            <TabsContent key={channel} value={channel} className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Sent</div>
                  <div className="text-2xl font-bold">{channelData.totalSent.toLocaleString()}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Delivery Rate</div>
                  <div className="text-2xl font-bold">{channelData.deliveryRate.toFixed(1)}%</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Open Rate</div>
                  <div className="text-2xl font-bold">{channelData.openRate.toFixed(1)}%</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Click-Through Rate</div>
                  <div className="text-2xl font-bold">{channelData.clickThroughRate.toFixed(1)}%</div>
                </Card>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Segmentation Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance by Member Segment</h3>
        <div className="space-y-3">
          {SEGMENT_METRICS.map((segment) => (
            <div key={segment.segmentName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-medium">{segment.segmentName}</div>
                  <div className="text-sm text-muted-foreground">{segment.memberCount.toLocaleString()} members</div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <div className="text-muted-foreground">Messages</div>
                  <div className="font-semibold">{segment.totalSent.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Open Rate</div>
                  <div className="font-semibold">{segment.openRate.toFixed(1)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Click Rate</div>
                  <div className="font-semibold">{segment.clickThroughRate.toFixed(1)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Engagement</div>
                  <Badge
                    variant={segment.engagementScore >= 80 ? "default" : segment.engagementScore >= 60 ? "secondary" : "destructive"}
                  >
                    {segment.engagementScore}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Campaign Performance Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Campaign</th>
                <th className="pb-3 font-medium">Channel</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Sent</th>
                <th className="pb-3 font-medium text-right">Delivery</th>
                <th className="pb-3 font-medium text-right">Open</th>
                <th className="pb-3 font-medium text-right">Click</th>
                <th className="pb-3 font-medium text-right">Opt-Out</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {CAMPAIGN_METRICS.map((campaign) => (
                <tr key={campaign.campaignId} className="text-sm">
                  <td className="py-3">
                    <div className="font-medium">{campaign.campaignName}</div>
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className="capitalize">
                      {campaign.channel}
                    </Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">{campaign.sentDate}</td>
                  <td className="py-3 text-right">{campaign.totalSent.toLocaleString()}</td>
                  <td className="py-3 text-right">{campaign.deliveryRate.toFixed(1)}%</td>
                  <td className="py-3 text-right font-semibold">{campaign.openRate.toFixed(1)}%</td>
                  <td className="py-3 text-right font-semibold">{campaign.clickThroughRate.toFixed(1)}%</td>
                  <td className="py-3 text-right">
                    <span className={campaign.optOutRate > 1 ? "text-red-600 font-semibold" : ""}>
                      {campaign.optOutRate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Device Breakdown & Best Time to Send */}
      <div className="grid grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Device Breakdown (Email Opens)</h3>
          <div className="space-y-4">
            {Object.entries(DEVICE_BREAKDOWN).map(([device, percentage]) => (
              <div key={device}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device)}
                    <span className="font-medium capitalize">{device}</span>
                  </div>
                  <span className="font-semibold">{percentage.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Best Time to Send */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Best Time to Send</h3>
          <div className="space-y-3">
            {BEST_TIME_TO_SEND.map((timeSlot, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{timeSlot.dayOfWeek}</div>
                    <div className="text-sm text-muted-foreground">
                      {timeSlot.hour}:00 {timeSlot.hour < 12 ? "AM" : "PM"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Avg Open Rate</div>
                  <div className="font-semibold text-green-600">{timeSlot.openRate.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

