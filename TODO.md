# NEXA — বর্তমান কাজ

- [x] `AI Creator Tools` category এবং চারটি registry entry যোগ করা।
- [x] AI Translator, AI Hashtag Generator, AI Description Generator এবং AI Video Analyzer-এর direct routes যুক্ত করা।
- [x] Backend AI API-এর জন্য স্পষ্ট ready-state, input/output contract এবং truthful unavailable UI তৈরি করা।
- [x] Existing text, image ও document utility routes অক্ষুণ্ণ রেখে responsive UI যাচাই করা।
- [x] TypeScript check ও production build চালিয়ে checkpoint তৈরি করা।

## পরবর্তী creator tools phase

- [x] AI Stock Metadata Generator-এর registry entry, route ও API-ready upload/context workspace যোগ করা।
- [x] AI YouTube SEO Assistant-এর registry entry, route ও API-ready SEO request workspace যোগ করা।
- [x] AI Subtitle Generator-এর registry entry, route ও API-ready audio/video transcript workspace যোগ করা।
- [x] Existing AI Creator routes অক্ষুণ্ণ রেখে responsive UI, TypeScript ও production build যাচাই করা।

## Clip Planner phase

- [x] AI Video Analyzer / Clip Planner-এর registry entry ও direct route যোগ করা।
- [x] Video upload, optional description ও content-type controlsসহ typed API-ready request contract যোগ করা।
- [x] Truthful summary, timestamp, clip idea, title, hashtag ও description output structureসহ premium workspace বাস্তবায়ন করা।
- [x] Existing routes অক্ষুণ্ণ রেখে responsive UI, TypeScript ও production build যাচাই করা।

## Secure AI backend phase

- [x] Full-stack backend capability সক্রিয় করে AI endpoint conventions পর্যালোচনা করা।
- [x] Provider-বদলযোগ্য AI service layer, server-only environment contract ও request schemas তৈরি করা।
- [x] সাতটি AI tool-এর validated public endpoint এবং truthful unavailable-provider behavior তৈরি করা।
- [x] Existing AI Creator UI-তে loading ও error-state backend connection যুক্ত করা।
- [x] TypeScript, production build ও frontend key-exposure যাচাই করে checkpoint তৈরি করা।

## React root regression fix

- [x] Client bootstrap-এ duplicate `createRoot` initialization-এর কারণ নির্ণয় করা।
- [x] একক React root initialization প্রয়োগ করে homepage rendering error দূর করা।
- [x] Browser console, TypeScript ও production build যাচাই করে checkpoint তৈরি করা।

## OpenAI-compatible AI provider phase

- [x] Server-only OpenAI-compatible provider module, environment contract ও secret-free setup guide তৈরি করা; platform policy সরাসরি `.env.example` edit অনুমোদন করে না।
- [x] Translator, hashtag, description, stock metadata ও YouTube SEO-এর জন্য structured model output parsing সংযুক্ত করা।
- [x] Subtitle, video analyzer ও clip planner-কে truthful media-backend-required state-এ রাখা।
- [x] Provider unit tests, TypeScript, full test suite, production build ও responsive UI যাচাই করা।

## Premium subscription access-control phase

- [x] FREE ও PREMIUM plan state এবং future subscription metadata schema যোগ করা।
- [x] Reusable server-side Premium authorization helper ও `$10/month` price configuration যোগ করা।
- [x] সব current AI tRPC endpoint-এ authentication ও Premium guard প্রয়োগ করা; provider call-এর আগে server-side reject নিশ্চিত করা।
- [x] Free-user upgrade CTA, disabled execution control ও Premium-aware tool status UI বাস্তবায়ন করা।
- [x] Schema migration, authorization tests, TypeScript, full test suite, production build ও responsive UI যাচাই করা।

## Premium AI credit-system phase

