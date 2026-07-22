---
tags:
  - knowledge
  - migration
  - survey
description: File-level coverage manifest for the complete project-owned MangaDock Markdown scan.
source: D:/Github/MangaDock snapshot surveyed on 2026-07-22
---

# MangaDock Markdown Survey Manifest

Scope: project-owned Markdown in the repository root, Obsidian knowledge, docs, component documentation, academic/system documents, runbooks, scripts, and design critiques. Excluded: dependencies, generated caches, upstream/vendor forks, and generic third-party skill libraries.

Status markers: `[ ]` pending semantic review · `[x]` reviewed and classified. SHA-256 allows future passes to read only changed files.

- Included files: 160
- Final status: semantic review and disposition complete on 2026-07-22

## Disposition by Category

| Category | Disposition | Portable result |
|---|---|---|
| Academic and System Docs | Reference | Traceability, UAT, deployment evidence, and historical labeling |
| ADRs | Adapt | Architecture, state, lifecycle, rollout, and contract principles |
| Agent Workflow | Adapt selectively | Vocabulary and bootstrap rules retained; client/model-specific delegation rejected |
| Component Docs | Adapt selectively | Operational contracts retained; MangaDock endpoints and limits rejected |
| Design Critiques | Adapt | Accessibility, progressive disclosure, recovery, and visible state |
| Knowledge Vault | Adapt/deduplicate | Durable feedback retained once; project-only notes rejected |
| Other Project Docs | Reference | Live work state and reconciliation patterns, not T4 decisions |
| Plans and Specs | Adapt selectively | Correctness and lifecycle invariants retained; product scope rejected |
| Reports | Adapt | Evidence, recovery, performance, release, and operational lessons |
| Research | Adapt selectively | Method and provenance retained; manga/model conclusions rejected |
| Root Docs | Adapt selectively | North Star and truth hierarchy retained; MangaDock commands rejected |
| Runbooks | Adapt pattern | Executable verification shape retained; machine-specific steps rejected |

## Academic and System Docs

- [x] `Documents/Backend/BACKEND_DOC_INDEX.md` — 25 lines — `d2b7d9e96753538c174daaaafd3f61796c9f5da9db1a49b156e444d7a64cb2e8`
- [x] `Documents/Backend/BACKEND_SERVICE_OVERVIEW_AND_INTEGRATION.md` — 89 lines — `e78308de0b89aa1f23544f1008cc85002f377163aa7ef1861fadb691a3175a36`
- [x] `Documents/DOCUMENT_INDEX.md` — 49 lines — `f0d9d23539bca1059bd290af7dd221add410d405e199bb97dec2175822ff6b5c`
- [x] `Documents/Frontend/FRONTEND_ARCHITECTURE_AND_RUNTIME.md` — 82 lines — `3d7ba68cd094112843711b89bb8555674c39aa52f97ae5c7c0460ccc41d7711b`
- [x] `Documents/Frontend/FRONTEND_DOC_INDEX.md` — 25 lines — `4a6e3cf83ee807d017a580997bebb86a925479548f6b5336d544cdb1d6bb1b60`
- [x] `Documents/MIT/MIT_DOC_INDEX.md` — 25 lines — `97551863ffcae5f100acfc4cb31c81a7535a143e6a7e61ed8c1ba25024f5fad1`
- [x] `Documents/MIT/MIT_SERVICE_OVERVIEW_AND_INTEGRATION.md` — 62 lines — `7bd3f0bbe0a5b34e807e80f05963749d5aed1710e7e5119bfc2f8d2fdda98e74`
- [x] `Documents/Mobile/MOBILE_ARCHITECTURE_AND_INTEGRATION.md` — 60 lines — `c94216d2c24c4d8ea69c34b0e3e38d4605f7c1f7192c04ac4bf04ff2f5423d49`
- [x] `Documents/Plan/Plan.md` — 274 lines — `5d042ac9f52ecccec338bae2495b183799213bdd85f72087acc056b5b8e0a108`
- [x] `Documents/Plan/PRD_COMMUNITY_FORUM.md` — 55 lines — `e3c98eab4ab24d4e31ac78ef2f800b2c1d44ae690662ceddadfc5f0d6f2e1f4a`
- [x] `Documents/Software Engineer/SE_PHASE1_PROJECT_PLAN_AND_GANTT.md` — 107 lines — `abdd736645bda09a595e3f2df357e38ec4047718411dda09eba90c0d48b2f11d`
- [x] `Documents/Software Engineer/SE_PHASE2_SRS_AND_SYSTEM_ANALYSIS.md` — 91 lines — `3cdfd52c091ea4f43a1cd9a54a21a5f322346a6950134775411d3bd79ca9e2ab`
- [x] `Documents/Software Engineer/SE_PHASE3_DIALOGUES_AND_PROTOTYPE.md` — 75 lines — `285105dcaba911f908131948fbd53e22d81cc977fe6ed800970a808acea98807`
- [x] `Documents/Software Engineer/SE_PHASE4_INTERNAL_DOCUMENTATION.md` — 94 lines — `c62546cb0f47514c28f878d0a233c51f1e541335c6d8ea3e5222578cc18eeb61`
- [x] `Documents/Software Engineer/SE_PHASE5_TEST_SPECIFICATION_AND_UAT.md` — 66 lines — `59dcf5098b68c71d301d3f58b52a7597ea6fce940bf633347d687e78fb05f750`
- [x] `Documents/Software Engineer/SE_PHASE6_DEPLOYMENT_AND_GO_LIVE.md` — 96 lines — `b4b26ae3a8387520bccbb3b8b0f0e8de218aec4c7650cc44147dcc1d6ee0d301`
- [x] `Documents/Software Engineer/SE_PHASE7_QUALITY_ASSESSMENT_AND_PROCESS_EVIDENCE.md` — 68 lines — `2c36ea65ef698aa083c937a1ec96d598c2a2ed61290377e2e73fc36f3dbb91d5`
- [x] `Documents/Software Engineer/SE_PHASE_INDEX.md` — 30 lines — `eb0da21869202b0841e162a7a5e02591054b00766629147ff6cb4cf542446733`
- [x] `Documents/Software Engineer/UML_REPORT.md` — 262 lines — `1ba6500225f5e214674a215264a072d573297bca6fd16646c7375e4f2a900af1`
- [x] `Documents/SYSTEM_ARCHITECTURE_OVERVIEW.md` — 87 lines — `3b90752aa241f70f221177f8a4b1d9987a77d5f4a1e7d1430e95a7f5f757e35d`

