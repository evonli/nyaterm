// ── Resolved rule (single color already chosen for the current theme) ───────

/** Rule shape passed to the highlighting engine after dark/light resolution. */
export interface ResolvedHighlightRule {
  id: string;
  name: string;
  patterns: string[];
  color: string;
  enabled: boolean;
  /** 大小写敏感匹配（表头字段词如 NAMES/STATUS 只匹配大写） */
  caseSensitive?: boolean;
}

// ── Luminance helper ────────────────────────────────────────────────────────

/** Perceived brightness of a "#rrggbb" hex color (0–1). */
export function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length < 6) return 0.5;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function requireTokenBoundary(pattern: string): string {
  // remove the \b to avoid conflicts
  const cleanPattern = pattern.replace(/\\b/g, "");
  return `(?<![\\w-])(?:${cleanPattern})(?![\\w-])`;
}

// ── Built-in rule patterns ───────────────────────────────────────────────────
// All patterns are compiled with the `gi` flag (global + case-insensitive)
// unless the rule opts into case-sensitive matching.

const BUILTIN_PATTERNS = {
  error: [
    "access denied",
    "address already in use",
    "authentication failed",
    "broken pipe",
    "cannot allocate memory",
    "command not found",
    "connection refused",
    "connection reset by peer",
    "connection timed out",
    "error",
    "fail(?:ed|ure)?",
    "fatal",
    "exception",
    "host key verification failed",
    "module not found",
    "network is unreachable",
    "no route to host",
    "no space left on device",
    "operation timed out",
    "out of memory",
    "panic",
    "permission denied",
    "port already in use",
    "segmentation fault",
    "critical",
    "traceback",
    "unable to connect",
    "failed to",
    "unable to",
    "refused",
    "timed out",
    "not found",
    "aborted",
    "corrupted",
    "invalid",
    "mismatch",
    "unexpected",
    "unreachable",
    "denied",
    "timeout",
  ].map(requireTokenBoundary),
  warn: [
    "warn(?:ing)?",
    "deprecated",
    "caution",
    "unhealthy",
    "degraded",
    "disconnected",
    "expired",
    "almost full",
    "low on memory",
    "high load",
    "slow",
  ].map(requireTokenBoundary),
  // 状态词：表示"正在正常运行/就绪"的稳定状态
  status: [
    "running",
    "healthy",
    "ready",
    "active",
    "started",
    "connected",
    "listening",
    "online",
    "reachable",
    "available",
    "enabled",
    "authorized",
    "authenticated",
    "bound",
    "mounted",
    "up",
  ].map(requireTokenBoundary),
  // 成功动作/结果：表示某件事做完了
  success: [
    "completed",
    "success(?:ful(?:ly)?)?",
    "done",
    "installed",
    "deployed",
    "saved",
    "finished",
    "verified",
    "validated",
    "updated",
    "upgraded",
    "restored",
    "synchronized",
    "synced",
    "created",
    "uploaded",
    "downloaded",
    "accepted",
    "passed",
    "resolved",
    "configured",
    "applied",
    "committed",
    "pushed",
    "merged",
    "built",
    "ok",
  ].map(requireTokenBoundary),
  // docker ps STATUS 列：不同取值不同颜色（大小写敏感，只匹配 docker 输出格式）
  containerUp: ["Up\\s+(?:About\\s+)?(?:(?:\\d+|a)\\s+(?:second|minute|hour|day|week)s?)"],
  containerExited: ["Exited\\s*\\(\\d+\\)"],
  containerRestarting: ["Restarting(?:\\s*\\(\\d+\\))?"],
  containerPaused: ["Paused"],
  // 表格表头字段（docker/kubectl/systemctl 等，大小写敏感）
  field: [
    "NAMES",
    "STATUS",
    "PORTS",
    "AGE",
    "IMAGE",
    "READY",
    "RESTARTS",
    "COMMAND",
    "CREATED",
    "NODE",
    "POD",
    "SERVICE",
    "PROTOCOL",
    "STATE",
    "VERSION",
    "SYNCED",
    "HEAD",
    "NAME",
    "TYPE",
    "UID",
    "REPLICAS",
    "AVAILABLE",
    "LOCAL",
    "REMOTE",
    "CONTAINER ID",
    "IMAGE ID",
    "CLUSTER-IP",
    "EXTERNAL-IP",
  ].map(requireTokenBoundary),
  // kubectl get 的常见状态值（大小写敏感）
  kubectlState: [
    "Running",
    "Pending",
    "CrashLoopBackOff",
    "ImagePullBackOff",
    "ErrImagePull",
    "Completed",
    "Terminating",
    "ContainerCreating",
    "OOMKilled",
    "NodeLost",
    "Evicted",
    "FailedScheduling",
  ].map(requireTokenBoundary),
  // git 场景词
  git: [
    "origin",
    "master",
    "main",
    "ahead",
    "behind",
    "untracked",
    "modified",
    "staged",
    "unmerged",
    "renamed",
    "detached",
    "branch",
    "merge",
    "rebase",
  ].map(requireTokenBoundary),
  // 常用运维命令（输入行实时着色 + 输出中的命令引用）
  action: [
    "docker",
    "docker-compose",
    "podman",
    "kubectl",
    "kubectx",
    "kubens",
    "helm",
    "terraform",
    "ansible",
    "minikube",
    "git",
    "ssh",
    "scp",
    "sftp",
    "rsync",
    "curl",
    "wget",
    "ping",
    "traceroute",
    "ls",
    "cd",
    "cat",
    "echo",
    "grep",
    "find",
    "tail",
    "head",
    "tar",
    "unzip",
    "zip",
    "chmod",
    "chown",
    "sudo",
    "systemctl",
    "journalctl",
    "apt",
    "apt-get",
    "yum",
    "dnf",
    "brew",
    "pip",
    "pip3",
    "npm",
    "pnpm",
    "yarn",
    "node",
    "python",
    "python3",
    "cargo",
    "make",
    "cmake",
    "vim",
    "nano",
    "mysql",
    "psql",
    "mongo",
    "redis-cli",
    "netstat",
    "telnet",
    "df",
    "du",
    "free",
    "uptime",
    "crontab",
    "history",
    "which",
    "uname",
    "hostname",
    "whoami",
  ].map(requireTokenBoundary),
  // 文件路径（Unix 绝对/相对、Windows 盘符路径）
  path: [
    "(?<![A-Za-z0-9_.])~?(?:/[A-Za-z0-9_.@%+-]+)+/?",
    "(?<![A-Za-z0-9_.])\\.{1,2}(?:/[A-Za-z0-9_.@%+-]+)+/?",
    "[A-Za-z]:\\\\(?:[A-Za-z0-9_.@%+-]+\\\\)+[A-Za-z0-9_.@%+-]*",
  ],
  option: [
    "(?<![\\w-])--[a-zA-Z][\\w-]*(?![\\w-])",
    "(?<![\\w-])-[a-zA-Z](?:[a-zA-Z0-9])*(?![\\w-])",
  ],
  datetime: [
    "\\b\\d{4}[-/]\\d{2}[-/]\\d{2}(?:T(?:[01]\\d|2[0-3])[-:][0-5]\\d[-:][0-5]\\d(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:?\\d{2})?)?\\b",
    "\\b(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?(?:\\.\\d{1,9})?\\b",
  ],
  number: [
    "(?<![\\w-])[-+]?0x[0-9a-f]+(?![\\w-])",
    "(?<![\\w.-])[-+]?(?:\\.\\d+|\\d+\\.\\d*|\\d+[eE][-+]?\\d+|\\d{2,})(?:[eE][-+]?\\d+)?(?:\\s*%)?(?![\\w.-])",
  ],
  constant: [
    "true",
    "false",
    "null",
    "nil",
    "none",
    "undefined",
    "NaN",
    "Infinity",
    "nullptr",
    "EOF",
    "stop(?:ped)?",
    "exit(?:ed|ing)?",
    "quit(?:ed|ing)?",
    "abort(?:ed|ing)?",
    "cancel(?:ed|ing)?",
    "interrupt(?:ed|ing)?",
    "pause(?:ed|ing)?",
    "resume(?:ed|ing)?",
  ].map(requireTokenBoundary),
  address: [
    "\\b(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b",
    "(?<![0-9A-Fa-f:])(?:(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,7}:|(?:[0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,5}(?::[0-9A-Fa-f]{1,4}){1,2}|(?:[0-9A-Fa-f]{1,4}:){1,4}(?::[0-9A-Fa-f]{1,4}){1,3}|(?:[0-9A-Fa-f]{1,3}:){1,3}(?::[0-9A-Fa-f]{1,4}){1,4}|(?:[0-9A-Fa-f]{1,4}:){1,2}(?::[0-9A-Fa-f]{1,4}){1,5}|[0-9A-Fa-f]{1,4}:(?:(?::[0-9A-Fa-f]{1,4}){1,6})|:(?:(?::[0-9A-Fa-f]{1,4}){1,7}|:))(?![0-9A-Fa-f:])",
    "\\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\\b",
  ],
  url: ["\\b(?:https?|ftp|wss?):\\/\\/[-\\w+&@#/%?=~_|!:,.;]*[-\\w+&@#/%=~_|]"],
  uuid: ["\\b[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}\\b"],
  string: ["\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'"],
  operator: ["[\\-:=+&*()$\\[\\]<>?|{}]+"],
  version: [
    "\\bv\\d+(?:\\.\\d+){1,2}(?:-[a-z0-9.-]+)?\\b",
    "\\b\\d+(?:\\.\\d+){2,}(?:-[a-z0-9.-]+)?\\b",
    "\\blatest\\b",
    "\\brelease\\b",
    "\\bstable\\b",
    "\\bbeta\\b",
    "\\balpha\\b",
    "\\brevision\\b",
  ],
  size: ["\\b\\d+(?:\\.\\d+)?\\s*(?:[kmgtep]i?b|b|bytes?|[kmgtep]bps)\\b"],
  duration: [
    "\\b[-+]?\\d+(?:\\.\\d+)?\\s*(?:ns|µs|us|ms|sec|mins?|minutes|hrs?|hours|days|weeks|months|years)\\b",
  ],
  prompt: ["[$#](?=\\s)"],
} as const;

