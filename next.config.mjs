export default {
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/', destination: '/index.html' }];
  },
  async headers() {
    const development = process.env.NODE_ENV !== 'production';
    // 보안: 외부 JS 이벤트 함수를 사용하며 HTML 이벤트 속성 실행은 차단합니다.
    // style-src 예외는 기존 CSS용이며 JavaScript 실행 허용과 별개입니다.
    const csp = [
      "default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'",
      `script-src 'self'${development ? " 'unsafe-eval'" : ''}`,
      "script-src-attr 'none'",
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