- [x] 5,000 monthly allowance, remaining balance, last reset date ও AI credit ledger-এর database schema যোগ করা।
- [x] Server-only monthly credit configuration এবং প্রতিটি AI tool-এর centralized cost map যোগ করা।
- [x] Atomic credit reservation, provider-failure refund, transaction status tracking ও race-condition protection বাস্তবায়ন করা।
- [x] Active subscription period অনুযায়ী reliable monthly reset এবং per-user request rate limit বাস্তবায়ন করা।
- [x] সব AI endpoint-এ credit guard প্রয়োগ এবং Premium credit status/insufficient-credit UI যোগ করা।
- [x] Migration, concurrency/refund/reset tests, TypeScript, full test suite, production build ও responsive UI যাচাই করা।
- [x] Registry-defined AI tool routesে credit-aware workspace rendering যাচাই ও কোনো route mismatch সংশোধন করা।

## Credit service recovery phase

- [x] `server/credits/service.ts`-এর উপস্থিতি, imports, API contract ও test expectations যাচাই করা।
- [x] Atomic reserve, success, refund, status ও subscription-period resetসহ missing credit service পুনঃস্থাপন করা।
- [x] Router integration, TypeScript, full test suite, production build ও workspace rendering যাচাই করা।

## Premium billing architecture phase

- [x] বর্তমান Premium entitlement ও credit reset-এর সঙ্গে মিলিয়ে provider-neutral billing contracts এবং server service তৈরি করা।
- [x] Verified event ছাড়া Premium activate না করে checkout, verification, status, cancellation, portal ও webhook server routes তৈরি করা।
- [x] Verified subscription start, cancellation ও expiry lifecycle-এ plan, period ও 5,000 credits সঠিকভাবে update করা।
- [x] $10/month Premium pricing, credit benefit, upgrade action ও truthful loading/error/payment-state UI তৈরি করা।
- [x] Billing tests, TypeScript, full test suite, production build ও responsive UI যাচাই করা।
- [x] Homepage Premium CTA ও credit benefit copy-কে dedicated billing page-এর সঙ্গে সামঞ্জস্যপূর্ণ করা।
- [x] Billing service-এর price metadata-কে server-owned Premium catalog থেকে নেওয়া নিশ্চিত করা।
- [x] `/premium` page-এর desktop ও 375px mobile preview-এ Orbit Studio layout, $10 মূল্য, 5,000 credit benefit, disabled truthful checkout CTA এবং FREE billing state responsiveভাবে যাচাই করা।

## Production-readiness audit phase

- [x] TypeScript, full test suite, production build ও dev-server diagnostics পর্যালোচনা করা।
- [x] AI endpoint authorization, FREE-user bypass resistance, provider-secret isolation ও request validation পর্যালোচনা করা।
- [x] Credit reserve/refund, non-negative balance, monthly reset এবং concurrent duplicate-spend resistance পর্যালোচনা করা।
- [x] Billing verified-event boundary, fake-payment resistance, webhook verification ও subscription expiry lifecycle পর্যালোচনা করা।
- [x] Registered routes, browser-local tools এবং desktop/mobile UI regression পর্যালোচনা করা।
- [x] পাওয়া production-readiness issues সংশোধন করে পুনরায় পূর্ণ validation চালানো।
- [x] Registry-এর `/tools/word-counter` local-tool route 404 হওয়ার কারণ সংশোধন করে registry-to-router consistency পুনঃস্থাপন করা।
- [x] AI workspace-এর FREE-user upgrade CTA-কে পুরোনো `/#pricing` hash-এর বদলে dedicated `/premium` route-এ পাঠানো।
- [x] Client checkout verification-এ provider-returned application user identity বর্তমান authenticated user-এর সঙ্গে মিলিয়ে cross-account entitlement activation প্রতিরোধ করা।
- [x] Production build-এর oversized initial JavaScript chunk warning কমাতে non-home route page-গুলো lazy load করা।

### Audit verification notes

- [x] Desktop preview-এ AI Translator, JSON Formatter ও Premium pricing UI সঠিক Orbit Studio surface-এ render হয়েছে; compatibility alias যোগের আগে শুধু obsolete `/tools/word-counter` URL 404 দেখিয়েছিল।
- [x] 375px mobile preview-এ `/tools/word-counter` compatibility alias এবং canonical `/tools/text/word-counter` উভয়ই কার্যকর local tool দেখিয়েছে; FREE AI CTA ও Premium page-এর price, credit, warning copy overflow ছাড়াই দেখা গেছে।

