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
