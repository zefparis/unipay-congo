'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export default function NavbarLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <Link href="/" className="flex items-center flex-shrink-0">
      <Image
        src={mounted && resolvedTheme === 'dark' ? '/logodark.png' : '/logo.png'}
        alt="UniPay Congo"
        height={40}
        width={120}
        priority
      />
    </Link>
  );
}