## Billing provider abstraction verification phase

- [x] `server/billing/provider.ts` উপস্থিতি, imports ও existing contract/test compatibility যাচাই করা।
- [x] Provider-neutral error, registration, checkout, verification, cancellation, portal ও signed webhook verification boundary পর্যালোচনা করা।
- [x] Server-only billing configuration এবং missing-credential `BILLING_NOT_CONFIGURED` behavior যাচাই করা।
- [x] প্রয়োজনে implementation বা regression coverage সংশোধন করে TypeScript, test ও production build চালানো।
- [x] Current checkout, cancellation, portal ও webhook methods `BillingProvider` interface-এ এবং unconfigured provider rejection `requireBillingProvider`-এ বিদ্যমান; নতুন implementation প্রয়োজন হয়নি।

## Video & Audio Tools phase

- [x] বিদ্যমান registry, route, image-tool এবং local-processing component architecture পর্যালোচনা করা।
- [x] Video & Audio Tools category-তে MP4 converter, MOV/WebM to MP4, video/MP4 to MP3, video/MP4 to GIF, video compressor, trimmer ও cropper registry entries এবং routes যোগ করা।
- [x] MP3/WAV converter, MP3 to WAV, MP3 to OGG, audio compressor ও cutter registry entries এবং routes যোগ করা।
- [x] Browser-localভাবে বাস্তবসম্মত metadata inspection, video frame/GIF extraction, video trim/crop preview এবং AudioContext-based WAV export/cutter বাস্তবায়ন করা।
- [x] MP4/WebM/MOV transcoding, MP3/OGG encoding, video compression ও file-format conversions-এর জন্য fake result ছাড়া secure FFmpeg server-processing readiness boundary তৈরি করা।
- [x] Drag/drop upload, file validation, progress, error, preview এবং download UX-কে Orbit Studio responsive design-এ বাস্তবায়ন করা।
- [x] Existing tools regression coverageসহ TypeScript, tests, production build এবং desktop/mobile rendering যাচাই করা।
- [x] `/tools/video-to-gif`, `/tools/mp3-to-wav` ও `/tools/mp4-converter`-এর rendered 404 report নির্ণয় করা: registry-এর canonical grouped paths (`/tools/video/*`, `/tools/audio/*`) সঠিকভাবে render করে; flat URLs registered ছিল না।
- [x] Canonical Video to GIF, MP3 to WAV ও MP4 Converter desktop previews-এ যথাক্রমে real local-processing workspace, real PCM WAV export workspace এবং truthful FFmpeg-required no-fabrication state যাচাই করা।
- [x] Flat compatibility URLs `/tools/video-to-gif`, `/tools/mp3-to-wav` ও `/tools/mp4-converter`-এ একই media tools খুলতে alias routes যোগ করা এবং 375px mobile preview-এ no-overflow upload, output ও FFmpeg-required state যাচাই করা।

## Video & Audio Tools expansion phase

- [x] বর্তমান 16টি media tool, server capability boundary, storage pattern ও FFmpeg deployment constraints পর্যালোচনা করা।
- [x] Video Rotator, Video Resizer, Audio Trimmer ও Audio Converter-কে central registry, route guards এবং compatibility aliases-এ যোগ করা।
- [x] Video Rotator/Resizer এবং Audio Trimmer-এর সত্যিকার browser-local processing, preview, error ও download flow বাস্তবায়ন করা।
- [x] Audio Converter এবং existing FFmpeg-required transcode tools-এর জন্য file validation, safe server processing architecture ও no-fabrication lifecycle প্রস্তুত করা।
- [x] Upload security, temporary-file cleanup policy, arbitrary-command prevention ও generated-file delivery boundary নথিভুক্ত ও পরীক্ষা করা।
- [x] All requested media routes, responsive UI, TypeScript, tests ও production build যাচাই করা।

- [x] FFmpeg runtime container-এ application process non-root `node` user-এ চালানো।

