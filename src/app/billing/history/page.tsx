import { redirect } from 'next/navigation';

export default function BillingHistoryRoute() {
  // Billing history is consolidated in the unified dashboard/billing page
  redirect('/dashboard/billing');
}
