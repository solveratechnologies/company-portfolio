import type { LegalBlock, LegalSection } from "@/components/ui/LegalPage";
import { fact, type LegalFacts } from "@/config/legal";

/**
 * The Terms and Conditions text. Everything the business owner has to supply (names, address, email, phone,
 * governing law, courts) comes from `LegalFacts` (src/config/legal.ts); the wording itself is the owner's
 * approved text. The phone lines are left out when no number is published.
 */

export const TERMS_SITE_URL = "https://solveratechnologies.com/";
const PRIVACY_URL = "https://solveratechnologies.com/privacy-policy/";

const p = (text: string): LegalBlock => ({ type: "p", text });
const list = (...items: string[]): LegalBlock => ({ type: "list", items });
const olist = (...items: string[]): LegalBlock => ({ type: "olist", items });

export function termsSections(f: LegalFacts): LegalSection[] {
  const email = fact(f.privacyEmail, "contact email to be completed");
  const mail = f.privacyEmail ? `[${email}](mailto:${email})` : email;
  const site = `[${TERMS_SITE_URL}](${TERMS_SITE_URL})`;
  const entity = fact(f.entityName, "legal entity to be completed");
  const address = fact(f.registeredAddress, "business address to be completed");
  const phone = f.phone ? `[${f.phone}](tel:${f.phone.replace(/[^\d+]/g, "")})` : undefined;
  const law = fact(f.jurisdiction, "governing jurisdiction to be confirmed");
  const courts = fact(f.courtsLocation, "city and country of the courts to be confirmed");

  return [
    {
      title: "Introduction and Acceptance",
      blocks: [
        p("Welcome to Solvera Technologies."),
        p(`These Terms and Conditions (“Terms”) govern access to and use of the website located at ${site}, including its publicly accessible content, features, and information (collectively, the “Website”).`),
        p("The Website is operated by Solvera Technologies (“Solvera,” “Company,” “we,” “us,” or “our”)."),
        p("By accessing the Website, you are subject to applicable rules governing its use. Where affirmative agreement is required for a particular contractual provision, we will obtain acceptance through an appropriate mechanism."),
        p("If you do not agree with these Terms, please discontinue use of the Website."),
        p("**These Terms primarily govern Website use. Paid professional services are governed by separate agreements accepted by the relevant Parties.**"),
        p("Nothing in these Terms is intended to exclude mandatory rights or remedies that cannot legally be waived."),
      ],
    },
    {
      title: "Company Information",
      blocks: [
        p("**Business Name:** Solvera Technologies"),
        p(`**Legal Entity / Proprietor:** ${entity}`),
        p(`**Business Address:** ${address}`),
        p(`**Website:** ${site}`),
        p(`**Email:** ${mail}`),
        ...(phone ? [p(`**Telephone:** ${phone}`)] : []),
        p("The relevant contracting party for professional services will be identified in the applicable written agreement."),
      ],
    },
    {
      title: "Global Availability and Applicable Laws",
      blocks: [
        p("Our Website may be accessed from multiple countries and territories."),
        p("The availability of information about our services does not mean that every service is available, licensed, permitted, or appropriate in every jurisdiction."),
        p("We may decline engagements that would require activities prohibited by applicable laws or that involve regulatory requirements we are not equipped or authorized to satisfy."),
        p("Visitors are responsible for using the Website lawfully, while Solvera remains responsible for complying with laws applicable to its own conduct."),
        p("We do not represent that the Website or all advertised services are legally suitable for every country or regulatory environment."),
        p("Any mandatory consumer, privacy, intellectual property, accessibility, or other rights under applicable law remain unaffected."),
      ],
    },
    {
      title: "Description of Services",
      blocks: [
        p("Solvera provides technology and professional business services, which may include:"),
        list(
          "Website design and development",
          "Web and mobile application development",
          "Custom software engineering",
          "CRM implementation and management",
          "API integrations and system connectivity",
          "Business automation and workflow development",
          "AI-powered applications and agents",
          "AI voice and conversational systems",
          "Digital marketing and campaign services",
          "Lead-generation and sales automation",
          "Technical consulting and support",
          "Related technology services",
        ),
        p("Service descriptions are provided for general informational purposes."),
        p("Actual deliverables, pricing, warranties, requirements, limitations, and contractual obligations depend on the relevant engagement."),
      ],
    },
    {
      title: "Eligibility and Authority",
      blocks: [
        p("The Website is primarily intended for business and professional use."),
        p("You agree to use it for lawful purposes."),
        p("If you enter into an agreement on behalf of a company, partnership, organization, or other legal entity, you represent that you have appropriate authority to do so."),
        p("Providing business information through a general contact form does not establish that Solvera has accepted a client engagement."),
        p("We may refuse prospective engagements where appropriate and lawful."),
      ],
    },
    {
      title: "Permitted Website Use",
      blocks: [
        p("Subject to applicable law, visitors may:"),
        list(
          "Browse publicly available Website content.",
          "Review service information.",
          "Submit legitimate inquiries.",
          "Request consultations or quotations.",
          "Share links to publicly available pages.",
          "Download or print reasonable portions of Website content for personal reference or internal business evaluation.",
        ),
        p("These permissions do not transfer ownership of the Website or any intellectual property."),
        p("No broader commercial-use license is granted unless expressly authorized."),
      ],
    },
    {
      title: "Prohibited Conduct",
      blocks: [
        p("Visitors must not:"),
        olist(
          "Attempt unauthorized access to the Website or connected systems.",
          "Circumvent authentication or security controls.",
          "Introduce malware or harmful software.",
          "Conduct denial-of-service attacks or malicious traffic activities.",
          "Submit fraudulent or intentionally misleading information.",
          "Use the Website to distribute spam or unlawful material.",
          "Infringe copyright, trademark, privacy, or other protected rights.",
          "Impersonate Solvera or its representatives.",
          "Engage in unauthorized extraction or commercial reproduction of protected Website content.",
          "Interfere with Website availability, integrity, or security.",
          "Attempt unauthorized access to private project information.",
          "Use the Website for unlawful, deceptive, abusive, or malicious activities.",
        ),
        p("Restrictions apply only to the extent consistent with applicable law and do not prohibit protected activities or duly authorized security testing."),
        p("We may take reasonable action to prevent misuse, including access restrictions and appropriate reporting of unlawful conduct."),
      ],
    },
    {
      title: "Intellectual Property",
      blocks: [
        p("Unless otherwise identified, Website content and original materials are owned by or licensed to Solvera."),
        p("These may include:"),
        list(
          "Company branding and logos",
          "Written content",
          "Graphics and illustrations",
          "Layouts and designs",
          "Original software and code",
          "Visual elements",
          "Documentation",
          "Proprietary technical materials",
        ),
        p("Such materials may be protected by copyright, trademark, trade secret, and other laws."),
        p("Visitors may not reproduce, sell, distribute, modify, sublicense, or commercially exploit protected materials without the necessary authorization."),
        p("Third-party names, brands, trademarks, and logos belong to their respective owners."),
        p("References to software platforms do not imply official partnership or endorsement unless expressly stated."),
      ],
    },
    {
      title: "Client-Supplied Information and Materials",
      blocks: [
        p("Visitors may voluntarily provide information to Solvera through contact forms, communications, or consultation requests."),
        p("You confirm that you have the right to provide any materials you submit."),
        p("You retain ownership of your lawful intellectual property."),
        p("You grant Solvera limited permission to receive, review, store, and use submitted materials to evaluate your inquiry, communicate with you, and perform other lawful purposes described in our Privacy Policy."),
        p("Unless a separate agreement provides otherwise, submissions through a general inquiry form do not create a contractual confidentiality relationship equivalent to a signed Non-Disclosure Agreement."),
        p("We recommend using appropriately secure channels and confidentiality arrangements before disclosing proprietary databases, trade secrets, passwords, or sensitive personal information."),
        p("Solvera will still comply with applicable privacy and confidentiality obligations relating to information it receives."),
      ],
    },
    {
      title: "Privacy and Data Protection",
      blocks: [
        p("Information about our collection and handling of personal data is available in our Privacy Policy:"),
        p(`[${PRIVACY_URL}](${PRIVACY_URL})`),
        p("Where applicable, additional cookie notices, privacy controls, or data-processing agreements may govern particular activities."),
        p("Personal information will be handled according to the applicable legal requirements."),
        p("Website use alone does not constitute consent to non-essential tracking or marketing where separate consent is legally required."),
        p("These Terms do not limit individuals’ mandatory privacy rights."),
      ],
    },
    {
      title: "Consultations, Quotations, and Proposals",
      blocks: [
        p("Visitors may submit inquiries and request consultations, estimates, or proposals."),
        p("Unless expressly agreed in writing:"),
        list(
          "Consultations are exploratory.",
          "Quotations are based on available project information.",
          "Estimates may change following technical discovery.",
          "Availability and timelines are subject to confirmation.",
          "Website content is not a binding service offer.",
          "Submission of an inquiry does not create a paid services agreement.",
        ),
        p("Solvera may issue a separate proposal or Statement of Work defining the relevant commercial arrangement."),
        p("A binding engagement is established through an appropriately accepted contract, service order, or other legally valid agreement."),
      ],
    },
    {
      title: "Professional Services and Contract Priority",
      blocks: [
        p("Professional services may be governed by:"),
        list(
          "Master Services Agreements",
          "Statements of Work",
          "Accepted project agreements",
          "Service orders",
          "Support agreements",
          "Data Processing Agreements",
          "Non-Disclosure Agreements",
          "Other valid written arrangements",
        ),
        p("These documents may specify:"),
        list(
          "Project scope and deliverables",
          "Technical specifications",
          "Pricing and billing",
          "Milestones",
          "Acceptance testing",
          "Revisions and support",
          "Intellectual property ownership",
          "Confidentiality and security",
          "Data protection",
          "Liability",
          "Termination",
          "Dispute resolution",
        ),
        p("Where a project-specific agreement conflicts with these Website Terms, the project-specific agreement governs the relevant professional engagement, subject to applicable law."),
        p("These Website Terms do not independently impose payment obligations for services not ordered or accepted."),
      ],
    },
    {
      title: "Project Scope and Change Requests",
      blocks: [
        p("The scope of any paid project must be defined through an accepted agreement."),
        p("Additional work may require approval of a revised scope, quotation, or Change Order."),
        p("Examples include new features, additional integrations, changed specifications, expanded workflow requirements, additional design revisions, and additional deployment environments."),
        p("Changes may affect price, delivery dates, third-party requirements, or technical feasibility."),
        p("Solvera is not obligated to perform work outside an agreed scope without the necessary contractual authorization."),
      ],
    },
    {
      title: "Fees and Payments",
      blocks: [
        p("Project fees, billing procedures, currencies, taxes, payment milestones, and due dates are established through applicable client agreements."),
        p("Unless expressly included, third-party costs such as:"),
        list(
          "Hosting",
          "Domains",
          "Software subscriptions",
          "CRM licenses",
          "API usage",
          "AI model usage",
          "Messaging and telecommunications",
          "Advertising budgets",
          "External service charges",
        ),
        p("may be separately payable."),
        p("Late-payment arrangements, suspension rights, refunds, and payment disputes are governed by the relevant contract and applicable law."),
        p("Simply visiting the Website or submitting an inquiry does not create a payment obligation."),
      ],
    },
    {
      title: "Refunds, Cancellations, and Termination of Paid Services",
      blocks: [
        p("Cancellation and refund rights relating to professional services are determined by the applicable client agreement and mandatory legal requirements."),
        p("Relevant considerations may include work completed, agreed milestones, unused prepaid fees, authorized expenses, and non-cancellable third-party costs."),
        p("There is no universal refund rule applicable to every Solvera project solely by reason of these Website Terms."),
        p("Rights that cannot legally be excluded remain unaffected."),
      ],
    },
    {
      title: "Intellectual Property in Client Projects",
      blocks: [
        p("Ownership of custom project deliverables must be established in the relevant client agreement."),
        p("Depending on the agreement, ownership of specific final deliverables may transfer to the client after payment, while Solvera retains its pre-existing and independently developed intellectual property."),
        p("Reusable tools, frameworks, templates, methodologies, and third-party technologies may be subject to separate ownership and licensing arrangements."),
        p("The inclusion of third-party or open-source material in a deliverable does not automatically transfer ownership of those materials."),
        p("Source-code access, documentation, repository ownership, and technical handover must be defined in the project agreement."),
      ],
    },
    {
      title: "Third-Party Software and Integrations",
      blocks: [
        p("Solvera may work with third-party applications and services, including hosting providers, CRM platforms, automation software, cloud infrastructure, communication tools, advertising platforms, and AI services."),
        p("Third-party providers maintain their own technical systems, contracts, pricing, usage limits, and policies."),
        p("They may change APIs, impose restrictions, update pricing, discontinue features, or experience outages."),
        p("Solvera cannot guarantee uninterrupted independent third-party services or permanent compatibility with every external platform."),
        p("However, nothing in these Terms excuses Solvera from its own contractual obligations or from liability that cannot lawfully be excluded."),
        p("Changes requiring additional development or maintenance may be addressed under the applicable client agreement."),
      ],
    },
    {
      title: "Artificial Intelligence Disclaimer",
      blocks: [
        p("Some solutions described or implemented by Solvera may use artificial intelligence or automated processing technology."),
        p("AI-generated outputs may be inaccurate, incomplete, outdated, non-unique, or unsuitable for certain purposes."),
        p("AI systems may depend on third-party providers and external data."),
        p("Unless expressly warranted under a separate agreement, Solvera does not guarantee that every AI output will be correct or that AI systems can operate without human oversight."),
        p("AI-generated information should be appropriately reviewed before use in consequential business, financial, legal, medical, employment, or other significant decisions."),
        p("Client-specific responsibilities, safeguards, data use, and acceptance criteria must be established in the relevant agreement."),
        p("This section does not exclude applicable statutory rights or Solvera’s own contractual responsibilities."),
      ],
    },
    {
      title: "CRM, Automation, and Communications Compliance",
      blocks: [
        p("CRM and automation services may involve customer databases, marketing campaigns, messages, telephone systems, and other communication channels."),
        p("The lawful operation of these systems may require:"),
        list(
          "Appropriate data-processing grounds",
          "Marketing consent or valid alternative authorization",
          "Call-recording disclosures",
          "Telephone and SMS compliance",
          "Email unsubscribe functionality",
          "Security safeguards",
          "Provider account verification",
          "Third-party licensing",
          "Customer privacy notices",
        ),
        p("Responsibilities for these matters should be allocated in the relevant client agreement."),
        p("A technically successful integration does not automatically establish that a client’s business operations comply with all applicable laws."),
        p("Solvera remains responsible for activities and commitments legally attributable to it."),
      ],
    },
    {
      title: "Digital Marketing and Results",
      blocks: [
        p("Digital marketing results may depend on advertising budgets, market conditions, competitors, consumer behavior, platform algorithms, client operations, and other factors."),
        p("Unless expressly guaranteed in a valid client agreement, Solvera does not guarantee:"),
        list(
          "Specific search engine rankings",
          "Advertising impressions",
          "Particular conversion rates",
          "Fixed lead or appointment volumes",
          "Guaranteed sales",
          "Guaranteed revenue",
          "Guaranteed return on investment",
          "Platform approval or verification",
        ),
        p("Any published case studies or testimonials should describe genuine results and accurately disclose material qualifications."),
        p("Past performance does not guarantee future results."),
      ],
    },
    {
      title: "Confidentiality and Security",
      blocks: [
        p("Some engagements may involve confidential information, customer records, source code, business processes, or other sensitive materials."),
        p("Appropriate confidentiality and security obligations will be established through applicable law and the relevant contract."),
        p("Such obligations may address authorized access, use restrictions, contractor confidentiality, secure credentials, incident response, return of information, and data deletion."),
        p("Our Website should not be treated as an unrestricted secure channel for sending sensitive information."),
        p("We do not guarantee that electronic systems are completely immune from technical vulnerabilities, but we remain accountable for our legal and contractual obligations."),
      ],
    },
    {
      title: "Website Information and Availability",
      blocks: [
        p("We aim to keep the Website accurate, functional, and accessible."),
        p("However, Website information may occasionally be incomplete, outdated, or affected by technical errors."),
        p("We may update content, revise service descriptions, or modify Website features as reasonably necessary."),
        p("Website availability may be affected by maintenance, hosting incidents, network disruptions, cyberattacks, or circumstances outside reasonable control."),
        p("We do not promise continuous Website availability unless a separate binding agreement expressly provides otherwise."),
        p("No Website update will automatically amend an existing signed client contract."),
      ],
    },
    {
      title: "Disclaimers and Warranties",
      blocks: [
        p("To the fullest extent permitted by applicable law, the public Website and its general informational content are provided on an “as is” and “as available” basis."),
        p("Solvera does not provide an unconditional guarantee that all Website information will be error-free, continuously available, or suitable for every visitor’s particular purpose."),
        p("Website content is general information and is not a substitute for individualized legal, financial, regulatory, cybersecurity, or other specialist advice."),
        p("Professional services warranties are governed by the relevant client agreement."),
        p("Nothing in these Terms excludes mandatory statutory protections, express contractual warranties, or liabilities that cannot legally be restricted."),
      ],
    },
    {
      title: "Limitation of Website Liability",
      blocks: [
        p("To the fullest extent permitted by applicable law, Solvera will not be liable for indirect or consequential losses arising solely from use of, or reliance on, general Website information, except where such exclusion is unlawful."),
        p("Any exclusion or limitation is subject to mandatory legal protections."),
        p("Nothing in these Terms excludes or limits liability for fraud, fraudulent misrepresentation, or other liability that cannot lawfully be excluded."),
        p("Liability arising under professional services contracts, including agreed data-protection or intellectual property obligations, is governed by those contracts and applicable law."),
        p("This provision is not intended to override project-specific liability arrangements."),
      ],
    },
    {
      title: "Indemnification for Website Misuse",
      blocks: [
        p("To the extent legally enforceable, a visitor or organization materially breaching these Terms may be responsible for reasonable third-party claims and direct losses caused by deliberate unlawful misuse of the Website."),
        p("Such misuse may include malicious access, infringement of protected intellectual property, fraudulent submissions, or unlawful distribution of harmful material."),
        p("Any indemnity is subject to applicable law, causation, proportionate remedies, and appropriate defenses."),
        p("Visitors are not required to indemnify Solvera for Solvera’s own unlawful conduct or for losses unrelated to their actions."),
        p("Professional services indemnities are governed by the applicable client agreement."),
      ],
    },
    {
      title: "External Links",
      blocks: [
        p("Our Website may contain links to external websites and platforms."),
        p("These services may operate independently and maintain their own terms, policies, and security arrangements."),
        p("We do not automatically endorse all external content merely by including a link."),
        p("Visitors should review applicable third-party terms and privacy policies."),
        p("Our responsibilities concerning third-party providers acting on our behalf remain subject to applicable law and relevant contracts."),
      ],
    },
    {
      title: "Suspension and Restriction of Website Access",
      blocks: [
        p("We may restrict or suspend Website access where reasonably necessary to:"),
        list(
          "Address malicious activity",
          "Investigate security incidents",
          "Prevent unauthorized access",
          "Respond to material misuse",
          "Comply with legal requirements",
          "Protect systems and information",
        ),
        p("Any action will be subject to applicable law."),
        p("Website restrictions do not automatically terminate separately agreed client services."),
      ],
    },
    {
      title: "Force Majeure",
      blocks: [
        p("Events beyond reasonable control may interrupt the Website or affect the performance of contractual obligations."),
        p("Potential events include major infrastructure outages, natural disasters, widespread network failures, and government restrictions."),
        p("Legal consequences depend on the applicable law and relevant agreement."),
        p("Force majeure does not automatically eliminate obligations that remain legally enforceable, including payment obligations that have already accrued."),
      ],
    },
    {
      title: "Governing Law and Dispute Resolution",
      blocks: [
        p(`These Website Terms are governed by the laws of **${law}**, subject to mandatory applicable laws and jurisdictional protections.`),
        p(`Where legally permitted, disputes specifically relating to Website use will be submitted to the competent courts of **${courts}**.`),
        p("The Parties are encouraged to attempt good-faith resolution of disputes before formal proceedings where appropriate."),
        p("Nothing in these Terms prevents an individual or organization from exercising rights, bringing claims, contacting regulators, or using a forum that cannot lawfully be excluded."),
        p("A separate client agreement may establish different governing-law, jurisdictional, mediation, or arbitration provisions for a professional engagement."),
      ],
    },
    {
      title: "Changes to These Terms",
      blocks: [
        p("Solvera may revise these Terms in response to changes in the Website, business operations, technology, or legal requirements."),
        p("Updated Terms will be published with a revised effective date."),
        p("We will provide additional notice or obtain required acceptance where legally necessary."),
        p("Revisions to Website Terms will not unilaterally change the terms of an existing professional services agreement."),
      ],
    },
    {
      title: "General Legal Provisions",
      blocks: [
        p("**Severability:** If a provision is found unenforceable, the remaining provisions will continue to apply where legally permissible."),
        p("**No Waiver:** Failure to enforce a provision does not necessarily waive future enforcement rights."),
        p("**No Partnership:** Website use does not create an employment, agency, partnership, or joint venture relationship."),
        p("**Assignment:** Rights and obligations may be transferred only to the extent permitted by applicable law and relevant agreements."),
        p("**Third-Party Rights:** These Terms do not create independent rights for unrelated third parties except where expressly stated or legally required."),
        p("**Electronic Communications:** Business communications and agreements may be completed electronically where legally valid."),
        p("**Entire Website Understanding:** These Terms govern general Website use and do not supersede separate enforceable professional services agreements."),
      ],
    },
    {
      title: "Contact Information",
      blocks: [
        p("For questions concerning these Terms, contact:"),
        p("**Solvera Technologies**"),
        p(`**Legal Entity / Proprietor:** ${entity}`),
        p(`**Business Address:** ${address}`),
        p(`**Website:** ${site}`),
        p(`**Email:** ${mail}`),
        ...(phone ? [p(`**Phone:** ${phone}`)] : []),
      ],
    },
  ];
}
