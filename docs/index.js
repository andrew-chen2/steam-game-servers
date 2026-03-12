const gameNames = new Map([
  [251570,  '7 Days to Die'],
  [17510,   'Age of Chivalry'],
  [630,     'Alien Swarm'],
  [10680,   'Aliens vs. Predator'],
  [270880,  'American Truck Simulator'],
  [33930,   'Arma 2: Operation Arrowhead'],
  [107410,  'Arma 3'],
  [346110,  'ARK: Survival Evolved'],
  [834910,  'ATLAS'],
  [1066890, 'Automobilista 2'],
  [445220,  'Avorion'],
  [602960,  'Barotrauma'],
  [362890,  'Black Mesa'],
  [2450,    'Bloody Good Time'],
  [311210,  'Call of Duty: Black Ops III'],
  [2457540, 'Cardfight!! Vanguard Dear Days 2'],
  [366090,  'Colony Survival'],
  [238430,  'Contagion'],
  [10,      'Counter-Strike'],
  [730,     'Counter-Strike 2'],
  [80,      'Counter-Strike: Condition Zero'],
  [240,     'Counter-Strike: Source'],
  [4465480, 'Counter-Strike:Global Offensive'],
  [30,      'Day of Defeat'],
  [300,     'Day of Defeat: Source'],
  [221100,  'DayZ'],
  [40,      'Deathmatch Classic'],
  [17530,   'D.I.P.R.I.P. Warm Up'],
  [570,     'Dota 2'],
  [65800,   'Dungeon Defenders'],
  [17580,   'Dystopia'],
  [383120,  'Empyrion - Galactic Survival'],
  [1203620, 'Enshrouded'],
  [17550,   'Eternal Silence'],
  [227300,  'Euro Truck Simulator 2'],
  [265630,  'Fistful of Frags'],
  [983870,  'FOUNDARY'],
  [4000,    'Garry\'s Mod'],
  [70,      'Half-Life'],
  [320,     'Half-Life 2: Deathmatch'],
  [360,     'Half-Life Deathmatch: Source'],
  [50,      'Half-Life: Opposing Force'],
  [686810,  'Hell Let Loose'],
  [297000,  'Heroes of Might & Magic III - HD Edition'],
  [393420,  'Hurtworld'],
  [1149460, 'Icarus'],
  [222880,  'Insurgency'],
  [17700,   'Insurgency: Modern Infantry Combat'],
  [581320,  'Insurgency: Sandstorm'],
  [673560,  'IOSoccer'],
  [1250,    'Killing Floor'],
  [500,     'Left 4 Dead'],
  [550,     'Left 4 Dead 2'],
  [290080,  'Life is Feudal: Your Own'],
  [299740,  'Miscreated'],
  [1371580, 'Myth of Empires'],
  [4920,    'Natural Selection 2'],
  [224260,  'No More Room in Hell'],
  [1963370, 'No One Survived'],
  [885570,  'Nova-Life: Amboise'],
  [17570,   'Pirates, Vikings, & Knights II'],
  [620,     'Portal 2'],
  [321360,  'Primal Carnage: Extinction'],
  [378860,  'Project CARS 2'],
  [282440,  'Quake Live'],
  [60,      'Ricochet'],
  [418460,  'Rising Storm 2: Vietnam'],
  [252490,  'Rust'],
  [1300,    'SiN Episodes: Emergence'],
  [17730,   'Smashball'],
  [238090,  'Sniper Elite 3'],
  [312660,  'Sniper Elite 4'],
  [244850,  'Space Engineers'],
  [480,     'Spacewar'],
  [573090,  'Stormworks: Build and Rescue'],
  [418030,  'Subsistence'],
  [541300,  'Survive the Nights'],
  [225840,  'Sven Co-op'],
  [17520,   'Synergy'],
  [440,     'Team Fortress 2'],
  [3545060, 'Team Fortress 2 Classified'],
  [20,      'Team Fortress Classic'],
  [2400,    'The Ship: Murder Party'],
  [394690,  'Tower Unite'],
  [304930,  'Unturned'],
  [892970,  'Valheim'],
  [1604030, 'V Rising'],
  [366220,  'Wurm Unlimited'],
  [17500,   'Zombie Panic! Source'],
]);

const WORKER_URL = 'https://steam-game-servers.andrewchen796.workers.dev?';

const FIELD_MAP = {
  name: 'search-name',
  map: 'search-map',
  appid: 'search-game',
  secure: 'search-secure',
  not_full: 'search-not-full',
  has_players: 'search-has-players',
};

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

