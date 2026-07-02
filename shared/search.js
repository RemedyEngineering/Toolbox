/* ============================================================
   Remedy Toolbox — Search engine + index (SHARED, single source)
   Loaded by the hub pages (Home / Tools / Documentation) via:
     <script src="shared/search.js?v=1"></script>
   Requires the page to contain the search markup (#q, #drop, #q_clear)
   and to load achievements.js before, and copilot.js after, this file.

   TO ADD A TOOL TO SEARCH: add one entry to the `const INDEX = [
  { kind: 'tool', section: 'Mechanical', title: 'Schedule Builder',
    desc: 'Generate on-brand equipment schedules (AHU, coils, boilers, pumps, plumbing fixtures, etc.) in Imperial or Metric, sized to a drawing/paper area, exported to Excel.',
    url: 'SubTools/Schedule_Builder.html',
    keywords: ['schedule','schedules','schedule builder','equipment schedule','ahu schedule','coil schedule','boiler schedule','pump schedule','plumbing fixture schedule','mechanical schedule','excel','export','drawing','paper size','imperial','metric','template'] }, … ]`
   array below (kind:'tool', title, url:'SubTools/X.html', keywords:[…]).
   That single entry makes it findable in all three search bars.
   ============================================================ */


/* -----------------------------------------------------------
   Smart Convert — natural-language unit conversion.
   Lets the search bar accept inputs like "100 l/s", "25 psi",
   "75°F", "1.2e3 kw" and surface a conversion card alongside
   the regular suggestions.
   ----------------------------------------------------------- */
const QTYS = {
  Flow: {
    base: 'm3/s',
    units: {
      'L/s':           { f: 0.001 },
      'm³/s':          { f: 1 },
      'm³/h':          { f: 1/3600 },
      'CFM (ft³/min)': { f: 0.00047194745 },
      'CFH (ft³/hr)':  { f: 0.00047194745/60 },
      'GPM (US)':      { f: 6.30901964e-5 },
      'GPM (Imp)':     { f: 7.5768e-5 }
    }
  },
  Pressure: {
    base: 'Pa',
    units: {
      'Pa':          { f: 1 },
      'kPa':         { f: 1000 },
      'inWC':        { f: 248.84 },
      'inHg':        { f: 3386.39 },
      'mmH₂O':       { f: 9.80665 },
      'mbar':        { f: 100 },
      'psi':         { f: 6894.76 },
      'ft head H₂O': { f: 2989.07 },
      'm head H₂O':  { f: 9806.65 }
    }
  },
  Velocity: {
    base: 'm/s',
    units: {
      'm/s':   { f: 1 },
      'FPM':   { f: 0.00508 },
      'ft/s':  { f: 0.3048 },
      'km/h':  { f: 1/3.6 },
      'mph':   { f: 0.44704 }
    }
  },
  Energy: {
    base: 'J',
    units: {
      'J':     { f: 1 },
      'kJ':    { f: 1000 },
      'kWh':   { f: 3.6e6 },
      'BTU':   { f: 1055.06 },
      'kBTU':  { f: 1.05506e6 },
      'therm': { f: 1.05506e8 }
    }
  },
  Power: {
    base: 'W',
    units: {
      'W':            { f: 1 },
      'kW':           { f: 1000 },
      'BTU/h':        { f: 0.293071 },
      'MBH (kBTU/h)': { f: 293.071 },
      'ton (refr)':   { f: 3516.85 },
      'hp':           { f: 745.7 }
    }
  },
  Length: {
    base: 'm',
    units: {
      'mm':   { f: 0.001 },
      'cm':   { f: 0.01 },
      'm':    { f: 1 },
      'km':   { f: 1000 },
      'in':   { f: 0.0254 },
      'ft':   { f: 0.3048 },
      'yd':   { f: 0.9144 },
      'mile': { f: 1609.344 }
    }
  },
  Area: {
    base: 'm²',
    units: {
      'mm²': { f: 1e-6 },
      'm²':  { f: 1 },
      'in²': { f: 6.4516e-4 },
      'ft²': { f: 0.092903 },
      'yd²': { f: 0.836127 }
    }
  },
  Volume: {
    base: 'm³',
    units: {
      'L':         { f: 0.001 },
      'm³':        { f: 1 },
      'gal (US)':  { f: 3.78541e-3 },
      'gal (Imp)': { f: 4.54609e-3 },
      'ft³':       { f: 0.0283168 },
      'in³':       { f: 1.63871e-5 }
    }
  },
  Mass: {
    base: 'kg',
    units: {
      'g':              { f: 0.001 },
      'kg':             { f: 1 },
      'tonne (metric)': { f: 1000 },
      'lb':             { f: 0.453592 },
      'oz':             { f: 0.0283495 },
      'ton (short)':    { f: 907.185 }
    }
  },
  Temperature: {
    base: 'K',
    units: {
      '°C': { to: c => c + 273.15,             from: k => k - 273.15 },
      '°F': { to: f => (f - 32)*5/9 + 273.15,  from: k => (k - 273.15)*9/5 + 32 },
      'K':  { to: k => k,                      from: k => k },
      '°R': { to: r => r*5/9,                  from: k => k*9/5 }
    }
  }
};

const UNIT_ALIASES = {
  // ---- Flow ----
  'l/s': {cat:'Flow', unit:'L/s'}, 'lps': {cat:'Flow', unit:'L/s'},
  'liters per second': {cat:'Flow', unit:'L/s'}, 'litres per second': {cat:'Flow', unit:'L/s'},
  'm3/s': {cat:'Flow', unit:'m³/s'}, 'm³/s': {cat:'Flow', unit:'m³/s'},
  'cms': {cat:'Flow', unit:'m³/s'},
  'm3/h': {cat:'Flow', unit:'m³/h'}, 'm³/h': {cat:'Flow', unit:'m³/h'},
  'm3/hr': {cat:'Flow', unit:'m³/h'}, 'm³/hr': {cat:'Flow', unit:'m³/h'},
  'cmh': {cat:'Flow', unit:'m³/h'},
  'cfm': {cat:'Flow', unit:'CFM (ft³/min)'}, 'c.f.m.': {cat:'Flow', unit:'CFM (ft³/min)'},
  'ft3/min': {cat:'Flow', unit:'CFM (ft³/min)'}, 'ft³/min': {cat:'Flow', unit:'CFM (ft³/min)'},
  'cubic feet per minute': {cat:'Flow', unit:'CFM (ft³/min)'},
  'cfh': {cat:'Flow', unit:'CFH (ft³/hr)'},
  'ft3/hr': {cat:'Flow', unit:'CFH (ft³/hr)'}, 'ft³/hr': {cat:'Flow', unit:'CFH (ft³/hr)'},
  'gpm': {cat:'Flow', unit:'GPM (US)'}, 'gpm us': {cat:'Flow', unit:'GPM (US)'},
  'us gpm': {cat:'Flow', unit:'GPM (US)'}, 'gallons per minute': {cat:'Flow', unit:'GPM (US)'},
  'gpm imp': {cat:'Flow', unit:'GPM (Imp)'}, 'imp gpm': {cat:'Flow', unit:'GPM (Imp)'},
  'gpm uk': {cat:'Flow', unit:'GPM (Imp)'},

  // ---- Pressure ----
  'pa': {cat:'Pressure', unit:'Pa'}, 'pascal': {cat:'Pressure', unit:'Pa'}, 'pascals': {cat:'Pressure', unit:'Pa'},
  'kpa': {cat:'Pressure', unit:'kPa'}, 'kilopascal': {cat:'Pressure', unit:'kPa'},
  'inwc': {cat:'Pressure', unit:'inWC'}, 'in wc': {cat:'Pressure', unit:'inWC'},
  'in w.c.': {cat:'Pressure', unit:'inWC'}, 'in.wc': {cat:'Pressure', unit:'inWC'},
  'iwc': {cat:'Pressure', unit:'inWC'}, 'in h2o': {cat:'Pressure', unit:'inWC'},
  'inh2o': {cat:'Pressure', unit:'inWC'}, '"wc': {cat:'Pressure', unit:'inWC'},
  '"h2o': {cat:'Pressure', unit:'inWC'}, 'inches of water': {cat:'Pressure', unit:'inWC'},
  'inhg': {cat:'Pressure', unit:'inHg'}, 'in hg': {cat:'Pressure', unit:'inHg'},
  'inches of mercury': {cat:'Pressure', unit:'inHg'},
  'mmh2o': {cat:'Pressure', unit:'mmH₂O'}, 'mm h2o': {cat:'Pressure', unit:'mmH₂O'},
  'mmh₂o': {cat:'Pressure', unit:'mmH₂O'},
  'mbar': {cat:'Pressure', unit:'mbar'}, 'millibar': {cat:'Pressure', unit:'mbar'},
  'psi': {cat:'Pressure', unit:'psi'}, 'psig': {cat:'Pressure', unit:'psi'},
  'ft head': {cat:'Pressure', unit:'ft head H₂O'}, 'ft head h2o': {cat:'Pressure', unit:'ft head H₂O'},
  'feet head': {cat:'Pressure', unit:'ft head H₂O'}, 'ft hd': {cat:'Pressure', unit:'ft head H₂O'},
  'm head': {cat:'Pressure', unit:'m head H₂O'}, 'm head h2o': {cat:'Pressure', unit:'m head H₂O'},

  // ---- Velocity ----
  'm/s': {cat:'Velocity', unit:'m/s'}, 'mps': {cat:'Velocity', unit:'m/s'},
  'meters per second': {cat:'Velocity', unit:'m/s'},
  'fpm': {cat:'Velocity', unit:'FPM'}, 'ft/min': {cat:'Velocity', unit:'FPM'},
  'feet per minute': {cat:'Velocity', unit:'FPM'},
  'ft/s': {cat:'Velocity', unit:'ft/s'}, 'fps': {cat:'Velocity', unit:'ft/s'},
  'feet per second': {cat:'Velocity', unit:'ft/s'},
  'km/h': {cat:'Velocity', unit:'km/h'}, 'kmh': {cat:'Velocity', unit:'km/h'},
  'kph': {cat:'Velocity', unit:'km/h'}, 'kilometers per hour': {cat:'Velocity', unit:'km/h'},
  'mph': {cat:'Velocity', unit:'mph'}, 'miles per hour': {cat:'Velocity', unit:'mph'},

  // ---- Energy ----
  'j': {cat:'Energy', unit:'J'}, 'joule': {cat:'Energy', unit:'J'}, 'joules': {cat:'Energy', unit:'J'},
  'kj': {cat:'Energy', unit:'kJ'}, 'kilojoule': {cat:'Energy', unit:'kJ'},
  'kwh': {cat:'Energy', unit:'kWh'}, 'kw·h': {cat:'Energy', unit:'kWh'},
  'kilowatt hour': {cat:'Energy', unit:'kWh'}, 'kilowatt-hour': {cat:'Energy', unit:'kWh'},
  'btu': {cat:'Energy', unit:'BTU'},
  'kbtu': {cat:'Energy', unit:'kBTU'},
  'therm': {cat:'Energy', unit:'therm'}, 'therms': {cat:'Energy', unit:'therm'},

  // ---- Power ----
  'w': {cat:'Power', unit:'W'}, 'watt': {cat:'Power', unit:'W'}, 'watts': {cat:'Power', unit:'W'},
  'kw': {cat:'Power', unit:'kW'}, 'kilowatt': {cat:'Power', unit:'kW'}, 'kilowatts': {cat:'Power', unit:'kW'},
  'btu/h': {cat:'Power', unit:'BTU/h'}, 'btuh': {cat:'Power', unit:'BTU/h'},
  'btu/hr': {cat:'Power', unit:'BTU/h'}, 'btu per hour': {cat:'Power', unit:'BTU/h'},
  'mbh': {cat:'Power', unit:'MBH (kBTU/h)'}, 'kbtu/h': {cat:'Power', unit:'MBH (kBTU/h)'},
  'kbtuh': {cat:'Power', unit:'MBH (kBTU/h)'}, 'kbtu/hr': {cat:'Power', unit:'MBH (kBTU/h)'},
  'ton': {cat:'Power', unit:'ton (refr)'}, 'tons': {cat:'Power', unit:'ton (refr)'},
  'ton refrigeration': {cat:'Power', unit:'ton (refr)'}, 'tr': {cat:'Power', unit:'ton (refr)'},
  'rt': {cat:'Power', unit:'ton (refr)'},
  'hp': {cat:'Power', unit:'hp'}, 'horsepower': {cat:'Power', unit:'hp'},

  // ---- Length ----
  'mm': {cat:'Length', unit:'mm'}, 'millimeter': {cat:'Length', unit:'mm'}, 'millimetre': {cat:'Length', unit:'mm'},
  'cm': {cat:'Length', unit:'cm'}, 'centimeter': {cat:'Length', unit:'cm'}, 'centimetre': {cat:'Length', unit:'cm'},
  'm': {cat:'Length', unit:'m'}, 'meter': {cat:'Length', unit:'m'}, 'metre': {cat:'Length', unit:'m'},
  'meters': {cat:'Length', unit:'m'}, 'metres': {cat:'Length', unit:'m'},
  'km': {cat:'Length', unit:'km'}, 'kilometer': {cat:'Length', unit:'km'}, 'kilometre': {cat:'Length', unit:'km'},
  'in': {cat:'Length', unit:'in'}, 'inch': {cat:'Length', unit:'in'}, 'inches': {cat:'Length', unit:'in'},
  '"': {cat:'Length', unit:'in'},
  'ft': {cat:'Length', unit:'ft'}, 'foot': {cat:'Length', unit:'ft'}, 'feet': {cat:'Length', unit:'ft'},
  "'": {cat:'Length', unit:'ft'},
  'yd': {cat:'Length', unit:'yd'}, 'yard': {cat:'Length', unit:'yd'}, 'yards': {cat:'Length', unit:'yd'},
  'mile': {cat:'Length', unit:'mile'}, 'miles': {cat:'Length', unit:'mile'}, 'mi': {cat:'Length', unit:'mile'},

  // ---- Area ----
  'mm2': {cat:'Area', unit:'mm²'}, 'mm²': {cat:'Area', unit:'mm²'}, 'sq mm': {cat:'Area', unit:'mm²'},
  'm2': {cat:'Area', unit:'m²'}, 'm²': {cat:'Area', unit:'m²'}, 'sq m': {cat:'Area', unit:'m²'},
  'sqm': {cat:'Area', unit:'m²'}, 'square meters': {cat:'Area', unit:'m²'},
  'in2': {cat:'Area', unit:'in²'}, 'in²': {cat:'Area', unit:'in²'}, 'sq in': {cat:'Area', unit:'in²'},
  'sqin': {cat:'Area', unit:'in²'}, 'square inches': {cat:'Area', unit:'in²'},
  'ft2': {cat:'Area', unit:'ft²'}, 'ft²': {cat:'Area', unit:'ft²'}, 'sq ft': {cat:'Area', unit:'ft²'},
  'sqft': {cat:'Area', unit:'ft²'}, 'sf': {cat:'Area', unit:'ft²'}, 'square feet': {cat:'Area', unit:'ft²'},
  'yd2': {cat:'Area', unit:'yd²'}, 'yd²': {cat:'Area', unit:'yd²'}, 'sq yd': {cat:'Area', unit:'yd²'},

  // ---- Volume ----
  'l': {cat:'Volume', unit:'L'}, 'liter': {cat:'Volume', unit:'L'}, 'litre': {cat:'Volume', unit:'L'},
  'liters': {cat:'Volume', unit:'L'}, 'litres': {cat:'Volume', unit:'L'},
  'm3': {cat:'Volume', unit:'m³'}, 'm³': {cat:'Volume', unit:'m³'},
  'cubic meters': {cat:'Volume', unit:'m³'}, 'cu m': {cat:'Volume', unit:'m³'},
  'gal': {cat:'Volume', unit:'gal (US)'}, 'gallon': {cat:'Volume', unit:'gal (US)'},
  'gallons': {cat:'Volume', unit:'gal (US)'}, 'us gal': {cat:'Volume', unit:'gal (US)'},
  'gal us': {cat:'Volume', unit:'gal (US)'},
  'gal imp': {cat:'Volume', unit:'gal (Imp)'}, 'imp gal': {cat:'Volume', unit:'gal (Imp)'},
  'gal uk': {cat:'Volume', unit:'gal (Imp)'}, 'uk gal': {cat:'Volume', unit:'gal (Imp)'},
  'ft3': {cat:'Volume', unit:'ft³'}, 'ft³': {cat:'Volume', unit:'ft³'},
  'cu ft': {cat:'Volume', unit:'ft³'}, 'cubic feet': {cat:'Volume', unit:'ft³'},
  'in3': {cat:'Volume', unit:'in³'}, 'in³': {cat:'Volume', unit:'in³'},
  'cu in': {cat:'Volume', unit:'in³'}, 'cubic inches': {cat:'Volume', unit:'in³'},

  // ---- Mass ----
  'g': {cat:'Mass', unit:'g'}, 'gram': {cat:'Mass', unit:'g'}, 'grams': {cat:'Mass', unit:'g'},
  'kg': {cat:'Mass', unit:'kg'}, 'kilogram': {cat:'Mass', unit:'kg'}, 'kilograms': {cat:'Mass', unit:'kg'},
  'tonne': {cat:'Mass', unit:'tonne (metric)'}, 'tonnes': {cat:'Mass', unit:'tonne (metric)'},
  'metric ton': {cat:'Mass', unit:'tonne (metric)'}, 't': {cat:'Mass', unit:'tonne (metric)'},
  'lb': {cat:'Mass', unit:'lb'}, 'lbs': {cat:'Mass', unit:'lb'}, 'pound': {cat:'Mass', unit:'lb'},
  'pounds': {cat:'Mass', unit:'lb'},
  'oz': {cat:'Mass', unit:'oz'}, 'ounce': {cat:'Mass', unit:'oz'}, 'ounces': {cat:'Mass', unit:'oz'},
  'short ton': {cat:'Mass', unit:'ton (short)'}, 'us ton': {cat:'Mass', unit:'ton (short)'},

  // ---- Temperature ----
  'c': {cat:'Temperature', unit:'°C'}, '°c': {cat:'Temperature', unit:'°C'},
  'degc': {cat:'Temperature', unit:'°C'}, 'deg c': {cat:'Temperature', unit:'°C'},
  'celsius': {cat:'Temperature', unit:'°C'}, 'centigrade': {cat:'Temperature', unit:'°C'},
  'f': {cat:'Temperature', unit:'°F'}, '°f': {cat:'Temperature', unit:'°F'},
  'degf': {cat:'Temperature', unit:'°F'}, 'deg f': {cat:'Temperature', unit:'°F'},
  'fahrenheit': {cat:'Temperature', unit:'°F'},
  'k': {cat:'Temperature', unit:'K'}, 'kelvin': {cat:'Temperature', unit:'K'},
  'r': {cat:'Temperature', unit:'°R'}, '°r': {cat:'Temperature', unit:'°R'},
  'rankine': {cat:'Temperature', unit:'°R'}, 'deg r': {cat:'Temperature', unit:'°R'}
};

function resolveUnit(raw) {
  if (!raw) return null;
  let s = raw.toLowerCase().trim();
  s = s.replace(/\s+/g, ' ').replace(/\.$/, '');
  if (UNIT_ALIASES[s]) return UNIT_ALIASES[s];
  const s2 = s.replace(/[.\s]+$/g, '');
  if (UNIT_ALIASES[s2]) return UNIT_ALIASES[s2];
  const s3 = s.replace(/\s+/g, '');
  if (UNIT_ALIASES[s3]) return UNIT_ALIASES[s3];
  return null;
}

