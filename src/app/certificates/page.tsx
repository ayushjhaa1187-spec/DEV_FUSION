import { redirect } from 'next/navigation';

export default function CertificatesRootRoute() {
  // Public certificate search and verification is on the /verify route
  redirect('/verify');
}
