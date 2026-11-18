import { B } from "../../lib/look";

/**
 * Light syntax colouring for config snippets — simple regexes, brand palette only (cyan family builds the world,
 * white strings, muted punctuation/comments; amber is reserved for the highlight, never syntax).
 * Languages: yaml, hcl/terraform, dockerfile, conf/ini/toml/nginx/properties, json, bash/sh. Anything else → conf.
 */
export type Tok = { t: string; c: string; b?: boolean; i?: boolean };

export const SYN = {
  key: "#67E8F9",
  kw: B.cyan,
  str: B.white,
  num: "#A5F3FC",
  punct: "rgba(226,236,250,0.42)",
  comment: "rgba(226,236,250,0.42)",
  plain: "rgba(226,236,250,0.78)",
  vari: "#A5F3FC",
};

export type Lang = "yaml" | "hcl" | "dockerfile" | "conf" | "json" | "bash";
export const normLang = (lang?: string, file?: string): Lang => {
  const l = (lang ?? "").toLowerCase().trim();
  const f = (file ?? "").toLowerCase();
  if (["yaml", "yml", "k8s", "kubernetes", "compose", "ansible", "helm"].includes(l)) return "yaml";
  if (["hcl", "tf", "terraform", "tfvars"].includes(l)) return "hcl";
  if (["dockerfile", "docker", "containerfile"].includes(l)) return "dockerfile";
  if (["json", "jsonc"].includes(l)) return "json";
  if (["bash", "sh", "shell", "zsh", "script"].includes(l)) return "bash";
  if (["conf", "ini", "toml", "cfg", "properties", "nginx", "env", "systemd", "service"].includes(l)) return "conf";
  if (/\.(ya?ml)$/.test(f)) return "yaml";
  if (/\.(tf|tfvars|hcl)$/.test(f)) return "hcl";
  if (/dockerfile|containerfile/.test(f)) return "dockerfile";
  if (/\.json$/.test(f)) return "json";
  if (/\.(sh|bash|zsh)$/.test(f)) return "bash";
  return "conf";
};
export const LANG_LABEL: Record<Lang, string> = { yaml: "YAML", hcl: "HCL", dockerfile: "DOCKERFILE", conf: "CONF", json: "JSON", bash: "BASH" };

const HCL_KW = new Set(["resource", "data", "variable", "output", "module", "provider", "locals", "terraform", "backend", "required_providers", "dynamic", "for_each", "count"]);
const BOOL = /^(true|false|null|yes|no|on|off|none|True|False)$/;

/** split off a trailing comment (outside quotes) */
const splitComment = (line: string, lang: Lang): [string, string] => {
  if (lang === "json") return [line, ""];
  let q: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === "\\") i++;
      else if (ch === q) q = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      q = ch;
      continue;
    }
    const prevWs = i === 0 || /\s/.test(line[i - 1]);
    if (ch === "#" && prevWs) return [line.slice(0, i), line.slice(i)];
    if (lang === "hcl" && ch === "/" && line[i + 1] === "/") return [line.slice(0, i), line.slice(i)];
    if (lang === "conf" && ch === ";" && line.slice(0, i).trim() === "") return [line.slice(0, i), line.slice(i)];
  }
  return [line, ""];
};

const TOKEN = /("(?:[^"\\]|\\.)*"?|'[^']*'?)|(\$\{?[\w.]+\}?)|(--?[A-Za-z][\w-]*)|(\b\d[\w.%:]*\b)|([A-Za-z_][\w.\-/]*)|(\s+)|([^\sA-Za-z0-9_])/g;

