const gameNames = new Map([
  [10,     'Counter-Strike'],
  [20,     'Team Fortress Classic'],
  [30,     'Day of Defeat'],
  [40,     'Deathmatch Classic'],
  [50,     'Opposing Force'],
  [60,     'Ricochet'],
  [70,     'Half-Life'],
  [80,     'Condition Zero'],
  [240,    'Counter-Strike: Source'],
  [300,    'Day of Defeat: Source'],
  [320,    'Half-Life 2: Deathmatch'],
  [360,    'Half-Life Deathmatch: Source'],
  [440,    'Team Fortress 2'],
  [500,    'Left 4 Dead'],
  [550,    'Left 4 Dead 2'],
  [570,    'Dota 2'],
  [620,    'Portal 2'],
  [630,    'Alien Swarm'],
  [730,    'Counter-Strike: Global Offensive'],
  [1800,   'Counter-Strike 2'],
  [1300,   'SiN Episodes: Emergence'],
  [2130,   'Dark Messiah of Might and Magic Multi-Player'],
  [2400,   'The Ship: Murder Party'],
  [2450,   'Bloody Good Time'],
  [4000,   'Garry\'s Mod'],
  [17500,  'Zombie Panic! Source'],
  [17510,  'Age of Chivalry'],
  [17520,  'Synergy'],
  [17530,  'D.I.P.R.I.P.'],
  [17550,  'Eternal Silence'],
  [17570,  'Pirates, Vikings, & Knights II'],
  [17580,  'Dystopia'],
  [17700,  'Insurgency'],
  [17710,  'Nuclear Dawn'],
  [17730,  'Smashball'],
  [222880, 'Insurgency (2014)'],
  [224260, 'No More Room in Hell'],
  [238430, 'Contagion'],
]);

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

function transformData(data) {
  if (!data) return [];

  let servers = [];

  data.forEach((server) => {
    servers.push([
      server.name ?? 'Server Name Not Found',
      server.addr ?? 'Server IP Not Found',
      gameNames.get(server.appid) ?? 'Game Not Found',
      server.map ?? 'Map Not Found',
      (server.players ?? 0) + '/' + (server.max_players ?? '?'),
      server.secure ? '✅' : '❌',
    ]);
  });

  return servers;
}

function createTable() {
  return new gridjs.Grid({
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
    data: [],
  });
}

function updateTable(table, data) {
  const connect = document.getElementById('btn-connect');
  connect.href = '#';
  connect.classList.add('disabled');

  document.getElementById('btn-copy').disabled = true;

  table.updateConfig({
    data: () => {
      return data.then((data) => transformData(data.servers));
    },
  }).forceRender();
}

// Initialise table
const table = createTable().render(document.getElementById('wrapper'));

// Connect to server and copy IP buttons
let selectedRow = null;

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

document.getElementById('btn-copy').addEventListener('click', () => {
  if (selectedRow) navigator.clipboard.writeText(selectedRow.ip);
});

// Populate game select options
const select = document.getElementById('search-game');

gameNames.forEach((name, id) => {
  let option = document.createElement('option');
  option.value = id;
  option.innerHTML = name;
  select.appendChild(option);
});

// Handle form
document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const sanitize = (val) => val.replace(/\\/g, '');

  const data = Object.fromEntries(new FormData(e.target));
  let filter = '';

  const name = data['search-name'].trim();
  const map = data['search-map'].trim();
  const appid = data['search-game'].trim();
  const secure = data['search-secure'];
  const not_full = data['search-not-full'];
  const has_players = data['search-has-players'];
  if (name) filter += `\\name_match\\*${sanitize(name)}*`;
  if (map) filter += `\\map\\${sanitize(map)}`;
  if (appid) filter += `\\appid\\${sanitize(appid)}`;
  if (secure) filter += `\\secure\\1`;
  if (not_full) filter += `\\full\\1`;
  if (has_players) filter += `\\empty\\1`;

  updateTable(table, getServers(5000, filter));
});
