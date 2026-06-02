// Curated educational starter templates for the Stack Feed.
// These are NOT user testimonials — purely reference protocol structures.

export type TemplateCompound = {
  compound: string;
  dose: number;
  dose_unit: "mcg" | "mg" | "IU" | "units";
  frequency: string;        // "Once Daily" | "Twice Daily" | "Three Times Daily" | "Twice Weekly" | "Once Weekly"
  time_of_day: "AM" | "PM" | "Both";
  route: "Subcutaneous" | "Intranasal" | "Oral" | "Topical";
  duration_days: number;
};

export type StackTemplate = {
  id: string;
  category: string;
  name: string;
  goal_tags: string[];
  description: string;
  compounds: TemplateCompound[];
  is_template: true;
};

const t = (
  id: string,
  category: string,
  name: string,
  goal_tags: string[],
  description: string,
  compounds: TemplateCompound[],
): StackTemplate => ({ id, category, name, goal_tags, description, compounds, is_template: true });

export const STACK_TEMPLATES: StackTemplate[] = [
  // ===== RECOVERY & HEALING =====
  t("rec-1", "Recovery & Healing", "Classic Recovery Stack",
    ["Recovery", "Anti-inflammatory"],
    "Foundational systemic recovery pairing. BPC-157 supports soft-tissue repair while TB-500 promotes broader cell migration and healing across muscle and connective tissue.",
    [
      { compound: "BPC-157", dose: 250, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
      { compound: "TB-500", dose: 2.5, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
    ]),
  t("rec-2", "Recovery & Healing", "Joint & Tendon Support",
    ["Recovery", "Anti-inflammatory"],
    "Twice-daily BPC-157 focused on localized joint and tendon healing. Commonly used during a 6-week rehab block.",
    [
      { compound: "BPC-157", dose: 250, dose_unit: "mcg", frequency: "Twice Daily", time_of_day: "Both", route: "Subcutaneous", duration_days: 42 },
    ]),
  t("rec-3", "Recovery & Healing", "Post-Training Repair",
    ["Recovery", "Skin & Hair"],
    "Short repair cycle combining BPC-157 systemic recovery with GHK-Cu for connective-tissue and skin remodeling support.",
    [
      { compound: "BPC-157", dose: 250, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 28 },
      { compound: "GHK-Cu", dose: 1, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 28 },
    ]),
  t("rec-4", "Recovery & Healing", "Deep Tissue Stack",
    ["Recovery"],
    "Higher-dose TB-500 protocol for deeper tissue healing. Twice-weekly cadence over 6 weeks.",
    [
      { compound: "TB-500", dose: 5, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 42 },
    ]),
  t("rec-5", "Recovery & Healing", "Recovery + GH Support",
    ["Recovery", "Body Composition", "Sleep"],
    "Layered recovery: BPC-157 for tissue repair plus an evening GH-secretagogue blend to support sleep-driven recovery.",
    [
      { compound: "BPC-157", dose: 250, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
      { compound: "CJC-1295/Ipamorelin Blend", dose: 200, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 56 },
    ]),

  // ===== GUT HEALTH =====
  t("gut-1", "Gut Health", "Gut Repair Starter",
    ["Gut Health", "Anti-inflammatory"],
    "Oral BPC-157 monoprotocol — a common starting point for gut-lining support.",
    [
      { compound: "BPC-157", dose: 500, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Oral", duration_days: 42 },
    ]),
  t("gut-2", "Gut Health", "Comprehensive Gut Stack",
    ["Gut Health", "Anti-inflammatory", "Immune"],
    "Pairs oral BPC-157 with KPV for layered anti-inflammatory and gut-immune support.",
    [
      { compound: "BPC-157", dose: 500, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Oral", duration_days: 56 },
      { compound: "KPV", dose: 250, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
    ]),
  t("gut-3", "Gut Health", "Gut + Barrier Support",
    ["Gut Health"],
    "Twice-daily oral BPC-157 layered with Larazotide to target intestinal-barrier integrity.",
    [
      { compound: "BPC-157", dose: 250, dose_unit: "mcg", frequency: "Twice Daily", time_of_day: "Both", route: "Oral", duration_days: 42 },
      { compound: "Larazotide", dose: 0.5, dose_unit: "mg", frequency: "Three Times Daily", time_of_day: "Both", route: "Oral", duration_days: 42 },
    ]),
  t("gut-4", "Gut Health", "Anti-Inflammatory Gut Reset",
    ["Gut Health", "Anti-inflammatory"],
    "Short, focused KPV cycle targeting GI inflammation.",
    [
      { compound: "KPV", dose: 250, dose_unit: "mcg", frequency: "Twice Daily", time_of_day: "Both", route: "Oral", duration_days: 28 },
    ]),
  t("gut-5", "Gut Health", "Gut + Recovery Combo",
    ["Gut Health", "Recovery"],
    "Combines oral BPC-157 for gut support with subcutaneous TB-500 for systemic recovery.",
    [
      { compound: "BPC-157", dose: 500, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Oral", duration_days: 56 },
      { compound: "TB-500", dose: 2.5, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
    ]),

  // ===== COGNITIVE & FOCUS =====
  t("cog-1", "Cognitive & Focus", "Focus & Clarity Starter",
    ["Cognitive", "Energy"],
    "Single-peptide morning Semax protocol — a common cognitive starting point.",
    [
      { compound: "Semax", dose: 300, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Intranasal", duration_days: 28 },
    ]),
  t("cog-2", "Cognitive & Focus", "Calm Focus Stack",
    ["Cognitive", "Stress"],
    "Morning Semax for activation; evening Selank for calm focus and downshift.",
    [
      { compound: "Semax", dose: 300, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Intranasal", duration_days: 42 },
      { compound: "Selank", dose: 300, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Intranasal", duration_days: 42 },
    ]),
  t("cog-3", "Cognitive & Focus", "Daily Cognitive Stack",
    ["Cognitive", "Energy"],
    "N-Acetyl Semax Amidate twice daily for extended cognitive support across the workday.",
    [
      { compound: "N-Acetyl Semax", dose: 300, dose_unit: "mcg", frequency: "Twice Daily", time_of_day: "Both", route: "Intranasal", duration_days: 56 },
    ]),
  t("cog-4", "Cognitive & Focus", "Stress & Focus Balance",
    ["Cognitive", "Stress"],
    "Twice-daily N-Acetyl Selank Amidate targeting stress modulation and focused calm.",
    [
      { compound: "N-Acetyl Selank", dose: 300, dose_unit: "mcg", frequency: "Twice Daily", time_of_day: "Both", route: "Intranasal", duration_days: 42 },
    ]),
  t("cog-5", "Cognitive & Focus", "Neuro Support Stack",
    ["Cognitive"],
    "Morning Semax paired with daily oral Dihexa for layered neurotrophic support.",
    [
      { compound: "Semax", dose: 300, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Intranasal", duration_days: 56 },
      { compound: "Dihexa", dose: 8, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Oral", duration_days: 56 },
    ]),

  // ===== SLEEP & STRESS =====
  t("slp-1", "Sleep & Stress", "Sleep Support Starter",
    ["Sleep"],
    "Evening DSIP monoprotocol — a minimal entry point for sleep support.",
    [
      { compound: "DSIP", dose: 100, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 28 },
    ]),
  t("slp-2", "Sleep & Stress", "Calm & Rest Stack",
    ["Sleep", "Stress"],
    "Evening Selank for stress downshift paired with DSIP for sleep onset support.",
    [
      { compound: "Selank", dose: 300, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Intranasal", duration_days: 42 },
      { compound: "DSIP", dose: 100, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 42 },
    ]),
  t("slp-3", "Sleep & Stress", "Evening GH + Sleep",
    ["Sleep", "Body Composition", "Recovery"],
    "Evening GH-secretagogue blend to support deeper sleep architecture and overnight recovery.",
    [
      { compound: "CJC-1295/Ipamorelin Blend", dose: 200, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 56 },
    ]),
  t("slp-4", "Sleep & Stress", "Stress Resilience Stack",
    ["Stress"],
    "Twice-daily Selank protocol focused on stress resilience over a 6-week block.",
    [
      { compound: "Selank", dose: 300, dose_unit: "mcg", frequency: "Twice Daily", time_of_day: "Both", route: "Intranasal", duration_days: 42 },
    ]),
  t("slp-5", "Sleep & Stress", "Wind-Down Stack",
    ["Sleep", "Anti-aging"],
    "Evening Pinealon plus DSIP — a longevity-oriented wind-down cycle.",
    [
      { compound: "Pinealon", dose: 10, dose_unit: "mg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 28 },
      { compound: "DSIP", dose: 100, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 28 },
    ]),

  // ===== BODY COMPOSITION & METABOLIC =====
  t("bod-1", "Body Composition & Metabolic", "Metabolic Starter (GLP-1)",
    ["Fat Loss", "Metabolic Health"],
    "Standard low-dose Semaglutide starter cycle — typical titration starting point.",
    [
      { compound: "Semaglutide", dose: 0.25, dose_unit: "mg", frequency: "Once Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
    ]),
  t("bod-2", "Body Composition & Metabolic", "Dual Incretin Stack",
    ["Fat Loss", "Metabolic Health"],
    "Tirzepatide starter dose — dual GIP/GLP-1 incretin protocol.",
    [
      { compound: "Tirzepatide", dose: 2.5, dose_unit: "mg", frequency: "Once Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
    ]),
  t("bod-3", "Body Composition & Metabolic", "Body Recomposition Stack",
    ["Fat Loss", "Body Composition"],
    "Evening GH-secretagogue blend with morning AOD-9604 for body composition support.",
    [
      { compound: "CJC-1295/Ipamorelin Blend", dose: 200, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 84 },
      { compound: "AOD-9604", dose: 300, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
    ]),
  t("bod-4", "Body Composition & Metabolic", "Metabolic + Mitochondrial",
    ["Metabolic Health", "Energy"],
    "MOTS-c protocol focused on mitochondrial signaling and metabolic support.",
    [
      { compound: "MOTS-C", dose: 10, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 42 },
    ]),
  t("bod-5", "Body Composition & Metabolic", "Lean Support Stack",
    ["Fat Loss", "Metabolic Health", "Energy"],
    "Weekly Semaglutide paired with MOTS-c for combined metabolic and mitochondrial support.",
    [
      { compound: "Semaglutide", dose: 0.25, dose_unit: "mg", frequency: "Once Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
      { compound: "MOTS-C", dose: 10, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
    ]),
  t("bod-6", "Body Composition & Metabolic", "The Scotty Stack",
    ["Fat Loss", "Body Composition", "Muscle Growth", "Metabolic Health"],
    "A comprehensive body-composition template combining growth-hormone stimulation (Tesamorelin, CJC-1295, Ipamorelin) with a targeted fat-loss fragment (AOD-9604) and metabolic and satiety modulators (Retatrutide, Cagrilintide). Structured to support lean recomposition while managing appetite. An advanced multi-compound reference template.",
    [
      { compound: "Tesamorelin", dose: 2, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
      { compound: "CJC-1295 (no DAC) / Ipamorelin Blend", dose: 200, dose_unit: "mcg", frequency: "Twice Daily", time_of_day: "Both", route: "Subcutaneous", duration_days: 84 },
      { compound: "AOD-9604", dose: 300, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
      { compound: "Retatrutide", dose: 2, dose_unit: "mg", frequency: "Once Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
      { compound: "Cagrilintide", dose: 1.5, dose_unit: "mg", frequency: "Once Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
    ]),

  // ===== ANTI-AGING & LONGEVITY =====
  t("age-1", "Anti-Aging & Longevity", "Longevity Starter (Epitalon)",
    ["Anti-aging"],
    "Classic 20-day Epitalon longevity cycle.",
    [
      { compound: "Epitalon (Epithalon)", dose: 5, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 20 },
    ]),
  t("age-2", "Anti-Aging & Longevity", "Cellular Support Stack",
    ["Anti-aging", "Energy"],
    "Daily NAD+ subcutaneous protocol for cellular energy support.",
    [
      { compound: "NAD+", dose: 100, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 28 },
    ]),
  t("age-3", "Anti-Aging & Longevity", "Mitochondrial Longevity",
    ["Anti-aging", "Energy"],
    "SS-31 daily plus MOTS-c twice weekly for layered mitochondrial support.",
    [
      { compound: "SS-31 (Elamipretide)", dose: 5, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 28 },
      { compound: "MOTS-C", dose: 10, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 28 },
    ]),
  t("age-4", "Anti-Aging & Longevity", "Thymic Support Cycle",
    ["Anti-aging", "Immune"],
    "Short 10-day Thymalin cycle for thymic and immune support.",
    [
      { compound: "Thymalin", dose: 10, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 10 },
    ]),
  t("age-5", "Anti-Aging & Longevity", "Comprehensive Longevity Stack",
    ["Anti-aging", "Energy"],
    "Layered 20-day longevity block: Epitalon plus daily NAD+.",
    [
      { compound: "Epitalon (Epithalon)", dose: 5, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 20 },
      { compound: "NAD+", dose: 100, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 20 },
    ]),

  // ===== GROWTH HORMONE & PERFORMANCE =====
  t("gh-1", "Growth Hormone & Performance", "GH Secretagogue Starter",
    ["Body Composition", "Recovery", "Sleep"],
    "Evening Ipamorelin monoprotocol — a clean GH-secretagogue starting point.",
    [
      { compound: "Ipamorelin", dose: 200, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 56 },
    ]),
  t("gh-2", "Growth Hormone & Performance", "Classic GH Stack",
    ["Body Composition", "Recovery"],
    "Classic CJC-1295 (no DAC) with Ipamorelin — pulsatile GH-secretagogue pairing.",
    [
      { compound: "CJC-1295 no DAC", dose: 100, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 84 },
      { compound: "Ipamorelin", dose: 200, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 84 },
    ]),
  t("gh-3", "Growth Hormone & Performance", "Performance Recovery Stack",
    ["Recovery", "Body Composition"],
    "Twice-daily GH-secretagogue blend layered with BPC-157 for ongoing tissue repair.",
    [
      { compound: "CJC-1295/Ipamorelin Blend", dose: 200, dose_unit: "mcg", frequency: "Twice Daily", time_of_day: "Both", route: "Subcutaneous", duration_days: 84 },
      { compound: "BPC-157", dose: 250, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
    ]),
  t("gh-4", "Growth Hormone & Performance", "Lean Mass Support",
    ["Body Composition", "Sleep"],
    "Evening oral MK-677 monoprotocol — extended GH-axis stimulation.",
    [
      { compound: "MK-677 (Ibutamoren)", dose: 12.5, dose_unit: "mg", frequency: "Once Daily", time_of_day: "PM", route: "Oral", duration_days: 84 },
    ]),
  t("gh-5", "Growth Hormone & Performance", "Advanced Performance Stack",
    ["Body Composition", "Recovery"],
    "Advanced 10-week block layering CJC-1295 (no DAC), Ipamorelin, and a 4-week IGF-1 LR3 finishing phase.",
    [
      { compound: "CJC-1295 no DAC", dose: 100, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 70 },
      { compound: "Ipamorelin", dose: 200, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "PM", route: "Subcutaneous", duration_days: 70 },
      { compound: "IGF-1 LR3", dose: 20, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 28 },
    ]),

  // ===== IMMUNE & SKIN =====
  t("imm-1", "Immune & Skin", "Immune Support Starter",
    ["Immune"],
    "Standard twice-weekly Thymosin Alpha-1 cycle — a foundational immune-support protocol.",
    [
      { compound: "Thymosin Alpha-1", dose: 1.5, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
    ]),
  t("imm-2", "Immune & Skin", "Immune + Anti-Inflammatory",
    ["Immune", "Anti-inflammatory"],
    "Thymosin Alpha-1 paired with daily KPV for layered immune and anti-inflammatory support.",
    [
      { compound: "Thymosin Alpha-1", dose: 1.5, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
      { compound: "KPV", dose: 250, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
    ]),
  t("imm-3", "Immune & Skin", "Skin & Collagen Stack",
    ["Skin & Hair", "Anti-aging"],
    "Daily GHK-Cu monoprotocol for skin and collagen support.",
    [
      { compound: "GHK-Cu", dose: 2, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
    ]),
  t("imm-4", "Immune & Skin", "Hair Support Stack",
    ["Skin & Hair"],
    "GHK-Cu subcutaneous paired with topical PTD-DBM over an extended 12-week block.",
    [
      { compound: "GHK-Cu", dose: 2, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
      { compound: "PTD-DBM", dose: 1, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Topical", duration_days: 84 },
    ]),
  t("imm-5", "Immune & Skin", "Glow Stack",
    ["Skin & Hair"],
    "GHK-Cu paired with a 4-week Melanotan II cycle for combined skin and pigmentation support.",
    [
      { compound: "GHK-Cu", dose: 2, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
      { compound: "Melanotan II", dose: 250, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 28 },
    ]),

  // ===== AUTOIMMUNE & IMMUNE BALANCE =====
  t("ai-1", "Autoimmune & Immune Balance", "Autoimmune Foundation Stack",
    ["Immune", "Anti-inflammatory", "Gut Health"],
    "Foundational autoimmune-balance protocol: Thymosin Alpha-1 immune modulation, KPV anti-inflammatory support, and twice-weekly Glutathione for antioxidant support.",
    [
      { compound: "Thymosin Alpha-1", dose: 1.5, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
      { compound: "KPV", dose: 250, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
      { compound: "Glutathione", dose: 200, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
    ]),
  t("ai-2", "Autoimmune & Immune Balance", "Gut-Driven Autoimmune Stack",
    ["Gut Health", "Immune", "Anti-inflammatory"],
    "Gut-first autoimmune approach: oral BPC-157 and KPV targeting GI inflammation, with Glutathione antioxidant support.",
    [
      { compound: "BPC-157", dose: 500, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Oral", duration_days: 70 },
      { compound: "KPV", dose: 250, dose_unit: "mcg", frequency: "Twice Daily", time_of_day: "Both", route: "Oral", duration_days: 70 },
      { compound: "Glutathione", dose: 200, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 70 },
    ]),
  t("ai-3", "Autoimmune & Immune Balance", "Comprehensive Autoimmune Protocol",
    ["Immune", "Anti-inflammatory", "Gut Health", "Skin & Hair"],
    "Comprehensive 12-week protocol layering immune modulation, tissue repair, anti-inflammatory, regenerative, and antioxidant support.",
    [
      { compound: "Thymosin Alpha-1", dose: 1.5, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
      { compound: "BPC-157", dose: 250, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
      { compound: "KPV", dose: 250, dose_unit: "mcg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
      { compound: "GHK-Cu", dose: 1, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
      { compound: "Glutathione", dose: 200, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 84 },
    ]),
  t("ai-4", "Autoimmune & Immune Balance", "Immune Reset Cycle",
    ["Immune", "Anti-inflammatory"],
    "Focused 8-week reset: Thymosin Alpha-1 immune modulation plus Glutathione antioxidant support.",
    [
      { compound: "Thymosin Alpha-1", dose: 1.5, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
      { compound: "Glutathione", dose: 200, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 56 },
    ]),
  t("ai-5", "Autoimmune & Immune Balance", "Inflammation Calming Stack",
    ["Anti-inflammatory", "Immune", "Skin & Hair"],
    "Anti-inflammatory focused: KPV twice daily, GHK-Cu daily, and Glutathione twice weekly.",
    [
      { compound: "KPV", dose: 250, dose_unit: "mcg", frequency: "Twice Daily", time_of_day: "Both", route: "Subcutaneous", duration_days: 42 },
      { compound: "GHK-Cu", dose: 1, dose_unit: "mg", frequency: "Once Daily", time_of_day: "AM", route: "Subcutaneous", duration_days: 42 },
      { compound: "Glutathione", dose: 200, dose_unit: "mg", frequency: "Twice Weekly", time_of_day: "AM", route: "Subcutaneous", duration_days: 42 },
    ]),
];

export const TEMPLATE_CATEGORIES: string[] = Array.from(
  new Set(STACK_TEMPLATES.map((t) => t.category)),
);

export function maxDuration(tmpl: StackTemplate): number {
  return Math.max(...tmpl.compounds.map((c) => c.duration_days));
}

export function allTemplateCompounds(tmpl: StackTemplate): string[] {
  return Array.from(new Set(tmpl.compounds.map((c) => c.compound)));
}
