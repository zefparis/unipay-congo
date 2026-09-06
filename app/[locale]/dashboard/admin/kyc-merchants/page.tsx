import { redirect } from 'next/navigation';

export default function KycMerchantsRedirect() {
  redirect('/dashboard/admin/merchants/kyc');
}