## ADRs

- [x] `docs/adr/001-cloudflare-r2-storage.md` — 75 lines — `9adcb3a2310124c2249a414a7001f752fa08c350f622bd97c442371d73a5f9f8`
- [x] `docs/adr/002-mit-inpaint-luminance-reground.md` — 85 lines — `a45609fc18731d604c575a3dae8b2d59c69220ce18cddcc75d9cf71d477624f8`
- [x] `docs/adr/003-mit-flux-klein-optional-inpainter.md` — 92 lines — `92521e80b6d371ad76e50139bec61e0e1a1b3f3c7db6831f64440d96f0f5642b`
- [x] `docs/adr/004-mit-patch-based-rendering-pipeline.md` — 154 lines — `9cef771b62b715239815b77678a96e12c59113108f0cb927b843adc72d6c5730`
- [x] `docs/adr/005-mit-classical-cpu-inpaint-refinement-levers.md` — 169 lines — `c05a6ea4c2a031380ea19e1b143a112c1cc8814eead3d5e539887f062def8e48`
- [x] `docs/adr/006-mit-bubble-aware-detection-grouping.md` — 119 lines — `b15e10a219b05936ff6fe8c4f6323d2b90719ec1d441e29d872f0342026be6bd`
- [x] `docs/adr/007-mit-render-parity-clean-layout-narrow-column-supersampling.md` — 140 lines — `453f364834201ea321c425cc59be69c542ed82636864111a6261ea54eb42a897`
- [x] `docs/adr/008-mit-god-object-characterization-byte-identical-seams.md` — 133 lines — `100a6991aac6a9284ade7d9e8584055762b144335d65a9fd6810d476575d2b80`
- [x] `docs/adr/009-mit-model-lifecycle-dispatch-registry-worker-guards.md` — 135 lines — `f7596491cadb54a725cd3f4e3d2851b2847474f6d4afbaac7898bc6cd3b3c059`
- [x] `docs/adr/010-cross-page-translation-context-bleed-boundary.md` — 202 lines — `d471bda24756834c49ecd5cd4e6cdda1f8d4df42a7687f5c956108063decabe8`
- [x] `docs/adr/011-three-tier-translation-patch-cache.md` — 126 lines — `fdf47be2b3180a9219860ed7ad2732fc51b97daafea11cec617febc9bd080dff`
- [x] `docs/adr/012-mit-integration-security-boundary.md` — 150 lines — `a90ed92ab4aa58ff9cb0cb170e91e3461679a0d8c8262e5c62573898dcc771be`
- [x] `docs/adr/013-service-role-supabase-authz-in-code.md` — 45 lines — `63da6f07f7255341123d76db26dcd8eccc57f99d21c9ba2b789d6f174d525f4b`
- [x] `docs/adr/014-frontend-single-entry-proxy.md` — 47 lines — `f6e5ef93d32b56aca730d91e8cb849892086f6b0eca56d4772aa08f3732e1d7b`
- [x] `docs/adr/015-frontend-auth-context-supabase-adapter.md` — 60 lines — `ce87c732c8cccffc8fe219aec12577784fa3fa85015a5cf80beaa9b346324507`
- [x] `docs/adr/016-upload-magic-byte-mime-validation.md` — 70 lines — `cbfc59927318a31ef0c7cd8f9531fb6bf840b7cabdf8ce4b357471ba43c62775`
- [x] `docs/adr/017-mit-batch-transport-jobstate-seam.md` — 87 lines — `fcde29299dc7781e888dbc60d6ff80a0c8f8b57e4911a282d0ad169251e6387f`
- [x] `docs/adr/020-drop-batch-redis-pubsub.md` — 66 lines — `db3104ca2fc1e90b4bf5f41720f024be8cece53bfb99f5d5feea116466e04e08`
- [x] `docs/adr/021-deployment-and-cost-architecture.md` — 64 lines — `30b833819399fc117906ff2e1ccb6e86bb4b98634e20263d020ab30b10cfa280`
- [x] `docs/adr/README.md` — 38 lines — `b1d6a165d7fe98e23d63c0be148dcef23b77be81c20d0efde290f894b18fbb53`

