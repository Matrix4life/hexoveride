// ═══════════════════════════════════════════════════════════════
// HEXOVERRIDE: GHOST YEAR — campaign content
// All hand-authored. Missions are scripted attack chains, no two alike.
// A "beat" is one chat/story node. A "mission" is a terminal sequence.
// ═══════════════════════════════════════════════════════════════

export const C = {
  bg:'#0a0a0f', panel:'#111118', dark:'#08080c', text:'#fcfcfa', dim:'#727072',
  cyan:'#78dce8', green:'#a9dc76', danger:'#ff6188', warn:'#ffd866',
  file:'#fc9867', purple:'#ab9df2', border:'#2d2a2e', pink:'#ff6ac1',
};

// crew members in "the basement" group chat
export const CREW = {
  V0LK:    { name:'V0LK',    color:C.danger, role:'the mentor' },
  bitrot:  { name:'bitrot',  color:C.green,  role:'crew · sarcastic' },
  m1ku:    { name:'m1ku',    color:C.pink,   role:'crew · anxious genius' },
  Cyrus:   { name:'Cyrus',   color:C.warn,   role:'crew · reckless' },
  SYSTEM:  { name:'SYSTEM',  color:C.dim,    role:'' },
};

// ── TERMINAL MISSIONS ──────────────────────────────────────────
// Each step: { do: command player must run (regex or exact),
//              hint, out: lines printed on success, [trace], [reveal] }
// Missions teach a distinct real technique. Walkthrough lives in hints.

