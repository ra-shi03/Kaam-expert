/** Dummy marketing copy & structured content for KaamExpert landing */

export const SITE = {
  name: 'KaamExpert',
  tagline: 'India’s trusted on-demand construction workforce',
  url: 'https://kaamexpert.com',
  contactEmail: 'kaamexpertservice@gmail.com',
  phone: '6267752613',
}

export const trustBadges = [
  { id: 'verified', label: 'Verified Workers', icon: 'shield' },
  { id: 'booking', label: 'Instant Booking', icon: 'zap' },
  { id: 'pay', label: 'Safe Payments', icon: 'wallet' },
  { id: 'aadhaar', label: 'Aadhaar Verified', icon: 'fingerprint' },
]

export const problemPoints = [
  {
    title: 'Time consuming',
    description:
      'Calling multiple thekedars, waiting for callbacks, and coordinating shifts steals hours from your site.',
  },
  {
    title: 'Unverified labour',
    description:
      'No standard checks—skill claims are verbal, and replacements are hard to find on short notice.',
  },
  {
    title: 'No transparency',
    description:
      'Rates, attendance, and work quality vary wildly with little documentation or accountability.',
  },
  {
    title: 'Payment issues',
    description:
      'Cash-only settlements, disputes on overtime, and delayed payouts strain both sides.',
  },
  {
    title: 'Availability problems',
    description:
      'Peak-season shortages and last-minute no-shows can stall critical construction milestones.',
  },
]

export const comparisonRows = [
  {
    aspect: 'Discovery & booking',
    traditional: 'Phone chains & word-of-mouth',
    kaamexpert: 'Search, filter, and book in minutes',
  },
  {
    aspect: 'Verification',
    traditional: 'Informal references only',
    kaamexpert: 'Aadhaar-linked profiles & skill tags',
  },
  {
    aspect: 'Pricing',
    traditional: 'Negotiated case-by-case',
    kaamexpert: 'Transparent slabs & estimates upfront',
  },
  {
    aspect: 'Reliability',
    traditional: 'High variance, hard to replace',
    kaamexpert: 'Ratings, backups & priority support',
  },
  {
    aspect: 'Payments',
    traditional: 'Mostly cash, limited records',
    kaamexpert: 'UPI, cards & secure escrow-style flow',
  },
]

export const howItWorksUsers = [
  {
    step: 1,
    title: 'Select labour type',
    description: 'Pick mason, electrician, helper, or any trade your site needs today.',
    icon: 'layers',
  },
  {
    step: 2,
    title: 'Choose location & timing',
    description: 'Pin your site, set shift hours, and add any safety or access notes.',
    icon: 'map-pin',
  },
  {
    step: 3,
    title: 'Confirm booking',
    description: 'Review pricing, assign a supervisor contact, and lock the slot.',
    icon: 'check-circle',
  },
  {
    step: 4,
    title: 'Labour arrives',
    description: 'Track assignment status and get alerts when your crew checks in.',
    icon: 'truck',
  },
]

export const howItWorksLabourers = [
  {
    step: 1,
    title: 'Register profile',
    description: 'Create your free profile with experience, tools owned, and preferred radius.',
    icon: 'user-plus',
  },
  {
    step: 2,
    title: 'Upload Aadhaar / KYC',
    description: 'Complete quick verification to unlock higher-trust, higher-paying jobs.',
    icon: 'id-card',
  },
  {
    step: 3,
    title: 'Receive nearby jobs',
    description: 'Get matched to homeowners, contractors, and companies around you.',
    icon: 'bell',
  },
  {
    step: 4,
    title: 'Get secure payments',
    description: 'Payouts to bank/UPI with clear attendance and overtime records.',
    icon: 'banknote',
  },
]

