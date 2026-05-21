// PDF generation via pdfmake. Client-side only — pdfmake bundles fonts and
// runs entirely in the browser, so all exports here are dynamically imported.

import type {
  Content,
  ContentTable,
  TDocumentDefinitions,
  TableCell,
} from "pdfmake/interfaces";

type PdfMakeStatic = typeof import("pdfmake/build/pdfmake");

let pdfMakePromise: Promise<PdfMakeStatic> | null = null;

async function loadPdfMake(): Promise<PdfMakeStatic> {
  if (pdfMakePromise) return pdfMakePromise;
  pdfMakePromise = (async () => {
    const [pdfMakeMod, vfsMod] = await Promise.all([
      import("pdfmake/build/pdfmake"),
      import("pdfmake/build/vfs_fonts"),
    ]);
    const pdfMake = (pdfMakeMod as { default?: PdfMakeStatic }).default ??
      (pdfMakeMod as unknown as PdfMakeStatic);
    const vfs = (vfsMod as { default?: Record<string, string> }).default ??
      (vfsMod as unknown as Record<string, string>);
    pdfMake.addVirtualFileSystem(vfs);
    return pdfMake;
  })();
  return pdfMakePromise;
}

const FS_PRIMARY = "#1e90d6";
const INK = "#161616";
const INK_MUTED = "#5a5a5e";
const HAIRLINE = "#e3dfd6";
const PARCHMENT = "#faf7f0";
const SUCCESS = "#1a6d2f";
const WARN = "#a06400";
const DANGER = "#c8102e";

export const PDF_COLORS = {
  primary: FS_PRIMARY,
  ink: INK,
  inkMuted: INK_MUTED,
  hairline: HAIRLINE,
  parchment: PARCHMENT,
  success: SUCCESS,
  warn: WARN,
  danger: DANGER,
};

export type StatTile = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warn" | "danger";
};

export type ReportMeta = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  metadata?: { label: string; value: string }[];
};

export function reportHeader(meta: ReportMeta): Content[] {
  const parts: Content[] = [
    {
      text: meta.eyebrow,
      style: "eyebrow",
      margin: [0, 0, 0, 4],
    },
    {
      text: meta.title,
      style: "title",
      margin: [0, 0, 0, meta.subtitle ? 4 : 10],
    },
  ];
  if (meta.subtitle) {
    parts.push({
      text: meta.subtitle,
      style: "subtitle",
      margin: [0, 0, 0, 10],
    });
  }
  if (meta.metadata && meta.metadata.length > 0) {
    const cols = 2;
    const rows: TableCell[][] = [];
    for (let i = 0; i < meta.metadata.length; i += cols) {
      const row: TableCell[] = [];
      for (let j = 0; j < cols; j++) {
        const item = meta.metadata[i + j];
        row.push(
          item
            ? {
                stack: [
                  { text: item.label, style: "metaLabel" },
                  { text: item.value, style: "metaValue" },
                ],
                border: [false, false, false, false],
              }
            : { text: "", border: [false, false, false, false] },
        );
      }
      rows.push(row);
    }
    parts.push({
      table: {
        widths: new Array(cols).fill("*"),
        body: rows,
      },
      layout: "noBorders",
      margin: [0, 4, 0, 12],
    });
  }
  parts.push({
    canvas: [
      {
        type: "line",
        x1: 0,
        y1: 0,
        x2: 515,
        y2: 0,
        lineWidth: 0.5,
        lineColor: HAIRLINE,
      },
    ],
    margin: [0, 0, 0, 14],
  });
  return parts;
}

export function sectionTitle(text: string): Content {
  return {
    text,
    style: "section",
    margin: [0, 14, 0, 8],
  };
}

export function statTiles(tiles: StatTile[]): Content {
  const cols = Math.min(4, tiles.length);
  const rows: TableCell[][] = [];
  for (let i = 0; i < tiles.length; i += cols) {
    const row: TableCell[] = [];
    for (let j = 0; j < cols; j++) {
      const t = tiles[i + j];
      if (!t) {
        row.push({ text: "", border: [false, false, false, false] });
        continue;
      }
      const valueColor =
        t.tone === "success"
          ? SUCCESS
          : t.tone === "warn"
            ? WARN
            : t.tone === "danger"
              ? DANGER
              : INK;
      row.push({
        stack: [
          { text: t.label.toUpperCase(), style: "tileLabel" },
          {
            text: String(t.value),
            color: valueColor,
            style: "tileValue",
          },
          ...(t.hint
            ? [{ text: t.hint, style: "tileHint" } as Content]
            : []),
        ],
        fillColor: PARCHMENT,
        margin: [8, 8, 8, 8],
        border: [true, true, true, true],
      });
    }
    rows.push(row);
  }
  return {
    table: {
      widths: new Array(cols).fill("*"),
      body: rows,
    },
    layout: {
      hLineColor: () => HAIRLINE,
      vLineColor: () => HAIRLINE,
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 6],
  };
}

export type DataColumn<T> = {
  header: string;
  width?: "*" | "auto" | number;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => string | number;
  color?: (row: T) => string | undefined;
};

