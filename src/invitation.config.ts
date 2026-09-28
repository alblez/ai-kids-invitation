/**
 * Edit this file to customise the invitation for your child's birthday party.
 * Every component, the OG image, and the Astro/Tailwind config read from here.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface InvitationConfig {
  /** The birthday child */
  child: {
    /** Display name used in titles, copy and alt text */
    name: string;
    /** Age they are turning (1–10 for the star layout) */
    age: number;
    /** Pronouns spliced into copy and alt text: "he/him/his", "she/her/her", "they/them/their" */
    pronouns: { subject: string; object: string; possessive: string };
  };
  /** Party logistics shown on the details card */
  party: {
    /** Full date label, e.g. "Saturday, June 13, 2026" */
    date: string;
    /** Time range, e.g. "3:00 p.m. to 6:00 p.m." */
    time: string;
    /** Short date + time for the OG image, e.g. "Saturday, June 13 · 3:00 p.m." */
    ogDateTime: string;
    /** Venue name */
    venue: string;
    /** Full street address */
    address: string;
    /** Small note under the address (omit to hide) */
    addressNote?: string;
    /** Override the auto-derived map links if needed */
    links?: { googleMaps?: string; waze?: string };
  };
  /** RSVP contact */
  rsvp: {
    /** WhatsApp number with country code, no leading + */
    whatsappNumber: string;
    /** Pre-filled WhatsApp message (mention the child's name so guests know whose party) */
    whatsappMessage: string;
  };
  /** Site metadata and OG tags */
  site: {
    /** Canonical URL (used for OG image URL) */
    url: string;
    /** Page title and og:title */
    title: string;
    /** Meta description and og:description */
    description: string;
  };
  /** Visual theme */
  theme: {
    /** The ten colour tokens (CSS hex values). Tailwind utilities like bg-hero-red/50 use them. */
    colors: {
      heroRed: string;
      heroBlue: string;
      heroDark: string;
      powerBlue: string;
      powerGreen: string;
      powerRed: string;
      nightSky: string;
      cityGray: string;
      starYellow: string;
      webWhite: string;
    };
    /** Fonts loaded from Google Fonts via Astro's Fonts API */
    fonts: {
      /** Display / heading font */
      display: { name: string; weights: number[] };
      /** Body text font */
      body: { name: string; weights: number[]; styles?: string[] };
    };
  };
}

// ── Demo values (Gael, age 4) ────────────────────────────────────────────────

export const invitation: InvitationConfig = {
  child: {
    name: 'Gael',
    age: 4,
    pronouns: { subject: 'he', object: 'him', possessive: 'his' },
  },
  party: {
    date: 'Saturday, June 13, 2026',
    time: '3:00 p.m. to 6:00 p.m.',
    ogDateTime: 'Saturday, June 13 \u00b7 3:00 p.m.',
    venue: 'The Beverly Hills Hotel',
    address: '9641 Sunset Boulevard, Beverly Hills, CA 90210',
    addressNote: 'Demo address \u2014 use your own party location',
  },
  rsvp: {
    whatsappNumber: '15555550123',
    whatsappMessage: "Hi! We'll be at Gael's party. See you there!",
  },
  site: {
    url: 'https://ai-kids-invitation.vercel.app',
    title: 'Gael is turning 4! \ud83c\udf89',
    description: "You're invited to Gael's birthday party. Come celebrate with us!",
  },
  theme: {
    colors: {
      heroRed: '#e23636',
      heroBlue: '#2c3e8c',
      heroDark: '#1a1a2e',
      powerBlue: '#3b82f6',
      powerGreen: '#22c55e',
      powerRed: '#ef4444',
      nightSky: '#0f172a',
      cityGray: '#334155',
      starYellow: '#fbbf24',
      webWhite: '#f8fafc',
    },
    fonts: {
      display: { name: 'Bangers', weights: [400] },
      body: { name: 'Nunito', weights: [400, 600, 700], styles: ['normal'] },
    },
  },
};

// ── Derived values (used by components and scripts) ──────────────────────────

const addressQuery = encodeURIComponent(
  `${invitation.party.venue}, ${invitation.party.address}`,
);

/** Google Maps link (overridable via party.links.googleMaps) */
export const googleMapsUrl =
  invitation.party.links?.googleMaps ??
  `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;

/** Waze link (overridable via party.links.waze) */
export const wazeUrl =
  invitation.party.links?.waze ??
  `https://waze.com/ul?q=${addressQuery}&navigate=yes`;

/** WhatsApp deep link with pre-filled message */
export const whatsappUrl =
  `https://wa.me/${invitation.rsvp.whatsappNumber}?text=${encodeURIComponent(invitation.rsvp.whatsappMessage)}`;
