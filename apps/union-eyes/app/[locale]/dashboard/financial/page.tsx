import { redirect } from 'next/navigation';

/**
 * Financial Management index — redirects to the Expenses sub-page which is the
 * most common entry-point for leadership users.
 */
export default function FinancialIndexPage({
  params,
}: {
  params: { locale: string };
}) {
  // Redirect to the non-locale expenses page which has the full implementation.
  redirect('/dashboard/financial/expenses');
}