## Agent Workflow

- [x] `docs/agents/domain.md` — 91 lines — `8d2aeea187da5dd58414d2a72c45f2c23b789bbc7934dc6b1f9f64155b50c4e2`
- [x] `docs/agents/issue-tracker.md` — 69 lines — `03988290ca1f1d4460e5d93d7e3a5b743409ac26472b36d0c27bc7d2843b85e2`
- [x] `docs/agents/qwen-delegation.md` — 169 lines — `6ef15a496346d0d61ad96202f0a588130eab656cd0e11da23d0b18609f28890c`
- [x] `docs/agents/triage-labels.md` — 167 lines — `ae37886ad38a8109e440e802dee5eb20db789012a0b9d852804abb7f0a9f695f`
- [x] `docs/agents/workflow.md` — 219 lines — `63b22499c652d8a917f8a3931aaf8f5b8e69d0b708bb08d74549d1de860da23d`

## Component Docs

- [x] `Backend/README.md` — 62 lines — `69e2c1ab876ad67bd311979161ecca9c5495144a648b7102cd0c6f781943eba5`
- [x] `Cloudflare-Worker/R2_WORKER_WORKFLOW_SAMPLE.md` — 77 lines — `37bfda65070a809906d5b0ad33a655c435ec7bc2abfafb1b4fefdf237a971ed6`
- [x] `Cloudflare-Worker/README.md` — 89 lines — `f63e077ca0b5005f31f326ec0da34755069ac781d1b2c37c256f46055b6ff6fb`
- [x] `Frontend/.impeccable/critique/2026-06-06T05-40-57Z__frontend-app-docs.md` — 130 lines — `5f03de53657ef308564d526f89dba9c0fa59d8c6fcac5670fd916203b27e7f8f`
- [x] `Frontend/README.md` — 59 lines — `3cbcaa904cf5209ecb802624ea517dc76ca9007a4f335188cfd4cd2645e3cb44`
- [x] `MIT/ARCHITECTURE.md` — 348 lines — `082980388752d588b2fbf80ed44c85db075214831d0a36b78a6a843f1902c35a`
- [x] `MIT/BENCHMARK.md` — 60 lines — `ca1da868aec0ab0f494236606907838a1c9421484ca35727eeedf6a411130103`
- [x] `MIT/CONTRACT.md` — 165 lines — `63cd5a04e3a0f4e320b92c9002e927b50a03c47c48987c0cbcb001c44ef848c7`
- [x] `MIT/front/README.md` — 125 lines — `69c9b27f1f0e46e2bb08420490225c79669fa416c194669230f741f3f8aad0c1`
- [x] `MIT/OPTIMIZATION.md` — 269 lines — `5b4db3e997cd418d106e0d28942791dfde8a4b4a887eeee7b57165916dc2e878`
- [x] `MIT/OPTIMIZATION-PLAN.md` — 292 lines — `21752136d300a198e11f5e2e0d3d194bf1b2eaa14d01ecf652df20a54c9b6166`
- [x] `MIT/PIPELINE.md` — 305 lines — `29adae8d45c2a57be31cf579999dca20155bb60f82e7826a3f9455fa9d9e30d5`
- [x] `MIT/README.md` — 314 lines — `f2e0e49029870fd4a9d7a009ca06aec2988381afef0b340a40d2b11af0aeabce`
- [x] `MIT/SETUP.md` — 120 lines — `a0a1f26f5d38e7a630764eaf8c398c189cb3af91886d6966f369f649d4b2c15e`
- [x] `MIT/test/README.md` — 21 lines — `efbac26b8e75a9033d5cb3b2c159d3c0d8454a9c7901fa2288c0bf4c695566ed`
- [x] `scripts/README.md` — 47 lines — `99db975b42d3dbc67010d58bab32ef9b07a8138fdbd632bd2d83e58ad5e28c66`