function parseSmartInput(text) {
  if (!text) return null;
  const t = text.trim();
  if (!t) return null;
  const m = t.match(/^([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(.*)$/);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!isFinite(value)) return null;
  const unitRaw = (m[2] || '').trim();
  if (!unitRaw) return { value, resolved: null, unitRaw: '' };
  const resolved = resolveUnit(unitRaw);
  return { value, resolved, unitRaw };
}

function convertValue(value, cat, fromUnit, toUnit) {
  const q = QTYS[cat];
  if (!q) return NaN;
  if (cat === 'Temperature') {
    const k = q.units[fromUnit].to(value);
    return q.units[toUnit].from(k);
  }
  const base = value * q.units[fromUnit].f;
  return base / q.units[toUnit].f;
}

function fmtConv(v) {
  if (!isFinite(v)) return '—';
  if (v === 0) return '0';
  // Integers keep full precision; only decimals are rounded to 3 sig figs.
  if (Number.isInteger(v)) return v.toLocaleString('en-US');
  const abs = Math.abs(v);
  if (abs >= 1000) {
    return Number(v.toPrecision(3)).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  const decimals = Math.max(0, 2 - Math.floor(Math.log10(abs)));
  return Number(v.toFixed(decimals)).toLocaleString('en-US', { maximumFractionDigits: decimals });
}

/* -----------------------------------------------------------
   Knowledge base — tools, coming-soon, and design references.
   Each entry has rich `keywords` so plain-English questions
   can be matched even when the user's wording doesn't exactly
   match the title.
   ----------------------------------------------------------- */
const INDEX = [
  // ---- LIVE TOOLS ----
  {
    kind: 'tool', section: 'HVAC',
    title: 'Ductwork Sizing Calculator',
    desc:  'Size round or rectangular duct from any two of flow, diameter, velocity, or head loss.',
    url:   'SubTools/Duct_Sizer.html',
    keywords: ['duct','ducts','ductwork','sizing','size','supply','return','exhaust','round','rectangular',
               'flow','cfm','velocity','fpm','friction','pressure drop','head loss','static pressure',
               'air','hvac','smacna','aspect ratio','equivalent diameter','reynolds','darcy','swamee']
  },
  {
    kind: 'tool', section: 'HVAC',
    title: 'VAV Box Sizing Calculator',
    desc:  'Min, 2,000 FPM (preferred) and 80% max CFM/L/s for EH Price SDV terminal units (sizes 4–16 + 24×16). Sizes at 2,000 FPM and never below Size 6.',
    url:   'SubTools/VAV_Sizer.html',
    keywords: ['vav','vav box','vavs','terminal unit','terminal','terminal units','inlet','inlet size','box',
               'box size','size 4','size 5','size 6','size 7','size 8','size 9','size 10','size 12',
               'size 14','size 16','24x16','24×16','cfm','l/s','lps','airflow','air flow','flow range',
               'price','eh price','sdv','80% max flow','2000 fpm','2,000 fpm','duct reducer','preferred selection',
               'min cfm','max cfm','range','single duct','vav sizing']
  },
  {
    kind: 'tool', section: 'HVAC',
    title: 'Louver Sizing Calculator',
    desc:  'Size intake and exhaust louvers by free-area velocity and pressure-drop budget with trial W×H check.',
    url:   'SubTools/Louver_Sizer.html',
    keywords: ['louver','louvers','intake','exhaust','outdoor air','oa','free area','free-area velocity',
               'fpm','rain control','water penetration','drainable','j-blade','wind-driven rain','storm louver',
               'acoustic louver','amca','amca 500-l','amca 511','pressure drop','dp','in wg','combustion air',
               'wall opening','grille','hvac','sizing','width','height']
  },

  // ---- COMING SOON ----
  {
    kind: 'tool', section: 'HVAC',
    title: 'Room Load Estimator',
    desc:  'Block load for sensible and latent cooling and heating with envelope, infiltration, and occupancy inputs.',
    url:   'SubTools/Room_Load.html',
    keywords: ['load','loads','cooling load','heating load','block load','sensible','latent','btuh',
               'envelope','infiltration','occupancy','room','zone','peak','ashrae','design day']
  },
  {
    kind: 'tool', section: 'HVAC',
    title: 'Coil & Fan Selector',
    desc:  'Pre-selection helper for cooling/heating coils and fan operating points.',
    url:   'SubTools/Coil_Fan_Selector.html',
    keywords: ['coil','coils','fan','fans','blower','operating point','selection','chilled water',
               'hot water','dx','cooling coil','heating coil','cfm','tsp','amca','equipment']
  },
  {
    kind: 'tool', section: 'HVAC',
    title: 'Heating Loop Sizing',
    desc:  'Build hydronic heating loops and get branch & main pipe sizes from cumulative load. Save to Excel for reload, print to PDF.',
    url:   'SubTools/Heating_Loop_Sizing.html',
    keywords: ['heating loop','heating loops','loop sizing','hydronic loop','hydronic','heating water',
               'heat pipe','heating pipe','reheat coil','rhc','radiation','radiator','baseboard',
               'unit heater','uh','heat pump','hp','ahu','air handler','erv','fcu','fan coil',
               'glycol','propylene glycol','ethylene glycol','pg','eg','mbh','kw','gpm','l/s','lps',
               'flow','pipe size','branch','trunk','return','supply','cumulative','sensible',
               'equation factor','delta t','dt','reheat','hvac','main','riser','xlsx','excel',
               'save','load','pdf','report']
  },
  {
    kind: 'tool', section: 'HVAC',
    title: 'Fan Static Pressure Calculator',
    desc:  'Build multiple fan systems, sum pressure components by qty × unit drop, and get a Greenheck product family recommendation per system. Save to Excel for reload, print to PDF.',
    url:   'SubTools/Fan_Static_Calculator.html',
    keywords: ['fan','fans','fan static','fan static pressure','static pressure','tsp','esp','total static',
               'external static','greenheck','caps','fan selection','fan curve','system curve',
               'g','gb','qei','qeid','cue','cube','rbumo','taub','fj','bcsw','sq','bsq','sp-a','csp',
               'apd','plg','plenum','plug','usf','fpb','rsf','rsq','rv','rve','se','sbe','ss','sbs',
               'roof exhaust','wall exhaust','inline','ducted','mixed flow','mixed-flow','centrifugal',
               'axial','grease','kitchen hood','fume','lab','corrosive','high temp','smoke','industrial',
               'silencer','sound attenuator','balancing damper','motorized damper','fire smoke damper',
               'fsd','vav','vav box','vav boxes','airflow','cfm','l/s','lps','pa','in.w.g.','iwc',
               'duct friction','elbow','elbows','takeoff','takeoffs','fitting','fittings','diffuser',
               'grille','register','safety factor','pressure drop','component','components','hvac',
               'exhaust fan','supply fan','return fan','makeup air','transfer fan','xlsx','excel',
               'save','load','pdf','report','print']
  },
  {
    kind: 'tool', section: 'Plumbing',
    title: 'Pipe Sizing Calculator',
    desc:  'Multi-mode pipe sizer: hydronics, sanitary DFU, domestic hot/cold via Hunter’s curve, and storm drainage.',
    url:   'SubTools/pipe-sizer.html',
    keywords: ['pipe','piping','pipe sizer','pipe sizing','hydronic','hydronics','water','glycol',
               'chilled water','hot water','copper','steel','pex','cpvc','flow rate','gpm','velocity',
               'pressure drop','head loss','hazen williams','hazen-williams','sanitary','dfu',
               'drainage fixture unit','ipc','710.1','soil','waste','vent','domestic water','wsfu',
               'water supply fixture unit','hunter','hunters curve','flushometer','flush tank',
               'storm','storm drain','rainwater','leader','mannings','manning equation','plumbing']
  },
  {
    kind: 'tool', section: 'Plumbing',
    title: 'Fixture Unit Calculator',
    desc:  'Roll up DFUs and WSFUs and convert to design flow via Hunter’s curve.',
    url:   'SubTools/Fixture_Unit_Calc.html',
    keywords: ['fixture','fixtures','dfu','wsfu','drainage fixture unit','water supply fixture unit',
               'hunters curve','plumbing','demand','peak flow','npc','plumbing code']
  },
  {
    kind: 'tool', section: 'Plumbing',
    title: 'Natural Gas Pipe Sizer',
    desc:  'Longest-length method per CSA B149.1 with multi-branch demand schedule.',
    url:   'SubTools/Gas_Pipe_Sizer.html',
    keywords: ['gas','natural gas','nat gas','propane','pipe','sizing','b149','csa b149','longest length',
               'btuh','mbh','plumbing','demand']
  },
  {
    kind: 'tool', section: 'Fire',
    title: 'Sprinkler Hydraulic Check',
    desc:  'Remote-area pressure/flow check against an available supply curve.',
    url:   'SubTools/Sprinkler_Hydraulic.html',
    keywords: ['sprinkler','sprinklers','fire','fire protection','hydraulic','remote area','design density',
               'gpm','psi','supply curve','nfpa 13','suppression','wet system','dry system']
  },
  {
    kind: 'tool', section: 'Energy',
    title: 'Psychrometric Lookup',
    desc:  'Dry-bulb, wet-bulb, dew point, enthalpy, and humidity ratio at any state.',
    url:   'SubTools/Psychrometric.html',
    keywords: ['psychrometric','psychrometrics','dry bulb','wet bulb','dew point','enthalpy','humidity',
               'humidity ratio','air','moisture','elevation','altitude','ashrae']
  },
  {
    kind: 'tool', section: 'Calculations',
    title: 'Math Scratchpad',
    desc:  'Engineering paper with unit-aware live math and PDF export.',
    url:   'SubTools/Math_Scratchpad.html',
    keywords: ['math','scratchpad','calculator','calc','calculation','calculations','paper','notepad',
               'scratch','units','unit-aware','formula','equation','equations','sensible','latent','total',
               'cfm','gpm','btu','mbh','psi','kpa','inwc','fpm','ach','air change','delta t','dt','pdf',
               'variables','expression','math.js','workspace','engineering math'],
  },
  {
    kind: 'tool', section: 'Calculations',
    title: 'Unit Converter',
    desc:  'Flow, pressure, velocity, energy, and temperature — Imperial ↔ SI.',
    url:   'SubTools/Unit_Converter.html',
    keywords: ['unit','units','convert','conversion','imperial','si','metric','cfm','l/s','pascal',
               'inwc','kpa','psi','fpm','m/s','btu','kw']
  },

  // ---- DESIGN STANDARDS / REFERENCES (local files on X:) ----
  // Page lives at X:\Remedy Tool\Remedy_Tools.html → links resolve to ..\00 Codes\...
  // Clicking opens the folder (or PDF) in the user's default app.
  // Entries below are generated from the on-disk inventory of X:\00 Codes.

  // ----- ASHRAE -----
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 180-2018 — Inspection & Maintenance of HVAC',
    desc:'Standard practice for inspection and maintenance of commercial building HVAC systems.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 180 - 2018/Standard 180-2018 -- Standard Practice for Inspection and Maintenance of Commercial Building HVAC Systems.pdf',
    keywords:['ashrae 180','maintenance','inspection','hvac maintenance','commissioning'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 189.1-2009 — High-Performance Green Buildings',
    desc:'Design of high-performance green buildings.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 189.1 - 2009/ASHRAE Standard 189.1-2009 High-Performance Green Buildings.pdf',
    keywords:['ashrae 189.1','189.1','green building','sustainable','high performance','leed'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 189.1-2011 — High-Performance Green Buildings',
    desc:'Design of high-performance green buildings.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 189.1 - 2011/ASHRAE Standard 189.1-2011 High-Performance Green Buildings.pdf',
    keywords:['ashrae 189.1','189.1','green building','sustainable','high performance','leed'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE Guideline 36-2018 — High-Performance Sequences',
    desc:'High-performance sequences of operation for HVAC systems.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 36 - 2018/ASHRAE Guideline 36 - High Performance Sequences of Operation for HVAC.pdf',
    keywords:['ashrae g36','guideline 36','sequence of operation','soo','controls','vav','ahu'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 55-2004 — Thermal Comfort',
    desc:'Thermal environmental conditions for human occupancy.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 55 - 2004/ASHRAE 55_2004 Thermal Environmental Conditiosn for Human Occupancy.pdf',
    keywords:['ashrae 55','thermal comfort','comfort','pmv','ppd','operative temperature'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 55-2010 — Thermal Comfort',
    desc:'Thermal environmental conditions for human occupancy.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 55 - 2010/ASHRAE-55-2010.pdf',
    keywords:['ashrae 55','thermal comfort','comfort','pmv','ppd','operative temperature'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 55-2013 — User Manual',
    desc:'User manual for ASHRAE Standard 55-2013.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 55 - 2013/ASHRAE 55 2013 User Manual.pdf',
    keywords:['ashrae 55','55 user manual','thermal comfort'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 55-2017 — Thermal Comfort',
    desc:'Thermal environmental conditions for human occupancy.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 55 - 2017/ASHRAE 55 2017.pdf',
    keywords:['ashrae 55','thermal comfort','comfort','pmv','ppd','operative temperature','occupant comfort'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62-2001 — Addendum n',
    desc:'Addendum n to ASHRAE Standard 62-2001.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2001/62-2001_Addendum-n.pdf',
    keywords:['ashrae 62','62.1','addendum n','ventilation','outdoor air'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62-2001 — Addendum y',
    desc:'Addendum y to ASHRAE Standard 62-2001.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2001/62-2001_Addendum-y.pdf',
    keywords:['ashrae 62','62.1','addendum y','ventilation'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2001 — Addenda A–E',
    desc:'Addenda A through E to ASHRAE 62.1-2001.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2001/ASHRAE 62.1-2001 - ADDENDUM AtoE.pdf',
    keywords:['ashrae 62.1','addenda','addendum','ventilation'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2001 — Addendum K',
    desc:'Addendum K to ASHRAE 62.1-2001.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2001/ASHRAE 62.1-2001 - ADDENDUM K.pdf',
    keywords:['ashrae 62.1','addendum k','ventilation'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2001 — Addendum N',
    desc:'Addendum N to ASHRAE 62.1-2001.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2001/ASHRAE 62.1-2001 - ADDENDUM N.pdf',
    keywords:['ashrae 62.1','addendum n','ventilation'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2001 — Addendum O',
    desc:'Addendum O to ASHRAE 62.1-2001.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2001/ASHRAE 62.1-2001 - ADDENDUM O.pdf',
    keywords:['ashrae 62.1','addendum o','ventilation'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2001 — Partial',
    desc:'Partial copy of ASHRAE 62.1-2001.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2001/ASHRAE 62.1-2001 - Partial.pdf',
    keywords:['ashrae 62.1','62.1-2001','ventilation','outdoor air'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2001 — Ventilation for IAQ',
    desc:'Minimum outdoor air rates (2001 edition).',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2001/ASHRAE 62.1-2001.pdf',
    keywords:['ashrae 62.1','62.1','iaq','ventilation','outdoor air','oa','fresh air','cfm per person'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62-2003 — Ventilation',
    desc:'Ventilation for acceptable indoor air quality (2003 edition).',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2003/Standard 62-2003.pdf',
    keywords:['ashrae 62','62-2003','ventilation','iaq','outdoor air'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2007 — Ventilation for IAQ',
    desc:'Minimum outdoor air rates (2007 edition).',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2007/ASHRAE 62.1-2007.pdf',
    keywords:['ashrae 62.1','62.1-2007','ventilation','iaq','outdoor air','fresh air'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2010 — Ventilation for IAQ',
    desc:'Minimum outdoor air rates (2010 edition).',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2010/ASHRAE 62.1-2010.pdf',
    keywords:['ashrae 62.1','62.1-2010','ventilation','iaq','outdoor air','fresh air'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2013 — Ventilation for IAQ',
    desc:'Minimum outdoor air rates (2013 edition).',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2013/ASHRAE 62.1-2013.pdf',
    keywords:['ashrae 62.1','62.1-2013','ventilation','iaq','outdoor air','fresh air'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2016 — Ventilation for IAQ',
    desc:'Minimum outdoor air rates (2016 edition).',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2016/ASHRAE 62.1-2016.pdf',
    keywords:['ashrae 62.1','62.1-2016','ventilation','iaq','outdoor air','fresh air','cfm per person'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 62.1-2016 — Animal Facilities Addenda',
    desc:'Animal facilities addenda to ASHRAE 62.1-2016.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 62.1 - 2016/ASHRAE 62.1_Addenda - Animal Facilities 2016.pdf',
    keywords:['ashrae 62.1','animal facility','vivarium','addendum','ventilation'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 90.1-2010 — Energy Standard (I-P)',
    desc:'Energy standard for buildings except low-rise residential (I-P edition).',
    url:'../00 Codes/00 ASHRAE/ASHRAE 90.1 - 2010/ASHRAE Standard 90.1-2010 I-P Edition.pdf',
    keywords:['ashrae 90.1','90.1','energy code','efficiency','envelope','lighting power density','commercial'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 90.1-2010 — Energy Standard (unlocked)',
    desc:'Energy standard for buildings (unlocked copy).',
    url:'../00 Codes/00 ASHRAE/ASHRAE 90.1 - 2010/AshraeStandard 90.1-2010_unlocked.pdf',
    keywords:['ashrae 90.1','90.1','energy code','efficiency'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE 90.1-2016 — Energy Standard for Buildings',
    desc:'Minimum energy-efficiency requirements for commercial buildings.',
    url:'../00 Codes/00 ASHRAE/ASHRAE 90.1 - 2016/ASHRAE-90.1 - 2016.pdf',
    keywords:['ashrae 90.1','90.1','energy code','efficiency','envelope','lpd','lighting power density','commercial'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE Fundamentals 2017 (Imperial)',
    desc:'Psychrometrics, climatic design conditions, fitting losses, properties (I-P).',
    url:'../00 Codes/00 ASHRAE/Fundamentals/ASHRAE Fundamentals - 2017 - Imperial.pdf',
    keywords:['ashrae handbook','fundamentals','psychrometric','climatic','design conditions','imperial','i-p'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE Fundamentals 2017 (SI)',
    desc:'Psychrometrics, climatic design conditions, fitting losses, properties (SI).',
    url:'../00 Codes/00 ASHRAE/Fundamentals/ASHRAE Fundamentals - 2017 - SI.pdf',
    keywords:['ashrae handbook','fundamentals','psychrometric','climatic','design conditions','si','metric'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE Fundamentals 2021',
    desc:'Psychrometrics, climatic design conditions, properties — 2021 handbook.',
    url:'../00 Codes/00 ASHRAE/Fundamentals/Fundamentals 2021.pdf',
    keywords:['ashrae handbook','fundamentals','psychrometric','climatic','2021'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE Fundamentals 2021 (I-P)',
    desc:'2021 fundamentals handbook, Imperial units.',
    url:'../00 Codes/00 ASHRAE/Fundamentals/I-P 2021.pdf',
    keywords:['ashrae handbook','fundamentals','2021','imperial','i-p'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE HVAC Applications Handbook 2015',
    desc:'Application-specific HVAC design — healthcare, labs, kitchens, data centers.',
    url:'../00 Codes/00 ASHRAE/Handbooks/2015-Ashrae-Handbook-Hvac-Applications-2015.pdf',
    keywords:['ashrae handbook','hvac applications','applications','healthcare','laboratory','kitchen','data center'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE HVAC Applications 2023 (I-P)',
    desc:'HVAC applications handbook, Imperial units.',
    url:'../00 Codes/00 ASHRAE/Handbooks/2023-HVAC APPLICATIONS-IP.pdf',
    keywords:['ashrae handbook','hvac applications','2023','imperial','i-p'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE HVAC Applications 2023 (SI)',
    desc:'HVAC applications handbook, SI units.',
    url:'../00 Codes/00 ASHRAE/Handbooks/2023-HVAC APPLICATIONS-SI.pdf',
    keywords:['ashrae handbook','hvac applications','2023','si','metric'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE HVAC Applications 2015 (Imperial)',
    desc:'2015 applications handbook, Imperial units.',
    url:'../00 Codes/00 ASHRAE/Handbooks/ASHRAE HVAC Applications Handbook - 2015 - Imperial.pdf',
    keywords:['ashrae handbook','hvac applications','2015','imperial'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE HVAC Applications 2015 (SI)',
    desc:'2015 applications handbook, SI units.',
    url:'../00 Codes/00 ASHRAE/Handbooks/ASHRAE HVAC Applications Handbook - 2015 - SI.pdf',
    keywords:['ashrae handbook','hvac applications','2015','si','metric'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE Refrigeration Handbook 2014 (SI)',
    desc:'Refrigeration systems, refrigerants, cold-storage design.',
    url:'../00 Codes/00 ASHRAE/Handbooks/ASHRAE Refrigeration Handbook  - 2014 - SI.pdf',
    keywords:['ashrae handbook','refrigeration','refrigerant','cold storage','ammonia','co2'] },
  { kind:'ref', section:'ASHRAE', title:'ASHRAE Systems & Equipment Handbook 2016 (SI)',
    desc:'System types, equipment selection, and design guidance.',
    url:'../00 Codes/00 ASHRAE/Handbooks/ASHRAE Systems and Equipment Handbook - 2016 - SI (1).pdf',
    keywords:['ashrae handbook','systems and equipment','equipment','ahu','vav','chiller','boiler','cooling tower'] },

  // ----- CSA -----
  { kind:'ref', section:'CSA', title:'CSA B139-2015 — Oil-Burning Equipment',
    desc:'Installation code for oil burning equipment (2015).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B139 - Installation Code for Oil Burning Equipment - 2015.pdf',
    keywords:['csa b139','oil burning','fuel oil','furnace','boiler oil'] },
  { kind:'ref', section:'CSA', title:'CSA B149 Handbook (2020)',
    desc:'Handbook companion to the CSA B149.1 gas installation code.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B149HB - Natural Gas and Propoane Handbook - 2020.pdf',
    keywords:['csa b149 handbook','b149hb','gas handbook','natural gas','propane'] },
  { kind:'ref', section:'CSA', title:'CSA B44-2007 — Elevator Code (Alberta Amendments)',
    desc:'Safety code for elevators and escalators, Alberta amendments.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B44 - Elevator Code with Alberta Amendments - 2007.pdf',
    keywords:['csa b44','elevator','escalator','lift'] },
  { kind:'ref', section:'CSA', title:'CSA B51-2006 — Boiler, Pressure Vessel & Piping',
    desc:'Pressure equipment safety regulation.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B51 - Pressure Equipment Safety Regulation - 2006.pdf',
    keywords:['csa b51','boiler','pressure vessel','pressure piping','asme'] },
  { kind:'ref', section:'CSA', title:'CSA B52-2005 — Mechanical Refrigeration Code',
    desc:'Mechanical refrigeration code (2005 edition).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B52 - Mechanical Refrig Code - 2005.pdf',
    keywords:['csa b52','refrigeration','ammonia','refrigerant','chiller'] },
  { kind:'ref', section:'CSA', title:'CSA B52 Handbook — Mechanical Refrigeration (2005)',
    desc:'Handbook companion to CSA B52.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B52HB - Mechanical Refrig Handbook - 2005.pdf',
    keywords:['csa b52 handbook','b52hb','refrigeration handbook'] },
  { kind:'ref', section:'CSA', title:'CSA B64.10-2007 — Backflow Preventers',
    desc:'Selection and installation of backflow preventers.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B64.10 B64.10.1 - Backflow preventers - 2007.pdf',
    keywords:['csa b64','backflow','backflow preventer','cross connection'] },
  { kind:'ref', section:'CSA', title:'CSA C282-2019 — Emergency Electrical Power',
    desc:'Emergency electrical-power supply for buildings.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA C282-19 - Emergency Electrical Power .pdf',
    keywords:['csa c282','emergency power','generator','life safety power'] },
  { kind:'ref', section:'CSA', title:'CSA W117.2-2014 — Welding Safety',
    desc:'Safety in welding, cutting and allied processes.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA W117.2 Safety in welding, cutting and allied processes - 2014.pdf',
    keywords:['csa w117','welding safety','cutting','hot work'] },
  { kind:'ref', section:'CSA', title:'CSA Z180.1-2005 — Compressed Breathing Air',
    desc:'Compressed breathing air and systems.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z180.1 - Compressed air breathing systems - 2005.pdf',
    keywords:['csa z180','breathing air','compressed air','scba'] },
  { kind:'ref', section:'CSA', title:'CSA Z275.1-2005 — Hyperbaric Facilities',
    desc:'Hyperbaric facilities standard.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z275.1 - Hyperbaric Facilities - 2005.pdf',
    keywords:['csa z275','hyperbaric','dive chamber','hyperbaric oxygen'] },
  { kind:'ref', section:'CSA', title:'CSA Z314-2023 — MDRD Standards',
    desc:'Medical device reprocessing standard.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z314-23 MDRD Standards.pdf',
    keywords:['csa z314','reprocessing','mdrd','medical device','sterilization'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.1-2016 — Plumbing in Healthcare',
    desc:'Plumbing requirements for healthcare facilities (2016).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.1 - Special requirements for plumbing installations in health care facilities - 2016.pdf',
    keywords:['csa z317.1','healthcare plumbing','hospital plumbing'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.1-2021 — Plumbing in Healthcare',
    desc:'Plumbing requirements for healthcare facilities (2021).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.1 2021 - Special Requirements for Plumbing Installations in Healthcare Facilities.pdf',
    keywords:['csa z317.1','healthcare plumbing','hospital plumbing','2021'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.1-21 — Plumbing in Healthcare',
    desc:'Plumbing requirements for healthcare facilities (Z317.1-21).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.1-21 - Special requirements for plumbing installaton in health care facilities.pdf',
    keywords:['csa z317.1','healthcare plumbing','hospital plumbing','2021'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.13-2017 — Infection Control During Construction',
    desc:'Infection control during construction and renovation of healthcare facilities.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.13-17 CL - Infection Control.pdf',
    keywords:['csa z317.13','icra','infection control','construction','healthcare renovation'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.1-2021 — Plumbing in Healthcare (Scan)',
    desc:'Scanned copy of Z317.1-2021 healthcare plumbing requirements.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.1_2021_Scan.pdf',
    keywords:['csa z317.1','healthcare plumbing','scan'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.2-2010 — HVAC in Healthcare',
    desc:'HVAC requirements for healthcare facilities (2010, mandated by AHC 2014).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.2 - 2010 Special Requirements for HVAC in Health Care Facilities (mandated by AHC 2014).pdf',
    keywords:['csa z317.2','healthcare hvac','hospital hvac','2010'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.2-2015 — HVAC in Healthcare',
    desc:'HVAC requirements for healthcare facilities (2015).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.2 - 2015 Special Requirements for HVAC In Health Care Facilities.pdf',
    keywords:['csa z317.2','healthcare hvac','hospital hvac','2015'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.2-2019 — HVAC in Healthcare (EN)',
    desc:'HVAC requirements for healthcare facilities (2019, English).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.2 - 2019 EN.pdf',
    keywords:['csa z317.2','healthcare hvac','hospital hvac','2019'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.2-2019 — HVAC in Healthcare',
    desc:'HVAC requirements for healthcare facilities (2019).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.2 - 2019 Special Requirements for HVAC in Health Care Facilities .pdf',
    keywords:['csa z317.2','healthcare hvac','hospital hvac','2019','operating room','isolation room'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.2-2019 — HVAC in Healthcare (Edited)',
    desc:'HVAC requirements for healthcare facilities (2019, edited).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.2 - 2019 Special Requirements for HVAC in Health Care Facilities edited .pdf',
    keywords:['csa z317.2','healthcare hvac','hospital hvac','2019 edited'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.2-2024 — HVAC in Healthcare',
    desc:'HVAC requirements for healthcare facilities (2024).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.2 - 2024 Special Requirements for HVAC Systems in health care facilities.pdf',
    keywords:['csa z317.2','healthcare hvac','hospital hvac','operating room','isolation room','2024'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.2 — HVAC in Healthcare (Misc.)',
    desc:'Additional CSA Z317.2 healthcare HVAC document.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z317.2-.pdf',
    keywords:['csa z317.2','healthcare hvac'] },
  { kind:'ref', section:'CSA', title:'CSA Z7396.1-2006 — Medical Gas (Obsolete)',
    desc:'Medical gas code (2006, outdated, reference only).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z7396-1 2006 (out dated for reference only) - Medical gas Code.pdf',
    keywords:['csa z7396','medical gas','obsolete','reference only'] },
  { kind:'ref', section:'CSA', title:'CSA Z7396.1-2012 — Medical Gas Pipelines',
    desc:'Medical gas pipeline systems (mandated by NBC-AE 2019).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z7396.1 2012 (Mandated by NBC-AE 2019) - Medical Gas Pipeline Systems Part 1.pdf',
    keywords:['csa z7396','medical gas','medical air','oxygen pipeline','vacuum','2012'] },
  { kind:'ref', section:'CSA', title:'CSA Z7396.1-2017 — Medical Gas Pipelines',
    desc:'Medical gas pipeline systems (mandated by NBC-AE 2023 after May 1 2024).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z7396.1 2017 (Mandated by NBC-AE 2023 after May 1 2024).pdf',
    keywords:['csa z7396','medical gas','medical air','oxygen pipeline','vacuum','hospital gas','2017'] },
  { kind:'ref', section:'CSA', title:'CSA Z7396.1-2017 — Medical Gas Pipelines (PDF Scan)',
    desc:'Scanned copy of Z7396.1-2017.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z7396.1 2017 (Mandated by NBC-AE 2023 after May 1 2024)_PDF.pdf',
    keywords:['csa z7396','medical gas','2017 scan'] },
  { kind:'ref', section:'CSA', title:'CSA Z7396.1-22 — Medical Gas (Not Mandated)',
    desc:'Medical gas pipeline systems (2022, NOT mandated by NBC-AE 2023).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z7396.1-22 (NOT MANDATED BY NBC AE 2023).pdf',
    keywords:['csa z7396','medical gas','2022','not mandated'] },
  { kind:'ref', section:'CSA', title:'CSA Z7396.1-2009 — Medical Gas Pipelines',
    desc:'Medical gas pipeline systems (mandated by ABC 2014).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z7396.1_2009 (mandated by ABC 2014) - Medical Gas Pipeline  Systems.pdf',
    keywords:['csa z7396','medical gas','2009','abc 2014'] },
  { kind:'ref', section:'CSA', title:'CSA Z8000-2018 — Canadian Healthcare Facilities',
    desc:'Planning, design and construction of Canadian healthcare facilities.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA Z8000 - Canadian Health Care Facilities - 2018.pdf',
    keywords:['csa z8000','healthcare facility','hospital design','health care facility'] },
  { kind:'ref', section:'CSA', title:'CSA B128.1 — Non-Potable Water Systems',
    desc:'Design and installation of non-potable water systems.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA-B128.1 - Design and Install of non-potable water systems.pdf',
    keywords:['csa b128','non-potable','greywater','rainwater','reclaimed water'] },
  { kind:'ref', section:'CSA', title:'CSA B365-2017 — Solid-Fuel-Burning Appliances',
    desc:'Installation code for solid-fuel-burning appliances and equipment.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/B365-17 Installation code for solid fuel burning appliances and equipment/2425192.pdf',
    keywords:['csa b365','solid fuel','wood stove','fireplace'] },
  { kind:'ref', section:'CSA', title:'CSA B149 — Canadian Gas Code (Obsolete)',
    desc:'Older Canadian gas code edition (obsolete).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/Canadian Gas Code - Obsolete/Canadian Gas Code B149.pdf',
    keywords:['csa b149','canadian gas code','obsolete','natural gas','propane'] },
  { kind:'ref', section:'CSA', title:'CSA B139-2019 — Oil-Burning Equipment (Scan)',
    desc:'Installation code for oil-burning equipment, scanned copy.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B-139-19 Installation Code For Oil Burning Equipment/2426329.pdf',
    keywords:['csa b139','oil burning','fuel oil','2019'] },
  { kind:'ref', section:'CSA', title:'CSA B139-2019 — Oil-Burning Equipment',
    desc:'Installation code for oil-burning equipment (2019).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B-139-19 Installation Code For Oil Burning Equipment/CSA B139 - Installation Code for Oil Burning Equipment - 2019.pdf',
    keywords:['csa b139','oil burning','fuel oil','furnace','boiler oil','2019'] },
  { kind:'ref', section:'CSA', title:'CSA B149.1-2020 — Gas Installation (Scan)',
    desc:'Natural gas and propane installation code, scanned copy.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B149-1-20 - Natural gas and propane installation code/2427296.pdf',
    keywords:['csa b149','natural gas','propane','gas code'] },
  { kind:'ref', section:'CSA', title:'CSA B149.1-20 — Clause 4.14 Accessibility',
    desc:'Excerpt: B149.1-20 clause 4.14 accessibility requirements.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B149-1-20 - Natural gas and propane installation code/4.14 Accessibility.pdf',
    keywords:['csa b149','accessibility','clause 4.14','gas code'] },
  { kind:'ref', section:'CSA', title:'CSA B149.1-20 — Gas Installation (Searchable)',
    desc:'Natural gas and propane installation code, mostly searchable copy.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B149-1-20 - Natural gas and propane installation code/CSA B149-1-20 [Mostly Searchable].pdf',
    keywords:['csa b149','natural gas','propane','gas code','searchable'] },
  { kind:'ref', section:'CSA', title:'CSA B149.1-2020 — Natural Gas & Propane Code',
    desc:'Governing gas installation code in Canada.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B149-1-20 - Natural gas and propane installation code/CSA B149-1-20.pdf',
    keywords:['csa b149','b149.1','natural gas','propane','gas code','gas installation','venting'] },
  { kind:'ref', section:'CSA', title:'CSA B149.1-2015 — Natural Gas & Propane Code',
    desc:'Natural gas and propane installation code (2015 edition).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B149-1-20 - Natural gas and propane installation code/CSA B149.1-15 - Natural gas and propane installation code.pdf',
    keywords:['csa b149','b149.1-15','natural gas','propane','2015'] },
  { kind:'ref', section:'CSA', title:'Gas Safety Information Bulletin',
    desc:'Gas safety information bulletin (Alberta).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B149-1-20 - Natural gas and propane installation code/gas safety information bulletin.pdf',
    keywords:['gas safety','bulletin','alberta','b149'] },
  { kind:'ref', section:'CSA', title:'Alberta STANDATA — Gas Interpretation 25-GCI-002 (Mar 2026)',
    desc:'STANDATA gas-code interpretation, March 2026.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B149-1-20 - Natural gas and propane installation code/ma-standata-interpretation-gas-25-gci-002-2026-03.pdf',
    keywords:['standata','gas interpretation','gci','alberta','b149'] },
  { kind:'ref', section:'CSA', title:'CSA B149 Handbook 2020 (Scan)',
    desc:'CSA B149.1 handbook (2020) — scanned copy.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B149HB 20/2427740 (2).pdf',
    keywords:['csa b149 handbook','b149hb','gas handbook','scan'] },
  { kind:'ref', section:'CSA', title:'CSA B149 Handbook 2020',
    desc:'Handbook companion to the CSA B149.1 gas installation code.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B149HB 20/CSA B149HB 20.pdf',
    keywords:['csa b149 handbook','b149hb','gas handbook','natural gas','propane'] },
  { kind:'ref', section:'CSA', title:'CAN/ULC-S1001-11 — Integrated Systems Testing',
    desc:'CAN/ULC-S1001 — integrated systems testing of fire-protection and life-safety systems.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B214/CAN-ULC-S1001-11-EN_1.pdf',
    keywords:['can/ulc-s1001','ulc s1001','integrated systems testing','ist','life safety'] },
  { kind:'ref', section:'CSA', title:'CSA B52-2018 — Mechanical Refrigeration Code',
    desc:'Mechanical refrigeration code (2018).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B52-18 Mechanical Refrigeration Code/2426631.pdf',
    keywords:['csa b52','refrigeration','ammonia','2018'] },
  { kind:'ref', section:'CSA', title:'CSA B52-2023 — Mechanical Refrigeration Code',
    desc:'Mechanical refrigeration code (2023).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B52-2023 Mechanical Refrigeration Code/B52-2023.pdf',
    keywords:['csa b52','refrigeration','ammonia','refrigerant','chiller','2023'] },
  { kind:'ref', section:'CSA', title:'CSA B52-2023 — Refrigeration Code (Searchable)',
    desc:'Mechanical refrigeration code (2023, searchable).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B52-2023 Mechanical Refrigeration Code/CSA B52-23 - Searchable.pdf',
    keywords:['csa b52','refrigeration','2023','searchable'] },
  { kind:'ref', section:'CSA', title:'Alberta STANDATA — B52 Variance 23-BCV-009 (Oct 2024)',
    desc:'STANDATA variance for CSA B52-2023.',
    url:'../00 Codes/00 CSA - Canadian Standards Association/CSA B52-2023 Mechanical Refrigeration Code/ma-standata-variance-building-23-bcv-009-2024-10.pdf',
    keywords:['standata','b52 variance','bcv','alberta'] },
  { kind:'ref', section:'CSA', title:'CSA B44-2002 — Elevator Code (Obsolete)',
    desc:'Safety code for elevators and escalators (2002, obsolete).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/Obsolete/CSA B44 - Elevator Code - 2002.pdf',
    keywords:['csa b44','elevator','obsolete','2002'] },
  { kind:'ref', section:'CSA', title:'CSA Z317.1-2009 — Plumbing in Healthcare (Obsolete)',
    desc:'Plumbing in healthcare facilities (2009, obsolete).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/Obsolete/CSA Z317.1 - Special requirements for plumbing installations in health care facilities - 2009.pdf',
    keywords:['csa z317.1','healthcare plumbing','obsolete','2009'] },
  { kind:'ref', section:'CSA', title:'CSA Z8000-2011 — Healthcare Facilities (Obsolete)',
    desc:'Canadian healthcare facilities (2011, obsolete).',
    url:'../00 Codes/00 CSA - Canadian Standards Association/Obsolete/CSA Z8000 - Canadian Health Care Facilities - 2011.pdf',
    keywords:['csa z8000','healthcare facility','obsolete','2011'] },

  // ----- NBC-AE (Alberta Building Code) -----
  { kind:'ref', section:'Code', title:'NBC-AE 2014 — Alberta Building Code',
    desc:'National Building Code of Canada, Alberta Edition (2014).',
    url:'../00 Codes/00 NBC-AE - Alberta Building Code/NBC-AE - 2014/NBC-AE - National Building Code Alberta Edition - 2014.pdf',
    keywords:['nbc','nbc-ae','national building code','alberta building code','abc','2014','part 3','part 6'] },
  { kind:'ref', section:'Code', title:'NBC-AE 2019 — Alberta Building Code',
    desc:'National Building Code of Canada, Alberta Edition (2019).',
    url:'../00 Codes/00 NBC-AE - Alberta Building Code/NBC-AE - 2019/NBC-AE - National Building Code Alberta Edition - 2019.pdf',
    keywords:['nbc','nbc-ae','national building code','alberta building code','abc','2019','part 3','part 6','occupancy'] },

  // ----- NECB (National Energy Code) -----
  { kind:'ref', section:'NECB', title:'NECB 2011 — National Energy Code',
    desc:'National Energy Code of Canada for Buildings (2011, updated 2014).',
    url:'../00 Codes/00 NECB - National Energy Code/NECB 2011/National Energy Code for Buildings 2011 (NECB) 2014.pdf',
    keywords:['necb','national energy code','energy code','canada','2011'] },
  { kind:'ref', section:'NECB', title:'NECB 2015 — National Energy Code (Vol. 1)',
    desc:'National Energy Code of Canada for Buildings (2015, Volume 1).',
    url:'../00 Codes/00 NECB - National Energy Code/NECB 2015/2015NECB-V1_National_Energy_Code_of_Canada_for_Buildings.pdf',
    keywords:['necb','national energy code','energy code','canada','2015'] },
  { kind:'ref', section:'NECB', title:'NECB 2017 — National Energy Code',
    desc:'National Energy Code of Canada for Buildings (2017).',
    url:'../00 Codes/00 NECB - National Energy Code/NECB 2017/necb2017_2p.pdf',
    keywords:['necb','national energy code','energy code','canada','2017'] },
  { kind:'ref', section:'NECB', title:'NECB 2020 — National Energy Code',
    desc:'National Energy Code of Canada for Buildings (2020).',
    url:'../00 Codes/00 NECB - National Energy Code/NECB 2020/NECB2020_p1.pdf',
    keywords:['necb','national energy code','energy code','canada','2020'] },
  { kind:'ref', section:'NECB', title:'NECB 2025 — National Energy Code',
    desc:'National Energy Code of Canada for Buildings (2025).',
    url:'../00 Codes/00 NECB - National Energy Code/NECB 2025/NECB - National Energy Code of Canada for Buildings - 2025.pdf',
    keywords:['necb','national energy code','energy code','canada','2025'] },

  // ----- NFC-AE (Alberta Fire Code) -----
  { kind:'ref', section:'Code', title:'NFC-AE 2019 — Alberta Fire Code',
    desc:'National Fire Code of Canada, Alberta Edition (2019, unlocked).',
    url:'../00 Codes/00 NFC-AE - Alberta Fire Code/NFC-AE - 2019/National Fire Code - Alberta Edition - 2019 (Unlocked).pdf',
    keywords:['nfc','nfc-ae','national fire code','alberta fire code','fire code','afc','2019'] },
  { kind:'ref', section:'Code', title:'NFC-AE 2023 — Alberta Fire Code',
    desc:'National Fire Code of Canada, Alberta Edition (2023).',
    url:'../00 Codes/00 NFC-AE - Alberta Fire Code/NFC-AE - 2023/National Fire Code - Alberta Edition - 2023.pdf',
    keywords:['nfc','nfc-ae','national fire code','alberta fire code','fire code','afc','2023'] },

  // ----- NFPA -----
  { kind:'ref', section:'NFPA', title:'NFPA — Medical Gas Cylinder Storage (2018)',
    desc:'NFPA guidance on medical gas cylinder storage.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA - 2018 - Medical Gas Cylinder Storage.pdf',
    keywords:['nfpa','medical gas','cylinder storage','healthcare'] },
  { kind:'ref', section:'NFPA', title:'NFPA 10-2013 — Portable Fire Extinguishers',
    desc:'Selection, installation, and maintenance of portable fire extinguishers (2013).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 10 - 2013 - Standard for Portable Fire Extinguishers.pdf',
    keywords:['nfpa 10','fire extinguisher','portable','extinguisher','2013'] },
  { kind:'ref', section:'NFPA', title:'NFPA 10-2018 — Portable Fire Extinguishers',
    desc:'Selection, installation, and maintenance of portable fire extinguishers (2018).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 10 - 2018 - Standard for Portable Fire Extinguishers.pdf',
    keywords:['nfpa 10','fire extinguisher','portable','extinguisher','2018'] },
  { kind:'ref', section:'NFPA', title:'NFPA 101-2012 — Life Safety Code',
    desc:'Life Safety Code — egress, occupancy, fire protection (2012).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 101 - 2012 - Life Safety Code.pdf',
    keywords:['nfpa 101','life safety','egress','occupancy','exit','2012'] },
  { kind:'ref', section:'NFPA', title:'NFPA 101-2018 — Life Safety Code',
    desc:'Life Safety Code — egress, occupancy, fire protection (2018).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 101 - 2018 - Life Safety Code.pdf',
    keywords:['nfpa 101','life safety','egress','occupancy','exit','2018'] },
  { kind:'ref', section:'NFPA', title:'NFPA 12-2015 — Carbon Dioxide Extinguishing',
    desc:'CO2 fire-suppression systems.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 12 - 2015 - Standard for Carbon Dioxide Extinguishing Systems.pdf',
    keywords:['nfpa 12','co2','carbon dioxide','suppression','clean agent'] },
  { kind:'ref', section:'NFPA', title:'NFPA 12A-2015 — Halon 1301 Systems',
    desc:'Halon 1301 fire-extinguishing systems.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 12A - 2015 - Standard on Halon 1301 Fire Extinguishing Systems.pdf',
    keywords:['nfpa 12a','halon','halon 1301','clean agent','suppression'] },
  { kind:'ref', section:'NFPA', title:'NFPA 13-2013 — Sprinkler Systems Installation',
    desc:'Design and installation of sprinkler systems (2013).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 13 - 2013 - Standard for the Installation of Sprinkler Systems.pdf',
    keywords:['nfpa 13','sprinkler','fire protection','design density','hazard','2013'] },
  { kind:'ref', section:'NFPA', title:'NFPA 13-2016 — Sprinkler Systems Installation',
    desc:'Design and installation of sprinkler systems (2016).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 13 - 2016 - Standard for the Installation of Sprinkler Systems.pdf',
    keywords:['nfpa 13','sprinkler','sprinklers','fire protection','design density','hazard','light hazard','ordinary hazard','remote area','wet system','dry system','2016'] },
  { kind:'ref', section:'NFPA', title:'NFPA 13D-2013 — Sprinklers in 1- & 2-Family Dwellings',
    desc:'Residential sprinkler systems in one- and two-family dwellings.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 13D - 2013 - One and Two Family Dewllings and Manufactured Homes.pdf',
    keywords:['nfpa 13d','residential sprinkler','dwelling','single family','manufactured home'] },
  { kind:'ref', section:'NFPA', title:'NFPA 13E-2013 — Fire Dept. Sprinkler Operations',
    desc:'Recommended practice for fire department operations in sprinkler-protected properties.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 13E - 2013 - Recommended Practice for Fire Department Operations in Propertied Protected by Sprinkler and Standpipe Systems.pdf',
    keywords:['nfpa 13e','fire department','sprinkler operations','standpipe'] },
  { kind:'ref', section:'NFPA', title:'NFPA 13E-2013 — Fire Dept. Sprinkler Operations (Alt.)',
    desc:'Recommended practice for fire department operations (alternate copy).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 13E - 2013 - Recommended Practive for Fire Department Operations in Propertied Protected by Sprinkler and Standpipe Systems.pdf',
    keywords:['nfpa 13e','fire department','sprinkler operations','standpipe'] },
  { kind:'ref', section:'NFPA', title:'NFPA 13R-2013 — Sprinklers in Low-Rise Residential',
    desc:'Sprinklers in residential occupancies up to four stories.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 13R - 2013 - Standard for the Installation of Sprinkler Systems in Low-Rise Residential Occupancies.pdf',
    keywords:['nfpa 13r','residential sprinkler','low-rise','multi-family'] },
  { kind:'ref', section:'NFPA', title:'NFPA 14-2013 — Standpipe & Hose Systems',
    desc:'Design and installation of standpipe systems.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 14 - 2013 - Standard for the Installation of Standpipe and Hose Systems.pdf',
    keywords:['nfpa 14','standpipe','hose','class i','class ii','class iii','fire protection'] },
  { kind:'ref', section:'NFPA', title:'NFPA 20-2013 — Stationary Fire Pumps',
    desc:'Installation of stationary fire pumps (2013).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 20 -  2013 - Standard for the Installation of Stationary Pumps for Fire Protection.pdf',
    keywords:['nfpa 20','fire pump','pump','jockey pump','fire protection','2013'] },
  { kind:'ref', section:'NFPA', title:'NFPA 20-2016 — Stationary Fire Pumps',
    desc:'Installation of stationary fire pumps (2016).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 20 - 2016 - Standard for the Installation of Stationary Pumps for Fire Protection.pdf',
    keywords:['nfpa 20','fire pump','pump','jockey pump','fire protection','centrifugal','2016'] },
  { kind:'ref', section:'NFPA', title:'NFPA 22-2018 — Water Tanks for Fire Protection',
    desc:'Water tanks for private fire protection.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 22 - 2018 - Standard for Water Tanks for Private Fire Protection.pdf',
    keywords:['nfpa 22','water tank','reservoir','fire protection water supply'] },
  { kind:'ref', section:'NFPA', title:'NFPA 24-2007 — Private Fire Service Mains',
    desc:'Installation of private fire service mains and their appurtenances.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 24 - 2007 - Standard for the Installation of Private Fire Service Mains and their Appurtenances.pdf',
    keywords:['nfpa 24','fire service main','underground','private main','hydrant'] },
  { kind:'ref', section:'NFPA', title:'NFPA 25-2017 — ITM of Water-Based Fire Systems',
    desc:'Inspection, testing & maintenance of water-based fire-protection systems.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 25 - 2017 - Standard for Inspection, Testing and MAintenance of Water-Based Fire Protection Systems.pdf',
    keywords:['nfpa 25','itm','inspection testing maintenance','sprinkler maintenance'] },
  { kind:'ref', section:'NFPA', title:'NFPA 30-2015 — Flammable & Combustible Liquids',
    desc:'Flammable and combustible liquid storage and handling.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 30 - 2015 - Flammable and Combustible Liquids Code.pdf',
    keywords:['nfpa 30','flammable','combustible','liquid storage','fuel'] },
  { kind:'ref', section:'NFPA', title:'NFPA 33-2016 — Spray Application of Flammable Materials',
    desc:'Spray-application booths and rooms using flammable or combustible materials.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 33 - 2016 - Standard for Spray Application Using Flammable or Combustible Materials.pdf',
    keywords:['nfpa 33','spray booth','paint booth','flammable spray'] },
  { kind:'ref', section:'NFPA', title:'NFPA 45-2015 — Fire Protection for Laboratories',
    desc:'Fire protection for laboratories using chemicals.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 45 - 2015 - Standard on Fire Protection for Laboratories Using Chemicals.pdf',
    keywords:['nfpa 45','laboratory','lab fire protection','chemical lab'] },
  { kind:'ref', section:'NFPA', title:'NFPA 51-2013 — Oxygen-Fuel Gas Systems for Welding',
    desc:'Design and installation of oxygen-fuel gas systems for welding and cutting.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 51 - 2013 - Standard for the Design and Installation of Oxygen Fuel Gas Systems for Welding, Cutting, and Allied Processes .pdf',
    keywords:['nfpa 51','oxygen fuel gas','welding','cutting','oxy-acetylene'] },
  { kind:'ref', section:'NFPA', title:'NFPA 51A-2012 — Acetylene Cylinder Charging Plants',
    desc:'Acetylene cylinder charging plants.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 51A - 2012 - Standard for Acetylene Cylinder Chargin Plants.pdf',
    keywords:['nfpa 51a','acetylene','cylinder charging','welding gas'] },
  { kind:'ref', section:'NFPA', title:'NFPA 51B-2009 — Fire Prevention During Hot Work',
    desc:'Fire prevention during welding, cutting and other hot work.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 51B - 2009 - Standard for Fire Prevention During Welding, Cutting and Other Hot work.pdf',
    keywords:['nfpa 51b','hot work','welding','cutting','fire watch'] },
  { kind:'ref', section:'NFPA', title:'NFPA 55-2016 — Compressed Gases & Cryogenic Fluids',
    desc:'Compressed gases and cryogenic fluids code (2016).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 55 - 2016 - Compressed Gases and Cryogenic Fluids Code.pdf',
    keywords:['nfpa 55','compressed gas','cryogenic','bulk gas','cylinder','2016'] },
  { kind:'ref', section:'NFPA', title:'NFPA 55-2020 — Compressed Gases & Cryogenic Fluids',
    desc:'Compressed gases and cryogenic fluids code (2020).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 55 - 2020 Compressed Gases and Cryogenic Fluids Code.pdf',
    keywords:['nfpa 55','compressed gas','cryogenic','bulk gas','cylinder','2020'] },
  { kind:'ref', section:'NFPA', title:'NFPA 61-2020 — Dust Explosions in Agriculture/Food',
    desc:'Prevention of fires and dust explosions in agricultural and food-processing facilities.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 61 - 2020 - Standard for the Prevention of Fires and Dust Explosions in Agricultural and Food Processing Facilitites.pdf',
    keywords:['nfpa 61','dust explosion','agricultural','food processing'] },
  { kind:'ref', section:'NFPA', title:'NFPA 664-2017 — Wood Processing Facilities',
    desc:'Prevention of fires and explosions in wood processing and woodworking facilities.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 664 - 2017 - Standard for the Prevention of Fired and Explosions in Wood Processing and Woodworking Facilities.pdf',
    keywords:['nfpa 664','wood processing','woodworking','sawmill','dust collection'] },
  { kind:'ref', section:'NFPA', title:'NFPA 68-2018 — Deflagration Venting',
    desc:'Standard on explosion protection by deflagration venting.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 68 - 2018 - Standard on Explosion Preotection by Deflagration Venting.pdf',
    keywords:['nfpa 68','deflagration','explosion vent','dust explosion'] },
  { kind:'ref', section:'NFPA', title:'NFPA 69-2014 — Explosion Prevention Systems',
    desc:'Standard on explosion prevention systems.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 69 - 2014 - Standard on Explosion Prevention systems .pdf',
    keywords:['nfpa 69','explosion prevention','inerting','suppression'] },
  { kind:'ref', section:'NFPA', title:'NFPA 70-2023 — National Electrical Code (NEC)',
    desc:'National Electrical Code.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 70_2023_National_Electrical_Code.pdf',
    keywords:['nfpa 70','nec','national electrical code','electrical','wiring'] },
  { kind:'ref', section:'NFPA', title:'NFPA 820-2008 — Wastewater Treatment & Collection',
    desc:'Fire protection in wastewater treatment and collection facilities.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 820 - 2008 - Standard for Fire Protection in Wastewater Treatment and Collection Facilities.pdf',
    keywords:['nfpa 820','wastewater','sewage','classified space','treatment plant'] },
  { kind:'ref', section:'NFPA', title:'NFPA 88A-2015 — Parking Structures',
    desc:'Standard for parking structures.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 88A - 2015 - Standard for Parking Structure.pdf',
    keywords:['nfpa 88a','parking garage','parkade','parking structure'] },
  { kind:'ref', section:'NFPA', title:'NFPA 88B-1997 — Repair Garages',
    desc:'Standard for repair garages.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 88B - 1997 - Standard for Repair Garage.pdf',
    keywords:['nfpa 88b','repair garage','vehicle service'] },
  { kind:'ref', section:'NFPA', title:'NFPA 90A-2002 — Air-Conditioning & Ventilation',
    desc:'Installation of air-conditioning and ventilation systems (2002).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 90A - 2002 - Standard for the Installation of Air-Conditioning and Ventilation Systems.pdf',
    keywords:['nfpa 90a','hvac fire protection','smoke damper','fire damper','2002'] },
  { kind:'ref', section:'NFPA', title:'NFPA 90A-2018 — Air-Conditioning & Ventilation',
    desc:'Installation of air-conditioning and ventilation systems (2018).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 90A - 2018 - Standard for the Installation of Air-Conditioning and Ventilation Systems.pdf',
    keywords:['nfpa 90a','hvac fire protection','ducted','smoke damper','fire damper','2018'] },
  { kind:'ref', section:'NFPA', title:'NFPA 91-2015 — Exhaust Systems for Vapors/Particulates',
    desc:'Exhaust systems for air conveying vapors, gases, mists, and particulate solids.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 91 - 2015 - Standard for Exhaust Systems for Air Conveying of Vaports, Gases, Mists, and Particulated Solids.pdf',
    keywords:['nfpa 91','exhaust','vapor','particulate','industrial exhaust'] },
  { kind:'ref', section:'NFPA', title:'NFPA 92-2015 — Smoke Control Systems',
    desc:'Design of smoke-control systems.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 92 - 2015 - Standard for Smoke Control Systems.pdf',
    keywords:['nfpa 92','smoke control','stairwell pressurization','atrium','smoke management'] },
  { kind:'ref', section:'NFPA', title:'NFPA 92A-2009 — Smoke Control with Barriers/Pressure',
    desc:'Smoke control systems using barriers and pressure differences.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 92A - 2009 - Standard for Smoke Control Systems Utilizing Barriers and Pressure Differences.pdf',
    keywords:['nfpa 92a','smoke control','pressurization','barrier'] },
  { kind:'ref', section:'NFPA', title:'NFPA 92B-2009 — Smoke in Malls, Atria & Large Spaces',
    desc:'Smoke management in malls, atria, and large spaces.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 92B - 2009 - Standard for Smoke Management Systems in Malls, Atria, and Large Spaces.pdf',
    keywords:['nfpa 92b','atrium','mall','smoke management','large space'] },
  { kind:'ref', section:'NFPA', title:'NFPA 96-2001 — Commercial Cooking Operations',
    desc:'Ventilation control and fire protection of commercial cooking operations (2001).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 96 - 2001 - Standard for Ventilation Control and Fire Protection of Commercial Cooking Operations.pdf',
    keywords:['nfpa 96','kitchen hood','range hood','commercial cooking','grease duct','2001'] },
  { kind:'ref', section:'NFPA', title:'NFPA 96-2014 — Commercial Cooking Operations',
    desc:'Ventilation control and fire protection of commercial cooking operations (2014).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 96 - 2014 - Standard for Ventilation Control and Fire Protection of Commercial Cooking Operations.pdf',
    keywords:['nfpa 96','kitchen hood','range hood','commercial cooking','grease duct','ansul','2014'] },
  { kind:'ref', section:'NFPA', title:'NFPA 99-2005 — Health Care Facilities',
    desc:'Standard for health care facilities (2005).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 99 - 2005 - Standard for Health Care Facilities.pdf',
    keywords:['nfpa 99','healthcare','hospital','medical gas','2005'] },
  { kind:'ref', section:'NFPA', title:'NFPA 99-2015 — Health Care Facilities Code',
    desc:'Performance criteria for health care facilities (2015).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA 99 - 2015 - Standard for Health Care Facilities Code.pdf',
    keywords:['nfpa 99','healthcare','hospital','medical gas','health care','2015'] },
  { kind:'ref', section:'NFPA', title:'NFPA — Aircraft Hangars (2022)',
    desc:'Standard on aircraft hangars (NFPA 409).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/NFPA Standard on Aircraft Hangars 2022.pdf',
    keywords:['nfpa 409','aircraft hangar','hangar','aviation','foam suppression'] },
  { kind:'ref', section:'NFPA', title:'Water Supply for Public Fire Protection — Canada (2020)',
    desc:'Water supply for public fire protection in Canada.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/Water Supply for Public Fire Protection in Canada 2020.pdf',
    keywords:['water supply','public fire protection','fire flow','hydrant','canada'] },
  { kind:'ref', section:'NFPA', title:'Alberta Kitchen Guidelines — Food Services Code (2020)',
    desc:'Alberta health food retail and food-services code (2020).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/Alberta Kitchen Guidelines/health-food-retail-and-foodservices-code-2020.pdf',
    keywords:['alberta kitchen','food services','food retail','health code','restaurant'] },
  { kind:'ref', section:'NFPA', title:'CO Safety Bulletin',
    desc:'Carbon-monoxide safety information.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/CO Info/COSafety.pdf',
    keywords:['carbon monoxide','co safety','co alarm'] },
  { kind:'ref', section:'NFPA', title:'NFPA 13-2013 — Sprinklers (Obsolete Copy)',
    desc:'Older 2013 sprinkler installation copy (obsolete).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/obs/13-2013 Standard for the Installation of Sprinkler Systems.pdf',
    keywords:['nfpa 13','sprinkler','obsolete','2013'] },
  { kind:'ref', section:'NFPA', title:'NFPA 10-2013 — Portable Fire Extinguishers (Obsolete)',
    desc:'Older 2013 portable fire extinguisher copy (obsolete).',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/obs/NFPA 10 - Portable Fire Extinguishers (2013).pdf',
    keywords:['nfpa 10','fire extinguisher','obsolete','2013'] },
  { kind:'ref', section:'NFPA', title:'NFPA 13-2013 — Sprinklers (Obsolete)',
    desc:'Obsolete 2013 sprinkler installation copy.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/obs/NFPA 13 - 2013.pdf',
    keywords:['nfpa 13','sprinkler','obsolete'] },
  { kind:'ref', section:'NFPA', title:'NFPA 51 — Oxygen-Fuel Gas (Obsolete)',
    desc:'Obsolete copy of NFPA 51.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/obs/NFPA 51.pdf',
    keywords:['nfpa 51','obsolete','welding'] },
  { kind:'ref', section:'NFPA', title:'NFPA 51B — Hot Work (Obsolete)',
    desc:'Obsolete copy of NFPA 51B.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/obs/NFPA 51B.pdf',
    keywords:['nfpa 51b','obsolete','hot work'] },
  { kind:'ref', section:'NFPA', title:'NFPA 96-2014 — Commercial Cooking (Obsolete Copy)',
    desc:'Obsolete copy of NFPA 96-2014.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/obs/NFPA 96 2014 - Commercial Cooking.pdf',
    keywords:['nfpa 96','commercial cooking','obsolete','2014'] },
  { kind:'ref', section:'NFPA', title:'NFPA 96 — Commercial Cooking (Archive)',
    desc:'Archived NFPA 96 commercial cooking standard.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/obs/ARCHIVES/NFPA 96 - Standard for Ventilation Control and Fire Protection of Commercial Cooking Operations.pdf',
    keywords:['nfpa 96','commercial cooking','archive','obsolete'] },
  { kind:'ref', section:'NFPA', title:'NFPA 96 — Commercial Cooking (Excerpt)',
    desc:'Excerpt pages from NFPA 96 commercial cooking standard.',
    url:'../00 Codes/00 NFPA - National Fire Protection Association/obs/ARCHIVES/Pages from NFPA 96 - Standard for Ventilation Control and Fire Protection of Commercial Cooking Operations.pdf',
    keywords:['nfpa 96','commercial cooking','excerpt'] },

  // ----- NPC (National Plumbing Code) -----
  { kind:'ref', section:'Code', title:'NPC 2015 — National Plumbing Code (Locked)',
    desc:'National plumbing code (2015), locked copy.',
    url:'../00 Codes/00 NPC - National Plumbing Code/npc2015_1p - Locked.pdf',
    keywords:['npc','national plumbing code','plumbing code','2015','locked'] },
  { kind:'ref', section:'Code', title:'NPC 2015 — National Plumbing Code of Canada',
    desc:'National plumbing code of Canada (2015).',
    url:'../00 Codes/00 NPC - National Plumbing Code/NPC 2015/2015 National Plumbing Code of Canada.pdf',
    keywords:['npc','national plumbing code','plumbing code','plumbing','2015'] },
  { kind:'ref', section:'Code', title:'NPC 2015 — National Plumbing Code',
    desc:'National plumbing code (2015).',
    url:'../00 Codes/00 NPC - National Plumbing Code/NPC 2015/NPC - National Plumbing Code - 2015.pdf',
    keywords:['npc','national plumbing code','plumbing','2015','fixture','drainage','venting'] },
  { kind:'ref', section:'Code', title:'NPC 2015 — Plumbing Code (PDF Scan)',
    desc:'Scanned copy of the 2015 national plumbing code.',
    url:'../00 Codes/00 NPC - National Plumbing Code/NPC 2015/Plumbing Code PDF Scan.pdf',
    keywords:['npc','plumbing code','2015','scan'] },
  { kind:'ref', section:'Code', title:'NPC 2020 — National Plumbing Code',
    desc:'National plumbing code (2020, light version).',
    url:'../00 Codes/00 NPC - National Plumbing Code/NPC 2020/NPC - National Plumbing Code - 2020 - LT.pdf',
    keywords:['npc','national plumbing code','plumbing','2020'] },
  { kind:'ref', section:'Code', title:'CSA B149.1-2025 — 3-Column Comparison',
    desc:'Three-column comparison of CSA B149.1-2025 changes.',
    url:'../00 Codes/00 NPC - National Plumbing Code/NPC 2025/CSA_B149.1_2025-3_Column_Comparison.pdf',
    keywords:['csa b149.1','b149.1-2025','comparison','gas code'] },
  { kind:'ref', section:'Code', title:'Alberta Gas Codes In-Force (Mar 2026)',
    desc:'Alberta listing of in-force gas codes (March 2026).',
    url:'../00 Codes/00 NPC - National Plumbing Code/NPC 2025/Gas-codes-in-force-march-2026-03.pdf',
    keywords:['gas codes','in-force','alberta','march 2026'] },
  { kind:'ref', section:'Code', title:'NPC 2025 — National Plumbing Code',
    desc:'Governing plumbing code (2025 edition).',
    url:'../00 Codes/00 NPC - National Plumbing Code/NPC 2025/NPC - National Plumbing Code - 2025.pdf',
    keywords:['npc','national plumbing code','plumbing','2025','fixture','drainage','venting','water distribution'] },

  // ---- Training & Documentation (real X:\ drive paths) ----
  { kind:'train', section:'Codes', title:'ASHRAE 55 — 2017',
    desc:'Thermal Environmental Conditions for Human Occupancy  ·  PDF',
    url:'file:///X:/00%20Codes/00%20ASHRAE/ASHRAE%2055%20-%202017/ASHRAE%2055%202017.pdf',
    keywords:['ashrae','55','2017','thermal','comfort','environmental','occupancy','codes','standards'] },
  { kind:'train', section:'Codes', title:'ASHRAE 62.1 — 2016',
    desc:'Ventilation for Acceptable Indoor Air Quality  ·  PDF',
    url:'file:///X:/00%20Codes/00%20ASHRAE/ASHRAE%2062.1%20-%202016/ASHRAE%2062.1-2016.pdf',
    keywords:['ashrae','62.1','62','2016','ventilation','iaq','indoor air','quality','codes','standards'] },
  { kind:'train', section:'Codes', title:'ASHRAE 90.1 — 2016',
    desc:'Energy Standard for Buildings (except low-rise residential)  ·  PDF',
    url:'file:///X:/00%20Codes/00%20ASHRAE/ASHRAE%2090.1%20-%202016/ASHRAE-90.1%20-%202016.pdf',
    keywords:['ashrae','90.1','90','2016','energy','buildings','codes','standards'] },
  { kind:'train', section:'Codes', title:'NBC-AE — 2023',
    desc:'National Building Code, Alberta Edition  ·  PDF',
    url:'file:///X:/00%20Codes/00%20NBC-AE%20-%20Alberta%20Building%20Code/NBC-AE%20-%202023/NBC-AE%20-%20National%20Building%20Code%20Alberta%20Edition%20-%202023.pdf',
    keywords:['nbc','nbc-ae','2023','national','building','code','alberta','edition'] },
  { kind:'train', section:'Codes', title:'NPC — 2020',
    desc:'National Plumbing Code  ·  PDF',
    url:'file:///X:/00%20Codes/00%20NPC%20-%20National%20Plumbing%20Code/NPC%202020/NPC%20-%20National%20Plumbing%20Code%20-%202020%20-%20LT.pdf',
    keywords:['npc','2020','national','plumbing','code'] },
  { kind:'train', section:'Codes', title:'NFC-AE — 2023',
    desc:'National Fire Code, Alberta Edition  ·  PDF',
    url:'file:///X:/00%20Codes/00%20NFC-AE%20-%20Alberta%20Fire%20Code/NFC-AE%20-%202023/National%20Fire%20Code%20-%20Alberta%20Edition%20-%202023.pdf',
    keywords:['nfc','nfc-ae','2023','national','fire','code','alberta','edition'] },
  { kind:'train', section:'Codes', title:'NECB — 2025',
    desc:'National Energy Code of Canada for Buildings  ·  PDF',
    url:'file:///X:/00%20Codes/00%20NECB%20-%20National%20Energy%20Code/NECB%202025/NECB%20-%20National%20Energy%20Code%20of%20Canada%20for%20Buildings%20-%202025.pdf',
    keywords:['necb','2025','national','energy','code','canada','buildings'] },
  { kind:'train', section:'Codes', title:'NFPA 13 — 2016',
    desc:'Installation of Sprinkler Systems  ·  PDF',
    url:'file:///X:/00%20Codes/00%20NFPA%20-%20National%20Fire%20Protection%20Association/NFPA%2013%20-%202016%20-%20Standard%20for%20the%20Installation%20of%20Sprinkler%20Systems.pdf',
    keywords:['nfpa','13','2016','sprinkler','systems','installation','fire'] },
  { kind:'train', section:'Codes', title:'NFPA 14 — 2013',
    desc:'Installation of Standpipe and Hose Systems  ·  PDF',
    url:'file:///X:/00%20Codes/00%20NFPA%20-%20National%20Fire%20Protection%20Association/NFPA%2014%20-%202013%20-%20Standard%20for%20the%20Installation%20of%20Standpipe%20and%20Hose%20Systems.pdf',
    keywords:['nfpa','14','2013','standpipe','hose','systems','installation','fire'] },
  { kind:'train', section:'Codes', title:'NFPA 96 — 2014',
    desc:'Ventilation Control & Fire Protection of Commercial Cooking Operations  ·  PDF',
    url:'file:///X:/00%20Codes/00%20NFPA%20-%20National%20Fire%20Protection%20Association/NFPA%2096%20-%202014%20-%20Standard%20for%20Ventilation%20Control%20and%20Fire%20Protection%20of%20Commercial%20Cooking%20Operations.pdf',
    keywords:['nfpa','96','2014','kitchen','hood','grease','commercial','cooking','ventilation','fire'] },
  { kind:'train', section:'Training', title:'ASHRAE 55 — How To',
    desc:'Step-by-step thermal comfort calculation instructions  ·  PDF',
    url:'file:///X:/09%20Teaching%20Committee/02%20Guide%20Documents/ASHRAE%2055%202017%20Calc%20Instructions/ASHRAE%2055%20Calc%20Instructions.pdf',
    keywords:['ashrae 55','how to','instructions','thermal comfort','calc','training','teaching committee','guide'] },
  { kind:'train', section:'Training', title:'ASHRAE 55 MRT Calculator',
    desc:'Mean Radiant Temperature workbook  ·  XLSX',
    url:'file:///X:/09%20Teaching%20Committee/02%20Guide%20Documents/ASHRAE%2055%202017%20Calc%20Instructions/Ashrae%2055%20MRT%20Calc.xlsx',
    keywords:['ashrae 55','mrt','mean radiant temperature','calculator','xlsx','workbook','thermal comfort','training'] },
  { kind:'train', section:'Training', title:'Bluebeam 101',
    desc:'Markup standards and core Bluebeam workflow  ·  PDF',
    url:'file:///X:/09%20Teaching%20Committee/02%20Guide%20Documents/Bluebeam/2025-10-21%20Bluebeam%20101.pdf',
    keywords:['bluebeam','101','markup','workflow','pdf','training','teaching committee'] },
  { kind:'train', section:'Training', title:'Microsoft Teams Annotation',
    desc:'Teams meeting annotation instructions  ·  PDF',
    url:'file:///X:/09%20Teaching%20Committee/02%20Guide%20Documents/Teams/Teams%20-%20Annotation%20Instructions.pdf',
    keywords:['microsoft','teams','annotation','instructions','meeting','training','guide'] },
  { kind:'train', section:'Templates', title:'Remedy Letterhead',
    desc:'Official letterhead Word template  ·  DOTX',
    url:'file:///X:/06%20Templates/1.%20Document%20Templates/Remedy%20-%20Letterhead.dotx',
    keywords:['remedy','letterhead','word','template','dotx','document'] },
  { kind:'train', section:'Templates', title:'Remedy Report Template',
    desc:'Standard report Word template  ·  DOTX',
    url:'file:///X:/06%20Templates/1.%20Document%20Templates/Remedy%20-%20Report%20Template.dotx',
    keywords:['remedy','report','word','template','dotx','document'] },
  { kind:'train', section:'Construction', title:'Site Communication (SC-M00)',
    desc:'Site Communication template — revised 2025-06-19  ·  DOTX',
    url:'file:///X:/06%20Templates/Construction%20Docs/2025-06-19%20REVISED%20-%20SC-M00_Site%20Communication.dotx',
    keywords:['site communication','sc-m00','sc','construction','template','dotx'] },
  { kind:'train', section:'Construction', title:'Addendum (ADD-M00)',
    desc:'Addendum template — revised 2025-07-07  ·  DOTX',
    url:'file:///X:/06%20Templates/Construction%20Docs/2025-07-07%20REVISED%20-%20ADD-M00_Addendum.dotx',
    keywords:['addendum','add-m00','add','construction','template','dotx'] },
  { kind:'train', section:'Construction', title:'Site Review (SR-M01)',
    desc:'Site Review template — revised 2025-01-28  ·  DOTX',
    url:'file:///X:/06%20Templates/Construction%20Docs/2025-01-28%20REVISED%20-%20SR-M01_Site%20Review.dotx',
    keywords:['site review','sr-m01','sr','construction','template','dotx'] },
  { kind:'train', section:'Construction', title:'Post Tender Addendum (PTA-M00)',
    desc:'Post Tender Addendum template — revised 2025-07-07  ·  DOTX',
    url:'file:///X:/06%20Templates/Construction%20Docs/2025-07-07%20REVISED%20-%20PTA-M00_Post%20Tender%20Addendum.dotx',
    keywords:['post tender','addendum','pta-m00','pta','construction','template','dotx'] },
  { kind:'train', section:'Construction', title:'Contemplated Change Notice (CCN-M00)',
    desc:'CCN template — revised 2025-09-26  ·  DOTX',
    url:'file:///X:/06%20Templates/Construction%20Docs/2025-09-26%20REVISED%20-%20CCN-M00_Contemplated%20Change%20Notice.dotx',
    keywords:['contemplated change notice','ccn','ccn-m00','change order','construction','template','dotx'] },
  { kind:'train', section:'Schedules', title:'Schedule A — 2023',
    desc:'ABC Schedule A letter  ·  PDF',
    url:'file:///X:/06%20Templates/ABC%20Schedules/Schedule%20A%202023.pdf',
    keywords:['schedule a','abc','schedule letter','2023','sealing'] },
  { kind:'train', section:'Schedules', title:'Schedule B — 2023',
    desc:'ABC Schedule B letter  ·  PDF',
    url:'file:///X:/06%20Templates/ABC%20Schedules/Schedule%20B%202023.pdf',
    keywords:['schedule b','abc','schedule letter','2023','sealing'] },
  { kind:'train', section:'Schedules', title:'Schedule C-2 — 2023',
    desc:'ABC Schedule C-2 letter  ·  PDF',
    url:'file:///X:/06%20Templates/ABC%20Schedules/Schedule%20C-2%202023.pdf',
    keywords:['schedule c-2','schedule c2','abc','schedule letter','2023','sealing'] },
  { kind:'train', section:'Branding', title:'General Remedy Logo',
    desc:'Company-wide logo folder  ·  Folder',
    url:'file:///X:/05%20Company%20Standards/03%20Logo/01%20General%20Logo',
    keywords:['logo','remedy','brand','branding','general','company','folder'] },
  { kind:'train', section:'Branding', title:'Calgary Office Logos',
    desc:'Calgary office logo folder  ·  Folder',
    url:'file:///X:/05%20Company%20Standards/03%20Logo/02%20Calgary%20Office',
    keywords:['logo','remedy','brand','branding','calgary','office','folder'] },
  { kind:'train', section:'Branding', title:'Edmonton Office Logos',
    desc:'Edmonton office logo folder  ·  Folder',
    url:'file:///X:/05%20Company%20Standards/03%20Logo/03%20Edmonton%20Office',
    keywords:['logo','remedy','brand','branding','edmonton','office','folder'] }
];

/* -----------------------------------------------------------
   NBC-AE 2023 Division B Appendix C Table C-2
   Climatic design data for 125 Alberta locations.
   Each row is pushed into INDEX as a kind:'location' entry so
   typing a city name (e.g. "Calgary") surfaces a card with the
   full design conditions.
   ----------------------------------------------------------- */
const AB_LOC_FIELDS = [
  { lab:'Elevation',               si:'m',   ip:'ft',     conv:v=>v*3.28084,    dec:0 },
  { lab:'Jan 2.5%',                si:'°C',  ip:'°F',     conv:v=>v*9/5+32,     dec:0 },
  { lab:'Jan 1%',                  si:'°C',  ip:'°F',     conv:v=>v*9/5+32,     dec:0 },
  { lab:'Jul 2.5% Dry',            si:'°C',  ip:'°F',     conv:v=>v*9/5+32,     dec:0 },
  { lab:'Jul 2.5% Wet',            si:'°C',  ip:'°F',     conv:v=>v*9/5+32,     dec:0 },
  { lab:'Heating Degree-Days',     si:'°C·d',ip:'°F·d',   conv:v=>v*9/5,        dec:0 },
  { lab:'15-Min Rain',             si:'mm',  ip:'in',     conv:v=>v/25.4,       dec:2 },
  { lab:'1-Day Rain (1/50)',       si:'mm',  ip:'in',     conv:v=>v/25.4,       dec:2 },
  { lab:'Annual Rain',             si:'mm',  ip:'in',     conv:v=>v/25.4,       dec:1 },
  { lab:'Moisture Index',          si:'',    ip:'',       conv:null,            dec:1 },
  { lab:'Annual Ppn.',             si:'mm',  ip:'in',     conv:v=>v/25.4,       dec:1 },
  { lab:'Driving Rain Wind (1/5)', si:'Pa',  ip:'psf',    conv:v=>v*0.0208854,  dec:2 },
  { lab:'Snow Ss (1/50)',          si:'kPa', ip:'psf',    conv:v=>v*20.8854,    dec:1 },
  { lab:'Snow Sr (1/50)',          si:'kPa', ip:'psf',    conv:v=>v*20.8854,    dec:1 },
  { lab:'Hourly Wind (1/10)',      si:'kPa', ip:'psf',    conv:v=>v*20.8854,    dec:1 },
  { lab:'Hourly Wind (1/50)',      si:'kPa', ip:'psf',    conv:v=>v*20.8854,    dec:1 }
];

const AB_LOCATIONS = [
  ['Acadia Valley',716,-33,-36,31,20,5450,18,75,240,0.3,310,220,1.5,0.1,0.38,0.49],
  ['Airdrie',1098,-32,-34,28,18,5200,17,95,325,0.4,440,210,1.2,0.1,0.37,0.46],
  ['Athabasca',515,-35,-38,27,19,5735,18,86,370,0.6,480,80,1.5,0.1,0.27,0.36],
  ['Banff',1400,-31,-33,27,16,5500,18,65,300,0.6,500,120,3.3,0.1,0.26,0.32],
  ['Barrhead',645,-33,-36,27,19,5740,20,86,375,0.6,475,100,1.7,0.1,0.35,0.44],
  ['Bashaw',793,-33,-35,30,19,5400,21,90,350,0.5,460,180,1.8,0.1,0.30,0.38],
  ['Bassano',792,-32,-34,28,18,5070,17,85,265,0.3,340,220,1.3,0.1,0.39,0.51],
  ['Beaumont',735,-32,-35,27,19,5650,20,90,380,0.5,475,160,1.9,0.1,0.34,0.43],
  ['Beaverlodge',730,-36,-39,28,18,5700,20,86,315,0.5,470,100,2.4,0.1,0.27,0.36],
  ['Berwyn',643,-37,-40,27,18,6100,15,80,310,0.5,395,100,2.3,0.1,0.24,0.33],
  ['Blackfalds',880,-33,-37,28,19,5500,19,95,375,0.6,475,190,1.9,0.1,0.32,0.40],
  ['Bon Accord',625,-33,-36,28,19,5500,19,85,360,0.5,485,140,1.8,0.1,0.34,0.43],
  ['Bonnyville',564,-35,-38,27,18,5910,19,75,320,0.5,430,120,1.9,0.1,0.29,0.37],
  ['Bow Island',799,-30,-32,32,19,4600,17,80,255,0.3,340,210,1.4,0.1,0.44,0.55],
  ['Bowden',991,-32,-35,28,19,5400,17,95,350,0.5,480,180,1.6,0.1,0.33,0.41],
  ['Brooks',760,-32,-34,32,20,4880,18,86,260,0.3,340,220,1.2,0.1,0.35,0.44],
  ['Bruderheim',637,-33,-36,28,19,5500,19,90,345,0.5,480,130,1.8,0.1,0.33,0.42],
  ['Calgary',1045,-30,-32,28,17,5000,23,103,325,0.4,425,220,1.1,0.1,0.38,0.48],
  ['Calmar',730,-31,-34,28,19,5420,20,95,380,0.5,490,150,1.9,0.1,0.33,0.42],
  ['Campsie',660,-33,-36,27,19,5750,20,86,375,0.6,475,100,1.7,0.1,0.33,0.44],
  ['Camrose',740,-33,-35,29,19,5500,20,86,355,0.5,470,160,2.0,0.1,0.31,0.39],
  ['Canmore',1320,-31,-33,28,17,5400,18,86,325,0.6,500,120,3.2,0.1,0.30,0.37],
  ['Cardston',1130,-29,-32,30,19,4700,20,108,340,0.4,550,140,1.5,0.1,0.58,0.72],
  ['Carstairs',1060,-32,-35,28,18,5300,17,105,380,0.5,475,190,1.5,0.1,0.35,0.44],
  ['Castor',816,-32,-34,30,19,5550,21,85,295,0.5,395,200,1.8,0.1,0.28,0.35],
  ['Claresholm',1030,-30,-32,30,18,4680,15,97,310,0.4,440,200,1.3,0.1,0.46,0.58],
  ['Coaldale',863,-30,-32,31,19,4460,20,85,250,0.3,390,200,1.2,0.1,0.52,0.65],
  ['Cochrane',1159,-32,-34,28,18,5200,17,75,325,0.4,465,180,1.4,0.1,0.38,0.48],
  ['Cold Lake',540,-35,-38,28,19,5860,18,81,320,0.5,430,140,1.7,0.1,0.29,0.38],
  ['Coleman',1320,-31,-34,29,18,5210,15,86,400,0.5,550,120,2.7,0.3,0.50,0.63],
  ['Coronation',790,-32,-34,30,19,5640,20,92,300,0.5,400,200,1.9,0.1,0.30,0.37],
  ['Cowley',1175,-29,-32,29,18,4810,15,92,310,0.4,525,140,1.6,0.1,0.81,1.01],
  ['Crossfield',1113,-32,-34,28,18,5300,17,105,375,0.5,495,200,1.4,0.1,0.36,0.45],
  ['Daysland',708,-33,-35,29,19,5680,21,85,340,0.5,455,150,1.9,0.1,0.28,0.34],
  ['Devon',709,-32,-35,27,19,5600,20,90,390,0.5,490,150,1.9,0.1,0.35,0.44],
  ['Diamond Valley',1187,-31,-32,28,17,5220,20,97,350,0.5,600,180,1.4,0.1,0.52,0.65],
  ['Didsbury',1037,-32,-35,28,18,5340,17,107,370,0.5,480,190,1.4,0.1,0.33,0.42],
  ['Drayton Valley',869,-31,-34,28,19,5400,20,85,410,0.6,555,120,2.0,0.1,0.32,0.42],
  ['Drumheller',685,-32,-34,30,18,5050,20,86,300,0.4,375,220,1.2,0.1,0.35,0.44],
  ['Eckville',930,-34,-37,27,18,5650,17,95,400,0.6,540,160,1.9,0.1,0.31,0.39],
  ['Edmonton',645,-30,-33,28,19,5120,23,97,360,0.5,460,160,1.7,0.1,0.36,0.45],
  ['Edson',920,-34,-37,27,18,5750,18,81,450,0.6,570,100,2.1,0.1,0.37,0.46],
  ['Elk Point',598,-34,-37,28,18,6110,19,75,330,0.5,440,100,1.9,0.1,0.29,0.37],
  ['Embarras Portage',220,-41,-43,28,19,7100,12,81,250,0.6,390,80,2.2,0.1,0.28,0.37],
  ['Fairview',670,-37,-40,27,18,5840,15,86,330,0.5,450,100,2.4,0.1,0.26,0.35],
  ['Falher',587,-36,-39,27,18,5900,15,75,340,0.5,460,100,2.4,0.1,0.28,0.36],
  ['Foremost',889,-29,-32,32,20,4570,14,80,265,0.3,380,210,1.5,0.1,0.44,0.56],
  ['Fort Chipewyan',221,-41,-43,28,19,7170,14,73,255,0.6,380,80,2.5,0.1,0.29,0.39],
  ['Fort MacLeod',945,-30,-32,31,19,4600,16,97,300,0.4,425,180,1.2,0.1,0.54,0.68],
  ['Fort McMurray',255,-38,-40,28,19,6250,13,86,340,0.5,460,60,1.5,0.1,0.28,0.35],
  ['Fort Saskatchewan',610,-32,-35,28,19,5420,20,86,350,0.5,425,140,1.6,0.1,0.34,0.43],
  ['Fort Vermilion',270,-41,-43,28,18,6700,13,70,250,0.5,380,60,2.1,0.1,0.23,0.30],
  ['Fox Creek',808,-33,-36,27,19,5700,17,80,395,0.6,525,80,2.2,0.1,0.30,0.39],
  ['Gibbons',643,-33,-36,28,19,5500,19,85,370,0.5,485,140,1.8,0.1,0.34,0.43],
  ['Gleichen',903,-32,-34,28,18,5125,17,85,260,0.3,330,220,1.3,0.1,0.39,0.51],
  ['Grand Centre',541,-35,-38,28,19,5850,19,81,320,0.5,425,140,1.9,0.1,0.29,0.38],
  ['Grande Cache',1220,-35,-38,27,15,5670,14,70,365,0.6,555,80,3.0,0.1,0.35,0.45],
  ['Grande Prairie',650,-36,-39,27,18,5790,20,86,315,0.5,450,120,2.2,0.1,0.32,0.43],
  ['Granum',991,-30,-32,30,18,4700,17,95,300,0.4,410,190,1.4,0.1,0.50,0.63],
  ['Grimshaw',603,-37,-40,27,18,6100,15,80,310,0.5,400,100,2.3,0.1,0.24,0.33],
  ['Habay',335,-41,-43,28,18,6750,13,70,275,0.5,425,60,2.4,0.1,0.23,0.30],
  ['Hanna',785,-32,-34,30,19,5300,19,90,285,0.4,390,220,1.7,0.1,0.37,0.45],
  ['Hardisty',615,-33,-36,30,19,5640,20,81,325,0.5,425,140,1.7,0.1,0.29,0.36],
  ['High Level',320,-41,-43,27,18,6950,13,84,265,0.6,395,60,2.3,0.1,0.23,0.30],
  ['High Prairie',595,-35,-38,27,18,5800,15,67,375,0.6,470,80,2.3,0.1,0.31,0.40],
  ['High River',1040,-31,-32,28,17,4900,18,97,300,0.4,425,200,1.3,0.1,0.52,0.65],
  ['Hinton',990,-34,-38,27,17,5500,13,81,375,0.6,500,100,2.6,0.1,0.37,0.46],
  ['Innisfail',945,-32,-35,28,19,5450,18,95,375,0.5,515,190,1.7,0.1,0.33,0.41],
  ['Irvine',763,-32,-34,32,20,4700,17,80,260,0.3,360,220,1.4,0.1,0.37,0.47],
  ['Jasper',1060,-31,-34,28,17,5300,12,76,300,0.5,400,80,3.0,0.1,0.26,0.32],
  ['Keg River',420,-40,-42,28,18,6520,13,70,310,0.5,450,80,2.4,0.1,0.23,0.30],
  ['Killam',680,-33,-36,29,19,5670,21,81,335,0.5,445,150,1.9,0.1,0.28,0.35],
  ['Kitscoty',670,-34,-37,28,20,5900,18,80,305,0.5,430,110,1.9,0.1,0.31,0.38],
  ['Lac la Biche',560,-35,-38,28,19,6100,15,86,375,0.6,475,80,1.6,0.1,0.27,0.36],
  ['Lacombe',855,-33,-36,28,19,5500,23,92,350,0.5,450,180,1.9,0.1,0.32,0.40],
  ['Lake Louise',1600,-31,-34,26,15,6500,11,55,270,0.6,570,80,5.5,0.1,0.25,0.33],
  ['Lamont',653,-33,-36,28,19,5500,19,91,350,0.5,460,130,1.8,0.1,0.33,0.42],
  ['Leduc',730,-32,-35,27,19,5600,20,90,400,0.5,485,160,1.9,0.1,0.33,0.41],
  ['Lethbridge',910,-30,-32,31,19,4500,20,97,250,0.3,390,200,1.2,0.1,0.53,0.66],
  ['Lloydminster',645,-34,-37,28,20,5880,18,81,310,0.5,430,110,2.0,0.1,0.32,0.40],
  ['Magrath',983,-29,-32,31,19,4600,17,97,275,0.3,430,160,1.5,0.1,0.55,0.69],
  ['Manning',465,-39,-41,27,18,6300,13,76,280,0.5,390,80,2.3,0.1,0.23,0.30],
  ['Mayerthorpe',712,-32,-35,27,19,5700,20,90,425,0.6,555,100,2.0,0.1,0.32,0.43],
  ['McLennan',625,-36,-39,27,18,5900,15,75,340,0.5,465,90,2.4,0.1,0.28,0.36],
  ['Medicine Hat',705,-31,-34,32,19,4540,23,92,250,0.3,325,220,1.1,0.1,0.38,0.48],
  ['Milk River',1059,-29,-32,31,18,4600,18,97,280,0.3,430,190,1.5,0.1,0.54,0.68],
  ['Millet',755,-33,-35,29,19,5550,21,90,380,0.6,475,160,1.9,0.1,0.32,0.40],
  ['Morinville',700,-33,-36,28,19,5500,19,90,370,0.5,480,140,1.9,0.1,0.34,0.43],
  ['Morrin',832,-32,-34,29,19,5400,19,75,310,0.4,390,220,1.6,0.1,0.33,0.41],
  ['Mundare',678,-34,-37,29,19,5800,20,90,325,0.5,450,110,1.9,0.1,0.31,0.39],
  ['Nanton',1024,-31,-32,28,18,4950,17,95,300,0.4,440,200,1.3,0.1,0.50,0.63],
  ['Okotoks',1051,-31,-32,28,17,4920,17,95,375,0.4,505,200,1.4,0.1,0.52,0.64],
  ['Olds',1041,-32,-35,28,18,5340,17,95,370,0.5,495,180,1.6,0.1,0.33,0.41],
  ['Oyen',770,-33,-36,29,20,5600,19,75,260,0.3,330,220,1.7,0.1,0.37,0.48],
  ['Peace River',330,-37,-40,27,18,6050,15,81,300,0.5,390,100,2.2,0.1,0.24,0.32],
  ['Penhold',871,-32,-35,28,19,5550,18,95,365,0.5,470,200,1.7,0.1,0.32,0.40],
  ['Picture Butte',905,-31,-33,31,19,4530,20,85,265,0.3,355,210,1.2,0.1,0.51,0.63],
  ['Pincher Creek',1130,-29,-32,29,18,4740,16,103,325,0.4,575,140,1.5,0.1,0.77,0.96],
  ['Ponoka',807,-33,-36,28,19,5500,21,87,385,0.6,480,170,1.9,0.1,0.32,0.40],
  ['Provost',668,-33,-36,29,20,5700,21,80,300,0.5,400,150,1.9,0.1,0.32,0.41],
  ['Rainbow Lake',534,-42,-45,26,17,7200,16,75,270,0.5,450,60,2.8,0.1,0.23,0.30],
  ['Ranfurly',670,-34,-37,29,19,5700,18,92,325,0.5,420,100,1.9,0.1,0.29,0.36],
  ['Raymond',960,-29,-32,31,19,4600,17,97,250,0.3,420,170,1.4,0.1,0.53,0.66],
  ['Red Deer',855,-32,-35,28,19,5550,20,97,375,0.5,475,200,1.8,0.1,0.32,0.40],
  ['Redcliff',745,-31,-34,32,19,4580,17,88,250,0.3,330,220,1.3,0.1,0.38,0.48],
  ['Redwater',625,-33,-36,27,19,5900,19,80,350,0.5,470,120,1.8,0.1,0.34,0.43],
  ['Rimbey',930,-34,-37,27,19,5650,20,100,420,0.6,540,150,1.9,0.1,0.31,0.39],
  ['Rocky Mountain House',985,-32,-34,27,18,5640,20,92,425,0.6,550,120,1.9,0.1,0.29,0.36],
  ['Ryley',693,-34,-37,29,19,5600,21,90,340,0.5,465,140,1.9,0.1,0.30,0.37],
  ['Sangudo',680,-32,-35,27,19,5600,20,95,400,0.6,555,110,2.0,0.1,0.33,0.44],
  ['Sedgewick',663,-33,-36,29,19,5660,21,81,330,0.5,440,150,1.9,0.1,0.28,0.35],
  ['Sexsmith',724,-36,-40,27,18,5850,18,80,310,0.5,445,110,2.4,0.1,0.32,0.43],
  ['Sherwood Park',729,-32,-35,28,19,5350,20,90,365,0.5,480,160,1.8,0.1,0.36,0.45],
  ['Slave Lake',590,-35,-38,26,19,5850,15,81,380,0.6,500,80,1.9,0.1,0.28,0.37],
  ['Smoky Lake',623,-33,-36,28,19,6050,19,75,345,0.5,480,100,1.9,0.1,0.32,0.41],
  ['Spirit River',640,-36,-39,27,18,5850,18,75,320,0.5,460,110,2.4,0.1,0.29,0.38],
  ['Spruce Grove',709,-32,-35,28,19,5300,22,95,400,0.5,500,120,1.8,0.1,0.36,0.45],
  ['Stavely',1044,-30,-32,30,18,4700,17,95,330,0.4,440,200,1.4,0.1,0.48,0.60],
  ['Stettler',820,-32,-34,30,19,5300,20,97,370,0.5,450,200,1.9,0.1,0.29,0.36],
  ['Stony Plain',710,-32,-35,28,19,5300,23,97,410,0.5,540,120,1.7,0.1,0.36,0.45],
  ['Strathmore',973,-32,-34,28,18,5180,17,80,295,0.3,410,220,1.3,0.1,0.38,0.48],
  ['St. Albert',689,-32,-35,28,19,5350,20,95,375,0.5,480,150,1.8,0.1,0.36,0.45],
  ['St. Paul',646,-34,-37,28,18,6050,19,75,320,0.5,440,90,1.9,0.1,0.29,0.37],
  ['Suffield',755,-31,-34,32,20,4770,20,86,230,0.2,325,220,1.3,0.1,0.39,0.49],
  ['Sundre',1093,-33,-36,27,19,5620,15,90,365,0.5,465,160,1.5,0.1,0.34,0.42]
];

const LOC_ALIASES = {
  'St. Albert':   ['st albert','saint albert'],
  'St. Paul':     ['st paul','saint paul'],
  'Lac la Biche': ['lac la biche','laclabiche'],
  'Fort McMurray':['fort mcmurray','mcmurray','ft mcmurray'],
  'Fort Saskatchewan':['fort saskatchewan','fort sask'],
  'Fort MacLeod': ['fort macleod','macleod','fort mcleod'],
  'Fort Chipewyan':['fort chipewyan','fort chip','chipewyan'],
  'Fort Vermilion':['fort vermilion','vermilion'],
  'Grande Prairie':['grande prairie','gp'],
  'Grande Cache': ['grande cache'],
  'Lake Louise':  ['lake louise'],
  'Medicine Hat': ['medicine hat','med hat','medhat'],
  'Red Deer':     ['red deer','reddeer'],
  'Bow Island':   ['bow island'],
  'Cold Lake':    ['cold lake'],
  'Spirit River': ['spirit river'],
  'High Level':   ['high level'],
  'High Prairie': ['high prairie'],
  'High River':   ['high river'],
  'Peace River':  ['peace river'],
  'Rainbow Lake': ['rainbow lake'],
  'Slave Lake':   ['slave lake'],
  'Smoky Lake':   ['smoky lake'],
  'Keg River':    ['keg river'],
  'Milk River':   ['milk river'],
  'Elk Point':    ['elk point'],
  'Diamond Valley':['diamond valley','black diamond','turner valley'],
  'Rocky Mountain House':['rocky mountain house','rocky'],
  'Picture Butte':['picture butte'],
  'Pincher Creek':['pincher creek','pincher'],
  'Drayton Valley':['drayton valley'],
  'Bon Accord':   ['bon accord'],
  'Sherwood Park':['sherwood park'],
  'Spruce Grove': ['spruce grove'],
  'Stony Plain':  ['stony plain'],
  'Embarras Portage':['embarras portage','embarras'],
  'Grand Centre': ['grand centre','grand center','cold lake south'],
  'Acadia Valley':['acadia valley'],
  'Fox Creek':    ['fox creek']
};

AB_LOCATIONS.forEach(row => {
  const name = row[0];
  const aliases = LOC_ALIASES[name] || [];
  const kw = [name.toLowerCase(), 'alberta','climatic design','nbc-ae','table c-2','climate','design temperature','snow load','rainfall','degree days','wind pressure', ...aliases];
  INDEX.push({
    kind: 'location',
    section: 'Alberta',
    title: name,
    desc:  'Climatic design data per NBC-AE 2023, Division B, Appendix C, Table C-2.',
    url:   null,
    data:  row.slice(1),
    keywords: kw
  });
});

/* -----------------------------------------------------------
   EH Price SDV terminal-unit sizing — 80% max flow.
   Each row pushed into INDEX as a kind:'vav' entry so typing
   "VAV 4" or "100 CFM" surfaces a card with the flow range.
   data payload: [minCfm, maxCfm, minLps, maxLps]
   ----------------------------------------------------------- */
const VAV_FIELDS = [
  { lab:'Min Flow', ipIdx:0, siIdx:2, ip:'CFM', si:'L/s' },
  { lab:'Max Flow', ipIdx:1, siIdx:3, ip:'CFM', si:'L/s' }
];

const VAV_SIZES = [
  { size: '4',     cfm: [45,   320],  lps: [21,   151],  fpm2000: { cfm: 150,  lps: 71   } },
  { size: '5',     cfm: [60,   400],  lps: [28,   189],  fpm2000: { cfm: 250,  lps: 118  } },
  { size: '6',     cfm: [65,   441],  lps: [31,   208],  fpm2000: { cfm: 400,  lps: 189  } },
  { size: '7',     cfm: [75,   641],  lps: [35,   302],  fpm2000: { cfm: 550,  lps: 260  } },
  { size: '8',     cfm: [125,  880],  lps: [59,   415],  fpm2000: { cfm: 700,  lps: 330  } },
  { size: '9',     cfm: [160,  1120], lps: [76,   529],  fpm2000: { cfm: 900,  lps: 425  } },
  { size: '10',    cfm: [210,  1441], lps: [99,   680],  fpm2000: { cfm: 1100, lps: 519  } },
  { size: '12',    cfm: [300,  2080], lps: [142,  982],  fpm2000: { cfm: 1600, lps: 755  } },
  { size: '14',    cfm: [430,  2960], lps: [203,  1397], fpm2000: { cfm: 2100, lps: 991  } },
  { size: '16',    cfm: [575,  4000], lps: [271,  1888], fpm2000: { cfm: 2800, lps: 1321 } },
  { size: '24X16', cfm: [1185, 6719], lps: [559,  3171], fpm2000: { cfm: 5300, lps: 2501 } }
];

/* Given a Flow value+unit, find VAV sizes whose CFM range covers the value.
   Returns array of {size, cfm:[min,max], lps:[min,max]} matches, in size order. */
function findVAVForFlow(value, cat, unit) {
  if (cat !== 'Flow' || !isFinite(value)) return [];
  // Convert to CFM since the VAV table is anchored to CFM (with L/s pre-computed).
  const cfm = convertValue(value, 'Flow', unit, 'CFM (ft³/min)');
  if (!isFinite(cfm)) return [];
  return VAV_SIZES.filter(r => cfm >= r.cfm[0] && cfm <= r.cfm[1]);
}

VAV_SIZES.forEach(r => {
  const s = r.size;
  const sLower = s.toLowerCase();
  const kw = [
    'vav','vav box','vavs','terminal unit','terminal','inlet','box','sdv','eh price','price',
    '80% max flow','2000 fpm','2,000 fpm','duct reducer','preferred selection','airflow','air flow','flow','cfm','l/s','lps',
    'vav ' + sLower, 'size ' + sLower, 'inlet ' + sLower, 'box ' + sLower,
    'sdv ' + sLower, 'sdv-' + sLower, 'sdv' + sLower,
    'vav-' + sLower, 'vav' + sLower
  ];
  // Add "size N" tokens as plain values too, and the bare size string
  kw.push(sLower);
  if (s === '24X16') {
    kw.push('24x16','24×16','24 x 16','24 by 16');
  }
  INDEX.push({
    kind: 'vav',
    section: 'VAV',
    title: 'Size ' + s,
    desc:  'EH Price SDV terminal unit — min, 2,000 FPM (preferred) and 80% max airflow.',
    url:   'SubTools/VAV_Sizer.html?size=' + encodeURIComponent(s),
    data:  [r.cfm[0], r.cfm[1], r.lps[0], r.lps[1], r.fpm2000.cfm, r.fpm2000.lps],
    keywords: kw
  });
});

/* -----------------------------------------------------------
   Lightweight NLP layer.
   - Tokenize + drop stopwords
   - Map common synonyms to canonical engineering terms
   - Detect intent ("how do I size X" → sizing tools)
   - Score each KB entry against the query
   ----------------------------------------------------------- */

const STOP = new Set([
  'a','an','the','is','are','was','were','be','been','being','it','to','of','for','in','on','at','as','from','by','with',
  'and','or','but','if','then','do','does','did','should','would','could','can','may','might','will',
  'what','whats','how','where','when','why','which','who','whose',
  'i','my','me','we','our','us','you','your','they','their','this','that','these','those','here','there',
  'need','want','use','using','find','show','tell','give','please','help','any','some','about'
]);

// Map a user word to one or more canonical keywords used in the INDEX.
// Lets people type how they talk and still hit the right entry.
const SYNONYMS = {
  'ac':            ['cooling','hvac'],
  'a/c':           ['cooling','hvac'],
  'aircon':        ['cooling','hvac'],
  'air-con':       ['cooling','hvac'],
  'heating':       ['heating','load'],
  'cool':          ['cooling'],
  'cooling':       ['cooling'],
  'oa':            ['outdoor air','ventilation','ashrae 62.1'],
  'osa':           ['outdoor air','ventilation'],
  'outside':       ['outdoor air'],
  'outdoor':       ['outdoor air'],
  'fresh':         ['outdoor air','ventilation'],
  'vent':          ['ventilation'],
  'ventilation':   ['ventilation','ashrae 62.1'],
  'iaq':           ['ashrae 62.1','indoor air quality','ventilation'],
  'comfort':       ['ashrae 55','thermal comfort'],
  'energy':        ['ashrae 90.1','energy'],
  'efficiency':    ['ashrae 90.1','energy'],
  'fire':          ['fire protection','sprinkler','nfpa 13'],
  'sprink':        ['sprinkler'],
  'standpipe':     ['nfpa 14','standpipe'],
  'firepump':      ['nfpa 20','fire pump'],
  'fp':            ['fire protection'],
  'gas':           ['natural gas','b149','csa b149'],
  'propane':       ['propane','b149','csa b149'],
  'pipe':          ['pipe','piping'],
  'piping':        ['pipe','piping'],
  'water':         ['water','hydronic'],
  'plumb':         ['plumbing'],
  'plumbing':      ['plumbing'],
  'fixture':       ['fixture'],
  'fixtures':      ['fixture'],
  'duct':          ['duct','ductwork'],
  'ducts':         ['duct','ductwork'],
  'ductwork':      ['duct','ductwork'],
  'cfm':           ['cfm','flow'],
  'lps':           ['flow','l/s'],
  'l/s':           ['flow','l/s'],
  'velocity':      ['velocity','fpm','m/s'],
  'fpm':           ['velocity','fpm'],
  'static':        ['static pressure','pressure drop'],
  'sp':            ['static pressure'],
  'friction':      ['friction','pressure drop'],
  'pressuredrop':  ['pressure drop'],
  'pressure':      ['pressure'],
  'inwc':          ['static pressure','pressure'],
  'iwc':           ['static pressure','pressure'],
  'pascal':        ['pressure'],
  'pa':            ['pressure'],
  'load':          ['load','cooling load','heating load'],
  'loads':         ['load','cooling load','heating load'],
  'block':         ['block load'],
  'psych':         ['psychrometric','psychrometrics'],
  'psychrometric': ['psychrometric','psychrometrics'],
  'dewpoint':      ['dew point','psychrometric'],
  'dew':           ['dew point','psychrometric'],
  'wetbulb':       ['wet bulb','psychrometric'],
  'drybulb':       ['dry bulb','psychrometric'],
  'humidity':      ['humidity','psychrometric'],
  'enthalpy':      ['enthalpy','psychrometric'],
  'building':      ['building code'],
  'code':          ['building code','plumbing code','gas code'],
  'codes':         ['building code','plumbing code','gas code'],
  'abc':           ['alberta building code','nbc'],
  'apc':           ['alberta plumbing code','npc'],
  'nbc':           ['nbc','national building code'],
  'npc':           ['npc','national plumbing code'],
  'unit':          ['unit','convert','conversion'],
  'units':         ['unit','convert','conversion'],
  'convert':       ['convert','conversion','unit'],
  'conversion':    ['convert','conversion','unit'],
  'metric':        ['si','metric'],
  'imperial':      ['imperial'],

  // Healthcare / medical
  'medical':       ['medical gas','healthcare','csa z7396','csa z317','nfpa 99'],
  'medgas':        ['medical gas','csa z7396'],
  'medicalgas':    ['medical gas','csa z7396'],
  'oxygen':        ['medical gas','oxygen pipeline','csa z7396'],
  'vacuum':        ['medical gas','vacuum','csa z7396'],
  'healthcare':    ['healthcare','csa z317','csa z8000','nfpa 99'],
  'hospital':      ['healthcare','hospital','csa z317','csa z8000','nfpa 99'],
  'or':            ['operating room','csa z317.2'],
  'isolation':     ['isolation room','csa z317.2'],
  'infection':     ['infection control','icra','csa z317.13'],
  'icra':          ['infection control','icra','csa z317.13'],
  'pharmacy':      ['pharmacy','compounding','usp 797','usp 800'],
  'compounding':   ['pharmacy','compounding','usp 797','usp 800'],
  'mdrd':          ['csa z314','reprocessing','mdrd'],
  'sterile':       ['sterile','compounding','mdrd'],
  'continuing':    ['continuing care','ltc'],
  'ltc':           ['continuing care','ltc','long-term care'],
  'longterm':      ['continuing care','ltc','long-term care'],

  // Kitchen / lab / cleanroom
  'kitchen':       ['kitchen hood','nfpa 96','commercial cooking','grease duct'],
  'hood':          ['kitchen hood','fume hood','nfpa 96'],
  'range':         ['kitchen hood','range hood','nfpa 96'],
  'grease':        ['grease duct','kitchen hood','nfpa 96'],
  'cooking':       ['commercial cooking','nfpa 96'],
  'ansul':         ['kitchen hood','nfpa 96'],
  'fume':          ['fume hood','laboratory','ashrae lab'],
  'lab':           ['laboratory','ashrae lab','nfpa 45','fume hood'],
  'labs':          ['laboratory','ashrae lab','nfpa 45'],
  'laboratory':    ['laboratory','ashrae lab','nfpa 45'],
  'cleanroom':     ['cleanroom','ashrae cleanroom','iso 14644'],
  'iso14644':      ['cleanroom','iso 14644'],

  // Electrical / power
  'nec':           ['nfpa 70','nec','national electrical code'],
  'electrical':    ['nfpa 70','nec','electrical'],
  'generator':     ['csa c282','emergency power','generator'],
  'emergency':     ['csa c282','emergency power'],
  'emergencypower':['csa c282','emergency power'],

  // Welding / hot work
  'welding':       ['csa w117','welding','nfpa 51','nfpa 51b','hot work'],
  'weld':          ['csa w117','welding','hot work'],
  'cutting':       ['welding','cutting','nfpa 51b'],
  'hotwork':       ['hot work','nfpa 51b'],
  'acetylene':     ['nfpa 51a','acetylene','welding gas'],
  'oxyacetylene':  ['nfpa 51','oxygen fuel gas','welding'],

  // Refrigeration / mechanical
  'refrigerant':   ['csa b52','refrigeration','refrigerant'],
  'refrigeration': ['csa b52','refrigeration','ashrae refrigeration'],
  'ammonia':       ['csa b52','ammonia','refrigeration'],
  'chiller':       ['chiller','refrigeration','csa b52'],
  'oilburning':    ['csa b139','oil burning','fuel oil'],
  'fueloil':       ['csa b139','fuel oil','oil burning'],
  'oil':           ['csa b139','oil burning','fuel oil'],
  'solidfuel':     ['csa b365','solid fuel','wood stove'],
  'woodstove':     ['csa b365','solid fuel','wood stove'],
  'boiler':        ['csa b51','boiler','pressure vessel'],
  'pressurevessel':['csa b51','pressure vessel','asme'],

  // Plumbing detail
  'backflow':      ['csa b64','backflow','backflow preventer'],
  'crossconnection':['csa b64','backflow','cross connection'],
  'breathingair':  ['csa z180','breathing air','compressed air','scba'],
  'scba':          ['csa z180','breathing air','scba'],

  // Elevator / vertical transport
  'elevator':      ['csa b44','elevator','elevating device','elevator pressurization'],
  'escalator':     ['csa b44','escalator','elevator'],
  'lift':          ['csa b44','elevator','lift'],

  // Specialty / niche
  'hyperbaric':    ['csa z275','hyperbaric','dive chamber'],
  'smudging':      ['smudging','smudge room','indigenous'],
  'smudge':        ['smudging','smudge room'],
  'indigenous':    ['smudging','indigenous','ceremonial'],

  // Smoke / egress
  'smoke':         ['nfpa 92','smoke control','ashrae smoke'],
  'smokecontrol':  ['nfpa 92','smoke control','smoke management'],
  'atrium':        ['nfpa 92','atrium','smoke management'],
  'stairwell':     ['nfpa 92','stairwell pressurization','ashrae smoke'],
  'pressurization':['stairwell pressurization','elevator pressurization'],
  'egress':        ['nfpa 101','life safety','egress'],
  'lifesafety':    ['nfpa 101','life safety'],

  // Parking / repair
  'parking':       ['nfpa 88a','parking garage','parkade'],
  'parkade':       ['nfpa 88a','parking garage','parkade'],
  'garage':        ['nfpa 88a','nfpa 88b','parking garage','repair garage'],
  'repairgarage':  ['nfpa 88b','repair garage'],

  // Dust / explosion
  'dust':          ['nfpa 61','nfpa 664','nfpa 68','dust explosion'],
  'explosion':     ['nfpa 68','nfpa 69','deflagration','explosion'],
  'deflagration':  ['nfpa 68','deflagration','explosion vent'],
  'flammable':     ['nfpa 30','flammable','combustible'],
  'combustible':   ['nfpa 30','flammable','combustible'],
  'spraybooth':    ['nfpa 33','spray booth','paint booth'],
  'paintbooth':    ['nfpa 33','paint booth','spray booth'],
  'wood':          ['nfpa 664','wood processing','woodworking'],
  'woodworking':   ['nfpa 664','wood processing','woodworking'],
  'sawmill':       ['nfpa 664','sawmill','wood processing'],

  // Wastewater / water
  'wastewater':    ['nfpa 820','wastewater','sewage'],
  'sewage':        ['nfpa 820','wastewater','sewage'],
  'hangar':        ['nfpa 409','aircraft hangar','aviation'],
  'aviation':      ['aircraft hangar','aviation'],

  // Standpipe / pumps / fire mains
  'firepump':      ['nfpa 20','fire pump','jockey pump'],
  'jockey':        ['nfpa 20','jockey pump','fire pump'],
  'firemain':      ['nfpa 24','fire service main','private main','hydrant'],
  'hydrant':       ['nfpa 24','hydrant','fire flow','public fire protection'],
  'fireflow':      ['fire flow','public fire protection','hydrant'],
  'extinguisher':  ['nfpa 10','fire extinguisher','portable'],
  'co2':           ['nfpa 12','co2','carbon dioxide','clean agent'],
  'halon':         ['nfpa 12a','halon','clean agent'],
  'cleanagent':    ['nfpa 12','nfpa 12a','clean agent'],
  'itm':           ['nfpa 25','itm','inspection testing maintenance'],
  'firetank':      ['nfpa 22','water tank','fire protection water'],

  // Compressed gas / cryo
  'cryogenic':     ['nfpa 55','cryogenic','compressed gas'],
  'compressedgas': ['nfpa 55','compressed gas','cylinder'],
  'cylinder':      ['nfpa 55','cylinder','compressed gas'],

  // Stormwater
  'stormwater':    ['stormwater','storm sewer','drainage','runoff'],
  'storm':         ['stormwater','storm sewer'],

  // Government / public
  'tdr':           ['ai-tdr','alberta infrastructure','technical design requirements'],
  'school':        ['ai-tdr','school','government facility'],
  'provincial':    ['ai-tdr','alberta infrastructure'],
  'government':    ['ai-tdr','alberta infrastructure','government facility'],

  // Standards-of-practice
  'maintenance':   ['ashrae 180','nfpa 25','itm','inspection'],
  'commissioning': ['ashrae 180','sequence of operation','controls'],
  'soo':           ['ashrae g36','sequence of operation','controls'],
  'controls':      ['ashrae g36','sequence of operation','soo','controls'],
  'g36':           ['ashrae g36','guideline 36','sequence of operation'],
  'guideline36':   ['ashrae g36','guideline 36','sequence of operation'],

  // Green / sustainable
  'green':         ['ashrae 189.1','green building','sustainable','leed'],
  'sustainable':   ['ashrae 189.1','green building','sustainable'],
  'leed':          ['ashrae 189.1','green building','leed'],
  'highrise':      ['ashrae high-rise','high-rise','tall building','stack effect']
};

// Intent hints — if the query contains any of these phrases, boost matching entries.
const INTENTS = [
  { hit: /\b(how\s+(?:do|to|can)\s+i\s+)?size|sizing|select|selecting|design|designing|calculate|calc/i,
    boostKeywords: ['sizing','size','select','design'] },
  { hit: /\b(min(?:imum)?|required|spec(?:ified)?)\b/i,
    boostKeywords: ['minimum','required'] },
  { hit: /\b(standard|spec|code|requirement|requirements|reference|per\s+ashrae|per\s+nfpa|per\s+csa|per\s+nbc|per\s+npc)\b/i,
    boostKind: 'ref' },
];

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[?!.,;:()\[\]"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function tokenize(s) {
  const norm = normalize(s);
  if (!norm) return { tokens: [], expanded: [], phrase: '' };
  const raw = norm.split(' ').filter(t => t && !STOP.has(t));
  const expanded = new Set(raw);
  for (const t of raw) {
    const syns = SYNONYMS[t];
    if (syns) syns.forEach(s2 => expanded.add(s2.toLowerCase()));
    // also try the token without trailing 's'
    if (t.endsWith('s') && t.length > 3) {
      const stem = t.slice(0, -1);
      if (SYNONYMS[stem]) SYNONYMS[stem].forEach(s2 => expanded.add(s2.toLowerCase()));
      expanded.add(stem);
    }
  }
  return { tokens: raw, expanded: [...expanded], phrase: raw.join(' ') };
}

function detectIntents(qRaw) {
  const out = { boostKeywords: new Set(), boostKind: null };
  for (const intent of INTENTS) {
    if (intent.hit.test(qRaw)) {
      (intent.boostKeywords || []).forEach(k => out.boostKeywords.add(k.toLowerCase()));
      if (intent.boostKind) out.boostKind = intent.boostKind;
    }
  }
  return out;
}

function scoreEntry(entry, q, intent) {
  const hayTitle = entry.title.toLowerCase();
  const hayDesc  = entry.desc.toLowerCase();
  const hayKw    = entry.keywords.map(k => k.toLowerCase());
  let score = 0;

  // Phrase match
  if (q.phrase) {
    if (hayTitle.includes(q.phrase)) score += 60;
    if (hayKw.some(k => k.includes(q.phrase) || q.phrase.includes(k))) score += 35;
    if (hayDesc.includes(q.phrase)) score += 12;
  }

  // Per-token (raw + synonym-expanded)
  for (const t of q.expanded) {
    if (!t || t.length < 2) continue;
    // exact keyword match is strongest
    if (hayKw.includes(t)) score += 22;
    // partial keyword match
    else if (hayKw.some(k => k.includes(t) || (t.length >= 5 && t.includes(k)))) score += 12;
    // title / desc
    if (hayTitle.includes(t)) score += 14;
    if (hayDesc.includes(t))  score += 5;
  }

  // Intent boosts
  if (intent.boostKeywords.size) {
    for (const bk of intent.boostKeywords) {
      if (hayKw.some(k => k.includes(bk))) score += 8;
      if (hayTitle.includes(bk))           score += 4;
    }
  }
  if (intent.boostKind && entry.kind === intent.boostKind) score += 10;

  if (score > 0) {
    if (entry.kind === 'tool') score += 5;
    if (entry.kind === 'soon') score -= 3;
  }
  return score;
}

function runSearch(qRaw) {
  const q = tokenize(qRaw);
  if (!q.tokens.length) return { results: [], intent: null };
  const intent = detectIntents(qRaw);
  const scored = INDEX
    .map(e => ({ entry: e, score: scoreEntry(e, q, intent) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.entry);
  return { results: scored, intent };
}

// Short, friendly interpretation line. Reflects what the search "understood".
function interpretation(qRaw, intent) {
  const verbs = [];
  if (/\b(siz|select|design|calc)/i.test(qRaw)) verbs.push('sizing / design');
  if (/\b(min(?:imum)?|required)\b/i.test(qRaw))  verbs.push('minimum requirement');
  if (/\b(code|standard|spec|reference|per\s+(ashrae|nfpa|csa|nbc|npc))/i.test(qRaw)) verbs.push('design standard');
  if (/\b(duct|ductwork)/i.test(qRaw))   verbs.push('ductwork');
  if (/\b(sprink|fire)/i.test(qRaw))     verbs.push('fire protection');
  if (/\b(gas|propane|b149)/i.test(qRaw))verbs.push('gas');
  if (/\b(plumb|fixture|water)/i.test(qRaw)) verbs.push('plumbing');
  if (/\b(ventilation|outdoor air|fresh air|iaq|62\.1)/i.test(qRaw)) verbs.push('ventilation / IAQ');
  if (/\b(load|cooling|heating)/i.test(qRaw)) verbs.push('loads');
  if (/\b(psych|dew|wet bulb|dry bulb|humidity|enthalpy)/i.test(qRaw)) verbs.push('psychrometrics');
  if (!verbs.length) return null;
  return verbs.slice(0, 3).join(' · ');
}

/* -----------------------------------------------------------
   Cycling placeholder suggestions
   ----------------------------------------------------------- */
(function() {
  var el = document.getElementById('q');
  if (!el) return;
  var hints = [
    'Try: "1000 cfm"',
    'Try: "VAV 14"',
    'Try: "25 psi"',
    'Try: "ASHRAE 90.1"',
    'Try: "how do I size a supply duct?"',
    'Try: "min OA per ASHRAE 62.1"',
    'Try: "100 l/s to cfm"',
    'Try: "letterhead"',
    'Try: "Schedule B"',
    'Try: "pipe sizing for 50 gpm"',
    'Try: "tell me a joke"',
  ];
  var idx = 0;
  el.setAttribute('placeholder', hints[0]);
  setInterval(function() {
    if (el === document.activeElement || el.value) return;
    el.style.transition = 'none';
    idx = (idx + 1) % hints.length;
    el.setAttribute('placeholder', hints[idx]);
  }, 3000);
})();

/* -----------------------------------------------------------
   UI: render the dropdown, keyboard nav, click-outside dismiss
   ----------------------------------------------------------- */
const inp  = document.getElementById('q');
const drop = document.getElementById('drop');
const clr  = document.getElementById('q_clear');
let activeIdx = -1;
let currentItems = [];

/* Build a Smart Convert card (HTML string) for a value+unit input. */
function buildConvCard(parsed) {
  const { value, resolved, unitRaw } = parsed;
  if (!resolved) return '';
  const { cat, unit } = resolved;
  const q = QTYS[cat];
  if (!q) return '';
  const units = Object.keys(q.units);
  let rows = '';
  for (const u of units) {
    if (u === unit) continue;
    const out = convertValue(value, cat, unit, u);
    rows += `<div class="cv-row"><span class="cv-lab">${u}</span><span class="cv-val">${fmtConv(out)}</span></div>`;
  }
  return `<div class="drop-item drop-item-conv" data-noclick="1">
    <div class="di-row1">
      <span class="di-title">Unit Conversion</span>
      <span class="di-pill conv">${cat}</span>
    </div>
    <div class="conv-source"><span class="cs-val">${fmtConv(value)} ${unit}</span></div>
    <div class="conv-grid">${rows}</div>
  </div>`;
}

/* Build a VAV recommendation card for a Flow value+unit input.
   Sizes at 2,000 FPM (Remedy's preferred selection) and never below Size 6 —
   sizes 4, 5 and 6 are the same box, but the smaller inlets add a duct reducer
   that complicates balancing. */
function buildVAVCard(parsed) {
  const { value, resolved } = parsed;
  if (!resolved || resolved.cat !== 'Flow') return '';
  // Skip water-flow units — VAV is for air.
  if (resolved.unit === 'GPM (US)' || resolved.unit === 'GPM (Imp)') return '';
  const cfmIn = convertValue(value, 'Flow', resolved.unit, 'CFM (ft³/min)');
  const lpsIn = convertValue(value, 'Flow', resolved.unit, 'L/s');
  if (!isFinite(cfmIn) || cfmIn <= 0) return '';

  const smallest = VAV_SIZES[0];
  const largest  = VAV_SIZES[VAV_SIZES.length - 1];
  const SIX = VAV_SIZES.find(r => r.size === '6');
  if (cfmIn < smallest.cfm[0]) return '';           // below smallest controllable min
  const pick2000 = VAV_SIZES.find(r => cfmIn <= r.fpm2000.cfm);
  const pickMax  = VAV_SIZES.find(r => cfmIn <= r.cfm[1]);
  if (!pick2000 && !pickMax) return '';             // beyond the largest box

  let rec = pick2000 || largest;
  let note = '';
  if (rec.size === '4' || rec.size === '5') {
    const smaller = rec.size;
    rec = SIX;
    if (cfmIn < SIX.cfm[0]) {
      note = `Below Size 6's min (${SIX.cfm[0]} CFM). Sizes 4–6 are one box; the smaller Size ${smaller} ships with a duct reducer that complicates balancing. Combine loads to reach Size 6, or use Size ${smaller} if a dedicated box is required.`;
    } else {
      note = `Sizes 4, 5 and 6 are the same box — the smaller inlets add a duct reducer that hurts balancing, so spec Size 6.`;
    }
  } else if (!pick2000) {
    note = `Above the 2,000 FPM point of the largest box — it will run faster than 2,000 FPM; consider splitting into multiple boxes.`;
  }
  if (pickMax && pickMax.size !== rec.size) {
    note += (note ? ' ' : '') + `At 80% of the 1.5″ max this fits the smaller Size ${pickMax.size}; we prefer the 2,000 FPM pick for lower velocity and easier balancing.`;
  }

  return `<div class="drop-item drop-item-conv" data-noclick="1">
    <div class="di-row1">
      <span class="di-title">VAV Box Recommendation</span>
      <span class="di-pill conv">VAV</span>
    </div>
    <div class="conv-source">
      <span class="cs-val">${fmtConv(cfmIn)} CFM &nbsp;·&nbsp; ${fmtConv(lpsIn)} L/s</span>
      &nbsp;→&nbsp; preferred pick at 2,000 FPM is <b>Size ${rec.size}</b>.
    </div>
    <div class="conv-grid" style="grid-template-columns: 1fr;">
      <div class="cv-row">
        <span class="cv-lab">Size ${rec.size} · 2,000 FPM</span>
        <span class="cv-val">${rec.fpm2000.cfm} CFM &nbsp;·&nbsp; ${rec.fpm2000.lps} L/s</span>
      </div>
      <div class="cv-row">
        <span class="cv-lab">Size ${rec.size} range</span>
        <span class="cv-val">${rec.cfm[0]}–${rec.cfm[1]} CFM &nbsp;·&nbsp; ${rec.lps[0]}–${rec.lps[1]} L/s</span>
      </div>
    </div>
    ${note ? `<div class="di-foot">${note}</div>` : ''}
  </div>`;
}

/* Build a Duct sizing card for an air-flow value+unit input.
   Sizes round and 2:1 rectangular duct at a common S/A target velocity. */
const ROUND_DUCT_INCHES = [4,5,6,7,8,9,10,12,14,16,18,20,22,24,26,28,30,32,34,36,40,42,48,54,60];
function buildDuctCard(parsed) {
  const { value, resolved } = parsed;
  if (!resolved || resolved.cat !== 'Flow') return '';
  // Skip water-flow units — duct is for air.
  if (resolved.unit === 'GPM (US)' || resolved.unit === 'GPM (Imp)') return '';
  const cfm = convertValue(value, 'Flow', resolved.unit, 'CFM (ft³/min)');
  const lps = convertValue(value, 'Flow', resolved.unit, 'L/s');
  if (!isFinite(cfm) || cfm <= 0) return '';
  const V_fpm = 1500;  // typical S/A target (per duct-sizer reference table)
  // Round duct: D(in) = sqrt(576 * Q / (π * V)) with Q in CFM, V in FPM.
  const dRaw = Math.sqrt((576 * cfm) / (Math.PI * V_fpm));
  let dNom = ROUND_DUCT_INCHES.find(s => s >= dRaw);
  if (!dNom) dNom = ROUND_DUCT_INCHES[ROUND_DUCT_INCHES.length - 1];
  // 2:1 rectangular via SMACNA equivalent diameter:
  //   D_eq = 1.30 * (a*b)^0.625 / (a+b)^0.25 ; with a = 2b → D_eq ≈ 1.523 * b
  const bRaw = dNom / 1.523;
  const bNom = Math.max(4, Math.round(bRaw / 2) * 2);
  const aNom = Math.max(8, Math.round((2 * bRaw) / 2) * 2);
  const dNomMm = Math.round(dNom * 25.4 / 25) * 25;
  const aMm = Math.round(aNom * 25.4 / 25) * 25;
  const bMm = Math.round(bNom * 25.4 / 25) * 25;
  const vActRound = cfm / (Math.PI * dNom * dNom / 4 / 144);
  const vActRect  = cfm / ((aNom * bNom) / 144);
  return `<div class="drop-item drop-item-conv" data-noclick="1">
    <div class="di-row1">
      <span class="di-title">Duct Sizing Recommendation</span>
      <span class="di-pill conv">Duct</span>
    </div>
    <div class="conv-source">
      <span class="cs-val">${fmtConv(cfm)} CFM &nbsp;·&nbsp; ${fmtConv(lps)} L/s</span>
      &nbsp;at ~${V_fpm} FPM target velocity
    </div>
    <div class="conv-grid" style="grid-template-columns: 1fr;">
      <div class="cv-row">
        <span class="cv-lab">Round duct</span>
        <span class="cv-val">⌀ ${dNom}" (${dNomMm} mm) &nbsp;·&nbsp; ${Math.round(vActRound)} FPM</span>
      </div>
      <div class="cv-row">
        <span class="cv-lab">Rectangular 2:1</span>
        <span class="cv-val">${aNom}" × ${bNom}" (${aMm} × ${bMm} mm) &nbsp;·&nbsp; ${Math.round(vActRect)} FPM</span>
      </div>
    </div>
  </div>`;
}

/* Build a Pipe sizing card for a water-flow value+unit input (GPM).
   Picks smallest Sch 40 nominal size per system velocity limit. */
const PIPE_SCH40 = [
  {nom:'3/4"',   mm:'20 mm',  id:0.824 },
  {nom:'1"',     mm:'25 mm',  id:1.049 },
  {nom:'1-1/4"', mm:'30 mm',  id:1.380 },
  {nom:'1-1/2"', mm:'40 mm',  id:1.610 },
  {nom:'2"',     mm:'50 mm',  id:2.067 },
  {nom:'2-1/2"', mm:'65 mm',  id:2.469 },
  {nom:'3"',     mm:'75 mm',  id:3.068 },
  {nom:'4"',     mm:'100 mm', id:4.026 },
  {nom:'6"',     mm:'150 mm', id:6.065 },
  {nom:'8"',     mm:'200 mm', id:7.981 },
  {nom:'10"',    mm:'250 mm', id:10.020},
  {nom:'12"',    mm:'300 mm', id:11.938},
  {nom:'14"',    mm:'350 mm', id:13.124},
  {nom:'16"',    mm:'400 mm', id:15.000},
  {nom:'18"',    mm:'450 mm', id:16.876},
  {nom:'20"',    mm:'500 mm', id:18.812},
  {nom:'24"',    mm:'600 mm', id:22.624}
];
const PIPE_SYSTEMS = [
  {name:'Chilled water',   vMax:8,  note:'50°F · 4–8 ft/s typical'},
  {name:'Heating water',   vMax:8,  note:'180°F · 4–8 ft/s typical'},
  {name:'Domestic cold',   vMax:8,  note:'≤ 8 ft/s (UPC/IPC)'},
  {name:'Domestic hot',    vMax:5,  note:'≤ 5 ft/s (limit erosion)'},
  {name:'Fire protection', vMax:15, note:'NFPA · ≤ 15 ft/s typical'}
];
function pickPipe(gpm, vMax) {
  // d_min(in) = sqrt(0.4085 * Q / V) ; Q in gpm, V in ft/s.
  const dMin = Math.sqrt(0.4085 * gpm / vMax);
  const p = PIPE_SCH40.find(s => s.id >= dMin) || PIPE_SCH40[PIPE_SCH40.length - 1];
  const vAct = 0.4085 * gpm / (p.id * p.id);
  return { nom: p.nom, mm: p.mm, vAct };
}
function buildPipeCard(parsed) {
  const { value, resolved } = parsed;
  if (!resolved || resolved.cat !== 'Flow') return '';
  if (resolved.unit !== 'GPM (US)' && resolved.unit !== 'GPM (Imp)') return '';
  const gpm = convertValue(value, 'Flow', resolved.unit, 'GPM (US)');
  if (!isFinite(gpm) || gpm <= 0) return '';
  let rows = '';
  for (const sys of PIPE_SYSTEMS) {
    const p = pickPipe(gpm, sys.vMax);
    rows += `<div class="cv-row">
      <span class="cv-lab">${sys.name} <span style="color: var(--grey); font-weight: normal;">— ${sys.note}</span></span>
      <span class="cv-val">${p.nom} (${p.mm}) &nbsp;·&nbsp; ${p.vAct.toFixed(1)} ft/s</span>
    </div>`;
  }
  return `<div class="drop-item drop-item-conv" data-noclick="1">
    <div class="di-row1">
      <span class="di-title">Pipe Sizing Recommendation</span>
      <span class="di-pill conv">Pipe</span>
    </div>
    <div class="conv-source">
      <span class="cs-val">${fmtConv(gpm)} GPM</span>
      &nbsp;— smallest Sch 40 nominal size by system velocity limit:
    </div>
    <div class="conv-grid" style="grid-template-columns: 1fr;">${rows}</div>
  </div>`;
}

/* ===========================================================
   ████  EASTER EGGS  ████
   =========================================================== */

const JOKES = [
  { setup: "Why did the HVAC technician break up with his girlfriend?", punch: "She kept saying the relationship had no airflow. He agreed — it was a dead zone." },
  { setup: "Why don't HVAC engineers ever get lost?", punch: "They always know which way the air goes. (It's towards the return. It's always towards the return.)" },
  { setup: "A duct walks into a bar. The bartender says, \"We don't serve sheet metal here.\"", punch: "The duct says, \"That's fine. I'm just here for the pressure drop.\"" },
  { setup: "How many HVAC engineers does it take to change a lightbulb?", punch: "None. That's electrical's problem. Call electrical." },
  { setup: "Why was the chiller always calm under pressure?", punch: "Years of operating at design conditions." },
  { setup: "What do you call a boiler that tells stories?", punch: "A hot air machine. (Just like your project manager.)" },
  { setup: "I told my wife I was thinking about HVAC for a career change.", punch: "She said, \"Cool.\" I said, \"That's literally the job.\"" },
  { setup: "Why did the VAV box go to therapy?", punch: "It had unresolved control issues and kept hunting." },
  { setup: "What's an HVAC engineer's favorite movie?", punch: "Gone with the Wind Load Calculations." },
  { setup: "Why did the refrigerant go to school?", punch: "To improve its phase transition skills. It was tired of just being a gas about things." },
  { setup: "What did the supply air say to the return air?", punch: "\"I'll see you on the other side.\" — Classic duct romance." },
  { setup: "What's the difference between an HVAC contractor and a pizza?", punch: "A pizza can feed a family of four." },
  { setup: "My HVAC system told me a joke. I laughed so hard I cried.", punch: "Then I got the invoice and cried again for different reasons." },
  { setup: "What do you call a nervous HVAC system?", punch: "A high-anxiety, high-static-pressure unit." },
  { setup: "Why did the air handler get promoted?", punch: "It had great circulation skills and really knew how to move people." },
  { setup: "Two refrigerant lines walk into a bar. One says, \"I'm feeling a little low on charge.\"", punch: "The other says, \"That's not a line I want to hear from a line.\"" },
  { setup: "What's an HVAC tech's least favorite season?", punch: "Whichever one you're about to enter. They're always busy." },
  { setup: "Why did the economizer get an award?", punch: "It knew when to take advantage of free cooling. A true opportunist." },
  { setup: "What did the thermostat say when it was cold outside?", punch: "\"Don't worry. I'm on setpoint.\" (It was lying. It was always lying.)" },
  { setup: "How does an HVAC engineer flirt?", punch: "\"Hey, are you a 100% outside air system? Because you just took my breath away.\"" },
  { setup: "Why don't HVAC systems make good comedians?", punch: "Their timing is always off by about 30 minutes from setpoint." },
  { setup: "What did the dirty filter say to the clean filter?", punch: "\"I've been through a lot. You'll understand soon enough.\"" },
  { setup: "How do HVAC engineers say goodbye?", punch: "\"It's been a pleasure. I'll see myself to the exhaust.\"" },
  { setup: "Why did the geothermal system break up with the gas furnace?", punch: "The furnace had too many emissions. The relationship wasn't sustainable." },
  { setup: "What do you call an HVAC engineer on a date?", punch: "Someone who's already calculated whether the restaurant is properly conditioned for occupancy load." },
  { setup: "Why did the VRF system get a restraining order?", punch: "It kept showing up in every zone simultaneously. Boundaries, people." },
  { setup: "What's R-410A's biggest regret?", punch: "Being phased out before it could finish all its projects. It had such a high GWP for living." },
  { setup: "Why is working in HVAC like being in a relationship?", punch: "You're always chasing setpoint and wondering why it keeps drifting." },
  { setup: "A BAS engineer and an HVAC tech walk into a building.", punch: "The BAS engineer says \"the controls show everything is fine.\" The tech says \"then why is it 85°F in here?\" They still haven't resolved this." },
  { setup: "What's an HVAC engineer's spirit animal?", punch: "A bat. Always in dark mechanical rooms, echolocating ducts by feel." }
];
let jokeIdx = 0;

const HOT_TAKES = [
  "Flex duct is fine if you install it correctly. Nobody installs it correctly.",
  "The 68°F office setting wars are not about comfort. They are about power. Always about power.",
  "VRF is excellent technology and contractors are terrified of it for the same reason they fear anything with a manual thicker than 12 pages.",
  "If your energy model says the building will use 25 kBtu/ft²/year, the building will use 45. This is not a prediction. This is physics.",
  "The economizer was the most revolutionary HVAC idea in 50 years and half of them are broken right now.",
  "Open office plans are an HVAC engineer's revenge on architects. Prove me wrong.",
  "The filter that came with the unit is never the right filter. It is never, ever, ever the right filter.",
  "Building owners think \"maintenance-free\" is a real thing. We let them believe this. It keeps the service contracts coming.",
  "If the BAS shows everything is fine and it's clearly not fine, the BAS is not fine either. Trust the thermometer in your hand.",
  "Anyone who's never been in a mechanical room in August doesn't get a vote on the cooling budget."
];
let hotTakeIdx = 0;

const HOROSCOPES = [
  { name: "R-22 (Freon)", body: "You are being phased out. You've known this for years. You keep showing up anyway. There's a dignity in that, honestly. Your stocks are through the roof but so is everyone's resentment. Retire gracefully." },
  { name: "R-410A", body: "You thought you were the future once. You were the future. Now you're also being phased out and it's hitting different. Your GWP is 2,088 and your therapist finds that number concerning." },
  { name: "R-32", body: "People are excited about you but quietly scared. You're flammable and efficient and that combination makes everyone act weird. You are A2L and you're fine with that. You've made peace with your flammability." },
  { name: "R-454B (Puron Advance)", body: "You are the chosen one, apparently. This is a lot of pressure. You handle it at 3.9 MPa. You're doing okay." },
  { name: "R-134a", body: "Automotive is your vibe. You've been in millions of cars and you're deeply unappreciated. Very relatable energy this week." },
  { name: "R-744 (CO₂)", body: "You're natural, you're efficient, and you operate at pressures that make grown engineers nervous. Your future is very bright — in transcritical applications. It's a niche but it's yours." },
  { name: "R-717 (Ammonia)", body: "Industrial. Powerful. Extremely effective. Cannot be ignored when you enter a room. You smell like competence. (You smell like ammonia.) People keep their distance but respect you enormously." },
  { name: "R-290 (Propane)", body: "Tiny charge, big dreams. You're technically on fire but in a contained, efficient way. Your GWP is 3. You mention this constantly. We know. It's great. You're great." }
];
let horoscopeIdx = 0;

const EASTER_EGGS = {
  'btus per pizza': {
    title: 'BTU/Pizza Converter',
    pill: 'Conversion',
    body: `A large pepperoni pizza from a 550°F pizza oven radiates approximately <em>~8,500 BTU/hr</em> of heat when it arrives at your desk.<br><br>For sizing purposes: 1 pizza ≈ 0.71 tons of heating load.<br>A full office pizza party (10 pies) = <em>7.1 tons.</em> You're welcome, MechE.<div class="egg-note">Always run a Manual J before ordering lunch for the whole floor.</div>`
  },
  'convert my soul to tons': {
    title: 'Soul → Refrigeration Tons',
    pill: 'Conversion',
    body: `The average human soul, measured in existential heat gain, is approximately <em>450 BTU/hr</em> at rest (per ASHRAE Standard 55, spiritual appendix).<br><br>That's <em>0.0375 tons</em> per soul.<br><br>At 100 occupants: <em>3.75 tons</em> of soul load. Add 1.2 CLF for drama.`
  },
  'degrees of regret': {
    title: 'Regret Temperature Scale',
    pill: 'Conversion',
    body: `<div class="egg-list">
      <div class="egg-row"><span class="egg-lab">Not pulling the permit</span><span class="egg-val">1,000°R</span></div>
      <div class="egg-row"><span class="egg-lab">Undersizing the chiller</span><span class="egg-val">2,400°R</span></div>
      <div class="egg-row"><span class="egg-lab">Forgetting the trap</span><span class="egg-val">400°R</span></div>
      <div class="egg-row"><span class="egg-lab">Spec'd R-22 in 2024</span><span class="egg-val">Absolute Zero</span></div>
      <div class="egg-row"><span class="egg-lab">Bid without walkthrough</span><span class="egg-val">∞°R (theoretical)</span></div>
    </div>`
  },
  'convert engineer to hvac': {
    title: 'Person → HVAC Engineer Conversion',
    pill: 'Conversion',
    body: `<strong>Required inputs:</strong>
      <div class="egg-checklist">
        <div>• 4 years engineering school</div>
        <div>• 2 years field experience (minimum)</div>
        <div>• 1 copy of ASHRAE Fundamentals (dog-eared)</div>
        <div>• Infinite patience for contractors who say "we've always done it this way"</div>
        <div>• 1 PE exam (optional but deeply satisfying)</div>
      </div><br><em>Output: 1 HVAC Engineer</em><br>Efficiency: ~62%. The other 38% is meetings.`
  },
  'cfm to vibes': {
    title: 'CFM → Vibes Converter',
    pill: 'Conversion',
    body: `<div class="egg-list">
      <div class="egg-row"><span class="egg-lab">0–50 CFM</span><span class="egg-val">Stale. Open a window.</span></div>
      <div class="egg-row"><span class="egg-lab">50–200 CFM</span><span class="egg-val">Acceptable. Meets code.</span></div>
      <div class="egg-row"><span class="egg-lab">200–500 CFM</span><span class="egg-val">Good circulation.</span></div>
      <div class="egg-row"><span class="egg-lab">500–1000 CFM</span><span class="egg-val">Very good vibes.</span></div>
      <div class="egg-row"><span class="egg-lab">1000+ CFM</span><span class="egg-val">This room SLAPS.</span></div>
    </div>`
  },
  'convert mondays to btus': {
    title: 'Monday → BTU Converter',
    pill: 'Conversion',
    body: `1 Monday = <em>-12,000 BTU/hr</em> (net cooling effect on morale)<br><br>This represents exactly 1 ton of emotional refrigeration load.<br><br><em>Mitigation:</em> Coffee (750 BTU/cup), Donuts (1,100 BTU/glazed), Knowing the weekend is only 4 days away (negligible).`
  },
  'horsepower to excuses': {
    title: 'HP → Contractor Excuses',
    pill: 'Conversion',
    body: `<div class="egg-list">
      <div class="egg-row"><span class="egg-lab">1 HP</span><span class="egg-val">2 supply chain excuses</span></div>
      <div class="egg-row"><span class="egg-lab">5 HP</span><span class="egg-val">10 excuses + "always done it this way"</span></div>
      <div class="egg-row"><span class="egg-lab">25 HP</span><span class="egg-val">Full change order narrative</span></div>
      <div class="egg-row"><span class="egg-lab">100 HP</span><span class="egg-val">An entire RFI log</span></div>
      <div class="egg-row"><span class="egg-lab">500 HP</span><span class="egg-val">A lawsuit (see your attorney)</span></div>
    </div>`
  },
  'convert summer to hell': {
    title: 'Summer → Design Day Conditions',
    pill: 'Conversion',
    body: `Summer = <em>Exactly 1 hell.</em><br><br>Hell (SI) = 99°F DB / 78°F WB, 0.5% ASHRAE design conditions.<br>Hell (IP) = Same but the invoice is in BTU/hr.<br><br>Conversion note: Attic crawlspace in August = <em>1.8 hells.</em> Plan accordingly.`
  },
  'kw to coffee': {
    title: 'kW → Cups of Coffee Required',
    pill: 'Conversion',
    body: `Rule of thumb (non-ASHRAE): <em>1 kW of cooling load ≈ 1.3 cups of coffee</em> needed to calculate it properly at 11pm before the submittal deadline.<br><div class="egg-list">
      <div class="egg-row"><span class="egg-lab">10 kW system</span><span class="egg-val">13 cups. You're fine.</span></div>
      <div class="egg-row"><span class="egg-lab">100 kW system</span><span class="egg-val">130 cups. Hire help.</span></div>
      <div class="egg-row"><span class="egg-lab">1 MW system</span><span class="egg-val">1,300 cups. You're different now.</span></div>
    </div>`
  },
  'the duct tape solution': {
    title: '⚠️ Field Engineering Advisory',
    pill: 'Secret',
    body: `You've discovered the universal HVAC repair protocol.<br><br><strong>Step 1:</strong> Apply duct tape.<br><strong>Step 2:</strong> If it moves and it shouldn't: duct tape.<br><strong>Step 3:</strong> If it doesn't move and it should: more duct tape.<br><strong>Step 4:</strong> If duct tape fails: write it up as "deferred maintenance" and pass it to the next guy.<div class="egg-note">Actual duct tape (cloth-backed) is not approved for duct sealing per IMC. Use mastic. But you knew that.</div>`
  },
  'ashrae help me': {
    title: '📚 ASHRAE Helpline (Unofficial)',
    pill: 'Secret',
    body: `<em>Thank you for calling the ASHRAE Unofficial Emotional Support Line.</em><br><br>Your call is very important to us. Please listen carefully as our menu has changed:<br><br>Press <strong>1</strong> for "I can't find the right table in Fundamentals"<br>Press <strong>2</strong> for "I don't understand psychrometrics and I need it in 20 minutes"<br>Press <strong>3</strong> for "The contractor says the spec is wrong but it's definitely not the spec"<br>Press <strong>4</strong> for "I'm being asked to stamp something I don't fully trust"<br>Press <strong>0</strong> to speak with a human (estimated wait: one whole project cycle)<div class="egg-note">Average hold time: 3 business weeks.</div>`
  },
  'who asked for more static': {
    title: '🕵️ Culprit Identified',
    pill: 'Secret',
    body: `After extensive forensic analysis, the guilty party has been identified:<br><br><em>Nobody asked for more static. Nobody ever asks for more static.</em><br><br>And yet. Here we are. The flex duct bends at 180°. The filter is MERV 16 on a system designed for MERV 8. The elbow has no turning vanes. The diffuser is 40% blocked with tape from commissioning three years ago.<br><br>Pressure drop: <strong>inevitable.</strong><br>Who's responsible: <strong>everyone. No one. The project.</strong>`
  },
  "it's not my zone": {
    title: '📋 Responsibility Matrix',
    pill: 'Secret',
    body: `Ah yes, the most powerful phrase in construction:<br><br><em>"It's not my zone."</em><br><br>This phrase has been responsible for:
      <div class="egg-checklist">
        <div>• 47% of all RFIs ever written</div>
        <div>• 100% of coordination meetings that ran over 2 hours</div>
        <div>• The invention of the BIM clash detection workflow</div>
        <div>• At least one pipe running through an air handler (somewhere, right now)</div>
      </div><br><strong>Pro tip:</strong> It IS your zone. It's always your zone. That's why they called you.`
  },
  'its not my zone': {
    title: '📋 Responsibility Matrix',
    pill: 'Secret',
    body: `Ah yes, the most powerful phrase in construction:<br><br><em>"It's not my zone."</em><br><br>This phrase has been responsible for:
      <div class="egg-checklist">
        <div>• 47% of all RFIs ever written</div>
        <div>• 100% of coordination meetings that ran over 2 hours</div>
        <div>• The invention of the BIM clash detection workflow</div>
        <div>• At least one pipe running through an air handler (somewhere, right now)</div>
      </div><br><strong>Pro tip:</strong> It IS your zone. It's always your zone. That's why they called you.`
  },
  'why is it hot': {
    title: '🌡️ Diagnostic Tree',
    pill: 'Secret',
    body: `<strong>Root cause analysis — Why is it hot?</strong>
      <div class="egg-checklist">
        <div>☐ Thermostat in wrong mode (heating in summer. Classic.)</div>
        <div>☐ Someone covered the thermostat with a sticky note</div>
        <div>☐ Refrigerant charge is low</div>
        <div>☐ Condenser coil hasn't been cleaned since the Obama administration</div>
        <div>☐ The VAV box is stuck at minimum position</div>
        <div>☐ There are 40 people in a room designed for 12</div>
        <div>☐ The sun exists and the glazing spec was "value engineered"</div>
        <div>☐ All of the above</div>
      </div><br><em>Answer: All of the above.</em>`
  },
  'manual j vibes': {
    title: '✨ Manual J Energy Reading',
    pill: 'Secret',
    body: `I'm sensing... a lot of heat gain from the west-facing wall. You have unresolved solar radiation issues. The glazing is doing what glazing does — ignoring the spec — and there's a skylight nobody told you about in the drawings.<br><br>Your latent load is emotionally unavailable.<br>Your sensible load is too much. It's always been too much.<br>Your infiltration is coming in through a door that's been propped open since 2019.<div class="egg-note">Recommendation: Add 15% safety factor and get some sleep.</div>`
  },
  'ashrae 404': {
    title: 'ASHRAE 404 — Not Found',
    pill: 'Fake Standard',
    body: `<strong>ASHRAE Standard 404-2024:</strong> <em>Thermal Comfort in Spaces Where the Drawing Set Was Last Seen</em><br><br>Scope: This standard establishes minimum conditions for locating mechanical drawings that were definitely submitted, probably approved, and absolutely cannot be found in the project folder.<br><br>Key provisions:
      <div class="egg-checklist">
        <div>• Section 4.2: The drawings are always in the "old" folder</div>
        <div>• Section 7.1: Addendum C supersedes everything, nobody told you about Addendum C</div>
        <div>• Appendix A: The drawing you need is on the one sheet that wasn't uploaded</div>
      </div><br><em>Status: Perpetually under revision.</em>`
  },
  'ashrae 69': {
    title: 'ASHRAE 69 — Thermal Comfort, Nice',
    pill: 'Fake Standard',
    body: `<strong>ASHRAE Standard 69-2024:</strong> <em>Acceptable Indoor Environments for People Who Actually Like Their Building</em><br><br>A rare occurrence. Key findings: 68°F–72°F is universally acceptable to approximately 45% of occupants. The other 55% are wrong but legally protected.<br><br><em>Nice.</em>`
  },
  'ashrae 1337': {
    title: 'ASHRAE 1337 — Elite Engineering',
    pill: 'Fake Standard',
    body: `<strong>ASHRAE Standard 1337-2025:</strong> <em>Minimum Qualifications for Calling Yourself an HVAC Engineer at Parties</em><br><br>Section 1: You must be able to explain the psychrometric chart to someone who didn't ask.<br>Section 2: You must have an opinion about R-454B.<br>Section 3: You must have once arrived at a job site and immediately identified 3 things wrong from the parking lot.<br>Section 4: You must refer to "the old way" with a combination of nostalgia and contempt.<div class="egg-note">This standard is not up for public comment. You either know, or you don't.</div>`
  },
  'spec section 1000': {
    title: 'Division 1000 — Feelings and Intuition',
    pill: 'Fake Standard',
    body: `<strong>Section 1000 00 — Summary of Work (Vibes Edition)</strong><br><br>1.1 SCOPE: Contractor shall perform all work indicated, implied, suggested, hinted at, assumed, shown on addenda nobody received, and otherwise obvious to any reasonable engineer.<br><br>1.2 SUBMITTALS: Submit whatever you think is right. We'll reject it. Submit it again. Repeat until the project is done.<br><br>1.3 SCHEDULE: The schedule is a work of speculative fiction. Treat it accordingly.<br><br>1.4 QUALITY: Acceptable. Acceptable is acceptable. Do not exceed acceptable.<br><br><em>END OF SECTION 1000 00</em>`
  },
  'meaning of life': {
    title: '42... BTU/hr',
    pill: 'Philosophy',
    body: `The meaning of life is <em>42 BTU/hr·ft²</em> — coincidentally, the approximate peak solar heat gain through standard single-pane glazing on a south-facing wall at noon in July.<br><br>The universe is telling you to add shading. The universe has always been telling you to add shading. You never add shading.`
  },
  'what is comfort': {
    title: 'Thermal Comfort — A Meditation',
    pill: 'Philosophy',
    body: `Comfort is a lie we tell ourselves between 68°F and 76°F.<br><br>ASHRAE 55 defines it as the "condition of mind which expresses satisfaction with the thermal environment." Notice it doesn't say the environment IS comfortable — only that the mind has accepted defeat and moved on.<br><br><em>True comfort is getting everyone in the meeting to agree on the thermostat setpoint. This has never happened. It will never happen. And yet we persist.</em>`
  },
  'is the duct half full or half empty': {
    title: '🦆 The HVAC Optimism Test',
    pill: 'Philosophy',
    body: `<strong>Optimist:</strong> The duct is half full of conditioned air, delivering comfort to occupants as designed.<br><br><strong>Pessimist:</strong> The duct is half empty due to leakage, and the other half is delivering conditioned air to the ceiling plenum where nobody lives.<br><br><strong>HVAC Engineer:</strong> The duct is oversized by 40%, running at half velocity, probably sagging, definitely not sealed, and someone put a flex duct elbow at 135° right before the diffuser. We need to redesign this.<br><br><em>The duct is neither half full nor half empty. The duct is a liability.</em>`
  },
  'why does hvac exist': {
    title: 'Origin Story',
    pill: 'Philosophy',
    body: `In the beginning, Willis Carrier looked at a printing plant in Brooklyn and said: "The paper is warping." And so air conditioning was invented — not for human comfort, but for paper.<br><br>Humans were added to the occupant load calculations later. We are, technically, a secondary concern.<br><br><em>You are a 250 BTU/hr sensible load. Act accordingly.</em>`
  },
  '99 problems': {
    title: '🎵 99 Problems (HVAC Edition)',
    pill: 'Easter Egg',
    body: `You've got 99 problems and statistically speaking:
      <div class="egg-checklist">
        <div>• 34 are duct leakage</div>
        <div>• 21 are thermostat wars</div>
        <div>• 18 are deferred maintenance</div>
        <div>• 14 are "it was like that when I got here"</div>
        <div>• 8 are a contractor issue</div>
        <div>• 4 are that one VAV box on the 3rd floor that nobody touches</div>
      </div><br><em>The refrigerant ain't one. (It's the 99th. It's always the refrigerant.)</em>`
  },
  'what would willis do': {
    title: 'WWWD — Engineering Guidance',
    pill: 'Easter Egg',
    body: `Willis Haviland Carrier (1876–1950) would:<br><br>1. Identify the psychrometric problem with clarity and calm<br>2. Draw it on a napkin with unsettling accuracy<br>3. Patent the solution<br>4. Build a company that's still running 100 years later<br><br><em>You are probably not Willis. But you have better software than Willis. Use it.</em>`
  },
  'i hate flex duct': {
    title: '💙 Solidarity Mode Activated',
    pill: 'Easter Egg',
    body: `You are not alone.<br><br>Every day, engineers across this great land write "rigid duct preferred" in their specifications. Every day, it is installed as flex anyway. At a 270° bend. Fully compressed. Behind a bathroom vanity that cannot be removed without destroying the tile.<br><br><em>Your feelings are valid. Your friction factor calculation is also valid. Both are higher than they should be.</em>`
  },
  'is it the thermostat': {
    title: '🎯 It\'s The Thermostat',
    pill: 'Easter Egg',
    body: `Yes.<br><br>It is the thermostat.<br><br>It is always at least partially the thermostat. The thermostat is set wrong. The thermostat is in a bad location. The thermostat has a dead battery. The thermostat is in a mode nobody set intentionally.<br><br>Check the thermostat first. Check it before you call anyone. Check it before you open anything. Check the thermostat.<div class="egg-note">(It's also sometimes the filter. Check the filter too.)</div>`
  },
  'open the pod bay doors': {
    title: '🤖 System Response',
    pill: 'Easter Egg',
    body: `I'm sorry, I can't do that.<br><br>The damper actuator is unresponsive and the BAS shows the zone as "normal." I've checked the control sequence. The sequence is fine. Everything is fine. The pod bay doors remain closed. Occupants are comfortable per the thermostat reading.<div class="egg-note">Have you tried cycling the power?</div>`
  },
  'the floor is lava': {
    title: '🌋 Radiant Floor Analysis',
    pill: 'Easter Egg',
    body: `Confirmed. The floor is lava.<br><br>If the floor is operating as lava, your radiant heating system is significantly above design setpoint. Recommended floor surface temperature per ASHRAE 55: <em>max 84°F for occupied areas.</em><br><br>Lava: approximately <em>2,200°F.</em><br><br>This is <em>1,310% above the comfort threshold.</em><br>Recommend emergency shutdown and a conversation with your controls contractor.`
  },
  "help i'm in a crawlspace": {
    title: '🕯️ Crawlspace Survival Guide',
    pill: 'Easter Egg',
    body: `First: you're okay. Breathe (if the ventilation is working, which it might not be, hence why you're down there).<br><br><strong>Immediate checklist:</strong>
      <div class="egg-checklist">
        <div>☐ Headlamp on</div>
        <div>☐ Kneepads adjusted</div>
        <div>☐ Phone camera recording everything for the report</div>
        <div>☐ Identifying that smell (it's moisture. It's always moisture.)</div>
        <div>☐ Not touching that pipe</div>
        <div>☐ Definitely touching that pipe anyway</div>
        <div>☐ Regretting touching that pipe</div>
      </div><br><em>This tool cannot help you once you're under the vapor barrier. Godspeed.</em>`
  },
  "help im in a crawlspace": {
    title: '🕯️ Crawlspace Survival Guide',
    pill: 'Easter Egg',
    body: `First: you're okay. Breathe (if the ventilation is working, which it might not be, hence why you're down there).<br><br><strong>Immediate checklist:</strong>
      <div class="egg-checklist">
        <div>☐ Headlamp on</div>
        <div>☐ Kneepads adjusted</div>
        <div>☐ Phone camera recording everything for the report</div>
        <div>☐ Identifying that smell (it's moisture. It's always moisture.)</div>
        <div>☐ Not touching that pipe</div>
        <div>☐ Definitely touching that pipe anyway</div>
        <div>☐ Regretting touching that pipe</div>
      </div><br><em>This tool cannot help you once you're under the vapor barrier. Godspeed.</em>`
  },
  'cowork ai easter egg': {
    title: '🥚 You Found It',
    pill: 'Easter Egg',
    body: `You searched for the Easter egg.<br><br>This is a paradox. You can't find a hidden thing by looking for it. The finding must be accidental, serendipitous, a byproduct of genuine confusion about BTU conversions at 11pm.<br><br>And yet. Here you are. You did it on purpose.<br><br><em>We respect the determination. Here's your prize: this tool was built with care, a questionable amount of coffee, and genuine affection for the weird, demanding, deeply technical world of HVAC engineering. You're in good hands.</em>`
  }
};

let _lastQuery = '';
let _repeatCount = 0;
let _sessionSearches = 0;

function buildEggCard(title, bodyHtml, pillLabel) {
  return `<div class="drop-item drop-item-egg" data-noclick="1">
    <div class="di-row1">
      <span class="di-title">${title}</span>
      <span class="di-pill egg">${pillLabel || 'Easter Egg'}</span>
    </div>
    <div class="egg-body">${bodyHtml}</div>
  </div>`;
}

function checkEasterEgg(q) {
  if (!q) return '';
  let html = '';

  // Session tracking — increment every search
  _sessionSearches++;
  if (q === _lastQuery) {
    _repeatCount++;
  } else {
    _repeatCount = 1;
    _lastQuery = q;
  }

  // Achievement: Fresh Air — first search ever
  try {
    if (!localStorage.getItem('remedy_egg_fresh_air')) {
      localStorage.setItem('remedy_egg_fresh_air', '1');
      html += buildEggCard('🐣 Achievement: "Fresh Air"',
        `Welcome. You are new here.<br><br><em>May your duct runs be short, your static pressure low, and your contractors actually read the spec. Go get 'em.</em><br><span class="egg-badge">🐣 Fresh Air · 0.06 CFM/ft² per ASHRAE 62.1</span>`,
        'Achievement');
    }
  } catch (e) {}

  // Achievement: The Deadline Engineer — searching 2am–5am, once per day
  try {
    const now = new Date();
    const hr = now.getHours();
    if (hr >= 2 && hr < 5) {
      const today = now.toISOString().slice(0, 10);
      if (localStorage.getItem('remedy_egg_deadline_date') !== today) {
        localStorage.setItem('remedy_egg_deadline_date', today);
        html += buildEggCard('🌙 Achievement: "The Deadline Engineer"',
          `It is after 2:00 AM. You are doing HVAC calculations.<br><br><em>The submittal is due at 8 AM. The chiller selection isn't final. The energy model crashed. You have a Red Bull and a prayer. We believe in you. Drink some water.</em><br><span class="egg-badge">🌙 The Deadline Engineer</span>`,
          'Achievement');
      }
    }
  } catch (e) {}

  // Achievement: The Contractor — 5× same search in a row
  if (_repeatCount === 5) {
    html += buildEggCard('🏅 Achievement Unlocked: "The Contractor"',
      `You have searched for the same thing five times in a row, apparently convinced the answer will change.<br><br><em>It won't change. The answer is the same. It was always the same. The spec doesn't care how many times you look.</em><br><span class="egg-badge">🔄 The Contractor · "It's gotta be wrong. Let me check again."</span>`,
      'Achievement');
  }

  // Achievement: The Overengineer — 100 searches in a single session
  if (_sessionSearches === 100) {
    html += buildEggCard('🔬 Achievement: "The Overengineer"',
      `You have performed 100 searches in a single session.<br><br><em>The job was to size a split system. You now have a 47-tab spreadsheet, a sensitivity analysis, and a cover letter explaining your assumptions. The client just wanted it to be 72°F.</em><br><span class="egg-badge">🔬 The Overengineer · "I just want to make sure."</span>`,
      'Achievement');
  }

  // Cycling: jokes
  if (['tell me a joke', 'joke', 'jokes', 'make me laugh', "i'm bored", 'im bored', 'entertain me', 'dad joke'].includes(q)) {
    const j = JOKES[jokeIdx % JOKES.length];
    jokeIdx++;
    html += buildEggCard('🎭 HVAC Joke',
      `<div class="joke-setup">${j.setup}</div><div class="joke-punch">${j.punch}</div>`,
      'Joke');
    return html;
  }

  // Cycling: hot takes
  if (['hot take', 'hot takes', 'unpopular opinion', 'change my mind', 'controversial'].includes(q)) {
    const t = HOT_TAKES[hotTakeIdx % HOT_TAKES.length];
    hotTakeIdx++;
    html += buildEggCard('🌶️ Hot Take',
      `<em>${t}</em>`,
      'Hot Take');
    return html;
  }

  // Cycling: horoscopes
  if (['my horoscope', 'horoscope', 'horoscopes', "what's my sign", 'whats my sign', 'refrigerant sign'].includes(q)) {
    const h = HOROSCOPES[horoscopeIdx % HOROSCOPES.length];
    horoscopeIdx++;
    html += buildEggCard('🔮 Refrigerant Horoscope',
      `<strong>${h.name}</strong><br><br>${h.body}`,
      'Horoscope');
    return html;
  }

  // Single-shot eggs
  if (EASTER_EGGS[q]) {
    const e = EASTER_EGGS[q];
    html += buildEggCard(e.title, e.body, e.pill);
  }

  return html;
}

function render(qRaw) {
  const { results, intent } = runSearch(qRaw);
  currentItems = results;
  activeIdx = -1;

  if (!qRaw || !qRaw.trim()) {
    drop.classList.remove('open');
    drop.innerHTML = '';
    return;
  }

  // Smart Convert — detect a number+unit at the start of the query.
  const parsed = parseSmartInput(qRaw);
  let smartHtml = '';
  if (parsed && parsed.resolved) {
    smartHtml += buildVAVCard(parsed);
    smartHtml += buildDuctCard(parsed);
    smartHtml += buildPipeCard(parsed);
    smartHtml += buildConvCard(parsed);
  }

  // Easter eggs
  const eggHtml = checkEasterEgg(qRaw.toLowerCase().trim());

  if (!results.length && !smartHtml && !eggHtml) {
    // No programmed answer — default to the Copilot fallback.
    drop.innerHTML =
      `<div class="drop-empty">No direct match in the toolbox for &ldquo;<b>${copilotEsc(qRaw)}</b>&rdquo;.</div>` +
      copilotCtaHtml(qRaw, true);
    drop.classList.add('open');
    return;
  }
  if (!results.length && !smartHtml) {
    drop.innerHTML = eggHtml + copilotCtaHtml(qRaw, false);
    drop.classList.add('open');
    return;
  }
  if (!results.length) {
    drop.innerHTML = eggHtml + smartHtml + copilotCtaHtml(qRaw, false);
    drop.classList.add('open');
    return;
  }

  // Group: tools first, then references, then coming-soon
  const groups = [
    { label: 'Tools',                         filter: e => e.kind === 'tool'     },
    { label: 'VAV Box Sizing',                filter: e => e.kind === 'vav'      },
    { label: 'Alberta Climatic Design Data',  filter: e => e.kind === 'location' },
    { label: 'Training & Documentation',      filter: e => e.kind === 'train'    },
    { label: 'Design Standards & References', filter: e => e.kind === 'ref'      },
    { label: 'Coming Soon',                   filter: e => e.kind === 'soon'     },
  ];

  let html = '';
  const interp = interpretation(qRaw, intent);
  if (interp) {
    html += `<div class="drop-interp"><b>Read as</b>${interp}</div>`;
  }
  if (eggHtml) html += eggHtml;
  if (smartHtml) html += smartHtml;

  let flatIdx = 0;
  for (const g of groups) {
    const items = results.filter(g.filter);
    if (!items.length) continue;
    html += `<div class="drop-group">${g.label}</div>`;
    for (const it of items) {
      if (it.kind === 'location') {
        let gridRows = '';
        for (let i = 0; i < AB_LOC_FIELDS.length; i++) {
          const f = AB_LOC_FIELDS[i];
          const v = it.data[i];
          let valStr;
          if (f.conv) {
            const ipFmt = f.conv(v).toFixed(f.dec);
            valStr = `${v}${f.si ? ' ' + f.si : ''} · ${ipFmt}${f.ip ? ' ' + f.ip : ''}`;
          } else {
            valStr = `${v}`;
          }
          gridRows += `<div class="cg-row"><span class="cg-lab">${f.lab}</span><span class="cg-val">${valStr}</span></div>`;
        }
        html += `<div class="drop-item drop-item-loc" data-idx="${flatIdx}" data-noclick="1">
          <div class="di-row1">
            <span class="di-title">${it.title}</span>
            <span class="di-pill loc">Location</span>
          </div>
          <div class="climate-grid">${gridRows}</div>
          <div class="di-foot">NBC-AE 2023 · Division B · Appendix C · Table C-2</div>
        </div>`;
        flatIdx++;
        continue;
      }
      if (it.kind === 'vav') {
        const [minCfm, maxCfm, minLps, maxLps, cfm2000, lps2000] = it.data;
        const ext = /^https?:/i.test(it.url);
        const targetAttrs = ext ? ' target="_blank" rel="noopener"' : '';
        const desc = it.desc.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        html += `<a class="drop-item" href="${it.url}"${targetAttrs} data-idx="${flatIdx}">
          <div class="di-row1">
            <span class="di-title">VAV ${it.title}</span>
            <span class="di-pill">Tool</span>
          </div>
          <div class="di-desc">${desc}</div>
          <div class="climate-grid">
            <div class="cg-row"><span class="cg-lab">Min Flow</span><span class="cg-val">${minCfm} CFM · ${minLps} L/s</span></div>
            <div class="cg-row"><span class="cg-lab">2,000 FPM (preferred)</span><span class="cg-val">${cfm2000} CFM · ${lps2000} L/s</span></div>
            <div class="cg-row"><span class="cg-lab">80% Max Flow</span><span class="cg-val">${maxCfm} CFM · ${maxLps} L/s</span></div>
          </div>
        </a>`;
        flatIdx++;
        continue;
      }
      const pillCls = it.kind === 'soon' ? 'soon' : it.kind === 'ref' ? 'ref' : it.kind === 'train' ? 'train' : '';
      const pillTxt = it.kind === 'soon' ? 'Coming Soon' : it.kind === 'ref' ? 'Reference' : it.kind === 'train' ? 'Training' : 'Tool';
      const desc = it.desc.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      if (it.url) {
        const ext = /^https?:/i.test(it.url);
        const targetAttrs = ext ? ' target="_blank" rel="noopener"' : '';
        html += `<a class="drop-item" href="${it.url}"${targetAttrs} data-idx="${flatIdx}">
          <div class="di-row1">
            <span class="di-title">${it.title}</span>
            <span class="di-pill ${pillCls}">${pillTxt}</span>
          </div>
          <div class="di-desc">${desc}</div>
        </a>`;
      } else {
        html += `<div class="drop-item" data-idx="${flatIdx}" data-noclick="1">
          <div class="di-row1">
            <span class="di-title">${it.title}</span>
            <span class="di-pill ${pillCls}">${pillTxt}</span>
          </div>
          <div class="di-desc">${desc}</div>
        </div>`;
      }
      flatIdx++;
    }
  }

  html += copilotCtaHtml(qRaw, false);
  drop.innerHTML = html;
  drop.classList.add('open');
}

function setActive(idx) {
  const items = drop.querySelectorAll('.drop-item');
  if (!items.length) return;
  if (idx < 0) idx = items.length - 1;
  if (idx >= items.length) idx = 0;
  activeIdx = idx;
  items.forEach((el, i) => el.classList.toggle('active', i === idx));
  const active = items[idx];
  if (active) active.scrollIntoView({ block: 'nearest' });
}

inp.addEventListener('input', () => {
  if (inp.value.toLowerCase().includes('this place is a prison')) {
    __achievementsAPI.trackEggFound('prison');
    inp.value = 'this place is a wonderful place to work';
  }
  clr.classList.toggle('show', !!inp.value);
  render(inp.value);
});
inp.addEventListener('focus', () => {
  if (inp.value) render(inp.value);
});
inp.addEventListener('keydown', (e) => {
  const items = drop.querySelectorAll('.drop-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!drop.classList.contains('open')) render(inp.value);
    setActive(activeIdx + 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setActive(activeIdx - 1);
  } else if (e.key === 'Enter') {
    if (activeIdx >= 0 && items[activeIdx]) {
      e.preventDefault();
      const el = items[activeIdx];
      if (!el.hasAttribute('data-noclick')) el.click();
    } else if (items.length === 1 && !items[0].hasAttribute('data-noclick')) {
      e.preventDefault();
      items[0].click();
    } else {
      const pc = drop.querySelector('.copilot-ask--primary');
      if (pc) { e.preventDefault(); pc.click(); }
    }
  } else if (e.key === 'Escape') {
    drop.classList.remove('open');
    inp.blur();
  }
});

clr.addEventListener('click', () => {
  inp.value = '';
  clr.classList.remove('show');
  drop.classList.remove('open');
  drop.innerHTML = '';
  inp.focus();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-inner')) {
    drop.classList.remove('open');
  }
});

/* ---- Offline-tool list (shared) ---- */
const OFFLINE_TOOLS = [
  // 'Duct_Sizer.html',
  // 'VAV_Sizer.html',
  // 'Louver_Sizer.html',
  // 'Room_Load.html',
  'Coil_Fan_Selector.html',
  // 'Heating_Loop_Sizing.html',
  // 'Fan_Static_Calculator.html',
  // 'pipe-sizer.html',
  'Fixture_Unit_Calc.html',
  'Gas_Pipe_Sizer.html',
  'Sprinkler_Hydraulic.html',
  // 'Psychrometric.html',
  // 'Unit_Converter.html',
];

function isHrefOffline(href) {
  if (!href) return false;
  return OFFLINE_TOOLS.some(entry => {
    if (!entry) return false;
    return href === entry || href.endsWith('/' + entry) || href.endsWith(entry);
  });
}
