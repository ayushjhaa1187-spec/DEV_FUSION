import { redirect } from 'next/navigation';

export default function BillingPlansRoute() {
  // The plans selection is unified in the pricing page
  redirect('/pricing');
}
