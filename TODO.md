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
