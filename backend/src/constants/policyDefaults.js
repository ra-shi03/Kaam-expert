/**
 * Default text for the public Privacy Policy, Terms & Conditions and Support pages.
 * Used until an admin saves their own version. Format: "## Heading" starts a section,
 * "- item" is a bullet, "**bold**" and "[text](url)" are supported.
 * Placeholders ({{company_name}}, {{cin}}, {{address}}, {{phone}}, {{email}}, {{website}},
 * {{support_hours}}) are filled in from the company details saved in the admin panel.
 */

const CONTACT_BLOCK = `## Contact us
For any question about this document, write to us:

- **Company:** {{legal_name}} (CIN: {{cin}})
- **Registered office:** {{address}}
- **Customer care:** {{phone}} ({{support_hours}})
- **Email:** {{email}}`

const USER_PRIVACY = `## Introduction
{{company_name}} ("we", "us", "our") operates the {{company_name}} mobile application and website {{website}} (together, the "Platform"), which helps you book verified labour and skilled workers for home and site work. This Privacy Policy explains what personal information we collect from customers ("you"), why we collect it, how we use and protect it, and the choices you have.

By creating an account or using the Platform you agree to this Policy. If you do not agree, please do not use the Platform.

## Information we collect
- **Account details:** your name, mobile number, email address (if provided) and profile photo.
- **Address and location:** service addresses you save, and the device location you allow us to read so we can show services available in your area and help your worker reach you.
- **Booking details:** the services you book, date and time slots, duration, notes you add, and photos or progress updates shared during a job.
- **Payment details:** the payment method you choose (online or cash) and transaction references. Card, UPI and net-banking details are handled by our payment partner and are never stored on our servers.
- **Device and usage data:** device type, operating system, app version, IP address, notification token and basic usage logs used to keep the Platform secure and working.
- **Support communication:** messages, complaints and ratings you submit to us.

## How we use your information
- To create and manage your account and verify your mobile number with a one-time password (OTP).
- To match your booking with available workers in your zone and share the details they need to complete the job.
- To process payments, refunds, wallet entries and invoices.
- To send booking updates, OTPs, reminders and important service messages by SMS, push notification and in-app alerts.
- To resolve complaints, prevent fraud and misuse, and keep customers and workers safe.
- To improve the Platform, understand demand, and comply with legal obligations.

We do not sell your personal information.

## Who we share it with
- **Workers assigned to your booking** – your first name, service address, contact through the Platform and job details, only for the duration needed to complete the service.
- **Service providers** – payment gateways, SMS and notification providers, cloud hosting and analytics partners who process data on our behalf under confidentiality obligations.
- **Authorities** – where required by law, court order or to protect the rights and safety of users, workers or the public.
- **Business transfers** – if {{company_name}} is involved in a merger or acquisition, your information may transfer to the new entity under the same protections.

## Payments and security
Online payments are processed by a PCI-DSS compliant payment gateway. We protect your data with encrypted connections (HTTPS), access controls and regular monitoring. No system is completely secure, so please keep your OTP private and never share it with anyone, including anyone claiming to be from {{company_name}}.

## Data retention
We keep your information while your account is active and for as long as needed to provide services, resolve disputes, meet tax, accounting and legal requirements, and enforce our agreements. After that it is deleted or anonymised.

## Your rights and choices
Under applicable Indian law, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, you may:

- Access and correct the information in your profile.
- Withdraw consent for optional permissions such as location or notifications from your device settings.
- Ask us to delete your account and associated personal data, subject to records we must retain by law.
- Raise a grievance about how your data is handled.

To use any of these rights, contact us using the details below.

## Children
The Platform is meant for people aged 18 and above. We do not knowingly collect information from children.

## Cookies and similar technologies
Our website and app use cookies and similar technologies to keep you signed in, remember preferences and measure performance. You can control cookies through your browser settings.

## Changes to this Policy
We may update this Policy from time to time. The latest version is always available on this page along with its "last updated" date. Continued use of the Platform after a change means you accept the updated Policy.

## Grievance officer
In line with the Information Technology Act, 2000 and the rules made under it, you can reach our grievance officer at {{email}} or {{phone}}. We aim to acknowledge complaints within 48 hours and resolve them within 30 days.

${CONTACT_BLOCK}`