// ── Color sets ───────────────────────────────────────────────────────────────
// Colors chosen to be clearly visible against the respective terminal backgrounds
// while harmonising with each theme family's palette.

/** For dark terminal backgrounds (github-dark, dracula, nord, monokai, catppuccin-mocha …) */
const DARK_RULE_COLORS = {
  error: "#ff7b72",
  warn: "#e3b341",
  status: "#3fb950",
  success: "#56d364",
  containerUp: "#2ea043",
  containerExited: "#ffa657",
  containerRestarting: "#e3b341",
  containerPaused: "#8be9fd",
  field: "#58a6ff",
  kubectlState: "#ff9e64",
  git: "#d2a8ff",
  action: "#79c0ff",
  path: "#7ee787",
  option: "#ff9e64",
  datetime: "#f1fa8c",
  number: "#bd93f9",
  constant: "#ffb86c",
  address: "#2ac3de",
  url: "#8be9fd",
  uuid: "#ffb86c",
  string: "#ce9178",
  operator: "#ff79c6",
  version: "#ff9e64",
  size: "#2ac3de",
  duration: "#f1fa8c",
  prompt: "#f92672",
};

/** For light terminal backgrounds (github-light, solarized-light, catppuccin-latte …) */
const LIGHT_RULE_COLORS = {
  error: "#cf222e",
  warn: "#9a6700",
  status: "#116329",
  success: "#1a7f37",
  containerUp: "#116329",
  containerExited: "#bc4c00",
  containerRestarting: "#9a6700",
  containerPaused: "#2aa198",
  field: "#0969da",
  kubectlState: "#b04a00",
  git: "#8250df",
  action: "#0969da",
  path: "#008573",
  option: "#b04a00",
  datetime: "#a58900",
  number: "#6f42c1",
  constant: "#cb4b16",
  address: "#007197",
  url: "#2aa198",
  uuid: "#bc4c00",
  string: "#8c4600",
  operator: "#d33682",
  version: "#b04a00",
  size: "#007197",
  duration: "#859900",
  prompt: "#e00862",
};