/** generic value tokenizer; `bashCmd` colours the first word of each command as a keyword */
const values = (s: string, lang: Lang, startCmd = false): Tok[] => {
  const out: Tok[] = [];
  let cmdNext = startCmd;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(s))) {
    const [t, str, vari, flag, num, word, ws] = m;
    if (str) {
      // json key: string followed by a colon
      const isKey = lang === "json" && /^\s*:/.test(s.slice(TOKEN.lastIndex));
      out.push({ t, c: isKey ? SYN.key : SYN.str });
    } else if (vari) out.push({ t, c: SYN.vari });
    else if (flag && (lang === "bash" || lang === "dockerfile")) out.push({ t, c: SYN.num });
    else if (num) out.push({ t, c: SYN.num });
    else if (word) {
      if (cmdNext && lang === "bash") {
        out.push({ t, c: SYN.kw, b: true });
        cmdNext = false;
      } else if (BOOL.test(word)) out.push({ t, c: SYN.num });
      else out.push({ t, c: SYN.plain });
    } else if (ws) out.push({ t, c: SYN.plain });
    else {
      out.push({ t, c: SYN.punct });
      if (lang === "bash" && /[|;&]/.test(t)) cmdNext = true;
    }
    if (flag && !(lang === "bash" || lang === "dockerfile")) {
      // flag regex consumed a "-word" outside bash: re-colour as plain
      out[out.length - 1] = { t, c: SYN.plain };
    }
  }
  return out;
};

export const tokenize = (line: string, langIn: Lang): Tok[] => {
  const lang = langIn;
  const [code, comment] = splitComment(line, lang);
  const out: Tok[] = [];
  let rest = code;
  if (lang === "yaml") {
    const m = /^(\s*(?:-\s+)?)([^\s:#'"][^:#]*?|"[^"]*"|'[^']*')(\s*:)(?=\s|$)/.exec(rest);
    if (m) {
      out.push({ t: m[1], c: SYN.punct });
      out.push({ t: m[2], c: SYN.key });
      out.push({ t: m[3], c: SYN.punct });
      rest = rest.slice(m[0].length);
    } else {
      const d = /^(\s*-\s+)/.exec(rest);
      if (d) {
        out.push({ t: d[1], c: SYN.punct });
        rest = rest.slice(d[0].length);
      }
    }
    out.push(...values(rest, lang));
  } else if (lang === "hcl") {
    const kw = /^(\s*)([a-z_]+)(?=\s|$)/.exec(rest);
    if (kw && HCL_KW.has(kw[2])) {
      out.push({ t: kw[1], c: SYN.plain }, { t: kw[2], c: SYN.kw, b: true });
      rest = rest.slice(kw[0].length);
    } else {
      const m = /^(\s*)([\w\-]+)(\s*=)/.exec(rest);
      if (m) {
        out.push({ t: m[1], c: SYN.plain }, { t: m[2], c: SYN.key }, { t: m[3], c: SYN.punct });
        rest = rest.slice(m[0].length);
      }
    }
    out.push(...values(rest, lang));
  } else if (lang === "dockerfile") {
    const m = /^(\s*)([A-Za-z]+)(?=\s|$)/.exec(rest);
    if (m && /^(FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL|AS)$/i.test(m[2])) {
      out.push({ t: m[1], c: SYN.plain }, { t: m[2], c: SYN.kw, b: true });
      rest = rest.slice(m[0].length);
    }
    out.push(...values(rest, lang).map((t) => (/^as$/i.test(t.t) ? { ...t, c: SYN.kw, b: true } : t)));
  } else if (lang === "conf") {
    const sec = /^(\s*)(\[[^\]]*\]?)/.exec(rest);
    if (sec) {
      out.push({ t: sec[1], c: SYN.plain }, { t: sec[2], c: SYN.kw, b: true });
      rest = rest.slice(sec[0].length);
    } else {
      const m = /^(\s*)([\w.\-]+)(\s*[=:]\s*|\s+)/.exec(rest);
      if (m) {
        out.push({ t: m[1], c: SYN.plain }, { t: m[2], c: SYN.key }, { t: m[3], c: SYN.punct });
        rest = rest.slice(m[0].length);
      }
    }
    out.push(...values(rest, lang));
  } else if (lang === "bash") {
    out.push(...values(rest, lang, true));
  } else {
    out.push(...values(rest, lang));
  }
  if (comment) out.push({ t: comment, c: SYN.comment, i: true });
  return out.filter((t) => t.t.length > 0);
};

/** first n characters of a token list */
export const sliceToks = (toks: Tok[], n: number): Tok[] => {
  const out: Tok[] = [];
  let rem = n;
  for (const t of toks) {
    if (rem <= 0) break;
    out.push(t.t.length <= rem ? t : { ...t, t: t.t.slice(0, rem) });
    rem -= t.t.length;
  }
  return out;
};