const LABOUR_PRIVACY = `## Introduction
{{company_name}} ("we", "us", "our") connects skilled workers ("you", "labour partner") with customers who need work done. This Privacy Policy explains what personal information we collect from labour partners using the {{company_name}} Labour app, why we collect it, and how we handle it.

By registering or using the Labour app you agree to this Policy.

## Information we collect
- **Identity and profile:** your name, mobile number, gender, profile photo, work categories, skills, experience and service area.
- **KYC documents:** Aadhaar and PAN details (we store only masked numbers for display), document photos and a verification video, collected to confirm that you are a real, eligible person before you can take jobs.
- **Location:** your live location while you are online or on a job, so we can show you nearby bookings, guide you to the customer and let the customer follow your arrival.
- **Job records:** jobs offered, accepted, declined and completed, before and after work photos, start and completion OTPs, ratings and complaints.
- **Wallet and payout details:** wallet balance, recharges, commission and platform fee entries, cash collected, withdrawals, and the bank or UPI details you give for payouts.
- **Device data:** device type, app version, IP address and notification token.

## How we use your information
- To verify your identity and approve your account.
- To send you booking requests that match your skills, zone and wallet status.
- To share the details a customer needs for the job: your name, photo, rating and live arrival status.
- To calculate earnings, commission, taxes, wallet balances and payouts.
- To handle complaints, detect fraud or misconduct, and keep customers and workers safe.
- To send OTPs, job alerts, KYC updates and payment notifications.
- To improve the app and meet legal and tax obligations.

We do not sell your personal information.

## Who we share it with
- **Customers** you are assigned to – your name, photo, rating and live location during an active job.
- **Service providers** – payment gateways, SMS and notification services, cloud hosting and verification partners working under confidentiality terms.
- **Authorities** – when required by law, a court order, or to investigate fraud, theft or safety incidents.

Your Aadhaar and PAN documents are never shown to customers.

## KYC data and security
KYC documents and videos are used only for verification and are accessible to authorised admin staff. We protect information with encrypted connections and role-based access. Keep your OTP private and never share it with anyone.

## Data retention
We keep your information while your account is active and afterwards for as long as required to settle wallet balances, resolve disputes, and meet legal, tax and audit requirements.

## Your rights
Under the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 you may access and correct your profile, withdraw optional permissions such as location, request deletion of your account (subject to pending dues and legal record-keeping), and raise a grievance. Contact us using the details below.

## Changes to this Policy
We may update this Policy occasionally. The current version and its "last updated" date are always shown on this page.

## Grievance officer
You can reach our grievance officer at {{email}} or {{phone}}. We acknowledge complaints within 48 hours and aim to resolve them within 30 days.

${CONTACT_BLOCK}`

const USER_TERMS = `## Acceptance of terms
These Terms and Conditions ("Terms") form a legal agreement between you and {{legal_name}} (CIN: {{cin}}), having its registered office at {{address}} ("{{company_name}}", "we", "us"). By creating an account, booking a service or using the {{company_name}} app or website {{website}} (the "Platform"), you accept these Terms and our Privacy Policy. If you do not agree, please do not use the Platform.

## About the Platform
{{company_name}} is a technology platform that connects customers with independent labour partners and skilled workers. We provide the means to find, book and pay for services. Unless stated otherwise, workers are independent service providers and not our employees.

## Eligibility and your account
- You must be at least 18 years old and legally able to enter a contract.
- Registration requires a valid mobile number verified by OTP.
- You are responsible for the accuracy of your details and for all activity under your account. Do not share your OTP with anyone.
- We may suspend or close accounts that provide false information or break these Terms.

## Booking a service
- Choose a service, date, time slot and duration, then confirm the booking. Prices shown at checkout include applicable platform fee, taxes and any discounts.
- A booking is confirmed when a worker accepts it. We try our best to assign a worker, but we do not guarantee availability in every area or time slot.
- Services are available only in zones where we operate. Your address must fall inside an active service zone.
- Please ensure someone is available at the address and that the worker has safe access to the work area.
- Start and completion OTPs are used to confirm that work began and ended. Share the OTP only with the worker assigned to you.

## Pricing and payments
- You can pay online (UPI, cards, net banking, wallets) or in cash to the worker where the cash option is offered.
- Time-based charges depend on the duration you booked. Extra time worked beyond the booked slot, if agreed with the worker, may be charged at the displayed rate.
- Do not pay a worker anything other than the amount shown in your booking, and report any such request to us.
- Online payments are handled by a third-party payment gateway. Failed payments are refunded to the original source as per the gateway's timelines.

## Cancellation and refunds
- You can cancel a booking from the app. Cancellation charges may apply depending on how close to the start time you cancel, as shown in the Cancellation Policy within the app.
- If we or the worker cancel, or a worker does not arrive, you will be offered a replacement or a full refund of the amount paid online.
- Approved refunds are returned to the original payment method, usually within 5–7 working days.

## Your responsibilities
- Treat workers with respect. Abuse, harassment, discrimination or any unsafe behaviour is not tolerated.
- Provide accurate work details. Workers may decline work that is unsafe, illegal or different from what was booked.
- Do not ask workers to perform illegal tasks or work that requires specialised licences unless the service clearly allows it.
- Do not try to book or pay a worker outside the Platform to avoid fees. This may lead to suspension.
- Keep your valuables and sensitive documents safe during any service visit.

## Ratings and content
You may rate your experience honestly. You must not post false, abusive or unlawful content. We may remove content that violates these Terms.

## Limitation of liability
We take reasonable care in verifying workers, but we are an intermediary and cannot guarantee the quality of any individual service. To the extent permitted by law, {{company_name}} is not liable for indirect or consequential losses. Our total liability for any claim relating to a booking is limited to the amount you paid for that booking. Nothing here limits liability that cannot be excluded under law.

## Complaints and dispute resolution
Raise any problem from Support in the app, or contact us using the details below. We will review it and respond promptly. If a dispute cannot be resolved amicably, it will be governed by the laws of India and the courts at Sehore, Madhya Pradesh will have exclusive jurisdiction.

## Suspension and termination
We may suspend or terminate your access if you violate these Terms, misuse the Platform, or if required by law. You may stop using the Platform and request account deletion at any time.

## Changes to these Terms
We may update these Terms from time to time. The latest version with its "last updated" date is always on this page. Continued use after an update means you accept the changes.

${CONTACT_BLOCK}`

