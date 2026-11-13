// DEFAULT policy text. Editable from /admin/pages (saved copies override these).
// {{tokens}} are filled from Admin → Settings. These are starting drafts: have a lawyer review before launch.
export const POLICY_LIST = [
  { slug: "privacy", title: "Privacy Policy" },
  { slug: "terms", title: "Terms & Conditions" },
  { slug: "shipping", title: "Shipping Policy" },
  { slug: "refund", title: "Refund & Cancellation Policy" },
  { slug: "grievance", title: "Grievance Redressal" },
];

export const DEFAULTS = {
privacy: `Last updated: November 2026

{{business_name}} ("we", "us") operates {{site}}. This policy explains what personal information we collect when you shop with us, how we use it, and the choices you have. We process personal data in line with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.

## Information we collect
- **Details you give us:** name, email address, phone number, delivery address, and the messages or complaints you send us.
- **Order details:** the items you buy, order value, and delivery status.
- **Payment:** payments are processed by Razorpay. We do not see or store your card, UPI PIN or net-banking credentials. We receive only a payment reference and status.
- **Technical data:** device and browser type, pages visited, and approximate location from your IP address, collected through cookies and similar tools to keep the site secure and working.

## How we use it
- To process and deliver your orders, send order and shipping updates, and handle cancellations and refunds.
- To create and maintain your customer account so you can view orders, tracking and your wishlist.
- To respond to your enquiries and complaints.
- To prevent fraud, keep the website secure and meet legal obligations.
- With your consent, to send news about new drops. You can opt out at any time.

## Who we share it with
We share only what is needed with: payment gateway (Razorpay), courier and logistics partners, email and hosting providers (for example Resend, Supabase and Vercel), and authorities where required by law. We do not sell your personal information.

## Cookies
We use essential cookies to keep you logged in and remember your bag, and may use analytics cookies to understand how the site is used. You can control cookies in your browser settings; blocking essential cookies may stop checkout from working.

## How long we keep it
We keep order and tax records for as long as the law requires, and other data only as long as needed for the purposes above.

## Your rights
You can ask us to access, correct or delete your personal data, withdraw consent, or nominate someone to exercise your rights. Write to {{email}} and we will respond within a reasonable time. You can also raise concerns with our Grievance Officer (see Grievance Redressal).

## Security
We use reasonable technical and organisational safeguards, including encrypted connections. No online service can be 100% secure, so please keep your login details private.

## Children
Our store is not meant for children under 18 to buy without a parent or guardian. We do not knowingly collect children's data.

## Changes
We may update this policy and will post the new date at the top.

## Contact
{{legal_name}}, {{address}}. Email: {{email}}. Phone: {{phone}}.`,

terms: `Last updated: November 2026

These Terms & Conditions apply to your use of {{site}} and any purchase from {{business_name}} ({{legal_name}}). By using the site or placing an order you agree to them.

## Using the site
You must be 18 or older, or use the site under a parent or guardian's supervision. You agree to give accurate information and not to misuse the site, attempt to access it without permission, or use it for unlawful purposes.

## Products and prices
- All prices are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.
- We try to show product colours and details accurately, but screens vary, so slight differences may occur.
- We may change prices, or withdraw products, at any time. The price you pay is the price shown when you place your order.
- Stock is limited. If a product becomes unavailable after you order, we will tell you and refund you in full.

## Orders and payment
- An order is accepted when payment is confirmed and you receive our order confirmation email.
- Payments are processed securely by Razorpay. We do not store your card or UPI details.
- We may cancel an order for reasons such as stock errors, pricing errors or suspected fraud, and will refund any amount paid.

## Shipping and refunds
These are governed by our Shipping Policy and Refund & Cancellation Policy, which form part of these terms.

## Accounts
Your account is created from your email when you order or sign in. You are responsible for keeping access to that email secure.

## Intellectual property
The Formula 5 name, logo, designs, photographs and website content belong to us or our licensors. You may not copy, reproduce or use them commercially without written permission.

## Limitation of liability
To the extent permitted by law, we are not liable for indirect or consequential losses. Our total liability for any order is limited to the amount you paid for that order. Nothing here limits your rights under the Consumer Protection Act, 2019 or other applicable law.

## Governing law
These terms are governed by the laws of India. Courts at {{jurisdiction}} have jurisdiction, subject to your rights as a consumer under applicable law.

## Contact and grievances
Questions: {{email}}. Complaints: see Grievance Redressal.`,

shipping: `Last updated: November 2026

## Where we ship
We currently ship within India.

## Processing time
Orders are packed and handed to our courier partner within {{dispatch_days}} of payment confirmation (excluding Sundays and public holidays). Drop launches and sale periods may take a little longer.

## Delivery time
Once dispatched, delivery usually takes {{delivery_days}} depending on your pin code. Remote locations can take longer. These are estimates, not guarantees.

## Shipping charges
Shipping is free on orders of {{free_shipping_min}} rupees and above. Below that, a flat shipping fee of ₹{{shipping_fee}} applies. The exact amount is shown at checkout before you pay.

## Tracking
When your order ships we email you the courier name and tracking number. You can also see status any time by logging in to your account or using the Track Order page.

## Delivery attempts and wrong addresses
Please double-check your address and phone number. If the courier cannot deliver after attempts, the parcel may be returned to us. We will contact you to re-ship (extra shipping may apply) or cancel with a refund less non-recoverable shipping costs.

## Damaged or wrong parcels
If your parcel arrives damaged or tampered with, please record an unboxing video and contact us within 48 hours of delivery at {{email}} or via the Complaint form with your order number.

## Contact
{{email}} · {{phone}}`,

refund: `Last updated: November 2026

## Cancelling an order
- **Before it ships:** you can cancel and we will refund the full amount. Contact us as soon as possible at {{email}} with your order number. Once an order is handed to the courier it cannot be cancelled.
- **By us:** if we cannot fulfil an order (for example stock or pricing errors), we will cancel it and refund the full amount.

## How refunds are issued
- Approved refunds go back to the original payment method (card, UPI, net banking or wallet) used at checkout.
- We initiate refunds within {{refund_days}} business days of approving a cancellation. After that, your bank or payment provider may take an additional 5-7 business days to show the credit.
- If an order failed but money was deducted, it is automatically reversed by the payment gateway, usually within 5-7 business days. If not, contact us with your payment reference.

## What is refunded
The product price you paid. Shipping fees are refunded when the cancellation is due to our error, or when we cancel the order. Otherwise they may be non-refundable.

## Questions
{{email}} · {{phone}}`,

grievance: `In line with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000, we have appointed a Grievance Officer.

## Grievance Officer
**Name:** {{grievance_name}}
**Business:** {{legal_name}}
**Address:** {{address}}
**Email:** {{email}}
**Phone:** {{phone}}
**GST number:** {{gst}}

## How to raise a complaint
Use the Complaint form on our website or email the address above. Please include your name, contact details, order number (if any) and a clear description of the issue.

## What to expect
- We acknowledge every complaint within 48 hours of receiving it.
- We aim to resolve or redress it within one month of receipt.
- You will get a reference number so you can follow up.

If you are not satisfied with our response, you may approach the National Consumer Helpline (1915) or file a complaint at the consumer commission as provided under the Consumer Protection Act, 2019.`,
};

export function fillTokens(text, s) {
  const map = {
    business_name: s.business_name, legal_name: s.legal_name, address: s.address, email: s.contact_email,
    phone: s.contact_phone || "[phone]", gst: s.gst_number || "[GSTIN]", return_days: s.return_days, exchange_days: s.exchange_days,
    refund_days: s.refund_days, dispatch_days: s.dispatch_days, delivery_days: s.delivery_days,
    free_shipping_min: Number(s.free_shipping_min).toLocaleString("en-IN"), shipping_fee: s.shipping_fee,
    jurisdiction: s.jurisdiction, grievance_name: s.grievance_name, site: "your-site",
  };
  return String(text).replace(/\{\{(\w+)\}\}/g, (_, k) => (map[k] ?? ""));
}