// ── Built-in rule factory ────────────────────────────────────────────────────

/**
 * Returns the built-in highlight rules coloured for the current theme family.
 * IDs use the "builtin-" prefix so they never collide with user-created IDs
 * (which are timestamp-based: "kh-<timestamp>").
 */
export function getBuiltinRules(isDark: boolean): ResolvedHighlightRule[] {
  const c = isDark ? DARK_RULE_COLORS : LIGHT_RULE_COLORS;
  return [
    // Higher priority rules (complex structures, exact formats)
    {
      id: "builtin-url",
      name: "URL",
      patterns: [...BUILTIN_PATTERNS.url],
      color: c.url,
      enabled: true,
    },
    {
      id: "builtin-version",
      name: "Version",
      patterns: [...BUILTIN_PATTERNS.version],
      color: c.version,
      enabled: true,
    },
    {
      id: "builtin-address",
      name: "Address",
      patterns: [...BUILTIN_PATTERNS.address],
      color: c.address,
      enabled: true,
    },
    {
      id: "builtin-size",
      name: "Size",
      patterns: [...BUILTIN_PATTERNS.size],
      color: c.size,
      enabled: true,
    },
    {
      id: "builtin-string",
      name: "String",
      patterns: [...BUILTIN_PATTERNS.string],
      color: c.string,
      enabled: true,
    },
    {
      id: "builtin-option",
      name: "Option",
      patterns: [...BUILTIN_PATTERNS.option],
      color: c.option,
      enabled: true,
    },
    {
      id: "builtin-uuid",
      name: "UUID",
      patterns: [...BUILTIN_PATTERNS.uuid],
      color: c.uuid,
      enabled: true,
    },
    {
      id: "builtin-datetime",
      name: "DateTime",
      patterns: [...BUILTIN_PATTERNS.datetime],
      color: c.datetime,
      enabled: true,
    },
    {
      id: "builtin-path",
      name: "Path",
      patterns: [...BUILTIN_PATTERNS.path],
      color: c.path,
      enabled: true,
    },
    // Logical state and generic matching
    {
      id: "builtin-error",
      name: "Error",
      patterns: [...BUILTIN_PATTERNS.error],
      color: c.error,
      enabled: true,
    },
    {
      id: "builtin-warn",
      name: "Warning",
      patterns: [...BUILTIN_PATTERNS.warn],
      color: c.warn,
      enabled: true,
    },
    {
      id: "builtin-status",
      name: "Status",
      patterns: [...BUILTIN_PATTERNS.status],
      color: c.status,
      enabled: true,
    },
    {
      id: "builtin-success",
      name: "Success",
      patterns: [...BUILTIN_PATTERNS.success],
      color: c.success,
      enabled: true,
    },
    // docker ps 容器状态（大小写敏感，按语义分色）
    {
      id: "builtin-container-up",
      name: "Container Up",
      patterns: [...BUILTIN_PATTERNS.containerUp],
      color: c.containerUp,
      enabled: true,
      caseSensitive: true,
    },
    {
      id: "builtin-container-exited",
      name: "Container Exited",
      patterns: [...BUILTIN_PATTERNS.containerExited],
      color: c.containerExited,
      enabled: true,
      caseSensitive: true,
    },
    {
      id: "builtin-container-restarting",
      name: "Container Restarting",
      patterns: [...BUILTIN_PATTERNS.containerRestarting],
      color: c.containerRestarting,
      enabled: true,
      caseSensitive: true,
    },
    {
      id: "builtin-container-paused",
      name: "Container Paused",
      patterns: [...BUILTIN_PATTERNS.containerPaused],
      color: c.containerPaused,
      enabled: true,
      caseSensitive: true,
    },
    // 表格表头字段（大小写敏感）
    {
      id: "builtin-field",
      name: "Field",
      patterns: [...BUILTIN_PATTERNS.field],
      color: c.field,
      enabled: true,
      caseSensitive: true,
    },
    // kubectl 状态（大小写敏感）
    {
      id: "builtin-kubectl-state",
      name: "K8s State",
      patterns: [...BUILTIN_PATTERNS.kubectlState],
      color: c.kubectlState,
      enabled: true,
      caseSensitive: true,
    },
    // git 场景
    {
      id: "builtin-git",
      name: "Git",
      patterns: [...BUILTIN_PATTERNS.git],
      color: c.git,
      enabled: true,
    },
    // 命令动词（输入行实时着色）
    {
      id: "builtin-action",
      name: "Command",
      patterns: [...BUILTIN_PATTERNS.action],
      color: c.action,
      enabled: true,
    },
    // Base primitives
    {
      id: "builtin-duration",
      name: "Duration",
      patterns: [...BUILTIN_PATTERNS.duration],
      color: c.duration,
      enabled: true,
    },
    {
      id: "builtin-constant",
      name: "Constant",
      patterns: [...BUILTIN_PATTERNS.constant],
      color: c.constant,
      enabled: true,
    },
    {
      id: "builtin-number",
      name: "Number",
      patterns: [...BUILTIN_PATTERNS.number],
      color: c.number,
      enabled: true,
    },
    {
      id: "builtin-prompt",
      name: "Prompt",
      patterns: [...BUILTIN_PATTERNS.prompt],
      color: c.prompt,
      enabled: true,
    },
    {
      id: "builtin-operator",
      name: "Operator",
      patterns: [...BUILTIN_PATTERNS.operator],
      color: c.operator,
      enabled: true,
    },
  ];
}

// ── Quick-pick color palettes ─────────────────────────────────────────────────
// Curated from the actual ANSI palettes of the bundled dark / light themes.
// Each row has 6 swatches: error · warning · success · info · debug · accent.

/** 12 colors that stand out on dark terminal backgrounds. */
export const DARK_PALETTE: readonly string[] = [
  // row 1 – semantic tones
  "#ff7b72",
  "#e3b341",
  "#3fb950",
  "#79c0ff",
  "#d2a8ff",
  "#ff79c6",
  // row 2 – extended / accent tones
  "#ffa657",
  "#f1fa8c",
  "#56d364",
  "#8be9fd",
  "#bd93f9",
  "#ffb86c",
];

/** 12 colors that stand out on light terminal backgrounds. */
export const LIGHT_PALETTE: readonly string[] = [
  // row 1 – semantic tones
  "#cf222e",
  "#9a6700",
  "#116329",
  "#0969da",
  "#8250df",
  "#d33682",
  // row 2 – extended / accent tones
  "#bc4c00",
  "#a58900",
  "#1a7f37",
  "#2aa198",
  "#6f42c1",
  "#cb4b16",
];
