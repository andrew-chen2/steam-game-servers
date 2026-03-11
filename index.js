const WORKER_URL = 'https://steam-game-servers.andrewchen796.workers.dev?';

async function getServers(limit, filter) {
  const url = new URL(WORKER_URL);
  if (limit) url.searchParams.set('limit', limit);
  if (filter) url.searchParams.set('filter', filter);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return null;
  }
}
