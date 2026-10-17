# Vercel Deployment Implementation Plan

> Use subagent-driven-development for the database/API migration and independent review. Retain the approved public UI and feature contracts.

**Goal:** Register the complete team site in nomuryo7159/HCF_teamsite and deploy Vercel project hcf_teamsite with Supabase storage and email sign-in.

**Architecture:** Standard Next.js App Router on Vercel; Supabase SSR cookie authentication; PostgreSQL records/editors protected by RLS and authenticated RPC functions. No service-role key is needed. Initial owner is seeded privately into the dedicated database rather than embedded in public code.

- [ ] Preserve the existing theme/guide changes in a checkpoint commit and use feat/vercel-deployment.
- [ ] Replace Vinext build scripts and platform code with standard Next.js. Keep the local development port 5173.
- [ ] Add Supabase SSR server client, email sign-in page, verified callback and POST sign-out. Never trust incoming identity headers.
- [ ] Migrate storage and API code to user-scoped Supabase clients. PostgreSQL functions authorize edits and atomically protect revisions, task/phase references and complete phase ordering.
- [ ] Enable RLS, restrict SQL function execution, separate owner/editor management, seed only fixed public default records. Seed owner email separately through the database tool.
- [ ] Update README and implementation guide for Next.js, Supabase and Vercel. Preserve existing UI feature behavior.
- [ ] Run unit tests, actual database transaction checks, TypeScript and production build. Review authorization and secret handling independently.
- [ ] Push a feature branch to the empty requested GitHub repository, establish the reviewed initial main branch without directly pushing changes to main, and configure Vercel Git integration.
- [ ] Configure only necessary environment values in Vercel, deploy the reviewed commit and verify public read, guide, sign-in entry and anonymous write rejection. Do not send real login emails during agent tests.