- [x] 375px viewport-এ Video Rotator ও Audio Trimmer-এর local upload/download workspaces এবং MP4 Converter-এর no-fabrication FFmpeg-unavailable state overflow ছাড়া যাচাই করা।
- [x] FFmpeg-required MediaToolPage-এর generic “locally” descriptor-কে truthful server-side processing copy-এ সংশোধন করা।
- [x] Unimplemented remote FFmpeg worker configurationকে processing-available না দেখিয়ে server action-এর সঙ্গে capability state সঙ্গতিপূর্ণ করা।

## Tool discovery and Google sign-in phase

- [x] বর্তমান Tool Index, registry metadata, route structure এবং Manus OAuth integration পর্যালোচনা করা।
- [x] AI, Image, Video, Audio, PDF, Document, Archive, Text, Developer, Calculator & Converter এবং Creator categories ও useful subcategory metadata তৈরি করা।
- [x] Prominent global search, keyword search, category filters, Popular, Recently Used ও Featured AI sectionsসহ redesigned Tool Index তৈরি করা।
- [x] Search/filter-capable View All Tools page, category-distinct cards ও registry-driven direct navigation যোগ করা।
- [x] Secure server-side Google OAuth configuration, state/PKCE protection, callback/account-linking boundary ও user plan/credit continuity architecture যোগ করা।
- [x] Continue with Google UI এবং existing email/password fallback availabilityকে truthful state-এ উপস্থাপন করা; fake Google login না করা।
- [x] Existing local tools, server-side Premium protection, credits ও billing অপরিবর্তিত রেখে tests, TypeScript, build এবং responsive UI যাচাই করা।
- [ ] Published callback URL ব্যবহার করে Google OAuth configuration activation, account continuity ও sign-in callback verification সম্পন্ন করা।
- [x] Stored server-only Google credentials এবং `https://nexapremium-mpo86vkq.manus.space/api/auth/google/callback` callback value দিয়ে production authorization route enabled ও frontend-safe থাকার বিষয়টি যাচাই করা।

## Deployment repair

- [x] Docker build context-এ pnpm patched dependency file (`patches/wouter@3.7.1.patch`) উপলব্ধ করে deployment install failure সমাধান ও container build যাচাই করা।
- [x] Existing functionality অপরিবর্তিত রেখে check, test, build validate করে publish-ready checkpoint তৈরি করা।

## Public legal pages

- [x] Existing public navigation, footer pattern এবং public route conventions পর্যালোচনা করা।
- [x] NEXA Privacy Policy page-এ account, Google sign-in, cookies/local storage, AI tools, usage history, third-party services এবং user data practices-এর clear, non-fabricated language যোগ করা।
- [x] NEXA Terms of Service page-এ FREE/PREMIUM, $10/month, 5,000 monthly credits, subscriptions, AI tools, acceptable use এবং user responsibilities-এর clear, non-fabricated language যোগ করা।
- [x] `/privacy` ও `/terms` public routes এবং existing footer/navigation links যোগ করা।
- [x] Responsive rendering, route regression tests, TypeScript, test suite, production build এবং public URL availability যাচাই করা।

## Production Google OAuth state repair

- [x] Production `/api/auth/google/start` থেকে same-host OAuth state cookie issuance, secure attributes এবং exact redirect URI inspect করা।
- [x] Callback requestে state cookie preservation নিশ্চিত করে missing/mismatched state handling fix করা, OAuth security checks বজায় রেখে।
- [x] Google callbackে persistent NEXA session cookie issuance ও safe local redirect regression coverage যোগ করা।
- [ ] TypeScript, full tests, production build এবং published production authorization flow যাচাই করা।

## Authenticated Tool Index rendering fix

- [x] Google OAuth callback-এর পরে authenticated `/tools` route blank/`@@` render হওয়ার root cause নির্ণয় করা।
- [x] Authenticated session, account plan, subscription, credit ও Tool Index data dependency crash ছাড়া load নিশ্চিত করা।
- [ ] Minimal root-cause fix এবং regression test যোগ করে TypeScript, test, build ও production flow যাচাই করা।

## Production bundle graph repair

- [x] Production-only `ui-vendor` React export mismatch দূর করতে unsafe manual chunking configuration সংশোধন করা।
- [x] Rebuilt production runtime-এ `/tools` route-এর React bootstrap regression যাচাই করা।
- [ ] Published public `/tools` route-এ new automatic chunking artifact render যাচাই করা।