## Design Critiques

- [x] `Dashboard/.impeccable/critique/2026-06-17T11-56-53Z__app-preview-page-tsx-nodepopup.md` — 56 lines — `f141031bea8b1fb6dde0f9bd6d30ce9fa6c5fc938ece731ee894edcb77daf7bb`

## Knowledge Vault

- [x] `Obsidian-MangaDock/concept-mit-render-pipeline.md` — 78 lines — `3068def3a39dde63d5a7ca35a0854e2577144fd987cf9fd5f97ec8bcbc81078b`
- [x] `Obsidian-MangaDock/feedback-benchmark-confirms-md-defect-fixed.md` — 17 lines — `79ffd34b346d1bf400974905aaec9c531aaa20d6f60bba7c0568012a177f0d25`
- [x] `Obsidian-MangaDock/feedback-benchmark-patch-not-image-endpoint.md` — 18 lines — `8137fb7f3377c14462cf1d06126b8f5c7f67a6422ee1b12ea19547cf361aff88`
- [x] `Obsidian-MangaDock/feedback-clear-cache-before-test.md` — 18 lines — `f989a790ff4053927d3c1c185ddafa11a33204a8f4be17e692141619cfc77c8e`
- [x] `Obsidian-MangaDock/feedback-core-boundary.md` — 17 lines — `1af1b025a3a355c19d5f7c79ed935809c9d8fb6338e8e2141a2f9f09381ae27e`
- [x] `Obsidian-MangaDock/feedback-decomposition-method.md` — 20 lines — `ec25f8a86505ee656640fba91ddc8795cf78d53d31a40228bf79f2db4153a48d`
- [x] `Obsidian-MangaDock/feedback-impact-report.md` — 53 lines — `f2de7334ffbc65b838a6609cb3a3d9f695da67763d7770d69b9119ed4a7b334a`
- [x] `Obsidian-MangaDock/feedback-issue-ownership-scope.md` — 16 lines — `9c16fc93895d4625b0b0931c409881ba5966308deaf55d5f61ac7457d9a571e0`
- [x] `Obsidian-MangaDock/feedback-log-every-experiment-to-md.md` — 17 lines — `c0de74560e22dd98c2f169453502357d143891be466119300a72e5f053b3752b`
- [x] `Obsidian-MangaDock/feedback-md-history-log.md` — 13 lines — `9e37d43d8424b40820bdc3c0a3301d53c4c7d3bfe6a7b1e002322070a90ae85a`
- [x] `Obsidian-MangaDock/feedback-md-update-every-change.md` — 13 lines — `9f4d257061765408f8ba0b99f7bbb6239099dc78fbb8a68a051cdd6f5f3eeb8a`
- [x] `Obsidian-MangaDock/feedback-notify-on-done-or-question.md` — 19 lines — `8f666640b13a05828f4e5607d4a6c363f8dd629a51dc70ee10b8db5de3144c47`
- [x] `Obsidian-MangaDock/feedback-review-merge-policy.md` — 21 lines — `dbe9e2c8ec55c2238104518161410714f63cf131932953c63df27650e642e14a`
- [x] `Obsidian-MangaDock/feedback-techdebt-all-scenarios.md` — 19 lines — `0242e318e9505f99d349d596d42992430c7036f6ba39a1e46f54192d282435da`
- [x] `Obsidian-MangaDock/feedback-test-every-round.md` — 19 lines — `f8b80ba7d1cb4fdac94df817e9d16c324489ef6d0edf43649d41308d791b5540`
- [x] `Obsidian-MangaDock/feedback-update-readme-on-command-change.md` — 13 lines — `5fc8384b67d684a1d3b3fa31873bc7a672a947c6582572b277bef457eabcb9d8`
- [x] `Obsidian-MangaDock/feedback-verify-before-claiming.md` — 18 lines — `ddfb850de862f0e2f7a8c80a249b3bc197cee3b0b1273f1a26381ba8fe1efb12`
- [x] `Obsidian-MangaDock/Home.md` — 72 lines — `321d6fc8dddf1f652d84042114aa39bf66cb280d1dbbb1d4cb921377d852ac99`
- [x] `Obsidian-MangaDock/project-animetext-approved.md` — 15 lines — `b1b948561034388e2dd773e760d756f1acecd40b8a6a562fa40c75a59a0c96c3`
- [x] `Obsidian-MangaDock/project-backend-pre-existing-test-failures.md` — 31 lines — `a93a7eb56493bf15d8b66ccd302f2f3dcf11d77e4bcf548550ecf0c32fdf63bd`
- [x] `Obsidian-MangaDock/project-cache-phase2.md` — 26 lines — `6fc67c3368e472fd8e4c1dab47835dc62902d363a718e7bb5f4a6310517bf7c4`
- [x] `Obsidian-MangaDock/project-cache-quality-gaps.md` — 36 lines — `cab86f1ff8876f093da9adc79e3f02e771d2a74bcc68d1fab66c5d6dbbb8a21d`
- [x] `Obsidian-MangaDock/project-cache-reset-ordering.md` — 19 lines — `490ab03f6c303fc9f1bc08ccf5b41e923de7c3b4a685f4067654e370dbe663ab`
- [x] `Obsidian-MangaDock/project-community-forum.md` — 40 lines — `628776231de9272eb280b75f9d1ce5acbcf62b3f787d9a060255fc722a495a47`
- [x] `Obsidian-MangaDock/project-dev-commit-memory.md` — 15 lines — `72baa9f5a397c2f1f7b956f2136777a959738bbf3fec386a512dce2c16f85e10`
- [x] `Obsidian-MangaDock/project-mit-175-dialogue-path.md` — 26 lines — `76324a956ad0d20b56fd96b529e628bead5b9bc0cd10c6e73558712148a38961`
- [x] `Obsidian-MangaDock/project-mit-launch-env.md` — 23 lines — `a42c60a15fa356b9a393a8bce2d02dc5cd4afef8f3d050ed679442b79bf0c8a8`
- [x] `Obsidian-MangaDock/project-mit-refactor-resume.md` — 18 lines — `75f049a25abde549e9b0ce95eaadc332656315dd348467813fa41110cf42d7ea`
- [x] `Obsidian-MangaDock/project-mit-translate-nondeterministic.md` — 17 lines — `069bcdd666906ad8665eb7d294544f12cc1de55c1cdf5833bbd97f08ce9763c9`
- [x] `Obsidian-MangaDock/project-render-knob-gating.md` — 21 lines — `6dfee826b304f1c8d6addb9c4c97900fdbe2e171b159093bc44e9300bd082327`
- [x] `Obsidian-MangaDock/project-render-parity-direction.md` — 18 lines — `520316f403d4bf3e2e45d30b3582923f8aa93390e73f6903829943dbefaae746`
- [x] `Obsidian-MangaDock/reference-external-docs-index.md` — 62 lines — `cde3890915056404029532ed3227d91ded170509a3a91beaaf30b8da9307ebb1`