export function dataTable<T>(
  rows: T[],
  columns: DataColumn<T>[],
  options: { emptyText?: string; zebra?: boolean } = {},
): Content {
  if (rows.length === 0) {
    return {
      text: options.emptyText ?? "Aucune donnée.",
      style: "emptyText",
      margin: [0, 4, 0, 8],
    };
  }
  const widths = columns.map((c) => c.width ?? "*");
  const headerRow: TableCell[] = columns.map((c) => ({
    text: c.header.toUpperCase(),
    style: "thCell",
    alignment: c.align ?? "left",
    fillColor: PARCHMENT,
  }));
  const body: TableCell[][] = [headerRow];
  rows.forEach((r, i) => {
    body.push(
      columns.map((c) => {
        const v = c.render(r, i);
        const color = c.color?.(r);
        const cell: TableCell = {
          text: String(v),
          style: "tdCell",
          alignment: c.align ?? "left",
        };
        if (color) cell.color = color;
        if (options.zebra !== false && i % 2 === 1) {
          cell.fillColor = "#fbfaf6";
        }
        return cell;
      }),
    );
  });
  return {
    table: { widths, body, headerRows: 1 },
    layout: {
      hLineColor: () => HAIRLINE,
      vLineColor: () => HAIRLINE,
      hLineWidth: (i: number) => (i === 0 || i === 1 ? 0.8 : 0.4),
      vLineWidth: () => 0,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5,
    },
    margin: [0, 0, 0, 6],
  } as ContentTable;
}

export function paragraph(text: string, opts?: { muted?: boolean }): Content {
  return {
    text,
    style: opts?.muted ? "muted" : "body",
    margin: [0, 0, 0, 6],
  };
}

// Horizontal bar chart drawn as a column of mini-rows. Useful for hourly
// distributions or ranked categories where a visual cue helps reading.
export function horizontalBars(
  data: { label: string; value: number; color?: string }[],
  options: { max?: number; valueSuffix?: string; width?: number } = {},
): Content {
  if (data.length === 0) {
    return paragraph("Aucune donnée.", { muted: true });
  }
  const max = options.max ?? Math.max(1, ...data.map((d) => d.value));
  const width = options.width ?? 360;
  const rows: TableCell[][] = data.map((d) => {
    const pct = Math.max(0, Math.min(1, d.value / max));
    const barWidth = Math.max(2, Math.round(width * pct));
    const color = d.color ?? FS_PRIMARY;
    return [
      {
        text: d.label,
        style: "tdCell",
        alignment: "left",
        border: [false, false, false, false],
      },
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 2,
            w: width,
            h: 8,
            color: PARCHMENT,
          },
          {
            type: "rect",
            x: 0,
            y: 2,
            w: barWidth,
            h: 8,
            color,
          },
        ],
        border: [false, false, false, false],
      },
      {
        text: `${d.value}${options.valueSuffix ?? ""}`,
        style: "tdCell",
        alignment: "right",
        border: [false, false, false, false],
      },
    ];
  });
  return {
    table: {
      widths: ["auto", "*", "auto"],
      body: rows,
    },
    layout: "noBorders",
    margin: [0, 2, 0, 8],
  };
}

export function pageFooter(text: string): Content {
  return {
    text,
    style: "footer",
    margin: [0, 24, 0, 0],
  };
}

export type BuildOptions = {
  filename: string;
  content: Content[];
  pageOrientation?: "portrait" | "landscape";
};

export async function downloadPdf(opts: BuildOptions): Promise<void> {
  const pdfMake = await loadPdfMake();
  const doc: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: opts.pageOrientation ?? "portrait",
    pageMargins: [40, 36, 40, 44],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: INK,
      lineHeight: 1.25,
    },
    styles: {
      eyebrow: {
        fontSize: 8,
        characterSpacing: 1.2,
        color: INK_MUTED,
        bold: true,
      },
      title: {
        fontSize: 20,
        bold: true,
        color: INK,
      },
      subtitle: {
        fontSize: 11,
        color: INK_MUTED,
      },
      section: {
        fontSize: 13,
        bold: true,
        color: INK,
      },
      metaLabel: {
        fontSize: 8,
        color: INK_MUTED,
        bold: true,
        characterSpacing: 0.6,
      },
      metaValue: {
        fontSize: 10,
        color: INK,
        margin: [0, 1, 0, 0],
      },
      tileLabel: {
        fontSize: 7,
        characterSpacing: 0.8,
        color: INK_MUTED,
        bold: true,
      },
      tileValue: {
        fontSize: 16,
        bold: true,
        margin: [0, 4, 0, 2],
      },
      tileHint: {
        fontSize: 8,
        color: INK_MUTED,
      },
      thCell: {
        fontSize: 7.5,
        bold: true,
        color: INK_MUTED,
        characterSpacing: 0.6,
      },
      tdCell: {
        fontSize: 9.5,
        color: INK,
      },
      body: {
        fontSize: 10,
        color: INK,
      },
      muted: {
        fontSize: 9.5,
        color: INK_MUTED,
        italics: true,
      },
      emptyText: {
        fontSize: 10,
        color: INK_MUTED,
        italics: true,
      },
      footer: {
        fontSize: 8,
        color: INK_MUTED,
      },
    },
    content: opts.content,
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: "FileSanté — rapport généré côté client · Loi 25",
          style: "footer",
          margin: [40, 12, 0, 0],
        },
        {
          text: `${currentPage} / ${pageCount}`,
          alignment: "right",
          style: "footer",
          margin: [0, 12, 40, 0],
        },
      ],
    }),
  };
  pdfMake.createPdf(doc).download(opts.filename);
}

export function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
