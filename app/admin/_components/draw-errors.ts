/** Database errors from draw_race_prize()/annul_draw(), translated for the /admin banner. */
export const DRAW_ERRORS: Record<string, string> = {
  'Close registration and run submissions before drawing':
    'Steng påmelding og turregistrering før du trekker.',
  'Longer prizes must be drawn first': 'Trekk de lengste løpene først.',
  'No eligible entries are available': 'Ingen lodd igjen i potten for denne premien.',
  'Prize is not available for drawing': 'Premien er ikke publisert eller er allerede trukket.',
  'Prize has already been drawn': 'Premien er allerede trukket.',
  'Draw not found or already annulled': 'Trekningen finnes ikke eller er allerede annullert.',
  'Close registration and run submissions first':
    'Steng påmelding og turregistrering før du sletter kontaktinformasjon.',
};

export const DRAW_FAILED = 'Trekningen feilet. Prøv igjen.';

/** The banner only shows these texts, so a crafted ?feil= link cannot put words on the page. */
export function isKnownDrawError(text: string): boolean {
  return text === DRAW_FAILED || Object.values(DRAW_ERRORS).includes(text);
}