const LABOUR_TERMS = `## Acceptance of terms
These Terms and Conditions ("Terms") are an agreement between you, a labour partner ("you"), and {{legal_name}} (CIN: {{cin}}), having its registered office at {{address}} ("{{company_name}}", "we", "us"). By registering on or using the {{company_name}} Labour app, you accept these Terms and our Privacy Policy.

## Nature of the relationship
You provide services as an independent professional. You are not an employee, agent or partner of {{company_name}}. We provide a technology platform that shows you customer bookings and helps you collect payment. You decide whether to accept a booking, subject to these Terms.

## Eligibility and KYC
- You must be 18 or older and legally allowed to work in India.
- You must complete KYC with genuine Aadhaar and PAN details and a verification video. Until your KYC is approved you cannot receive bookings.
- You must keep your profile, skills and service area accurate and up to date.
- Giving false information, using another person's identity, or letting someone else use your account may lead to permanent removal.

## Free trial and subscription
- New labour partners may receive a free trial period after KYC approval, as shown in the app.
- After the trial, continued access may require a subscription or fee shown in the app. Fees paid are non-refundable except where required by law or announced by us.

## Accepting and doing jobs
- Booking requests are sent to eligible workers nearby. The first worker to accept gets the job.
- Once you accept, you must reach the customer on time. Repeated no-shows or late cancellations can reduce your priority and may lead to suspension.
- Take the before-work photo, then start the job using the customer's start OTP. Complete the job and use the completion OTP only when the customer confirms the work is done.
- The job timer follows the duration booked by the customer. Do not leave early or request extra money outside the Platform.
- Carry out work safely, politely and professionally. Respect the customer's property and privacy.

## Earnings, commission and payments
- You earn the amount shown for the job, after the platform commission and any applicable fee displayed in the app.
- **Online bookings:** the customer pays the Platform. Your earnings are credited to your wallet and can be withdrawn as per the withdrawal rules.
- **Cash bookings:** you collect the amount from the customer in cash. The platform commission for that job is adjusted from your wallet balance. To receive cash bookings you must maintain the minimum wallet balance set in the app. Unpaid dues may block you from taking further jobs until cleared.
- Wallet recharges are made through our payment gateway. Recharge balance is used for platform fees and is not withdrawable unless stated in the app.
- You are responsible for your own taxes on your earnings.

## Cancellations and penalties
Cancelling after accepting, or failing to arrive, affects the customer. Cancellation charges or penalties shown in the app may be applied. Genuine emergencies can be reported to support for review.

## Conduct rules
- No harassment, abuse, theft, intoxication or violence.
- Do not take bookings or payments outside the Platform to avoid commission.
- Do not share a customer's personal details or address with anyone else.
- Do not misuse OTPs, photos or the job timer.

## Suspension and termination
We may suspend or end your access for breaking these Terms, customer safety concerns, fraud, repeated complaints or legal reasons. Pending earnings will be settled after adjusting any dues, subject to investigation where needed. You may stop using the app and request account deletion at any time once dues are cleared.

## Limitation of liability
{{company_name}} is an intermediary. We are not responsible for disputes between you and a customer beyond helping to resolve them, and to the extent permitted by law we are not liable for indirect or consequential losses. You are responsible for any damage caused by your negligence or misconduct during a job.

## Governing law
These Terms are governed by the laws of India. Subject to amicable resolution, courts at Sehore, Madhya Pradesh have exclusive jurisdiction.

## Changes to these Terms
We may update these Terms from time to time. The current version and its "last updated" date are always on this page. Continued use of the app means you accept the updated Terms.

${CONTACT_BLOCK}`

