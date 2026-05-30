import { redirect } from 'next/navigation';

// The middleware handles all routing logic.
// This root page just redirects to /login as a fallback.
export default function RootPage() {
  redirect('/login');
}