## Final production completion — Google Auth and Paddle billing

- [ ] Public production artifact ও authenticated Google callback → `/tools` end-to-end route যাচাই ও স্থিতিশীল করা।
- [ ] Existing provider-neutral billing contracts, lifecycle service, webhook boundary ও frontend billing UI-র সাথে Paddle adapter design align করা।
- [x] Server-only Paddle checkout, verification, portal, cancellation এবং signed webhook adapter implement করা।
- [x] Verified Paddle subscription events থেকে existing Premium entitlement ও 5,000-credit lifecycle নিরাপদে apply করা।
- [ ] Required Paddle environment variables ও Dashboard-provided price/webhook values নিরাপদভাবে configure করা।
- [ ] FREE/PREMIUM, cross-account event rejection, idempotency, renewal, payment failure, cancellation ও expiry test coverage যোগ করা।
- [ ] TypeScript, full test suite, production build, real configured sandbox/production payment lifecycle ও published production flow যাচাই করা।

## Paddle monthly and annual price selection

- [x] Provider-neutral checkout requestে trusted monthly/annual plan selection যোগ করা; client-provided Paddle price ID গ্রহণ না করা।
- [x] Paddle adapterে monthly planকে `PADDLE_MONTHLY_PRICE_ID` এবং annual planকে `PADDLE_ANNUAL_PRICE_ID` দিয়ে server-side map করার contract প্রস্তুত করা।
- [x] Pricing UI, tRPC validation ও regression testsে monthly/annual selection সঠিকভাবে reflect করা।

## Real Paddle sandbox payment lifecycle

- [x] Existing HTTP webhook route inspect করে exact Paddle Dashboard destination URL নিশ্চিত করা।
- [x] Existing provider-neutral contractে Paddle sandbox API checkout, session verification, cancellation ও customer portal support implement করা।
- [x] Raw request body থেকে Paddle HMAC signature verify করে verified event-only entitlement update নিশ্চিত করা।
- [x] Verified monthly ও annual Paddle transaction/subscription eventsকে exact user, Premium entitlement এবং 5,000-credit lifecycle-এ map করা।
- [ ] Renewal, cancellation, payment failure, expiry এবং duplicate/cross-account events-এর regression coverage যোগ করা।
- [ ] Exact Paddle Dashboard webhook configuration ও server-only secret/price requirements সম্পন্ন করা।
- [ ] Google-authenticated accountে sandbox checkout ও post-callback `/tools` production render end-to-end যাচাই করা।

## Urgent production access and checkout repair

- [x] Production Google sign-in start/callback/session এবং authenticated `/tools` route পুনরুৎপাদন করে error root cause নির্ণয় করা।
- [ ] Existing server-side Paddle checkout route-এ exact configured-provider failure নির্ণয় ও minimal fix করা।
- [ ] কোনো design, pricing, entitlement rule বা unrelated feature না বদলে focused production path validation সম্পন্ন করা।
- [x] Unauthenticated Upgrade actionকে toast-only state থেকে existing secure Google sign-in handoffে পাঠানো।

## Independent production access diagnosis

- [ ] Production Google sign-in button, OAuth start redirect, callback state এবং `/tools` destination independently reproduce করা।
- [ ] Production Premium checkout UI ও authenticated checkout requestে configured Paddle provider error independently reproduce করা।
- [ ] Browser, network ও server logs থেকে exact failure causes নথিভুক্ত করে minimal fix বা required external configuration নির্ধারণ করা।

## Three-tier localized Paddle checkout

- [ ] Existing single-Premium entitlement assumptions এবং current Paddle price IDs audit করে Starter, Pro ও Advanced tier migration constraints নথিভুক্ত করা।
- [ ] Editable `Tier` catalogে Starter, Pro ও Advanced-এর monthly/annual server-owned Price ID contract তৈরি করা।
- [ ] Server-side country detectionসহ Paddle `PricePreview`-এর জন্য safe client configuration ও no-country fallback তৈরি করা।
- [ ] Monthly/yearly toggle ও Paddle-returned `formattedTotals` ব্যবহার করে localized three-tier pricing UI তৈরি করা।
- [ ] `@paddle/paddle-js` দিয়ে sandbox one-page overlay checkout, signed-in email prefill ও `/welcome` success redirect implement করা।
- [ ] Public-safe Paddle client token এবং server-only API key/environment separation `.env.example`-এ নথিভুক্ত করা।
- [ ] Sandbox checkout launch, completion, redirect, verified entitlement ও regressions পরীক্ষা করা।