function transformData(data) {
  if (!data) return [];

  let servers = [];

  data.forEach((server) => {
    servers.push([
      server.name ?? 'Server Name Not Found',
      server.addr ?? 'Server IP Not Found',
      gameNames.get(server.appid) ?? `Game Not Found (appid: ${server.appid})`,
      server.map ?? 'Map Not Found',
      (server.players ?? 0) + '/' + (server.max_players ?? '?'),
      server.secure ? '✅' : '❌',
    ]);
  });

  return servers;
}

function createTable(data) {
  document.getElementById('btn-submit').disabled = true;

  const table =  new gridjs.Grid({
    columns: [
      'Server Name',
      'Server IP',
      'Game',
      'Map',
      {
        name: 'Players',
        sort: {
          compare: (a, b) => {
            a = parseInt(a.split('/')[0])
            b = parseInt(b.split('/')[0])
            if (a > b) {
              return 1;
            } else if (b > a) {
              return -1;
            } else {
              return 0;
            }
          }
        }
      },
      'Secure'
    ],
    sort: true,
    pagination: {
      limit: 15,
    },
    data: data,
  });

  // Enable Search button once table is rendered
  table.config.store.subscribe((state, prevState) => {
    const prev = prevState.status;
    const cur = state.status;
    if ((prev === 2 && cur === 3) || (prev === 1 && cur === 4)) {
      document.getElementById('btn-submit').disabled = false;
    }
  });

  table.on('rowClick', (e, row) => {
    document.querySelectorAll('tr.selected').forEach(r => r.classList.remove('selected'));

    e.currentTarget.classList.add('selected');
    selectedRow = {
      ip: row.cells[1].data,
    };

    const connect = document.getElementById('btn-connect');
    connect.href = `steam://connect/${selectedRow.ip}`;
    connect.classList.remove('disabled');

    document.getElementById('btn-copy').disabled = false;
  });

  return table
}

function updateTable(data) {
  const connect = document.getElementById('btn-connect');
  connect.href = '#';
  connect.classList.add('disabled');

  document.getElementById('btn-copy').disabled = true;

  document.getElementById('wrapper').remove();
  let wrapper = document.createElement("div");
  wrapper.id = "wrapper";
  document.getElementById('container').appendChild(wrapper);
  createTable(data).render(wrapper);
}

const sanitize = (val) => val.replace(/\\/g, '');

function buildFilter({ name, map, appid, secure, not_full, has_players }) {
  let filter = '';
  if (name) filter += `\\name_match\\*${sanitize(name)}*`;
  if (map) filter += `\\map\\${sanitize(map)}`;
  if (appid) filter += `\\appid\\${appid}`;
  if (secure) filter += `\\secure\\1`;
  if (not_full) filter += `\\full\\1`;
  if (has_players) filter += `\\empty\\1`;
  return filter;
}

// Populate game select options
const select = document.getElementById('search-game');

gameNames.forEach((name, id) => {
  let option = document.createElement('option');
  option.value = id;
  option.innerHTML = name;
  select.appendChild(option);
});

// Initialise table
const filter_json = JSON.parse(localStorage.getItem('filter')) ?? {};
const filter = buildFilter(filter_json);

for (const [key, id] of Object.entries(FIELD_MAP)) {
  const el = document.getElementById(id);
  const val = filter_json[key];
  if (!el || !val) continue;
  if (el.type === 'checkbox') el.checked = true;
  else el.value = val;
}

createTable(filter ? () => getServers(5000, filter).then((data) => transformData(data.servers)) : []).render(document.getElementById('wrapper'));

// Connect to server and copy IP buttons
let selectedRow = null;

document.getElementById('btn-copy').addEventListener('click', (e) => {
  if (selectedRow) navigator.clipboard.writeText(selectedRow.ip);
  e.target.innerHTML = 'Copied!';
  e.target.disabled = true;
  setTimeout(() => {
    e.target.innerHTML = 'Copy IP';
    e.target.disabled = false;
  }, 1500);
});

// Handle form
document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();

  if (document.getElementById('btn-submit').disabled) return;

  const data = Object.fromEntries(new FormData(e.target));

  const filter_obj = {
    'name': data['search-name'].trim(),
    'map': data['search-map'].trim(),
    'appid': parseInt(data['search-game']),
    'secure': !!data['search-secure'],
    'not_full': !!data['search-not-full'],
    'has_players': !!data['search-has-players'],
  }

  localStorage.setItem('filter', JSON.stringify(filter_obj));
  updateTable(() => getServers(5000, buildFilter(filter_obj)).then((data) => transformData(data.servers)));
});
