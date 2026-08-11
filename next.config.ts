import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // 100ms's join()/leave() aren't safe against React Strict Mode's dev-mode
  // effect double-invoke: the replayed teardown calls leave() on a room
  // that's still mid-join, corrupting SDK peer state before it ever connects.
  reactStrictMode: false,
};

export default nextConfig;
