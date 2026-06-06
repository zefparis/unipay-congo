const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!ADMIN_SECRET) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-400">
          Administration non configurée — ajoutez <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">ADMIN_SECRET</code> dans vos variables d&apos;environnement.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