export const MISSIONS = {
  // M1 — school grade portal: recon → default creds → SQLi
  m1_school: {
    title:'GRADEFIX',
    intro:[
      ['V0LK','First job. Your school\'s grade portal. Baby stuff.'],
      ['V0LK','I\'m not telling you to change a grade. I\'m telling you to *prove you can*.'],
      ['bitrot','translation: do not actually change your grade, narc-bait'],
    ],
    host:{ ip:'10.0.14.8', name:'eduportal.westbrook.k12' },
    steps:[
      { do:/^nmap\s+10\.0\.14\.8$/, hint:'Start with recon. Scan the host: nmap 10.0.14.8',
        out:[['SYSTEM','PORT     STATE  SERVICE'],['SYSTEM','22/tcp   open   ssh'],['SYSTEM','80/tcp   open   http  Apache/2.4.29'],['SYSTEM','3306/tcp open   mysql'],['SYSTEM','→ A web app talking to MySQL. Look at the login.']] },
      { do:/^curl\s+.*\/login/, hint:'Pull the login page to read it: curl http://10.0.14.8/login',
        out:[['SYSTEM','<form action="/auth" method="POST">'],['SYSTEM','<!-- TODO: remove test acct admin/admin before launch -->'],['SYSTEM','→ A dev left a comment. Classic.']] },
      { do:/^login\s+admin\s+admin$/, hint:'A developer left test creds in a comment. Try them: login admin admin',
        out:[['SYSTEM','HTTP 200 — but session role = "student". The test acct got downgraded.'],['SYSTEM','→ Not admin after all. The login form itself might be injectable.']] },
      { do:/^sqlmap\s+10\.0\.14\.8/, hint:'The login field isn\'t sanitized. Test for SQL injection: sqlmap 10.0.14.8',
        out:[['SYSTEM','[*] testing parameter \'user\'...'],['SYSTEM','[+] parameter is VULNERABLE (boolean-blind)'],['SYSTEM','[+] dumped: admin_hash, 1,204 student rows'],['SYSTEM','→ You\'re in as admin. You could change every grade in the district.']],
        reveal:'m1_choice' },
    ],
  },

  // M2 — the rival doxxer: OSINT pivot
  m2_doxxer: {
    title:'GLASS HOUSE',
    intro:[
      ['m1ku','someone\'s doxxing kids from our school. posting addresses.'],
      ['m1ku','i\'m scared. can you find who it is. please.'],
      ['V0LK','OSINT job. No breaking in. You follow the breadcrumbs they left themselves.'],
    ],
    host:{ ip:'paste.cx/9f2a', name:'the doxxer\'s paste' },
    steps:[
      { do:/^whois\s+paste\.cx/, hint:'Start with the paste site. whois paste.cx',
        out:[['SYSTEM','Registrar: privacy-protected. Dead end on the domain.'],['SYSTEM','→ The site\'s a wall. Go after the *user*, not the site.']] },
      { do:/^exif\s+.*\.jpg$/, hint:'They posted an image. Image metadata leaks GPS. Try: exif avatar.jpg',
        out:[['SYSTEM','GPS: 41.0793, -73.4690'],['SYSTEM','DeviceModel: iPhone 13'],['SYSTEM','→ Coordinates. A house three streets from yours.']] },
      { do:/^recon-ng\s+.*username/, hint:'Cross-reference their handle across platforms: recon-ng --username gh0stf4ce',
        out:[['SYSTEM','match: gh0stf4ce → reused on a gaming forum'],['SYSTEM','forum profile real name: "Dylan R., 9th grade"'],['SYSTEM','→ It\'s a kid. A scared kid copying older trolls.']],
        reveal:'m2_choice' },
    ],
  },

  // M3 — corp VPN: phishing pretext + MFA fatigue (heat introduced)
  m3_vpn:{
    title:'FRONT DOOR',
    intro:[
      ['V0LK','Real job now. Real money. A logistics firm — Meridian.'],
      ['V0LK','You won\'t break the VPN. You\'ll make an employee open it for you.'],
      ['Cyrus','this is the fun part lmaooo social engineering >>> code'],
    ],
    host:{ ip:'vpn.meridian-log.com', name:'Meridian VPN gateway' },
    steps:[
      { do:/^harvest\s+linkedin/, hint:'Find a target employee first: harvest linkedin meridian',
        out:[['SYSTEM','17 employees scraped.'],['SYSTEM','→ "Karen Doss, IT Helpdesk" — newest hire, lowest suspicion.']] },
      { do:/^pretext\s+helpdesk/, hint:'Build a believable cover story: pretext helpdesk',
        out:[['SYSTEM','Pretext: you ARE helpdesk, "verifying her VPN before a migration."'],['SYSTEM','→ She trusts the role, not the person. That\'s the whole trick.']] },
      { do:/^send\s+phish/, hint:'Send the phishing link from a lookalike domain: send phish',
        trace:15,
        out:[['SYSTEM','Mail sent from meridian-1og.com (that\'s a ONE, not an L).'],['SYSTEM','She clicked. Creds captured. But login needs MFA.']] },
      { do:/^mfa\s+fatigue/, hint:'You have her password but she has MFA. Spam push prompts until she caves: mfa fatigue',
        trace:20,
        out:[['SYSTEM','push... push... push... (2:14am, she\'s exhausted)'],['SYSTEM','She tapped APPROVE to make it stop. You\'re inside the VPN.'],['SYSTEM','⚠ Heat is real now. They WILL review logs eventually.']],
        reveal:'m3_done' },
    ],
  },

  // M4 — the setup: V0LK's job is a trap
  m4_setup:{
    title:'BAGMAN',
    intro:[
      ['V0LK','One target. In and out. Grab a file called handoff.dat. Don\'t read it.'],
      ['bitrot','...don\'t read it? since when does V0LK say don\'t read it'],
      ['m1ku','i don\'t like this. i don\'t like this at all'],
    ],
    host:{ ip:'45.77.douglas.vault', name:'unknown vault' },
    steps:[
      { do:/^connect\s+45\.77/, hint:'Connect to the vault host: connect 45.77.douglas.vault',
        out:[['SYSTEM','Connected. The box is TOO open. No real defenses.'],['SYSTEM','→ This is staged. Someone wants you in here.']] },
      { do:/^cat\s+handoff\.dat$/, hint:'V0LK said don\'t read it. Read it anyway: cat handoff.dat',
        out:[['SYSTEM','handoff.dat → it\'s YOUR operator profile. Your real handle. Your IP history.'],['SYSTEM','Someone built a file *on you* and parked it as bait.'],['SYSTEM','→ You were never the hacker on this job. You were the package.']],
        reveal:'m4_twist' },
    ],
  },

  // M5 — ICS water plant: the moral line
  m5_ics:{
    title:'DEADHAND',
    intro:[
      ['V0LK','You want out? Fine. One last job buys your freedom.'],
      ['V0LK','Municipal water plant. SCADA system. I need you to open a valve.'],
      ['m1ku','that\'s not data. that\'s people. people drink that water.'],
    ],
    host:{ ip:'172.16.scada.plc4', name:'Riverside Water — PLC bank' },
    steps:[
      { do:/^modbus\s+scan/, hint:'Industrial systems speak Modbus. Scan the PLCs: modbus scan',
        out:[['SYSTEM','PLC-4: chlorine dosing controller. UNAUTHENTICATED.'],['SYSTEM','→ No password. Industrial gear never had one. You could write any value.']] },
      { do:/^modbus\s+read/, hint:'Read the current safe state before you touch anything: modbus read',
        out:[['SYSTEM','chlorine_ppm = 1.2 (safe range 0.2–4.0)'],['SYSTEM','setpoint_max = 4.0'],['SYSTEM','→ One write pushes it to a poisoning dose. The choice is yours.']],
        reveal:'m5_choice' },
    ],
  },

  // M6 — unmask V0LK
  m6_unmask:{
    title:'WHO IS V0LK',
    intro:[
      ['bitrot','we deserve to know who\'s been pulling our strings'],
      ['Cyrus','i pulled V0LK\'s C2 server IP from an old log. go.'],
    ],
    host:{ ip:'v0lk.onion.relay', name:'V0LK\'s infrastructure' },
    steps:[
      { do:/^trace\s+v0lk/, hint:'Trace the C2 back through the relay: trace v0lk',
        out:[['SYSTEM','7 hops... 6... 3... last hop resolves to a corporate netblock.'],['SYSTEM','→ V0LK isn\'t a lone hacker. That\'s an org.']] },
      { do:/^whois\s+.*netblock/, hint:'Look up who owns that netblock: whois netblock',
        out:[['SYSTEM','Netblock owner: "Arclight Security Solutions" — a fed contractor.'],['SYSTEM','→ V0LK runs informants. You\'ve been building a case against yourself.']],
        reveal:'m6_reveal' },
    ],
  },

  // M7 — finale terminal (branch decided in chat, this is the execution)
  m7_finale:{
    title:'GHOST YEAR',
    intro:[
      ['V0LK','You know what I am now. Doesn\'t change the deal on the table.'],
    ],
    host:{ ip:'final', name:'the last call' },
    steps:[
      { do:/^run\s+killswitch$/, hint:'Type the plan you committed to: run killswitch',
        out:[['SYSTEM','Executing payload...'],['SYSTEM','...'],['SYSTEM','It\'s done. There\'s no taking it back.']],
        reveal:'resolve_ending' },
    ],
  },
};