## Other Project Docs

- [x] `docs/coin-topup-xendit.md` — 449 lines — `cc3aeda73048fda8f457d048d667431bbd6a56598c5c953ec4bd9afa0a483c67`
- [x] `docs/images/render-quality/README.md` — 27 lines — `33d4df152ce4549bb45f9a06bef5cf314d44446fd4c4acf827124f8461cb18d5`
- [x] `docs/OPEN-WORK-LEDGER.md` — 142 lines — `4a8bf87253129964738f4fda18f90544d2001dd9352d5a50ec9ae271c44913cc`
- [x] `docs/RECONCILIATION-PLAN.md` — 142 lines — `3c01368ef06b6f0ebfd0712636d22b391b0043eb770bc31db57a0d531fc66fbf`
- [x] `docs/review-feat-cloudflare-r2-storage.md` — 150 lines — `87dbac0009f128f102ea9043d4db1824d918b2980c4199769bcd252db8b3b4cb`

## Plans and Specs

- [x] `docs/prd/backend-audit-remediation.md` — 151 lines — `c3ca073b6c6123f204d73fbbc042ef288136674afffc7c25d8092bff4584bc21`
- [x] `docs/prd/interactive-flow-simulations.md` — 219 lines — `3d7dfb5c3c722afcf4ebf56dd33903de0ddb23fab51b92d59449d6f982ececcf`
- [x] `docs/prd/r2-global-asset-distribution.md` — 197 lines — `8b503af50af011455924eb27980345afcfdcf7c6b3094beb63b62b0da4404f1e`
- [x] `docs/superpowers/agentic-workflow-presentation.md` — 138 lines — `7301077ccda66f428402a7456648dafdeabbd4efbf8e2232c807b482e36edf44`
- [x] `docs/superpowers/plans/2026-06-19-frontend-phase1-shared-primitives.md` — 634 lines — `168b3ba4ed951e5ba94f8efa4462a15a73a5e025e6c1eeba2a18ef80ef2ba15e`
- [x] `docs/superpowers/plans/2026-06-19-wallet-sse-payment.md` — 731 lines — `864d9daa267b54dac97b99c52606a6e8cb223ea53ec636e4b3e1152beed149ea`
- [x] `docs/superpowers/plans/2026-06-20-reading-progress-api.md` — 326 lines — `fe6f6cfa4d1bd8e40651210a5033feac68bd79d4554910641de38f351419d99c`
- [x] `docs/superpowers/plans/2026-06-22-history-export.md` — 423 lines — `f9d1390eb665b829f06a74b0b5787df717894ec55b0797baf27daa28606e2032`
- [x] `docs/superpowers/plans/2026-06-28-payment-unlock-correctness.md` — 475 lines — `751cb5a3a6237fb38a3c074e779d71a563cffa7c2d59f6829eb5aafd0e059546`
- [x] `docs/superpowers/plans/2026-07-02-mermaid-rendering.md` — 237 lines — `8ceb4266c904c27194900fb607ed37063028e00ee724b4401bf02118f2a28a45`
- [x] `docs/superpowers/plans/README.md` — 14 lines — `9513bc1677716c1571a8cb1d1a64bd9a8fa08177a025ba646c52a2dedfff57ca`
- [x] `docs/superpowers/specs/2026-06-19-wallet-sse-payment-design.md` — 235 lines — `2ca5e21ff73b31ac142e15acdb436893284842a837db7e0849768f9fee56acf8`

