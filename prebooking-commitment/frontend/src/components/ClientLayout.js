'use client';

import { Toaster } from 'react-hot-toast';

export default function ClientLayout({ children }) {
  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  );
}
