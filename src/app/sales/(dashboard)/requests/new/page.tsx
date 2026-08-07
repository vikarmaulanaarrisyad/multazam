import React from 'react';
import { Metadata } from 'next';
import { PreOrderClient } from './_components/pre-order-client';

export const metadata: Metadata = {
  title: 'New Pre-Order Request',
};

export default function NewPreOrderPage() {
  return (
    <div className="flex flex-col w-full h-full">
      <PreOrderClient />
    </div>
  );
}