## Reports

- [x] `docs/reports/2026-07-01-captcha-reprompt-hotfix.md` — 101 lines — `7dbdd7fc5e0a5ea5ee8353cbbdade55c50f6e4d39f207c77e04084340be6e576`
- [x] `docs/reports/2026-07-02-mit-speedup-e2e-measurements.md` — 82 lines — `54f443a7549285c22f01e367eb0eb39f8b6a6f6ea59a8e9025121009647039f9`
- [x] `docs/reports/2026-07-02-mit-speedup-study.md` — 102 lines — `018e73bfc1617c04c3e04ca8e83536b576b78969d51710e0dbf2d6657e43f0c3`
- [x] `docs/reports/2026-07-04-render-defect-root-cause.md` — 155 lines — `a82e62d760392dc3a7a056bc40d6ff1cd41cf610d4470bc2996640c365a3edd9`
- [x] `docs/reports/2026-07-08-md-docs-restructure-plan.md` — 199 lines — `50f3b701155399c81dd271e4d1ef586636cd102beac0a74484a2dcfcb406ce98`
- [x] `docs/reports/2026-07-17-project-maturity-and-improvement-roadmap.md` — 355 lines — `99e65954bd130a30806a1f793c71451bcc03ce15841acb95214a403198626145`
- [x] `docs/reports/benchmarks/2026-07-03-mit-layout-fit-and-merge-optimize.md` — 103 lines — `fa228f033c9ae97f26f4b825d777bbefac865357330642554fbb42904c1d07f4`
- [x] `docs/reports/bug-case-catalog.md` — 209 lines — `168e970480083bce17b0a2beba15a896a66be4bd9aaf464e63ff85f8e3f846b5`
- [x] `docs/reports/mit-benchmark-and-quality.md` — 86 lines — `02235f05a9efe1b606c2735f3a19ad5336010a189fccd0ae1598eeb58640bcbf`
- [x] `docs/reports/mit-presentation-defense.md` — 147 lines — `a6e493921099881ec2e109a444b66336a2cf0b8ee30ade432c6125c343361ac7`
- [x] `docs/reports/mit-refactor-progress.md` — 107 lines — `929f83e4d19c631a10e7a6ff4e883d43390da564ba91fc9f04a67b51977da6e4`
- [x] `docs/reports/positioning-differentiation-legal.md` — 173 lines — `60bfb7608d1e4ce7b0d5ec376ca285f923ce1d0eb3ba8102b28e7944057669ed`
- [x] `docs/reports/post-mortem-template.md` — 50 lines — `43a79db4b90b270b09a39abe6861620a8b295f3ceb97bf499b371768ec288a44`
- [x] `docs/reports/presentation-master-outline.md` — 220 lines — `d95c1ca6620dfc727dfb3ec32528d90004480b088bf2b8c2844398da4222b26f`
- [x] `docs/reports/README.md` — 21 lines — `2da04bd48760da80494fad2b89b43676a3298eb721086fd70042357305aa1481`
- [x] `docs/reports/survey-manifest/backend-remaining-modules.md` — 681 lines — `233043faf9bd093a9e629080d3d1b4eed2b5dd3f7218fa65e2051c656937c29d`
- [x] `docs/reports/survey-manifest/documents-full-content.md` — 132 lines — `80fa3f2b36a3249ac240c41f841dcbbd2e739392208cf4dc3683b05f317ae19c`
- [x] `docs/reports/survey-manifest/frontend-e2e-visual-survey.md` — 66 lines — `503f4fb6703e4eb9dd4931560257ee52a3f5371f62c593bbf6f63c536696c035`
- [x] `docs/reports/survey-manifest/frontend-remaining-areas.md` — 550 lines — `cbedea9d256fe730a72b5abf9cb130bcf4e0a75dd27ef2766ba1cd9d8a0b0c8d`
- [x] `docs/reports/survey-manifest/github-issues.md` — 199 lines — `4b1e01912e876beb88269242e67f785d19918305f88a54f8b349ab996f21296d`
- [x] `docs/reports/survey-manifest/github-prs.md` — 145 lines — `691b60f6c1f723edf902620470ab21d18e75cfdf480802c0aeae30b040b5330f`
- [x] `docs/reports/survey-manifest/mit-remaining-modules.md` — 252 lines — `2b80757eee64bbff62dfd2343950583b7f22af1d044fc8ac550f2a0474204452`
- [x] `docs/reports/survey-manifest/README.md` — 71 lines — `00451022c68caadd0f9d581a5451942354ffa1b3429eca6a525d155736b87b86`
- [x] `docs/reports/system-impact-report.md` — 897 lines — `c8e248a19621df7e02d275dafcd789e59782abf7b21d2a3bab175480c4ec810c`
- [x] `docs/reports/tech-debt-remediation-plan.md` — 91 lines — `b2a8ea1a4e8e7429ed9a7086b6d80920e076e057ed9ca77b526eb496108a5f45`

