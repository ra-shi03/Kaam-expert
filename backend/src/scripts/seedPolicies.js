import 'dotenv/config'
import mongoose from 'mongoose'
import Policy from '../models/Policy.js'

const PRIVACY_POLICY_CONTENT = {
  customer: `Privacy Policy for Customers

Welcome to our platform. We value your privacy and are committed to protecting your personal data.

1. Information We Collect
- Contact information (name, phone, email)
- Location data for booking services
- Payment details (processed securely)

2. How We Use Your Data
We use your data to provide you with the best service possible, match you with appropriate professionals, and process payments.

3. Data Sharing
We share your basic contact info with the professional assigned to your job. We do not sell your data.`,
  contractor: `Privacy Policy for Contractors

As a contractor on our platform, your data privacy is important to us.

1. Information We Collect
- Business registration details
- Team and workforce information
- Financial and payout details

2. Data Usage
Your data is used to verify your business, facilitate payouts, and match you with large scale projects.`,
  labour: `Privacy Policy for Labour/Professionals

We ensure that your personal information is kept secure while you work through our platform.

1. KYC & Verification
We collect identification documents (Aadhaar, etc.) strictly for background verification and safety.

2. Earnings & Payouts
Your bank details are stored securely to ensure you receive your payments on time.

3. Visibility
Your profile, ratings, and skills are visible to customers booking your services.`,
}

const TERMS_CONTENT = {
  customer: `Terms and Conditions for Customers

1. Acceptance of Terms
By accessing our platform, you agree to be bound by these terms.

2. Services
We connect you with independent professionals. We are not an employer of these professionals.

3. Payments and Fees
You agree to pay the quoted price for services booked through our platform. All payments are final unless specified in our Refund Policy.`,
  contractor: `Terms and Conditions for Contractors

1. Account Registration
You must provide accurate information regarding your business and team.

2. Project Execution
You agree to complete all accepted projects professionally and within the agreed timeline.

3. Fees and Commission
We deduct a standard commission from your payouts as outlined in the fee schedule.`,
  labour: `Terms and Conditions for Labour/Professionals

1. Platform Use
You agree to use the app to log attendance, view jobs, and manage earnings truthfully.

2. Professional Conduct
You must behave professionally at job sites and comply with safety guidelines.

3. Payouts
Your earnings will be credited to your wallet and disbursed according to the standard cycle.`,
}

const FAQS_CONTENT = {
  customer: `Frequently Asked Questions - Customers

Q: How do I book a service?
A: You can browse the services in the app and select 'Book Now' to initiate a request.

Q: How are payments handled?
A: Payments are securely processed through the app once the job is completed or as per milestone agreements.

Q: Can I cancel my booking?
A: Yes, you can cancel your booking before the professional arrives. Please refer to our Cancellation Policy for details.`,
  contractor: `Frequently Asked Questions - Contractors

Q: How do I get large projects?
A: Complete your profile and ensure your business documents are verified. You will receive project requests based on your location and expertise.

Q: When do I get paid?
A: Payouts are processed on a weekly basis for completed and approved milestones.

Q: How do I manage my workforce?
A: You can add and manage your team members directly from your profile dashboard.`,
  labour: `Frequently Asked Questions - Labour/Professionals

Q: How do I mark my attendance?
A: You can log your daily attendance using the app's attendance feature when you arrive at the job site.

Q: How do I track my earnings?
A: Your earnings are updated in real-time in the 'Earnings' section of the app after each approved shift.

Q: What should I do if I have a dispute on site?
A: Please contact our support team immediately through the 'Support' section in the app.`,
}

const CANCELLATION_CONTENT = {
  customer: `Cancellation Policy for Customers

1. Free Cancellation
You may cancel a booking free of charge up to 2 hours before the scheduled start time.

2. Late Cancellation Fee
Cancellations made within 2 hours of the start time may be subject to a nominal cancellation fee to compensate the professional for their time.

3. Professional No-Show
If the assigned professional does not arrive within the expected timeframe, you may cancel without any penalty and request a full refund if paid in advance.`,
  contractor: `Cancellation Policy for Contractors

1. Request Cancellation
You can cancel a workforce request before any team members have been dispatched or accepted the job.

2. Milestone Cancellation
Once a milestone has begun, cancellations must be mutually agreed upon with the deployed workforce, and payment for completed work is non-refundable.

3. Penalties
Frequent cancellations of confirmed bookings may affect your contractor rating and visibility on the platform.`,
  labour: `Cancellation Policy for Labour/Professionals

1. Job Rejection
You may reject a job assignment before accepting it without penalty.

2. Canceling Accepted Jobs
If you must cancel an accepted job due to an emergency, please do so as early as possible so a replacement can be found.

3. Excessive Cancellations
Repeatedly canceling accepted jobs at the last minute may result in a temporary suspension or reduced visibility of your profile to customers.`,
}

const REFUND_CONTENT = {
  customer: `Refund Policy for Customers

1. Eligible Refunds
Refunds are provided if a booked professional fails to show up or if the service delivered is demonstrably defective.

2. Refund Processing Time
Approved refunds will be credited back to your original payment method within 5-7 business days.

3. Dispute Resolution
If you are unsatisfied with a service, please raise a dispute within 24 hours of completion to be eligible for a review and potential refund.`,
  contractor: `Refund Policy for Contractors

1. Milestone Refunds
Payments made for milestones that are not completed by the workforce will be refunded to your contractor wallet.

2. Service Fees
Platform commission fees are generally non-refundable once a job is actively matched and commenced.

3. Withdrawing Funds
Refunds credited to your contractor wallet can be withdrawn to your linked bank account during the next payout cycle.`,
  labour: `Refund Policy for Labour/Professionals

1. Incorrect Deductions
If a penalty or platform fee is incorrectly deducted from your earnings, it will be refunded to your wallet upon successful review by support.

2. Dispute Claims
If a customer claims a refund that affects your payout, the amount will be held in escrow until the dispute is resolved.

3. Bank Reversals
If a payout fails due to incorrect bank details, the funds will be reversed to your app wallet within 3 business days.`,
}

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI required')
  await mongoose.connect(uri)

  console.log('Seeding Policies...')

  for (const role of ['customer', 'contractor', 'labour']) {
    await Policy.findOneAndUpdate(
      { type: 'privacy', role },
      { content: PRIVACY_POLICY_CONTENT[role] },
      { upsert: true, new: true }
    )
    console.log(`Seeded privacy policy for ${role}`)

    await Policy.findOneAndUpdate(
      { type: 'terms', role },
      { content: TERMS_CONTENT[role] },
      { upsert: true, new: true }
    )
    console.log(`Seeded terms & conditions for ${role}`)

    await Policy.findOneAndUpdate(
      { type: 'faqs', role },
      { content: FAQS_CONTENT[role] },
      { upsert: true, new: true }
    )
    console.log(`Seeded FAQs for ${role}`)

    await Policy.findOneAndUpdate(
      { type: 'cancellation', role },
      { content: CANCELLATION_CONTENT[role] },
      { upsert: true, new: true }
    )
    console.log(`Seeded cancellation policy for ${role}`)

    await Policy.findOneAndUpdate(
      { type: 'refund', role },
      { content: REFUND_CONTENT[role] },
      { upsert: true, new: true }
    )
    console.log(`Seeded refund policy for ${role}`)
  }

  console.log('Finished seeding policies.')
  await mongoose.disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
