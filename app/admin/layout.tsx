import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — Bali Showmatch Shuffle',
  description: 'Team shuffle system for Resolut1on Showmatch',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070710] text-white">
      {children}
    </div>
  );
}
