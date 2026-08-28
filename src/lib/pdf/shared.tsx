import { StyleSheet, View, Text, Page, Document, Image } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import fs from "node:fs";
import path from "node:path";

const logoCache = new Map<string, string | null>();
function loadLogoDataUri(file: "mark-black.png" | "mark-white.png"): string | null {
  if (logoCache.has(file)) return logoCache.get(file)!;
  let result: string | null = null;
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public/icons", file));
    result = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    result = null;
  }
  logoCache.set(file, result);
  return result;
}

export function getLogoDataUri(variant: "black" | "white" = "black"): string | null {
  return loadLogoDataUri(variant === "white" ? "mark-white.png" : "mark-black.png");
}

export const colors = {
  ink: "#111113",
  muted: "#5a5a60",
  border: "#e4e2da",
  accent: "#a8813f",
  surface: "#f7f6f2",
  danger: "#b3352f",
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 10,
    color: colors.ink,
    fontFamily: "Helvetica",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandMark: { width: 26, height: 26 },
  brandName: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  docMeta: { textAlign: "right", fontSize: 8, color: colors.muted },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: colors.muted, marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: { flexDirection: "row", marginBottom: 6 },
  col: { flex: 1 },
  label: { fontSize: 8, color: colors.muted, textTransform: "uppercase", marginBottom: 2 },
  value: { fontSize: 10, color: colors.ink },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: "hidden" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: { flexDirection: "row" },
  tableCellLabel: {
    width: "35%",
    padding: 8,
    backgroundColor: colors.surface,
    fontSize: 9,
    color: colors.muted,
  },
  tableCellValue: { width: "65%", padding: 8, fontSize: 9 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    fontSize: 8,
    color: colors.muted,
  },
  confidentialBanner: {
    backgroundColor: "#fbe9e7",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
  confidentialText: { fontSize: 9, color: colors.danger, fontFamily: "Helvetica-Bold" },
});

export function PdfHeader({ docTitle, subtitle }: { docTitle: string; subtitle: string }) {
  const now = new Intl.DateTimeFormat("es-UY", { dateStyle: "long", timeStyle: "short" }).format(new Date());
  const logo = getLogoDataUri();
  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, no alt prop */}
          {logo && <Image src={logo} style={styles.brandMark} />}
          <Text style={styles.brandName}>MR14</Text>
        </View>
        <View style={styles.docMeta}>
          <Text>Generado el {now}</Text>
        </View>
      </View>
      <Text style={styles.title}>{docTitle}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );
}

export function PdfFooter() {
  return (
    <Text
      style={styles.footer}
      fixed
      render={({ pageNumber, totalPages }) => `MR14 · Mateo Rodríguez · mateordgz.dev — Página ${pageNumber} de ${totalPages}`}
    />
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableCellLabel}>{label}</Text>
      <Text style={styles.tableCellValue}>{value || "-"}</Text>
    </View>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>{children}</View>
    </View>
  );
}

export function PdfPage({ children }: { children: ReactNode }) {
  return (
    <Document
      title="MR14"
      author="MR14 · Mateo Rodríguez"
    >
      <Page size="A4" style={styles.page}>
        {children}
        <PdfFooter />
      </Page>
    </Document>
  );
}
