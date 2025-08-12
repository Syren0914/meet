'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { isVideoCodec } from '@/lib/types';

const PageClientImpl = dynamic(() => import('./PageClientImpl').then(mod => ({ default: mod.PageClientImpl })), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{
    region?: string;
    hq?: string;
    codec?: string;
  }>;
}) {
  const resolvedParams = React.use(params);
  const resolvedSearchParams = React.use(searchParams);
  
  const codec =
    typeof resolvedSearchParams.codec === 'string' && isVideoCodec(resolvedSearchParams.codec)
      ? resolvedSearchParams.codec
      : 'vp9';
  const hq = resolvedSearchParams.hq === 'true' ? true : false;

  return (
    <PageClientImpl
      roomName={resolvedParams.roomName}
      region={resolvedSearchParams.region}
      hq={hq}
      codec={codec}
    />
  );
}
