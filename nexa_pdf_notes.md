# NEXA Master Build Prompt Notes

## Source

- File: `/home/ubuntu/upload/NEXA—CompleteMasterBuildPrompt.pdf`
- Reviewed visually: pages 1-5 of 54

## Key Findings from Pages 1-5

### Product vision

NEXA is described as an **all-in-one AI + utility + productivity + creator platform**. The product should feel like a **premium modern technology product**, not a generic dashboard or template. The build prompt explicitly asks for a **real, modular application foundation** with reusable components, responsive design, clean architecture, credit management, future AI integration, future payment integration, and future mobile compatibility.

### Brand and experience goals

The long-term positioning is: **"Everything you need. One intelligent workspace."**

The platform should feel:

- intelligent
- useful
- fast
- premium
- cinematic
- modern
- trustworthy
- expandable

### Product categories mentioned

The PDF lists these capability groups for the platform:

- AI tools
- Image tools
- PDF tools
- Document tools
- File utilities
- Calculators
- Converters
- Productivity tools
- Text tools
- Creator tools
- Personal workspace

### Business model

The prompt defines a **freemium model**.

| Plan | Price | Credit policy |
| --- | --- | --- |
| Free | $0 | 100 daily credits |
| Pro | $15/month | 15,000 monthly credits |

Additional constraints:

- Do **not** provide unlimited AI usage.
- Do **not** provide unlimited expensive processing.
- Pricing must live in a centralized configuration.
- Prices and credit amounts should not be hard-coded across components.
- Architecture should support easy future change of price and credit amounts.

### Free plan rules

- Plan name: **NEXA Free**
- Price: **$0**
- Credits: **100 credits per day**
- Unused daily credits do **not** roll over.
- Daily reset should be server-authoritative.
- The preferred reset reference is **00:00 UTC**.
- UI may show the next reset in local timezone, but backend logic remains authoritative.

### Pro plan rules

- Plan name: **NEXA Pro**
- Price: **$15 USD/month**
- Credits: **15,000 credits per billing cycle**
- Pro users do not have the Free plan's 100-credit daily restriction.
- When monthly credits reach zero, UI should communicate exhaustion and present future options such as waiting for the next billing cycle, buying additional credits later, or upgrading later.

### Credit system rules

- Credits are NEXA's internal usage unit.
- Credits are **not equal to dollars**.
- Different operations consume different credit amounts.
- The backend must determine actual credit cost.
- The frontend must never be trusted to decide user balance, tool cost, plan status, or payment status.

### Example basic tool credit costs shown on the reviewed pages

The prompt shows several example operations consuming **1 credit** per completed successful operation, including calculators, word and character counters, case converter, JSON formatter, Base64 encode/decode, password generation, image resize/compression, JPG↔PNG conversion, and basic PDF processing.

### Explicit no-charge UI actions

The reviewed section notes that normal UI interaction should not consume credits. Examples shown:

- Opening a tool: 0 credits
- Selecting a file: 0 credits

## Interim interpretation for the website rebuild

Although the PDF describes a broader future-ready product platform, the current active project is a **static frontend website**. Therefore, the implementation should likely translate these requirements into a premium marketing/product experience that communicates:

1. the unified workspace vision,
2. the premium visual identity,
3. the tool ecosystem,
4. the pricing and credit philosophy,
5. the extensible product architecture direction.

Further extraction from the remaining pages is still needed before final implementation decisions are locked.
