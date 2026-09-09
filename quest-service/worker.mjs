// Dependency-free Cloudflare Worker; the upstream URL is never supplied by a caller.
export const playerKey = name => String(name || '').trim().replace(/_/g, ' ').replace(/ +/g, ' ').toLowerCase();
export function validatePlayer(payload, username) {
  if (!payload || playerKey(payload.username) !== playerKey(username)) throw new Error('Personagem diferente na resposta');
  if (!payload.quests || Array.isArray(payload.quests) || typeof payload.quests !== 'object') throw new Error('Quests ausentes');
  const entries = Object.entries(payload.quests).filter(([name]) => name !== '.');
  if (!entries.length || entries.some(([, value]) => ![0, 1, 2].includes(value))) throw new Error('Estados de quest inválidos');
  return payload;
}

export function createService({fetchUpstream = fetch, now = Date.now} = {}) {
  const cache = new Map(), pending = new Map(), clients = new Map();
  const ttl = 30000, maxEntries = 500;
  return async function handle(request, env = {}) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || 'https://marcosjoaosch.github.io,http://localhost:4173').split(',').map(s => s.trim());
    const headers = {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'Vary':'Origin'};
    if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (data, status = 200) => new Response(JSON.stringify(data), {status, headers});
    if (origin && !allowed.includes(origin)) return reply({error:'Origem não permitida'}, 403);
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:{...headers,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept'}});
    if (request.method !== 'GET') return reply({error:'Método não permitido'}, 405);
    const url = new URL(request.url);
    if (url.pathname === '/health') return reply({ok:true, service:'osrs-quest-sync'});
    if (url.pathname !== '/quests') return reply({error:'Rota inexistente'}, 404);
    const username = (url.searchParams.get('username') || '').trim();
    if (!/^[A-Za-z0-9 _-]{1,12}$/.test(username)) return reply({error:'Nick inválido (1 a 12 caracteres)'}, 400);
    const key = playerKey(username), time = now(), ip = request.headers.get('CF-Connecting-IP') || 'local';
    for (const [client, bucket] of clients) if (time - bucket.start >= 60000) clients.delete(client);
    const bucket = clients.get(ip) || {start:time, count:0};
    if (++bucket.count > 30 || (!clients.has(ip) && clients.size >= maxEntries)) {
      return new Response(JSON.stringify({error:'Aguarde um minuto antes de consultar novamente'}), {status:429,headers:{...headers,'Retry-After':'60'}});
    }
    clients.set(ip, bucket);
    for (const [name, entry] of cache) if (time - entry.time >= ttl) cache.delete(name);
    const hit = cache.get(key);
    if (hit) return reply({...hit.result, cached:true});
    try {
      if (!pending.has(key)) {
        if (pending.size >= 30) return reply({error:'Serviço ocupado; tente novamente'}, 503);
        pending.set(key, (async () => {
          const response = await fetchUpstream('https://sync.runescape.wiki/runelite/player/' + encodeURIComponent(username) + '/STANDARD', {
            headers:{'User-Agent':'OSRS-Main-Journey/2.0 (https://github.com/marcosjoaosch/osrs-main-journey)', Accept:'application/json'},
            signal:AbortSignal.timeout(10000), redirect:'manual', cache:'no-store'
          });
          if (!response.ok) { const error = new Error(response.status === 404 ? 'Personagem não encontrado no WikiSync' : 'WikiSync indisponível'); error.status = response.status === 404 ? 404 : 502; throw error; }
          const source = validatePlayer(await response.json(), username);
          // timestamp is supplied by the API; do not label it as RuneLite upload time.
          const payload = Object.fromEntries(['username','timestamp','quests','achievement_diaries','combat_achievements','collection_log','collectionLogItemCount'].filter(k => source[k] !== undefined).map(k => [k, source[k]]));
          const result = {payload, cached:false, fetchedAt:new Date(now()).toISOString()};
          if (cache.size >= maxEntries) cache.delete(cache.keys().next().value);
          cache.set(key, {time:now(),result});
          return result;
        })().finally(() => pending.delete(key)));
      }
      return reply(await pending.get(key));
    } catch (error) { return reply({error:error.message || 'Falha ao consultar WikiSync'}, error.status || 502); }
  };
}
const handle = createService();
export default {fetch:handle};
