/**
 * ============================================================
 *  FIRM WHITE-LABEL CONFIGURATION
 * ============================================================
 *
 * Edit this file to customise the Legal Practice Management
 * System for a specific law firm.  Every place in the UI that
 * shows the firm name, location, logo, email domain, or
 * practice description reads from here — no other file needs
 * to be touched for basic white-labelling.
 *
 * Steps for a new deployment:
 *  1. Update the values below.
 *  2. Optionally replace the hero image at:
 *       client/src/assets/generated_images/
 *     and update the heroImage import in LoginPage.tsx.
 *  3. Run `npm run dev` (or your production build command).
 * ============================================================
 */

const firmConfig = {
  /** Full display name of the law firm */
  name: "Mwaura & Company Advocates",

  /** Short name / abbreviation shown in tight spaces */
  shortName: "M&CA",

  /** Physical office location shown under the logo */
  location: "Upperhill, Nairobi",

  /** Country / region (used in meta tags) */
  country: "Kenya",

  /** Email domain — used in placeholder hints (no @ symbol) */
  emailDomain: "mwauraandcompany.co.ke",

  /** One-line marketing headline shown on the login hero panel */
  tagline: "Excellence in Legal Practice",

  /** Longer description shown on the login hero panel */
  description:
    "Comprehensive solutions for Corporate, Intellectual Property, Real Estate, Banking & Finance, and Dispute Resolution.",

  /** Browser tab title suffix */
  systemTitle: "Practice Management System",
} as const;

export default firmConfig;