## Research

- [x] `docs/research/inpaint-cleanliness-vs-upstream.md` — 61 lines — `7dd5b6d48a3aea46cdf6eee42683cd0bc0ecd658971dcf6b97394ddb238b28d8`
- [x] `docs/research/mangatranslator-internals.md` — 139 lines — `bbab42bae1a24ddc6de33b8752f96ad2dfc3c6c09cf3bc606417d30e3cbf128a`
- [x] `docs/research/mangatranslator-round2-deep.md` — 89 lines — `695a02519ce1b7d5df22b93ce58e72c58e522fda94cf033d324f3027b4b46b88`
- [x] `docs/research/mangatranslator-study.md` — 139 lines — `c29ecc10ab760f9c783b3584568584664d0dabb9c52164696a0730a96fe41474`
- [x] `docs/research/mit-core-decomposition-analysis.md` — 144 lines — `5ccb6a5b6be11fe136a408d1b35eccdf5c4bde3d62df02a1fa0c05c074a8949e`
- [x] `docs/research/mit-hidden-capabilities.md` — 94 lines — `a9b36ebaac570e0810cb2ab38998c0a832ed5b22c583b6cb372f6e659dab4f44`
- [x] `docs/research/mit-vs-upstream-quality-divergence.md` — 100 lines — `4363814892e307d8b5c9844e6c76852bd6a32524bb55df9bc5a4353be2c76753`
- [x] `docs/research/pipeline-baseline-2026-06-08.md` — 131 lines — `cb879b61edcfdd4e197ae4fdbe8e661b711d47bb4dd5927c5025d3eb4c5028c5`
- [x] `docs/research/README.md` — 21 lines — `388a7b5cbbb85587f4dceacfc7960762ef2edfbd13bed651d07f613cf1a562be`
- [x] `docs/research/render-parity-port-plan.md` — 42 lines — `ae9225993a3415807aee9ef5eb964d6fb59cfdd8fae7738ed0ba548c5455d57c`
- [x] `docs/research/translation-northstar.md` — 86 lines — `4327c88366babb291c08c37340a873d9b33abb173ff9798b1bc91d4cec4b43a6`
- [x] `docs/research/translator-deep-dissection.md` — 554 lines — `ce892caa9080e0194cafc24e7688e3e5cedf9f543c906b6cdc13630f77e6dc47`

