type LogLevel = "debug" | "info" | "warn" | "error" | "success";

type LoggerOptions = {
  name?: string;
  showTimestamp?: boolean;
};

type ColorName = "gray" | "cyan" | "yellow" | "red" | "green" | "magenta";

const levelConfig: Record<LogLevel, { label: string; color: ColorName }> = {
  debug: { label: "DEBUG", color: "gray" },
  info: { label: "INFO", color: "cyan" },
  warn: { label: "WARN", color: "yellow" },
  error: { label: "ERROR", color: "red" },
  success: { label: "OK", color: "green" },
};

const RESET = "\x1b[0m";

function getAnsiColor(colorName: ColorName): string {
  const code = Bun.color(colorName, "ansi");
  return code ?? "";
}

function formatTimestamp(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const ms = now.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function colorize(text: string, colorName: ColorName): string {
  const ansi = getAnsiColor(colorName);
  return `${ansi}${text}${RESET}`;
}

function formatMessage(
  level: LogLevel,
  message: string,
  options: LoggerOptions,
): string {
  const config = levelConfig[level];
  const parts: string[] = [];

  if (options.showTimestamp !== false) {
    parts.push(colorize(formatTimestamp(), "gray"));
  }

  const levelLabel = colorize(config.label.padEnd(5), config.color);
  parts.push(levelLabel);

  if (options.name) {
    parts.push(colorize(`[${options.name}]`, "magenta"));
  }

  parts.push(message);

  return parts.join(" ");
}

function createLogMethod(level: LogLevel, options: LoggerOptions) {
  return (message: string, ...args: unknown[]) => {
    const formatted = formatMessage(level, message, options);
    const consoleFn =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : console.log;

    if (args.length > 0) {
      consoleFn(formatted, ...args);
    } else {
      consoleFn(formatted);
    }
  };
}

export type Logger = {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  success: (message: string, ...args: unknown[]) => void;
  child: (name: string) => Logger;
};

export function createLogger(options: LoggerOptions = {}): Logger {
  const opts: LoggerOptions = {
    showTimestamp: true,
    ...options,
  };

  return {
    debug: createLogMethod("debug", opts),
    info: createLogMethod("info", opts),
    warn: createLogMethod("warn", opts),
    error: createLogMethod("error", opts),
    success: createLogMethod("success", opts),
    child: (name: string) =>
      createLogger({
        ...opts,
        name: opts.name ? `${opts.name}:${name}` : name,
      }),
  };
}

export const logger = createLogger();