// ── STORY GRAPH (chat beats + branching) ───────────────────────
// Each beat: lines[], and either choices[] or {next} or {mission} or {ending}
// choices set flags / adjust stats and route to next beat.

export const STORY = {
  intro:{
    lines:[
      ['SYSTEM','— THE BASEMENT // 11:47pm —'],
      ['V0LK','So you\'re the new one bitrot vouched for.'],
      ['bitrot','told you they\'re good. paranoid in a healthy way.'],
      ['V0LK','We\'ll see. Rule one: I give you a job, you do the job. You don\'t ask who it\'s for.'],
      ['V0LK','Rule two: heat is forever. Get sloppy, you don\'t just burn yourself, you burn all of us.'],
      ['m1ku','hi. don\'t die. ok bye 🫥'],
    ],
    next:'m1_brief',
  },
  m1_brief:{ lines:[['V0LK','Open your terminal. First job\'s loaded. Type "start" when you\'re in.']], mission:'m1_school' },

  m1_choice:{
    lines:[['V0LK','You\'re admin. Whole district\'s grades in your hands. What do you do?']],
    choices:[
      { label:'Change nothing. Just screenshot proof.', rep:+2, doubt:0, flag:'clean1',
        result:[['V0LK','...huh. Restraint. Most kids change their grade and get caught in a week.'],['bitrot','knew it']] },
      { label:'Fix m1ku\'s failing grade (she\'s drowning).', rep:+1, heat:+1, flag:'helped_m1ku',
        result:[['m1ku','wait what'],['m1ku','i didn\'t ask you to do that'],['m1ku','...thank you. nobody does stuff for me.']] },
      { label:'Boost your own GPA. Obviously.', rep:-1, heat:+2, flag:'greedy',
        result:[['V0LK','Greedy. Noted. The log shows ONE grade changed — yours. That\'s a signature, genius.'],['bitrot','rookie move lol']] },
    ],
    next:'m2_brief',
  },
  m2_brief:{ lines:[['m1ku','ok real job. someone\'s hurting people. please help.']], mission:'m2_doxxer' },
  m2_choice:{
    lines:[['SYSTEM','It\'s Dylan, a scared 9th grader copying older trolls.'],['m1ku','so what do we do with him']],
    choices:[
      { label:'Quietly scare him into stopping. No exposure.', rep:+2, doubt:+1, flag:'mercy',
        result:[['m1ku','he took everything down in an hour. he was crying.'],['m1ku','you didn\'t ruin him. you stopped him. that\'s different.'],['V0LK','Soft. Could\'ve been useful leverage. Remember that word: leverage.']] },
      { label:'Dox the doxxer. Let the school burn him.', rep:-1, heat:+2, flag:'cruel',
        result:[['Cyrus','LMAO he\'s expelled. taste of his own medicine'],['m1ku','...we became the thing we were fighting. cool. great.']] },
    ],
    next:'m3_brief',
  },
  m3_brief:{ lines:[['V0LK','You\'re ready for a real payday. This one has consequences if you fumble.']], mission:'m3_vpn' },
  m3_done:{
    lines:[
      ['V0LK','Clean work. Money\'s in your wallet.'],
      ['bitrot','yo something\'s weird. V0LK moved us off the usual server tonight.'],
      ['bitrot','like... right before this job. why\'d he do that.'],
      ['m1ku','i\'m sure it\'s nothing 🙃 (it\'s never nothing)'],
    ],
    next:'m4_brief',
  },
  m4_brief:{ lines:[['V0LK','Quick grab. File called handoff.dat. In, out, do NOT read it.']], mission:'m4_setup' },
  m4_twist:{
    lines:[
      ['SYSTEM','The file was a profile. On YOU.'],
      ['V0LK','You read it. Of course you read it.'],
      ['V0LK','Here\'s the truth: I don\'t hack things. I build cases. And you\'ve been building yours.'],
      ['bitrot','wait WHAT'],
      ['Cyrus','i KNEW it i KNEW V0LK was a cop'],
      ['V0LK','Not a cop. Worse. Now — you can keep working for me, or we find out what your file is worth.'],
    ],
    choices:[
      { label:'Play along. Buy time, gather your own intel.', doubt:+3, flag:'spy_back',
        result:[['V0LK','Smart. Keep being smart.'],['bitrot','(dm) we trust no one now. find out who he really is.']] },
      { label:'Go dark. Cut contact, warn the crew.', rep:+3, heat:+2, flag:'went_dark',
        result:[['bitrot','everyone scatter. burner accounts. NOW.'],['m1ku','i\'m scared but i\'m with you']] },
    ],
    next:'m5_brief',
  },
  m5_brief:{
    lines:[
      ['V0LK','You want free? Last job. Water plant. Open a chlorine valve. People notice, nobody dies — probably.'],
      ['m1ku','probably?? PROBABLY???'],
    ],
    mission:'m5_ics',
  },
  m5_choice:{
    lines:[['SYSTEM','One write poisons a town\'s water. The valve is yours to turn.']],
    choices:[
      { label:'Refuse. Walk away from the keyboard.', rep:+4, doubt:+2, flag:'refused_ics',
        result:[['SYSTEM','You close the connection. Hands shaking.'],['V0LK','Disappointing. But honestly? I needed to know if you\'d cross that line.'],['m1ku','you\'re still you. ok. ok good.']] },
      { label:'Fake it — write a harmless value, report success.', rep:+2, doubt:+1, flag:'faked_ics',
        result:[['SYSTEM','You set chlorine to 1.3. Basically nothing. You lie to V0LK: "done."'],['V0LK','...the sensor says 1.3. You faked it. Clever. I\'ll allow it. This time.']] },
      { label:'Do it. Freedom is worth it.', rep:-5, heat:+4, flag:'pulled_trigger',
        result:[['SYSTEM','You write 4.0. A town tastes bleach by morning. 30 hospitalized.'],['Cyrus','dude.'],['m1ku','i can\'t. i can\'t be part of this. i\'m out.'],['m1ku','m1ku has left the basement.']] },
    ],
    next:'m6_brief',
  },
  m6_brief:{ lines:[['bitrot','no more rules. we find out who V0LK is. tonight.']], mission:'m6_unmask' },
  m6_reveal:{
    lines:[
      ['SYSTEM','V0LK = Arclight Security, a federal contractor running informants.'],
      ['V0LK','So now you know. I find kids with talent and I give them a choice their record never will.'],
      ['V0LK','Help me close the net on bigger fish — and your file disappears. Or run, and find out how fast I am.'],
    ],
    next:'finale_pick',
  },
  finale_pick:{
    lines:[['V0LK','Three doors. Pick one. There\'s no fourth.']],
    choices:[
      { label:'TAKE THE DEAL — flip, become his informant, walk free.', flag:'choice_fed',
        result:[['V0LK','Welcome aboard. You\'ll be very good at this.']], route:'fed_check' },
      { label:'TURN ON HIM — leak Arclight\'s informant list, ghost forever.', flag:'choice_ghost',
        result:[['bitrot','if we leak the list, every kid he owns goes free. including us.']], route:'ghost_check' },
      { label:'BURN IT ALL — torch the evidence even if it torches you.', flag:'choice_martyr',
        result:[['m1ku','(if she\'s still here) don\'t do this. please.']], route:'martyr_check' },
    ],
  },

  // finale routing — checks stats, then runs the m7 terminal, then ending
  fed_check:{ lines:[['V0LK','Run the killswitch on the crew\'s old infrastructure. Prove your loyalty.']], mission:'m7_finale' },
  ghost_check:{ lines:[['bitrot','upload the list to every journalist you can find. then we vanish.']], mission:'m7_finale' },
  martyr_check:{ lines:[['SYSTEM','You rig your own rig to wipe everything — including the trail to your crew.']], mission:'m7_finale' },

  // terminal-of-story: triggers ending resolution (handled in engine)
  resolve_ending:{ lines:[['SYSTEM','— end —']], ending:true },
};