## Root Docs

- [x] `AGENTS.md` — 313 lines — `437ecead3594ef484fa1f26cc4dbf8c1fe05872701cb2e695d1e7b0eb3cf0b7f`
- [x] `CLAUDE.md` — 313 lines — `30b147b86465953edde8baa4b2f955302458a4bd3f9665b913128f9b5dd8765c`
- [x] `CONTEXT.md` — 298 lines — `07dbb887bcecd1768b2794d80e8fc7a5025f2f43dacaa3f63c93f6313387e3ce`
- [x] `DESIGN.md` — 259 lines — `58d206252e867f923db0b86f092c1d4878aea3da8fca73fb03c927218ce60959`
- [x] `DONE.md` — 2451 lines — `7104729696b18acd4ebea9cde07919a77f26e7cbbdebb416891bdae918fd29a5`
- [x] `PRODUCT.md` — 49 lines — `345437346ddc4dd5965b5779eb70914f21a70c8513dc6b120d07cfb8589ea6fc`
- [x] `README.md` — 309 lines — `d4264c935dd60d60a6f886e388c7c463aec64a5a3b80b4f87adc68ffccd19efa`
- [x] `Roadmap.md` — 194 lines — `1fbba515f8c3f0c5549c72ba48680bbd0190550021cdd62f58b4238aba663232`
- [x] `Skills.md` — 175 lines — `9f27b81cd6457b93efbcd520bcd445dbab794d17ddc749cd3efc0510acfe0dbd`
- [x] `Todo.md` — 152 lines — `1bd5549aa08122318f020efdde20a280ad958cebb823890d88037189e2fbf730`
- [x] `UBIQUITOUS_LANGUAGE.md` — 317 lines — `61fb8921a3ac0ac8abee231aeadeaec3cd371b5f325bc569829fcf0c2301332d`

## Runbooks

- [x] `docs/deploy/backend-vps.md` — 126 lines — `2dc4e9e1c48ded5fba56366507e3cdfeee30ffac9f62cecc7c374d0fae794340`

Related: [[Knowledge Migration Ledger]] · [[Incremental Survey Manifests]] · [[Home]]
