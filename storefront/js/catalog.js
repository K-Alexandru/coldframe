// The Rime as sold: prices are relative to each group's default (0); base price covers the default build.
export const CATALOG = {
  id: 'glass-tower', name: 'Rime', basePrice: 4399, currency: 'CAD', financeMonths: 12, buildDays: 5,
  // Lighting presets are a software setting, not a purchase choice: the viewer previews them, they are not priced or carted.
  lighting: [
    { id: 'arctic', name: 'Arctic white' }, { id: 'ice', name: 'Ice blue' }, { id: 'ember', name: 'Ember' },
    { id: 'violet', name: 'Violet' }, { id: 'rainbow', name: 'Rainbow wave' }, { id: 'off', name: 'Lights off' } ],
  groups: [
    { id: 'finish', name: 'Finish', help: 'Snow swaps the case, cooler, fans and memory to their white editions.', options: [
      { id: 'black', name: 'Black', spec: 'Satin black powder coat', price: 0, default: true, model: { finish: 'black' } },
      { id: 'snow', name: 'Snow', spec: 'Matte white, white cooler, fans and RAM', price: 110, model: { finish: 'snow' } } ] },
    { id: 'cpu', name: 'Processor', help: 'X3D chips have extra cache that lifts frame rates in CPU-heavy games.', options: [
      { id: 'r7-9700x', name: 'AMD Ryzen 7 9700X', spec: '8 cores, up to 5.5 GHz', price: -210, perf: 0.86 },
      { id: 'r7-9800x3d', name: 'AMD Ryzen 7 9800X3D', spec: '8 cores, 96 MB L3, up to 5.2 GHz', price: 0, default: true, badge: 'Best for gaming', perf: 1 },
      { id: 'r9-9950x3d', name: 'AMD Ryzen 9 9950X3D', spec: '16 cores, 128 MB L3, up to 5.7 GHz', price: 360, badge: 'Gaming + creating', perf: 1.04 } ] },
    { id: 'gpu', name: 'Graphics', help: 'The biggest single factor in frame rate. 1440p high-refresh: RTX 5080. 4K max settings: RTX 5090.', options: [
      { id: 'rtx5070ti', name: 'ASUS Prime GeForce RTX 5070 Ti', spec: '16 GB GDDR7', price: -450, perf: 0.78, part: 'gpu' },
      { id: 'rtx5080fe', name: 'NVIDIA GeForce RTX 5080 Founders Edition', spec: '16 GB GDDR7', price: 0, default: true, badge: 'Recommended', perf: 1, part: 'gpu' },
      { id: 'rtx5090fe', name: 'NVIDIA GeForce RTX 5090 Founders Edition', spec: '32 GB GDDR7', price: 1710, perf: 1.42, part: 'gpu' },
      // appended, not sorted in: share codes store each option's index
      { id: 'rtx5070fe', name: 'NVIDIA GeForce RTX 5070 Founders Edition', spec: '12 GB GDDR7', price: -650, perf: 0.62, part: 'gpu' } ] },
    { id: 'cooling', name: 'Cooling', help: 'Both are 360 mm liquid coolers; Elite adds the 2.72-inch LCD on the pump.', options: [
      { id: 'kraken360', name: 'NZXT Kraken 360 RGB', spec: '360 mm AIO, RGB pump ring', price: -100, part: 'aio' },
      { id: 'krakenelite360', name: 'NZXT Kraken Elite 360 RGB', spec: '360 mm AIO, 2.72" LCD', price: 0, default: true, part: 'aio' } ] },
    { id: 'memory', name: 'Memory', help: '32 GB is plenty for gaming; 64 GB and up helps with streaming, editing and VMs.', options: [
      { id: 'm32', name: '32 GB (2 × 16 GB) DDR5-6000 CL30', spec: 'G.SKILL Trident Z5 Neo RGB', price: -150, part: 'ram' },
      { id: 'm64', name: '64 GB (2 × 32 GB) DDR5-6000 CL30', spec: 'G.SKILL Trident Z5 Neo RGB', price: 0, default: true, badge: 'Most popular', part: 'ram' },
      { id: 'm96', name: '96 GB (2 × 48 GB) DDR5-6000 CL28', spec: 'G.SKILL Trident Z5 Neo RGB', price: 250, part: 'ram' } ] },
    { id: 'storage', name: 'Storage', help: 'A modern game takes 100–150 GB.', options: [
      { id: 's1', name: '1 TB Samsung 990 PRO', spec: 'PCIe 4.0 NVMe, 7,450 MB/s', price: -100 },
      { id: 's2', name: '2 TB Samsung 990 PRO', spec: 'PCIe 4.0 NVMe, 7,450 MB/s', price: 0, default: true },
      { id: 's4', name: '4 TB Samsung 990 PRO', spec: 'PCIe 4.0 NVMe, 7,450 MB/s', price: 260 } ] },
    { id: 'storage2', name: 'Extra storage', help: 'A second drive for your library or projects.', options: [
      { id: 'none', name: 'None', spec: 'Add one later in the free M.2 slot', price: 0, default: true },
      { id: 'x2', name: '2 TB Samsung 990 EVO Plus', spec: 'PCIe 4.0 NVMe', price: 180 },
      { id: 'x4', name: '4 TB Samsung 990 EVO Plus', spec: 'PCIe 4.0 NVMe', price: 330 } ] },
    { id: 'psu', name: 'Power supply', help: '1000 W covers every option here with headroom.', options: [
      { id: 'rm1000x', name: 'Corsair RM1000x SHIFT', spec: '1000 W, 80+ Gold, fully modular', price: 0, default: true },
      { id: 'rm1200x', name: 'Corsair RM1200x SHIFT', spec: '1200 W, 80+ Gold, fully modular', price: 80 } ] },
    { id: 'os', name: 'Operating system', help: 'Pro adds BitLocker, Remote Desktop hosting and Hyper-V.', options: [
      { id: 'home', name: 'Windows 11 Home', spec: 'Installed and activated', price: 0, default: true },
      { id: 'pro', name: 'Windows 11 Pro', spec: 'Installed and activated', price: 80 },
      { id: 'none', name: 'No operating system', spec: 'Drive left blank', price: -160 } ] },
    { id: 'warranty', name: 'Warranty', help: 'Every build includes lifetime phone and chat support.', options: [
      { id: 'w2', name: '2-year parts and labor', spec: 'Included', price: 0, default: true },
      { id: 'w3', name: '3-year parts and labor', spec: 'Adds a year, plus free return shipping', price: 0, compareAt: 200, badge: 'Best value' },
      { id: 'w4', name: '4-year parts and labor', spec: 'Adds two years, plus advance replacement', price: 340 } ] },
    { id: 'packaging', name: 'Packaging', help: 'All builds ship with foam inserts inside the case.', options: [
      { id: 'standard', name: 'Standard double box', spec: 'Foam-lined', price: 0, default: true },
      { id: 'crate', name: 'Reinforced crate', spec: 'Fitted foam, reusable', price: 70 } ] },
  ],
  // One chassis, three presets of the configurator state (see seriesPicks in pricing.js). A preset covers only the groups it names;
  // a group left out takes its default, and finish, OS, warranty and packaging carry over between series.
  series: [
    { id: 'core', name: 'Core', line: 'Ryzen 7 9700X · RTX 5070 Ti', picks: { cpu: 'r7-9700x', gpu: 'rtx5070ti', memory: 'm32', storage: 's1', cooling: 'kraken360', psu: 'rm1000x' } },
    { id: 'pro', name: 'Pro', line: 'Ryzen 7 9800X3D · RTX 5080', badge: 'Best seller', picks: {} },
    { id: 'elite', name: 'Elite', line: 'Ryzen 9 9950X3D · RTX 5090', picks: { cpu: 'r9-9950x3d', gpu: 'rtx5090fe', memory: 'm96', storage: 's4', cooling: 'krakenelite360', psu: 'rm1200x' } },
  ],
  // In-house accessories (R9): separate cart lines, not part of the PC configuration. Whole Canadian dollars, rounded to $10.
  accessories: [
    { id: 'vista27', name: 'Coldframe Vista 27', spec: '27″ QHD 1440p · 240 Hz · IPS', price: 550, img: 'storefront/img/acc-monitor.svg', alt: 'Front view of a 27-inch gaming monitor on a slim stand, showing a cold blue horizon' },
    { id: 'tkl80', name: 'Coldframe Tenkey 80', spec: 'TKL · hot-swap linear switches · USB-C', price: 180, img: 'storefront/img/acc-keyboard.svg', alt: 'Top view of a compact tenkeyless keyboard with an ice-blue underglow' },
    { id: 'glide', name: 'Coldframe Glide', spec: 'Wireless · 58 g · 26,000 DPI · 80 h battery', price: 120, img: 'storefront/img/acc-mouse.svg', alt: 'Top view of a lightweight wireless gaming mouse with ice-blue side accents' },
    { id: 'echo7', name: 'Coldframe Echo 7', spec: 'Wireless · 7.1 surround · detachable mic', price: 200, img: 'storefront/img/acc-headset.svg', alt: 'A wireless gaming headset with a detachable microphone boom' },
  ],
  games: [
    { name: 'Cyberpunk 2077', cpuBound: 0.15, base: { '1080p': 168, '1440p': 124, '4k': 68 } },
    { name: 'Fortnite', cpuBound: 0.35, base: { '1080p': 285, '1440p': 214, '4k': 121 } },
    { name: 'Call of Duty: Black Ops 6', cpuBound: 0.3, base: { '1080p': 242, '1440p': 186, '4k': 112 } },
    { name: 'Counter-Strike 2', cpuBound: 0.6, base: { '1080p': 512, '1440p': 431, '4k': 268 } },
    { name: "Baldur's Gate 3", cpuBound: 0.4, base: { '1080p': 176, '1440p': 141, '4k': 87 } },
  ],
};
