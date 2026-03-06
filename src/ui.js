export function logEvent(msg, type = 'info') {
  const log = document.getElementById('event-log');
  const div = document.createElement('div');
  const time = new Date().toLocaleTimeString('en', { hour12: false });
  div.textContent = `[${time}] ${msg}`;
  if (type === 'warn')   div.style.color = '#ffaa00';
  if (type === 'danger') div.style.color = '#ff4444';
  log.prepend(div);
  while (log.children.length > 30) log.removeChild(log.lastChild);
}

export function updateStats(stats) {
  document.getElementById('stat-fired').textContent        = stats.fired;
  document.getElementById('stat-interceptors').textContent = stats.interceptors;
  document.getElementById('stat-hits').textContent         = stats.hits;
  document.getElementById('stat-misses').textContent       = stats.misses;
  const total = stats.hits + stats.misses;
  document.getElementById('stat-rate').textContent = 
    total > 0 ? `${Math.round(stats.hits/total*100)}%` : '—';
}