export const services = [
  {
    id: 'mason',
    title: 'Mason',
    description: 'Brickwork, plaster, and structural masonry for residential & commercial sites.',
    priceFrom: 900,
    availability: 'Same day',
    icon: 'brick-wall',
  },
  {
    id: 'electrician',
    title: 'Electrician',
    description: 'Wiring, fittings, switchboard work, and site electrification with safety compliance.',
    priceFrom: 750,
    availability: 'High demand',
    icon: 'zap',
  },
  {
    id: 'painter',
    title: 'Painter',
    description: 'Interior/exterior finishes, texture, and waterproof coatings.',
    priceFrom: 650,
    availability: 'Available',
    icon: 'paintbrush',
  },
  {
    id: 'carpenter',
    title: 'Carpenter',
    description: 'Shuttering, doors, modular fixes, and woodwork support on active sites.',
    priceFrom: 850,
    availability: 'Same day',
    icon: 'hammer',
  },
  {
    id: 'plumber',
    title: 'Plumber',
    description: 'CPVC/UPVC lines, sanitary installs, and leak fixes for new builds.',
    priceFrom: 700,
    availability: 'Available',
    icon: 'droplets',
  },
  {
    id: 'welder',
    title: 'Welder',
    description: 'Arc/MIG support for gates, structural steel, and fabrication assist.',
    priceFrom: 950,
    availability: 'Limited slots',
    icon: 'flame',
  },
  {
    id: 'tile',
    title: 'Tile Worker',
    description: 'Precision laying for floors and walls—ceramic, vitrified, and heavy formats.',
    priceFrom: 800,
    availability: 'Book ahead',
    icon: 'grid-3x3',
  },
  {
    id: 'helper',
    title: 'Construction Helper',
    description: 'Material shifting, mixing, cleanup, and support for lead trades.',
    priceFrom: 550,
    availability: 'Always on',
    icon: 'hard-hat',
  },
  {
    id: 'heavy',
    title: 'Heavy Machine Operator',
    description: 'Excavator, loader, and compactor operators with valid certifications.',
    priceFrom: 1400,
    availability: 'Priority booking',
    icon: 'tractor',
  },
]

export const features = [
  {
    title: 'Aadhaar Verified Workers',
    description: 'KYC-backed profiles reduce risk and speed up site entry compliance.',
    icon: 'fingerprint',
  },
  {
    title: 'Live Tracking',
    description: 'Know when your crew is en route and when they check in on site.',
    icon: 'map-pinned',
  },
  {
    title: 'Instant Booking',
    description: 'From urgent fixes to planned phases—book slots without endless calls.',
    icon: 'calendar-clock',
  },
  {
    title: 'Transparent Pricing',
    description: 'See starting rates, estimates, and add-ons before you confirm.',
    icon: 'indian-rupee',
  },
  {
    title: 'Emergency Labour',
    description: 'Priority matching for breakdowns, shutdowns, and deadline crunches.',
    icon: 'siren',
  },
  {
    title: 'Skilled & Unskilled Workers',
    description: 'From helpers to certified operators—one platform for the full crew mix.',
    icon: 'users',
  },
  {
    title: 'Multi-language Support',
    description: 'Hindi, English, Tamil, Telugu & more—so crews and clients stay aligned.',
    icon: 'languages',
  },
  {
    title: 'Ratings & Reviews',
    description: 'Post-job feedback builds reputation for workers and trust for contractors.',
    icon: 'star',
  },
  {
    title: 'Secure Payments',
    description: 'Digital payments with clear attendance logs and dispute assistance.',
    icon: 'shield-check',
  },
  {
    title: '24/7 Support',
    description: 'Round-the-clock help for payments, replacements, and safety escalations.',
    icon: 'headphones',
  },
]

export const userTypes = [
  {
    role: 'customer',
    title: 'For Customers (Homeowners & Residents)',
    badge: 'Individual Bookings',
    description:
      'Book verified electricians, plumbers, carpenters, masons, painters, and appliance experts for quick fixes or home renovations without dealing with unverified middlemen.',
    perks: ['Transparent slot & day rates', 'Zero advance fee guarantee', 'Aadhaar verified workers', 'Free replacement if unsatisfied'],
    icon: 'home',
  },
  {
    role: 'contractor',
    title: 'For Contractors (Builders & Site Managers)',
    badge: 'Workforce & Projects',
    description:
      'Scale your site operations with on-demand construction gangs, bar benders, shuttering experts, helpers, and machine operators with full attendance tracking and GST invoices.',
    perks: ['Multi-day shift scheduling', 'Bulk workforce matching', 'Digital milestone attendance', 'GST-compliant digital invoices'],
    icon: 'hard-hat',
  },
  {
    role: 'labour',
    title: 'For Labour Partners (Karigars & Helpers)',
    badge: 'Direct Daily Payouts',
    description:
      'Get consistent, dignified work directly on your mobile phone. Transparent earnings credited to your in-app wallet without paying cuts to thekedars.',
    perks: ['Free registration & Aadhaar KYC', 'Instant wallet withdrawal', 'Direct daily payouts', 'Fair rating-based promotions'],
    icon: 'user-check',
  },
]

