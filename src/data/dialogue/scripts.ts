import type { MemberId } from '../party';

export type Step =
  | string
  | { say: string; who?: string }
  | { choice: string[]; then: Step[][] }
  | { set: string }
  | { if: string; then: Step[]; else?: Step[] }
  | { give: string; n?: number }
  | { money: number }
  | { heal: true }
  | { save: true }
  | { shop: string }
  | { battle: string }
  | { join: MemberId }
  | { sfx: string }
  | { shake: true }
  | { flash: number }
  | { wait: number }
  | { music: string }
  | { ending: true };

const ANON = '???';
const IBIS = 'Brother Ibis';
const TENANT = 'The Anchor Tenant';

export const SCRIPTS: Record<string, Step[]> = {
  intro: [
    { wait: 400 },
    'Palmetto Hollow, Florida.',
    'Population: fewer than last year.',
    'Every town down here has a legend. This one has a woman in a yellow raincoat who lives in the retention pond behind the cul-de-sac.',
    'Nobody believes in her. That is how she likes it.',
    { sfx: 'ring' },
    'Somewhere past the vape shop, a payphone is ringing.',
    'Payphones have not rung in Palmetto Hollow since 2003.',
    '(Arrow keys or WASD to move. Z or Enter to talk and confirm. X or Esc to cancel and open the menu.)',
    { set: 'intro' },
  ],
  payphone: [
    {
      if: 'answeredPhone',
      then: [
        'The payphone hums. A recorded voice reads out the time, but it is the wrong time.',
        {
          choice: ['Rest & save', 'Hang up'],
          then: [
            [{ heal: true }, { sfx: 'heal' }, 'You lean against the booth and close your eyes. The dial tone sounds like the ocean.', { save: true }, 'Your progress has been saved. Your party is rested.'],
            ['Click.'],
          ],
        },
      ],
      else: [
        { sfx: 'ring' },
        'RIIIIIING.',
        'You pick up. The receiver is warm.',
        { say: 'Okee. You picked up. Good.', who: ANON },
        { say: 'The plaza is growing.', who: ANON },
        { say: 'Everglow Plaza. The dead one. It has been dead since the anchor store closed. But dead things in Florida do not stay down. You of all people know that.', who: ANON },
        { say: 'The garbage is listening now. Find the bird who eats it. He will know what it hears.', who: ANON },
        { say: '...', who: ANON },
        { shake: true },
        'Click. Across the lot, the chains on the plaza doors fall away.',
        { set: 'answeredPhone' },
        { music: 'town' },
        '(Payphones restore your party and save your progress.)',
        { heal: true },
        { save: true },
      ],
    },
  ],
  plazaLocked: ['The doors of Everglow Plaza are chained shut. Behind the glass, something is breathing very slowly.', 'You should find out who keeps calling that payphone.'],
  plazaEnter: [
    'Everglow Plaza. The air conditioning is still running. It has been running for eleven years, cooling nothing.',
    'The food court smells like a fryer remembering oil.',
    'Some of the trash is looking at you.',
    { set: 'plazaEntered' },
  ],
  dollarEnter: ['DOLLAR PARADISE. Everything is a dollar. Everything has always been a dollar. Even you.', { set: 'dollarEntered' }],
  anchorEnter: [
    "BELLWEATHER'S. The anchor store.",
    'The carpet is warm and slightly damp, like the inside of a mouth.',
    'At the back of the store, something enormous shifts.',
    { set: 'anchorEntered' },
  ],
  retiree: [
    {
      if: 'bossDefeated',
      then: [{ say: 'Did you hear that? The plaza stopped humming. First time since 2013. I could almost sleep.', who: 'Retiree' }],
      else: [
        { say: 'Evening. Hot one. They are all hot ones.', who: 'Retiree' },
        { say: 'My late husband swore he saw the Pond Lady once. Yellow coat. Teeth. Said she carried his groceries to the door when he threw out his back.', who: 'Retiree' },
        { say: '...Was that you? No. Couldn\'t be. That was 1971.', who: 'Retiree' },
      ],
    },
  ],
  hoa: [
    { say: 'This is a reminder that cryptids are not permitted under section 4.2 of the Homeowners Association bylaws.', who: 'HOA Patrol' },
    { say: 'We patrol at night. We have always patrolled at night. None of us remember joining.', who: 'HOA Patrol' },
    { if: 'bossDefeated', then: [{ say: 'Your lawn is in violation. Your lawn is a pond. Carry on.', who: 'HOA Patrol' }] },
  ],
  pastor: [
    {
      if: 'bossDefeated',
      then: [{ say: 'The plaza has gone quiet. The parking spaces are at peace. Go with God, or whatever it is you go with.', who: 'Pastor Dale' }],
      else: [
        { say: 'Brothers and sisters of the empty lot! The plaza HUNGERS!', who: 'Pastor Dale' },
        { say: 'I preach to the parking spaces. Each one holds a car that is not there anymore. They listen better than you would think.', who: 'Pastor Dale' },
        { say: 'You have the look of someone who has been underwater a long time. Bless you. Do not bless me back.', who: 'Pastor Dale' },
      ],
    },
  ],
  kid: [
    {
      if: 'bossDefeated',
      then: [
        { say: 'Weird. I checked my photo again. There are two blurs now. One yellow... and one white, with a long curvy beak.', who: 'Tyler' },
        { say: 'Nobody believes me. That is okay. I believe me.', who: 'Tyler' },
      ],
      else: [
        { say: 'Whoa. Whoa! No way. You\'re... I have a PICTURE of you!', who: 'Tyler' },
        'He shows you a photo on his phone. It is a yellow blur in front of the pond.',
        'Honestly, it is a good likeness.',
        { say: 'I\'m gonna be famous. Nobody at school believes in you. That\'s fine. I believe in you.', who: 'Tyler' },
      ],
    },
  ],
  clerk: [
    { say: 'Welcome to Bait & Vape. We sell bait. We sell vapes. We do not ask about the teeth.', who: 'Clerk' },
    { shop: 'baitvape' },
    { say: 'Come back whenever. We never close. We tried once.', who: 'Clerk' },
  ],
  mailbox: [
    'The mailbox opens its little door.',
    { say: 'NO MAIL TODAY.', who: 'Mailbox' },
    { say: 'NO MAIL FOR ANYONE. THEY STOPPED SENDING IT. I STILL WAIT. WAITING IS WHAT I AM FOR.', who: 'Mailbox' },
  ],
  manatee: [
    'A man in a manatee costume stands by the reeds. He has not moved in some time.',
    { say: '...I\'m a manatee.', who: 'Manatee?' },
    { say: '...You\'re a gator.', who: 'Manatee?' },
    { say: 'We should not be up here on the land, you and me. There is a boat propeller in my dreams every night.', who: 'Manatee?' },
    { if: 'ibisJoined', then: [{ say: 'Is that a bird with you? Birds are fine. Birds can go anywhere.', who: 'Manatee?' }] },
  ],
  roadWest: ['ROAD CLOSED.', 'The sign is older than the road.'],
  roadEast: ['YOU ARE NOW LEAVING PALMETTO HOLLOW.', 'Beyond the sign, the road ends in a hedge. No one has ever left. No one has ever tried.'],
  pondSign: ['NO SWIMMING. NO FISHING. NO FEEDING THE ALLIGATOR.', 'Someone has crossed out "THE ALLIGATOR" and written "HER" in marker.', { if: 'answeredPhone', then: [], else: [{ say: 'Home. Nothing to do here but listen to the payphone ring.' }] }],
  ibis: [
    'A white ibis is picking through the trash with surgical calm.',
    { say: 'Ah. The Pond Lady. You got the call.', who: IBIS },
    { say: 'I am Brother Ibis. I eat what the town throws away, and so I hear what it says.', who: IBIS },
    { say: 'Garbage remembers everything, Okee. Receipts. Wrappers. Promises.', who: IBIS },
    { say: 'Lately it all whispers the same thing: THE ANCHOR TENANT IS REOPENING.', who: IBIS },
    { say: 'I have been waiting for you since before this plaza was built. Shall we?', who: IBIS },
    { join: 'ibis' },
    { sfx: 'join' },
    'Brother Ibis joined your party!',
    { set: 'ibisJoined' },
    'Somewhere near the escalator, the garbage shifts aside, listening to Brother Ibis.',
  ],
  garbageBlock: ['A wall of garbage blocks the escalator. It is humming a jingle you almost recognize.', 'It will not move for you. It might move for someone who speaks its language.'],
  vending: [
    'The vending machine glows. Some of the items are still in date.',
    { shop: 'vending' },
  ],
  stall1: ['WOK-N-ROLL. The menu board lists one item: "IT."'],
  stall2: ['CINNABUN. The cinnamon smell is very strong and has no source.'],
  stall3: ['PRETZEL PALACE. A single pretzel rotates under a heat lamp. It has been rotating since the mall closed.'],
  mannequin1: ['The mannequin turns its head when you are not looking.', 'When you look, it says: "WE ARE OPEN."'],
  mannequin2: ['"Have you found everything you were looking for?"', 'It is not asking you. It is asking itself.'],
  mannequin3: ['"I used to model swimwear. Now I model waiting."'],
  mannequin4: ['The mannequin is facing the back of the store. Its hands are folded like it is praying.'],
  mannequin5: ['"SHE IS BEAUTIFUL WHEN SHE IS OPEN," the mannequin says, about the store.'],
  staffDoor: ['STAFF ONLY.', 'Behind the door you hear muzak played backwards, and something breathing in time with it.', { if: 'ibisJoined', then: [{ say: 'The garbage beyond this door is very loud. Save your strength at the payphone, Okee.', who: IBIS }] }],
  bossFight: [
    'A mountain of returns rises in the dark. A mannequin sits on top of it like a queen on a throne of receipts.',
    { shake: true },
    { say: 'WELCOME, SHOPPERS.', who: TENANT },
    { say: 'WE HAVE BEEN CLOSED FOR SO LONG. NO ONE CAME. SO WE BEGAN TO GROW.', who: TENANT },
    { say: 'THE TOWN THROWS THINGS AWAY. WE KEEP THEM. EVERYTHING ENDS UP HERE EVENTUALLY. SO WILL PALMETTO HOLLOW.', who: TENANT },
    { say: 'It is eating the town one discarded thing at a time.', who: IBIS },
    'Okee bares her teeth.',
    { battle: 'boss' },
    { set: 'bossDefeated' },
    'The Anchor Tenant shudders. Its neon sign flickers out, letter by letter.',
    { say: '...THANK YOU... FOR SHOPPING...', who: TENANT },
    'The heap collapses into ordinary trash. Bags and boxes and a mannequin that was only ever a mannequin.',
    { say: 'It is quiet. The garbage has nothing to say for once.', who: IBIS },
    { say: 'Go home, Okee. Get back in your pond. The town will forget you were here tonight. That is how it should be.', who: IBIS },
    { ending: true },
  ],
};
