import { cookies } from 'next/headers';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const isAuthenticated = !!cookies().get('auth_token')?.value;
  return <Navbar isAuthenticated={isAuthenticated} />;
}
