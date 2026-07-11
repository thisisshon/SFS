/**
 * stepIcons - the shared inline-SVG icon set for the step components
 * (StepsRow single-row + StepsRows multi-row). One source of truth so a step
 * anywhere on the site references a KEY, never a raw SVG.
 *
 * Every icon: 24px, viewBox 0 0 24 24, stroke:currentColor (rule 4). The chip
 * supplies the colour. Add new concepts here (kebab/lower key) - do NOT inline
 * SVGs on a page.
 *
 * Key -> concept (for picking the right step icon):
 *   account   open an account / sign up          kyc       KYC / ID verification
 *   verify    verified / approved / confirm       document  a form / statement / doc
 *   contract  contract / agreement / terms        upload    upload / submit documents
 *   signature e-sign / authorise / OTP consent    select    choose / pick from a list
 *   fund      add funds / wallet                  withdraw  withdraw / cash out
 *   coins     deposit / money in                  rupee     amount / value in ₹
 *   bank      bank / branch / transfer            percent   rate / LTV / interest
 *   pledge    pledge / lien / lock securities     shield    secure / protected / insured
 *   analyse   research / analyse                  search    evaluate / look up
 *   trade     place a trade / execute            growth    grow wealth / returns
 *   chart     track / monitor performance        activate  activate / enable a segment
 *   settle    expiry / settlement (calendar tick) calendar  tenure / schedule / date
 *   clock     duration / maturity / time         phone     mobile app / call
 *   mail      email / OTP                         link      link / connect account
 *   portfolio holdings / portfolio               target    goal / objective
 *   compare   compare / versus                   gift      bonus / NFO / reward
 */
export const STEP_ICONS: Record<string, string> = {
  account:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="10" cy="8" r="3.4" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 19.5c0-3.2 2.5-5.5 5.5-5.5 1.3 0 2.4.4 3.4 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 14.5v6M15 17.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  kyc:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="11" r="2" stroke="currentColor" stroke-width="1.8"/><path d="M13.5 10h4M13.5 13.5h4M5.6 15.6c.5-1.5 1.6-2.1 2.9-2.1s2.4.6 2.9 2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  verify:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="m8.4 12 2.3 2.3 4.9-4.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  document:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14H6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 3v4h4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12h6M9 15.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  contract:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 3h7l5 5v13H6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M13 3v5h5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 13h6M9 16.5h6M9 9.5h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  upload:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 15V4m0 0L8 8m4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  signature:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 17c2.8 0 2.6-9 5.5-9 2 0 .8 6 2.8 6 1.4 0 1.8-3 3.7-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M4 20.5h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  select:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 6.5h10M4 12h10M4 17.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m16.5 15.6 1.7 1.7 3.3-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fund:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12.5" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M3 9.5h18" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="13.75" r="1.5" fill="currentColor"/></svg>',
  withdraw:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12.5" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M3 9.5h18" stroke="currentColor" stroke-width="1.8"/><path d="M15 12v4m0 0 1.6-1.6M15 16l-1.6-1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  coins:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="7" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 7v5c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8V7" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 12v5c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8v-5" stroke="currentColor" stroke-width="1.7"/></svg>',
  rupee:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M9 8h6M9 11h6M14.5 8c0 3-5 3-5 3 3.2 0 5 1.5 5 4l-5-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bank:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 9.5 12 4l8 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 10v7M9.5 10v7M14.5 10v7M18.5 10v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3.5 20h17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  percent:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="m9 15 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.5" cy="9.5" r="1.2" fill="currentColor"/><circle cx="14.5" cy="14.5" r="1.2" fill="currentColor"/></svg>',
  pledge:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="15" r="1.4" fill="currentColor"/></svg>',
  shield:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 2.5v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  analyse:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="M15.4 15.4 21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 12v-1.6M10.5 12V8.6M13 12v-2.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  search:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="m15.4 15.4 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  trade:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 15.5 9 10.5l3 3 8-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 5.5h5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  growth:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 21v-6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 14.5c0-3.3 2.2-5.5 5.5-5.5 0 3.3-2.2 5.5-5.5 5.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 15.5c0-3.3-2.2-5.5-5.5-5.5 0 3.3 2.2 5.5 5.5 5.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  chart:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 20V4M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 16v-3M12 16v-6M16 16v-4M20 16V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  activate:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="7.5" width="19" height="9" rx="4.5" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="12" r="2.6" fill="currentColor"/></svg>',
  settle:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8.5 14.5 11 17l4.5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  calendar:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  clock:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  phone:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="7" y="3" width="10" height="18" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M10.5 18h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  mail:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5.5" width="18" height="13" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="m4 7.5 8 5.5 8-5.5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  link:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="m9.5 14.5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M11 7.3 12.3 6a3.5 3.5 0 0 1 5 5l-1.3 1.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13 16.7 11.7 18a3.5 3.5 0 0 1-5-5L8 11.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  portfolio:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="7.5" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18" stroke="currentColor" stroke-width="1.8"/></svg>',
  target:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>',
  compare:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5 4 9l4 4M4 9h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="m16 11 4 4-4 4M20 15h-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gift:
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="9" width="16" height="11" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M3 9h18M12 9v11" stroke="currentColor" stroke-width="1.8"/><path d="M12 9S10.7 4.8 8.7 5.6 10 9 12 9Zm0 0s1.3-4.2 3.3-3.4S14 9 12 9Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
};