## Single Premium monthly/annual verification

- [x] User-confirmed scope অনুযায়ী তিন-tier pricing request স্থগিত রেখে existing single Premium monthly/annual price mapping অপরিবর্তিত আছে নিশ্চিত করা।
- [ ] Production Google sign-in, authenticated `/tools` rendering এবং existing Premium checkout handoff independently verify করা।
- [x] Premium checkout sign-in handoff-এর `returnTo` query Google OAuth start route-এ preserve করে authentication শেষে `/premium`-এ নিরাপদে ফিরিয়ে আনা।
- [x] কেবল confirmed defect থাকলে minimal fix, regression coverage, TypeScript, tests ও production build চালিয়ে published checkpoint তৈরি করা।

## Uploaded fixed project reconciliation and production verification
- [x] Uploaded `nexa-premium-site-v2-fixed.zip` ও `pasted_content_2.txt` active project-এর সঙ্গে তুলনা করে source of truth নির্ধারণ করা।
- [x] Google OAuth ও single Premium monthly/annual Paddle configuration server-only boundaryসহ audit করা।
- [x] Production `/sign-in`, `/tools`, `/premium`, Google start route ও OAuth callback behavior verify করা; confirmed defect ছাড়া কোনো unrelated change না করা।
- [x] Confirmed production fix থাকলে check/test/build চালিয়ে published checkpoint তৈরি করা এবং remaining external Paddle action স্পষ্টভাবে রিপোর্ট করা।

## Production end-to-end verification

- [x] Production Google sign-in সম্পন্ন করে authenticated session, persistent account এবং `/tools` rendering যাচাই করা।
- [ ] Authenticated user হিসেবে monthly ও annual Paddle Sandbox checkout launch, completion এবং `/welcome` status যাচাই করা।
- [ ] Signed Paddle webhook, Premium entitlement, 5,000 credit issuance এবং cancellation/payment-failure lifecycle যাচাই করা।
- [x] শুধুমাত্র confirmed defect থাকলে minimal fix, regression tests, check/test/build ও published checkpoint তৈরি করা।
- [ ] Reported production Google sign-in button failure reproduce করে root cause নির্ণয় ও minimal fix প্রয়োগ করা।
- [ ] Connected Paddle Sandbox Dashboard থেকে public client token ও Default payment link configuration যাচাই করা।
- [x] Server-created Paddle transaction-এর জন্য client-side checkout launcher implement করা; production payment surface launch এখনো release-এর পরে verify করা বাকি।
- [ ] Paddle.js overlay-এর production launch, Sandbox payment completion, `/welcome` redirect এবং signed webhook entitlement event যাচাই করা।

## Paddle checkout return URL repair

- [x] Paddle-এর configured NEXA application origin ছাড়া অন্য origin থেকে তৈরি হওয়া checkout return URL error reproduce ও root cause নির্ণয় করা।
- [x] Server-owned `PADDLE_APP_URL` origin দিয়ে checkout success/cancel URL normalize করে Paddle validation-compliant করা।
- [x] Regression test, check/test/build দিয়ে return URL repair যাচাই করে production checkpoint release করা।

## Production Google sign-in error repair

- [ ] Reported production Google sign-in error reproduce করে browser, callback, session ও server logs থেকে exact root cause নির্ণয় করা।
- [ ] Existing OAuth state, PKCE, callback URI ও server-only secret boundary বজায় রেখে minimal sign-in fix করা।
- [ ] Google OAuth regression tests, check/test/build, production release ও `/tools` post-login rendering পুনরায় যাচাই করা।

## Authenticated account and billing workspace

