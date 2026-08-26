import type { Direction } from "@/lib/types";

export type ImportSource = "tradezella" | "topstep" | "mt5";

export interface ParsedTrade {
  opened_at: string;
  symbol: string;
  direction: Direction;
  r_multiple: number | null;
  pnl: number | null;
  entry: number | null;
  exit: number | null;
  setup: string | null;
  notes: string | null;
}

const SOURCE_HINT: Record<ImportSource, string> = {
  tradezella:
    "Columnas esperadas: Close Date, Symbol, Realized R Multiple, Side, Net P&L",
  topstep: "Columnas esperadas: Entry Time, Symbol, Qty, Net P&L",
  mt5: "Columnas esperadas: Time, Symbol, Type, Profit",
};

export function sourceHint(source: ImportSource) {
  return SOURCE_HINT[source];
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const vals = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = vals[idx] ?? ""));
    return row;
  });
}

function num(value: string | undefined) {
  const n = parseFloat(value ?? "");
  return Number.isNaN(n) ? null : n;
}

export function parseImportCsv(
  text: string,
  source: ImportSource,
): ParsedTrade[] {
  const rows = parseCsv(text);
  const trades: ParsedTrade[] = [];

  for (const row of rows) {
    let date = "";
    let symbol = "";
    let direction: Direction = "long";
    let rMultiple: number | null = null;
    let pnl: number | null = null;
    let entry: number | null = null;
    let exit: number | null = null;
    let setup: string | null = null;
    let notes: string | null = null;

    if (source === "tradezella") {
      date = row["Close Date"]?.slice(0, 10) || row["Date"]?.slice(0, 10) || "";
      symbol = row["Symbol"] ?? "";
      rMultiple = num(
        row["Realized RR"] ?? row["Realized R Multiple"] ?? row["R Multiple"],
      );
      const side = (row["Side"] ?? row["Direction"] ?? "").toLowerCase();
      direction = side.includes("short") ? "short" : "long";
      pnl = num(row["Net P&L"]);
      entry = num(row["Entry Price"]);
      exit = num(row["Exit Price"]);
      setup = row["Playbook"]?.trim() || null;
      notes =
        [row["Setups Mistakes"], row["Emotional Mistakes"]]
          .map((s) => (s ?? "").trim())
          .filter(Boolean)
          .join(" | ") || null;
    } else if (source === "topstep") {
      date = row["Entry Time"]?.slice(0, 10) || row["Date"]?.slice(0, 10) || "";
      symbol = row["Symbol"] ?? row["Instrument"] ?? "";
      pnl = num(row["P/L"] ?? row["Net P&L"]);
      direction = (num(row["Qty"]) ?? 1) < 0 ? "short" : "long";
    } else if (source === "mt5") {
      date = row["Time"]?.slice(0, 10) || row["Open Time"]?.slice(0, 10) || "";
      symbol = row["Symbol"] ?? "";
      pnl = num(row["Profit"]);
      direction = (row["Type"] ?? "").toLowerCase().includes("sell")
        ? "short"
        : "long";
    }

    if (!date || !symbol) continue;

    trades.push({
      opened_at: date,
      symbol: symbol.toUpperCase(),
      direction,
      r_multiple: rMultiple,
      pnl,
      entry,
      exit,
      setup,
      notes,
    });
  }

  return trades;
}