export const stats = [
  { label: 'Verified Trade Services', value: 240, suffix: '+' },
  { label: 'Active Service Regions', value: 5, suffix: ' Zones' },
  { label: 'Verified Workers in Network', value: 12500, suffix: '+' },
  { label: 'Aadhaar Verified Partners', value: 100, suffix: '%' },
]

export const testimonials = [
  {
    name: 'Ananya Sharma',
    role: 'Homeowner, Gurugram',
    quote:
      'We needed masons and helpers for a 10-day renovation. Booking on KaamExpert took minutes and the crew showed up on time—something that rarely happened with our old contacts.',
    rating: 5,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya',
  },
  {
    name: 'Rahul Kulkarni',
    role: 'Site Engineer, Pune',
    quote:
      'Transparent rates and Aadhaar-verified workers make it easier to clear security and client audits. The backup labour option saved us during a peak pour week.',
    rating: 5,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
  },
  {
    name: 'Imran Sheikh',
    role: 'Electrical Contractor, Hyderabad',
    quote:
      'Digital payments mean less cash handling on site. My regular electricians also like the steady job flow from nearby projects.',
    rating: 4,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Imran',
  },
  {
    name: 'Lakshmi Devi',
    role: 'Labour partner, Bengaluru',
    quote:
      'Earlier I waited near chowks hoping for work. Now I get matched jobs, clear hours, and money directly to my account.',
    rating: 5,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmi',
  },
]

export const safetyPoints = [
  {
    title: 'Aadhaar verification',
    description: 'Identity-linked onboarding with document checks and periodic re-validation.',
    icon: 'id-card',
  },
  {
    title: 'Background checks',
    description: 'Partner-led screening for flagged histories on sensitive or high-security sites.',
    icon: 'search',
  },
  {
    title: 'Rating system',
    description: 'Two-way reviews surface reliable workers and fair contractors over time.',
    icon: 'star-half',
  },
  {
    title: 'Secure payments',
    description: 'Encrypted checkout, UPI/cards, and dispute pathways with support mediation.',
    icon: 'lock',
  },
  {
    title: 'Support system',
    description: 'Safety escalations, no-show resolution, and on-ground coordination playbooks.',
    icon: 'life-buoy',
  },
]

export const faqs = [
  {
    q: 'How do I hire labour?',
    a: 'Choose your trade, pin your site, pick date & shift, and confirm. You’ll see starting rates before you pay. A supervisor can be added for handoffs.',
  },
  {
    q: 'Are workers verified?',
    a: 'Yes. Profiles can include Aadhaar-linked KYC, skill tags, tool ownership, and ratings from past jobs. High-trust badges reward consistent performance.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'UPI, popular cards, and net banking where enabled. Contractors can also request invoicing-friendly flows for larger engagements.',
  },
  {
    q: 'Can I hire labour urgently?',
    a: 'Use the Emergency Labour option for same-day or next-shift needs. Availability depends on your city—we surface realistic ETAs before confirmation.',
  },
  {
    q: 'How do labourers register?',
    a: 'Download the app, create a profile, upload Aadhaar/KYC, and set your work radius. Once verified, you’ll start receiving nearby job alerts.',
  },
  {
    q: 'What if someone does not show up?',
    a: 'Report a no-show in-app. Our support team helps with replacements and, where applicable, refunds or credits per policy.',
  },
]

export const footerLinks = {
  product: [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Services & Rates', href: '#services-pricing' },
    { label: 'Safety', href: '#safety' },
    { label: 'FAQ', href: '#faq' },
  ],
  company: [
    { label: 'About', href: '#problem' },
  ],
  legal: [
    { label: 'Terms', href: '#footer' },
    { label: 'Privacy', href: '#footer' },
    { label: 'Grievance', href: '#footer' },
  ],
}