- [x] Existing authenticated header, account query, subscription status ও billing route capabilities audit করা।
- [x] Signed-in user-এর avatar/name/profile dropdown, account navigation ও secure sign-out action যোগ করা।
- [x] Existing server-verified plan, credits, subscription/billing status এবং upgrade/manage actionsসহ `/account` workspace যোগ করা।
- [x] Responsive UI tests, authenticated route checks ও check/test/build সম্পন্ন করা; production checkpoint release করা বাকি।

## Adobe Stock preparation tool integration

- [x] Attached `adobe-stock-prep.html` থেকে tool behavior, inputs, outputs ও local-processing requirements audit করা।
- [x] Existing tool registry-এর উপযুক্ত categoryতে Adobe Stock preparation tool, direct route ও Orbit Studio-compatible workspace যোগ করা।
- [x] Attached tool-এর real local behavior preserve করে validation, download/error state, tests ও responsive rendering যাচাই করা।
- [x] Existing NEXA functionality অপরিবর্তিত রেখে check/test/build সম্পন্ন করা; production checkpoint release করা বাকি।

## Adobe Stock preparation enhancements

- [x] Existing Adobe Stock Prep metadata model, local export flow, AI Premium authorization ও current validation rules audit করা।
- [x] Batch image metadata editor যোগ করে per-item title, description, keywords ও category editing CSV export-এ persist করা।
- [x] Browser-local Adobe submission guideline checker যোগ করে only deterministic technical/content readiness guidance দেখানো।
- [x] Existing server-protected AI provider দিয়ে Premium-only title ও keyword assist যোগ করে FREE state এবং failure state truthful রাখা।
- [x] Focused tests, responsive validation, check/test/build ও production checkpoint release সম্পন্ন করা।

## Adobe Stock metadata workflow enhancements

- [x] Existing metadata editor state, browser-local persistence এবং CSV export data flow audit করা।
- [x] Browser-local metadata template save, select, apply ও delete workflow যোগ করা।
- [x] Case-insensitive duplicate-keyword detector যোগ করে per-item metadata review-এ clear feedback দেখানো।
- [x] Batch category presets যোগ করে selected files বা full batch-এ category apply করা।
- [x] Focused tests, responsive validation, check/test/build ও production checkpoint release সম্পন্ন করা।

## Adobe Stock workflow refinements

- [x] Existing template persistence, AI metadata assist state এবং browser-local image processing helpers audit করা।
- [x] Saved metadata templates-এর browser-local rename workflow যোগ করা।
- [x] Per-image browser-local keyword suggestion history দেখানো ও current metadata apply behavior রাখা।
- [x] Uploaded images-এর browser-local content fingerprint তৈরি করে exact duplicate image detector যোগ করা।
- [x] Focused tests, responsive validation, check/test/build ও production release সম্পন্ন করা।

## FINEMIND AI brand replacement

- [x] Existing NEXA name, logo component এবং global brand metadata usage শনাক্ত করা।
- [x] User-provided FINEMIND AI logo asset নিরাপদ web asset হিসেবে যোগ করা।
- [x] Existing logo slots ও visible NEXA brand labels-এ FINEMIND AI প্রয়োগ করা; অন্য UI বা functionality অপরিবর্তিত রাখা।
- [x] Focused regression test, responsive verification, check/test/build ও production release সম্পন্ন করা।

## FINEMIND AI circular logo refinement

- [x] Current shared FINEMIND AI logo asset, header/footer placement এবং existing size behavior পর্যালোচনা করা।
- [x] User-provided FINEMIND AI reference থেকে compact circular logo badge তৈরি করা।
- [x] Header ও footer/shared logo slots-এ circular badge প্রয়োগ করা; অন্য UI বা functionality অপরিবর্তিত রাখা।
- [x] Responsive visual verification, check/test/build ও production release সম্পন্ন করা।

## FINEMIND AI header branding polish

- [x] Shared header logo markup, existing spacing এবং favicon configuration পর্যালোচনা করা।
- [x] Header logo-তে subtle scale/glow hover effect এবং FINEMIND AI text spacing refinement প্রয়োগ করা।
- [x] Browser tab favicon-এ current circular FINEMIND AI logo প্রয়োগ করা।
- [x] Responsive visual validation, browser metadata check, test/build ও production release সম্পন্ন করা।
