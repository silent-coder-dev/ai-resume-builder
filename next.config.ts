import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The SQL sandbox loads sql.js by path inside a worker, so the build can't see it.
  outputFileTracingIncludes: {
    "/api/assessment": ["./node_modules/sql.js/dist/sql-wasm.js", "./node_modules/sql.js/dist/sql-wasm.wasm"],
  },
};

export default nextConfig;
