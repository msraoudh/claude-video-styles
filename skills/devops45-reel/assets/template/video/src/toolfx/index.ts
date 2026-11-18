import { logoKey } from "../kit/Logo";
import { LOGOS } from "../kit/logos";
import type { LogoKey } from "../kit/logos";
import type { ToolFx } from "./types";
import { CiFx } from "./ci";
import { DockerFx } from "./docker";
import { GitFx } from "./git";
import { GitHubFx } from "./github";
import { GrafanaFx } from "./grafana";
import { KubernetesFx } from "./kubernetes";
import { PrometheusFx } from "./prometheus";
import { TerraformFx } from "./terraform";
import { VSCodeFx } from "./vscode";
import { LinuxFx } from "./linux";
import { LoopFx } from "./loop";
import { ChefFx } from "./chef";
import { SmallStepsFx } from "./smallsteps";
import { DailyFx } from "./daily";
import { AlertFx } from "./alert";
import { LogsFx } from "./logs";
import { OpenSourceFx } from "./opensource";
import { FileChaosFx } from "./filechaos";
import { SaveGameFx } from "./savegame";
import { PullRequestFx } from "./pullrequest";
import { GitVsGitHubFx } from "./gitvsgithub";
import { WorksOnMyMachineFx } from "./worksonmymachine";
import { CargoFx } from "./cargo";
import { ImageContainerFx } from "./imagecontainer";
import { CultureFx } from "./culture";
import { AutomationFx } from "./automation";
import { MeasureFx } from "./measure";
import { SharingFx } from "./sharing";
import { RecipeFx } from "./recipe";

/**
 * Tool animations — each tool SHOWN doing its job (the user's direction 2026-10-22: « Docker encapsulates the app in a
 * container… animate each thing »). Logo key → animation; `<key>.sfx.json` next to it lists its internal sound moments
 * ({at: frames after f0, sfx, gain, note}) that scripts/cues.py adds. Used by the `tool` archetype.
 * The file name of each animation is in FILE (cues.py reads the sfx json by it).
 */
export const TOOL_FX: Partial<Record<LogoKey, ToolFx>> = {
  docker: DockerFx,
  kubernetes: KubernetesFx,
  git: GitFx,
  github: GitHubFx,
  vscode: VSCodeFx,
  githubactions: CiFx,
  jenkins: CiFx,
  gitlab: CiFx,
  terraform: TerraformFx,
  prometheus: PrometheusFx,
  grafana: GrafanaFx,
  linux: LinuxFx,
};
export const FILE: Record<string, string> = {
  docker: "docker", kubernetes: "kubernetes", git: "git", github: "github", vscode: "vscode",
  githubactions: "ci", jenkins: "ci", gitlab: "ci", terraform: "terraform", prometheus: "prometheus", grafana: "grafana",
  culture: "culture",
  automation: "automation",
  measure: "measure",
  sharing: "sharing",
  recipe: "recipe",
  linux: "linux",
  loop: "loop",
  chef: "chef",
  smallsteps: "smallsteps",
  daily: "daily",
  alert: "alert",
  logs: "logs",
  opensource: "opensource",
  filechaos: "filechaos",
  savegame: "savegame",
  pullrequest: "pullrequest",
  gitvsgithub: "gitvsgithub",
  worksonmymachine: "worksonmymachine",
  cargo: "cargo",
  imagecontainer: "imagecontainer",
};

/**
 * Concept animations — ideas with no logo (« la culture », « l'automatisation », « la recette »…), same contract
 * (they receive logo = "devops"). `label` is the name shown under the stage.
 */
export const CONCEPT_FX: Record<string, { C: ToolFx; label: string }> = {
  culture: { C: CultureFx, label: "Culture" },
  automation: { C: AutomationFx, label: "Automatisation" },
  measure: { C: MeasureFx, label: "Mesure" },
  sharing: { C: SharingFx, label: "Partage" },
  recipe: { C: RecipeFx, label: "La recette" },
  loop: { C: LoopFx, label: "La boucle" },
  chef: { C: ChefFx, label: "Le chef" },
  smallsteps: { C: SmallStepsFx, label: "Des tours courts" },
  daily: { C: DailyFx, label: "Le daily" },
  alert: { C: AlertFx, label: "L'alerte" },
  logs: { C: LogsFx, label: "Doc et logs" },
  opensource: { C: OpenSourceFx, label: "Open source" },
  filechaos: { C: FileChaosFx, label: "Le chaos des fichiers" },
  savegame: { C: SaveGameFx, label: "Les sauvegardes" },
  pullrequest: { C: PullRequestFx, label: "La pull request" },
  gitvsgithub: { C: GitVsGitHubFx, label: "Git ≠ GitHub" },
  worksonmymachine: { C: WorksOnMyMachineFx, label: "Ça marche chez moi" },
  cargo: { C: CargoFx, label: "Le conteneur standard" },
  imagecontainer: { C: ImageContainerFx, label: "Image → conteneur" },
};

/** a tool (logo key / alias) or a concept key → its animation, the name to show, and its logo (null for a concept) */
export const toolFx = (name?: unknown): { key: string; C: ToolFx; label: string; logo: LogoKey | null } | null => {
  const k = logoKey(name);
  const C = k ? TOOL_FX[k] : undefined;
  if (k && C) return { key: k, C, label: LOGOS[k].label, logo: k };
  const ck = typeof name === "string" ? name.trim().toLowerCase() : "";
  const c = CONCEPT_FX[ck];
  return c ? { key: ck, C: c.C, label: c.label, logo: null } : null;
};