// ── ENDINGS ────────────────────────────────────────────────────
// chosen by flags at the m7 finale resolution
export function resolveEnding(flags, stats){
  if(stats.heat >= 100) return 'collected';
  if(flags.choice_fed)    return 'fed';
  if(flags.choice_martyr) return 'martyr';
  if(flags.choice_ghost)  return stats.doubt >= 4 ? 'ghost' : 'ghost_messy';
  return 'collected';
}

export const ENDINGS = {
  ghost:{ title:'GHOST', color:C.green, lines:[
    'The list goes to forty newsrooms at once. By dawn Arclight is a scandal, not a threat.',
    'Every kid V0LK owned is free. Including you.',
    'You delete the handle. The basement goes quiet. You were never here.',
    'You go to school Monday like nothing happened. That\'s the trick to disappearing: be ordinary.',
  ]},
  ghost_messy:{ title:'GHOST (BLOODY)', color:C.warn, lines:[
    'The leak works — but you moved sloppy and left prints.',
    'The crew goes free. You spend a year looking over your shoulder.',
    'V0LK never finds you. But you never quite stop running, either.',
  ]},
  fed:{ title:'THE ASSET', color:C.cyan, lines:[
    'You took the badge-shaped deal. Your file vanishes. So does your name.',
    'Now you find kids with talent and give them a choice their record never will.',
    'You became V0LK. You tell yourself it\'s different. Some nights you believe it.',
  ]},
  martyr:{ title:'SCORCHED EARTH', color:C.danger, lines:[
    'You wipe everything — the evidence, the trail, the case against the crew.',
    'And the case against you goes with it, because you made sure your name was on top.',
    'bitrot, m1ku, Cyrus walk free and never know it was you.',
    'You take the fall alone. In the basement, an empty chair. They still leave it for you.',
  ]},
  collected:{ title:'COLLECTED', color:C.danger, lines:[
    'You got loud. You got sloppy. The heat hit a hundred and the door came down at 4am.',
    'No deal, no ghost, no fire. Just a kid in handcuffs who thought they were untouchable.',
    'The basement deletes itself the second you go offline.',
  ]},
};
