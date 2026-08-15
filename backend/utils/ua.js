function parseUA(ua = '') {
  const s = ua.toLowerCase();
  let device = 'Desktop';
  if (/mobile|iphone|android.*mobile/.test(s)) device = 'Mobile';
  else if (/ipad|tablet|android(?!.*mobile)/.test(s)) device = 'Tablet';

  let browser = 'Other';
  if (s.includes('edg/')) browser = 'Edge';
  else if (s.includes('chrome/') && !s.includes('chromium')) browser = 'Chrome';
  else if (s.includes('firefox/')) browser = 'Firefox';
  else if (s.includes('safari/') && !s.includes('chrome')) browser = 'Safari';
  else if (s.includes('opr/') || s.includes('opera')) browser = 'Opera';

  let os = 'Other';
  if (s.includes('windows')) os = 'Windows';
  else if (s.includes('mac os')) os = 'macOS';
  else if (s.includes('android')) os = 'Android';
  else if (s.includes('iphone') || s.includes('ipad')) os = 'iOS';
  else if (s.includes('linux')) os = 'Linux';

  return { device, browser, os };
}

module.exports = { parseUA };
