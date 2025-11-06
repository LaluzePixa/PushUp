/**
 * Health Check API Endpoint
 * Used by Docker health checks and monitoring tools
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Always run dynamically

/**
 * GET /api/health
 * Returns 200 OK if the application is healthy
 */
export async function GET() {
  try {
    // Basic health check - can be expanded to check:
    // - Database connection
    // - External services
    // - Memory usage
    // - etc.

    const healthInfo = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',
    };

    return NextResponse.json(healthInfo, { status: 200 });
  } catch (error) {
    // If health check fails, return 503 Service Unavailable
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * HEAD /api/health
 * Lightweight health check (no body)
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
