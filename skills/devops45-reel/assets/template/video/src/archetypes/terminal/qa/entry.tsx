/**
 * QA-only Remotion entry (never imported by the app): stress cases for the terminal / code / steps archetypes
 * (long / short / multi content) on the fixture's real word timings. Render stills with
 *   render-safe.sh still src/archetypes/terminal/qa/entry.tsx QA-<id> out.jpg --frame=<global f>
 */
import React from "react";
import { AbsoluteFill, Composition, registerRoot, Sequence, useCurrentFrame } from "remotion";
import "../../../kit/fonts";
import type { SceneSpec } from "../../../data/episode";
import { DURATION, FPS } from "../../../data/voice";
import { Captions } from "../../../components/Captions";
import { Hud } from "../../../components/Hud";
import { B } from "../../../lib/look";
import { GlobalFrameProvider } from "../../../lib/sync";
import type { Archetype } from "../..";
import { Terminal } from "..";
import { Code } from "../../code";
import { Steps } from "../../steps";

const S2 = { from: 292, to: 602, phrases: ["p02", "p03"], captions: true };
const S3 = { from: 602, to: 855, phrases: ["p04"], captions: true };
const S4 = { from: 855, to: 1239, phrases: ["p05", "p06", "p07", "p08"], captions: true };

const CASES: { id: string; C: Archetype; spec: SceneSpec }[] = [
  {
    id: "term-long",
    C: Terminal,
    spec: {
      ...S2,
      id: "qa1",
      type: "terminal",
      data: {
        command: "kubectl get pods -A --field-selector=status.phase!=Running",
        on: "tape",
        tab: "admin@prod-eu-west-1: ~/k8s",
        output: [
          { text: "NAMESPACE    NAME                        READY  STATUS            RESTARTS", tone: "dim" },
          { text: "prod         api-7d9f-x2kq9              0/1    CrashLoopBackOff  12", tone: "warn", on: "port" },
          { text: "prod         worker-5c8d-q8wnz           0/1    Pending           0" },
          { text: "monitoring   prometheus-0                1/2    Error             3" },
          { text: "ingress      nginx-ctrl-6c9f4-mz2        0/1    ImagePullBackOff  0", on: "ouvert" },
          { text: "kube-system  coredns-5d78c-7xk2p         0/1    ContainerCreating 0" },
          { text: "batch        nightly-backup-28391-zq7    0/1    Completed         0", tone: "ok", on: "programme" },
          { text: "default      debug-shell                 0/1    Unknown           1", tone: "dim" },
        ],
        note: { text: "12 redémarrages = crash en boucle", on: "écoute", line: 2 },
      },
    },
  },
  {
    id: "term-two",
    C: Terminal,
    spec: {
      ...S2,
      id: "qa2",
      type: "terminal",
      data: {
        commands: [
          { command: "systemctl status nginx", on: "tape", output: [{ text: "● nginx.service - A high performance web server", tone: "accent" }, { text: "   Active: failed (Result: exit-code)", tone: "warn", on: "port" }] },
          {
            command: 'journalctl -u nginx --since "10 min ago"',
            on: "programme",
            output: [
              { text: "nginx[812]: bind() to 0.0.0.0:80 failed (98: Address in use)", tone: "warn" },
              { text: "systemd[1]: nginx.service: Failed with result 'exit-code'.", tone: "dim" },
            ],
          },
        ],
      },
    },
  },
  { id: "term-none", C: Terminal, spec: { ...S2, id: "qa3", type: "terminal", data: { command: "df -h", on: "tape" } } },
  {
    id: "code-long",
    C: Code,
    spec: {
      ...S3,
      id: "qa4",
      type: "code",
      data: {
        file: "deployment.yaml",
        lang: "yaml",
        lines: [
          "apiVersion: apps/v1",
          "kind: Deployment",
          "metadata:",
          "  name: api",
          "spec:",
          "  replicas: 3",
          "  template:",
          "    spec:",
          "      containers:",
          '        - name: api',
          '          image: "registry.local/api:1.4.2"',
          "          resources:",
          "            limits:",
          "              memory: 128Mi  # trop juste",
        ],
        highlight: [{ line: 14, on: "ligne", fix: "              memory: 512Mi", fix_on: "change" }],
      },
    },
  },
  {
    id: "code-docker",
    C: Code,
    spec: {
      ...S3,
      id: "qa5",
      type: "code",
      data: {
        file: "Dockerfile",
        lang: "dockerfile",
        lines: ["FROM node:22", "WORKDIR /app", "COPY . .", "RUN npm install", 'CMD ["node", "server.js"]'],
        highlight: [{ line: 1, on: "config" }, { line: 4, on: "ligne", fix: "RUN npm ci --omit=dev", fix_on: "tout" }],
      },
    },
  },
  {
    id: "steps-five",
    C: Steps,
    spec: {
      ...S4,
      id: "qa6",
      type: "steps",
      data: {
        heading: "Avant chaque déploiement",
        items: [
          { text: "Lance les tests unitaires et d'intégration", on: "trois" },
          { text: "Vérifie les variables d'environnement", sub: "staging ≠ production", on: "liste" },
          { text: "Fais un backup de la base", on: "ferme" },
          { text: "Déploie en canary sur 5 %", on: "filtre" },
          { text: "Surveille les erreurs 15 min" },
        ],
      },
    },
  },
  { id: "steps-two", C: Steps, spec: { ...S4, id: "qa7", type: "steps", data: { items: [{ text: "Liste", on: "liste" }, { text: "Ferme", on: "ferme" }] } } },
];

const Case: React.FC<{ C: Archetype; spec: SceneSpec }> = ({ C, spec }) => {
  const f = useCurrentFrame();
  return (
    <GlobalFrameProvider frame={f}>
      <AbsoluteFill style={{ background: B.bg }}>
        <Sequence from={spec.from} durationInFrames={spec.to - spec.from}>
          <C spec={spec} />
        </Sequence>
        <Hud />
        <Captions />
      </AbsoluteFill>
    </GlobalFrameProvider>
  );
};

const Root: React.FC = () => (
  <>
    {CASES.map((c) => (
      <Composition key={c.id} id={`QA-${c.id}`} component={() => <Case C={c.C} spec={c.spec} />} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
    ))}
  </>
);

registerRoot(Root);
