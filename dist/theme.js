'use strict';
document.documentElement.dataset.native=typeof window.AbhyasAndroid==='object'?'true':'false';
try {
  const theme=JSON.parse(localStorage.getItem('abhyas-v1')||'{}')?.settings?.theme;
  document.documentElement.dataset.theme=['light','dark'].includes(theme)?theme:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
} catch { document.documentElement.dataset.theme='light'; }
