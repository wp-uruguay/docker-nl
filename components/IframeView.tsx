"use client";

import ServiceNotice from "@/components/ServiceNotice";

export default function IframeView({ title, src }: { title: string; src: string }) {
  return (
    <div className="h-full w-full">
      <ServiceNotice />
      <iframe title={title} src={src} className="h-full w-full" style={{ border: 0 }} />
    </div>
  );
}