const USER_SUPPORT = `## How do I book a service?
Open the app, choose a category and service, pick your date, time slot and duration, add your address and confirm. A nearby verified worker will accept your booking and you will get a notification.

## My worker has not arrived. What should I do?
First check the worker's live status in your booking. If they are late by more than 15 minutes, call our customer care on {{phone}}. We will arrange a replacement or a full refund for online payments.

## How do the start and completion OTPs work?
Share the start OTP with the worker only when they reach your location and take the before-work photo. After the work is complete and you are satisfied, share the completion OTP. Never share an OTP with anyone else.

## How do I cancel or reschedule a booking?
Open My Bookings, select the booking and tap Cancel. Charges depend on how close to the start time you cancel, as shown in the Cancellation Policy.

## How long do refunds take?
Approved refunds go back to your original payment method within 5–7 working days. If it takes longer, contact us with your booking details.

## My payment failed but money was deducted
Failed payments are normally reversed automatically by the bank in 3–5 working days. If it is not returned, email {{email}} with your booking ID and transaction reference.

## Can I pay in cash?
Yes, where the cash option is shown at checkout you can pay the worker directly after the job. Pay only the amount displayed in your booking.

## How do I report a problem or safety issue?
Use Support & issues inside the app to raise a complaint, or call {{phone}} right away. In an emergency, contact local emergency services first.

## How do I delete my account?
Write to {{email}} from your registered mobile number or email and we will process the request, subject to any pending bookings or legal record-keeping.`

const LABOUR_SUPPORT = `## How do I get verified and start receiving jobs?
Complete KYC in the app by submitting your Aadhaar and PAN details and a verification video. Our team reviews it, usually within 1–2 business days. You will get a notification as soon as it is approved, and your free trial starts at that point.

## Why am I not receiving booking requests?
Check that you are online, your KYC is approved, your work categories and area are set, and your subscription or free trial is active. For cash bookings you also need the minimum wallet balance shown in the app.

## How do cash bookings work?
You collect the full amount in cash from the customer. The platform fee for that job is deducted from your wallet balance, so keep your wallet recharged to keep seeing cash bookings.

## How do I recharge my wallet?
Open Wallet in the app, choose an amount within the allowed range and pay online. The balance is added instantly after payment succeeds.

## When will I get my earnings?
Earnings from online bookings are added to your wallet after the job is completed. You can withdraw them as per the withdrawal rules in the app. Contact us if a completed job is missing from your earnings.

## How do start and completion OTPs work?
Take the before-work photo, then enter the customer's start OTP to begin. The countdown follows the time booked by the customer. When the work is finished, take the after-work photo and use the completion OTP.

## A customer is behaving badly or the site is unsafe
Leave the situation safely and report it right away from Support & issues in the app, or call {{phone}}. In an emergency contact local emergency services first.

## My payment or wallet balance looks wrong
Email {{email}} with a screenshot and the booking ID. We will check the wallet statement and correct genuine errors.

## How do I update my profile or delete my account?
You can edit your details from Profile in the app. To delete your account, write to {{email}} from your registered number once any dues are cleared.`

export const POLICY_DEFAULTS = {
  privacy: { customer: USER_PRIVACY, labour: LABOUR_PRIVACY },
  terms: { customer: USER_TERMS, labour: LABOUR_TERMS },
  support: { customer: USER_SUPPORT, labour: LABOUR_SUPPORT },
}

/** Contractors share the customer-facing text until an admin writes their own. */
export function getDefaultPolicyContent(type, role) {
  const byRole = POLICY_DEFAULTS[type]
  if (!byRole) return ''
  return byRole[role] || byRole.customer || ''
}
