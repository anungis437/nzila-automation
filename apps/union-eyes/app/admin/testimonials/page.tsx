/**
 * Admin Testimonials Management Page
 * 
 * Approval workflow for organizer testimonials.
 * 
 * Features:
 * - List all testimonials with status filters
 * - Approve/reject workflow
 * - Bulk actions
 * - Featured testimonial selection
 */

import { db } from '@/db';
import { testimonials } from '@/db/schema/domains/marketing';
import { desc, eq } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import TestimonialApprovalActions from '@/components/admin/testimonial-approval-actions';

interface AdminTestimonialsPageProps {
  searchParams: {
    status?: 'pending' | 'approved' | 'rejected';
  };
}

export default async function AdminTestimonialsPage({
  searchParams,
}: AdminTestimonialsPageProps) {
  const { status } = searchParams;

  // Build query
  const query = status
    ? eq(testimonials.status, status)
    : undefined;

  // Fetch testimonials
  const allTestimonials = await db
    .select()
    .from(testimonials)
    .where(query)
    .orderBy(desc(testimonials.submittedAt))
    .limit(100);

  // Calculate statistics
  const stats = {
    total: allTestimonials.length,
    pending: allTestimonials.filter((t) => t.status === 'pending').length,
    approved: allTestimonials.filter((t) => t.status === 'approved').length,
    rejected: allTestimonials.filter((t) => t.status === 'rejected').length,
    featured: allTestimonials.filter((t) => t.isFeatured).length,
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Testimonials Management</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve organizer testimonials for the marketing site
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending Review" value={stats.pending} variant="warning" />
        <StatCard label="Approved" value={stats.approved} variant="success" />
        <StatCard label="Rejected" value={stats.rejected} variant="secondary" />
        <StatCard label="Featured" value={stats.featured} variant="primary" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Testimonials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select defaultValue={status || 'all'}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Testimonials ({allTestimonials.length})</CardTitle>
          <CardDescription>
            Review submissions and approve for public display
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitter</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTestimonials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No testimonials found with this filter
                  </TableCell>
                </TableRow>
              )}
              {allTestimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell className="font-medium">
                    {testimonial.submitterName}
                  </TableCell>
                  <TableCell>{testimonial.organizationName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{testimonial.role}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm line-clamp-2">{testimonial.quote}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        testimonial.status === 'approved'
                          ? 'default'
                          : testimonial.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {testimonial.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {testimonial.isFeatured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(testimonial.submittedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <TestimonialApprovalActions testimonial={testimonial} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'warning' | 'secondary' | 'primary';
}) {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    secondary: 'bg-gray-50 border-gray-200',
    primary: 'bg-blue-50 border-blue-200',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
