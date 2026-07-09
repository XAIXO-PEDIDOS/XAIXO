// Needed on this machine: Node.js can't verify Supabase's TLS cert chain
// (intermediate CA not in Node's bundled store). Safe for local dev only.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
