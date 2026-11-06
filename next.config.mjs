export default {
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/', destination: '/index.html' }];
  },
  async headers() {
    const development = process.env.NODE_ENV !== 'production';
    // 기존 UI의 inline handler/style을 유지하며 외부 스크립트·폼 전송을 제한합니다.
    const csp = [
      "default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'",
      `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob:",
      `connect-src 'self'${development ? ' ws:' : ''}`,
    ].join('; ');
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: csp },
    ] }];
  },
};
