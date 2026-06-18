import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, PlayCircle, Rotate3D, Microscope, FileText, Image as ImageIcon, Info, ExternalLink } from "lucide-react";

// =========================================================
// PLANTILLA PARA PÓSTER DE CONGRESO — DINÁMICA MOLECULAR
// =========================================================
// Sustituye estos enlaces por los definitivos cuando subas los archivos.
// Recomendación:
// - modelUrl: enlace público directo a .pdb o .cif del dímero.
// - videoUrl: enlace directo al .mp4 o enlace embebible.
// - images: enlaces a figuras PNG/JPG/PDF descargables.

const PROJECT = {
  title: "Dinámica molecular del homodímero E180-JAO2",
  subtitle: "Explora el dímero en 3D, visualiza la trayectoria y descarga material complementario.",
  authors: "Gabriel Sanchez Atrian et al.",
  affiliation: "National Biotechnology Center (CNB)",
  contact: "gabriel.sanchez@cnb.csic.es",
  modelUrl: "https://raw.githubusercontent.com/gabrisanat15/RBMP26_Dimer/main/dimer_poster.cif",
  videoUrl: "https://github.com/gabrisanat15/RBMP26_Dimer/raw/refs/heads/main/movie3.mp4",
  posterUrl: "", // Opcional: enlace al póster en PDF
};

const HIGHLIGHTED_RESIDUES = [
  {
    label: "Interfaz · cadena A",
    chain: "A",
    residues: "3,44,45,46,47,49,50,55,57,58,59",
    color: "#ef4444",
    description: "Residuos de la cadena A implicados en contactos de interfaz durante la dinámica molecular."
  },
  {
    label: "Interfaz · cadena B",
    chain: "B",
    residues: "43,46,47,49,171,175",
    color: "#3b82f6",
    description: "Residuos de la cadena B implicados en contactos de interfaz durante la dinámica molecular."
  },
];

const METHOD = [
  { key: "System", value: "E180-JAO2 dimer, initial structure obtained from AlphaFold3 and monomers refined using C-I-Tasser." },
  { key: "Preparación", value: "Protonación, limpieza de estructura, eliminación/retención de moléculas relevantes y generación del sistema solvado." },
  { key: "Software", value: "[OpenMM / GROMACS / AMBER / NAMD]" },
  { key: "Campo de fuerza", value: "[AMBER ff14SB / CHARMM36m / otro]" },
  { key: "Solvente", value: "Agua explícita [TIP3P/SPC/E] con iones para neutralizar y/o ajustar fuerza iónica." },
  { key: "Condiciones", value: "[300 K], [1 atm], condiciones periódicas de contorno." },
  { key: "Protocolo", value: "Minimización → equilibración NVT/NPT → producción." },
  { key: "Tiempo de producción", value: "[X ns / μs]" },
  { key: "Análisis", value: "RMSD, RMSF, radio de giro, contactos de interfaz, distancias relevantes y visualización de trayectoria." },
];

const IMAGES = [
  {
    title: "RMSD del dímero",
    description: "Evolución temporal de la desviación estructural durante la simulación.",
    url: "",
  },
  {
    title: "RMSF por residuo",
    description: "Flexibilidad local de cada residuo a lo largo de la dinámica molecular.",
    url: "",
  },
  {
    title: "Contactos en la interfaz",
    description: "Mapa o resumen de contactos principales entre monómeros.",
    url: "",
  },
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`No se pudo cargar el script externo: ${src}`));
    document.body.appendChild(script);
  });
}

function MoleculeViewer({ mode = "default" }) {
  const viewerId = useMemo(() => `viewer-${mode}-${Math.random().toString(36).slice(2)}`, [mode]);
  const [status, setStatus] = useState("Cargando visor molecular…");

  useEffect(() => {
    let cancelled = false;

    async function initViewer() {
      try {
        await loadScript("https://unpkg.com/3dmol@2.0.4/build/3Dmol-min.js");
        if (cancelled) return;

        const element = document.getElementById(viewerId);

        if (!element) {
          throw new Error("No se encontró el contenedor HTML del visor.");
        }

        if (!window.$3Dmol) {
          throw new Error("3Dmol.js no se cargó correctamente.");
        }

        element.innerHTML = "";
        const viewer = window.$3Dmol.createViewer(element, {
          backgroundColor: "white",
        });

        const applyStyles = () => {
          viewer.setStyle({}, { cartoon: { color: "spectrum" } });

          if (mode === "highlight") {
            HIGHLIGHTED_RESIDUES.forEach((group) => {
              const residues = group.residues
                .split(",")
                .map((r) => Number(r.trim()))
                .filter(Boolean);

              const selection = group.chain
                ? { chain: group.chain, resi: residues }
                : { resi: residues };

              viewer.setStyle(selection, {
                cartoon: { color: group.color },
                stick: { color: group.color, radius: 0.25 }
              });

              viewer.addSurface(
                window.$3Dmol.SurfaceType.VDW,
                { opacity: 0.18, color: group.color },
                selection
              );
            });
          }

          viewer.zoomTo();
          viewer.render();
          viewer.spin(false);
        };

        if (PROJECT.modelUrl) {
          const response = await fetch(PROJECT.modelUrl);

          if (!response.ok) {
            throw new Error(`No se pudo descargar el PDB: ${response.status}`);
          }

          const pdbText = await response.text();

          if (!pdbText.includes("ATOM") && !pdbText.includes("HETATM")) {
            throw new Error("El archivo descargado no parece un PDB válido.");
          }

          viewer.addModel(pdbText, "pdb");
          applyStyles();
          setStatus("Modelo cargado. Rota con un dedo y haz zoom con dos dedos.");
        } else {
          window.$3Dmol.download("pdb:1A3N", viewer, {}, () => {
            applyStyles();
            setStatus("Demo cargada. Sustituye PROJECT.modelUrl por el PDB/CIF real del dímero.");
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatus(`Error al cargar visor: ${message}`);
      }
    }

    initViewer();
    return () => {
      cancelled = true;
    };
  }, [viewerId, mode]);

  return (
    <div className="space-y-2">
      <div id={viewerId} className="h-[420px] w-full overflow-hidden rounded-2xl border bg-white shadow-inner" />
      <p className="text-xs text-slate-500">{status}</p>
    </div>
  );
}

function EmptyAsset({ icon: Icon, title, text }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50 p-6 text-center">
      <Icon className="mb-3 h-10 w-10 text-slate-400" />
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{text}</p>
    </div>
  );
}

export default function MDDimerPosterPage() {
  const [viewerMode, setViewerMode] = useState("default");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <Badge className="mb-4 rounded-full px-3 py-1">Póster interactivo · Dinámica molecular</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{PROJECT.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">{PROJECT.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
              <span>{PROJECT.authors}</span>
              <span>·</span>
              <span>{PROJECT.affiliation}</span>
              <span>·</span>
              <span>{PROJECT.contact}</span>
            </div>
          </div>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Info className="mt-1 h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="font-semibold">Cómo usar esta página</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    En móvil: rota el dímero con un dedo y haz zoom con dos dedos. Usa los botones para alternar entre la vista general y la vista con residuos destacados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold"><Rotate3D className="h-5 w-5" /> Visor 3D del dímero</h2>
                  <p className="mt-1 text-sm text-slate-600">Vista interactiva del modelo estructural.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant={viewerMode === "default" ? "default" : "outline"} onClick={() => setViewerMode("default")}>Dímero completo</Button>
                  <Button variant={viewerMode === "highlight" ? "default" : "outline"} onClick={() => setViewerMode("highlight")}>Residuos destacados</Button>
                </div>
              </div>
              <MoleculeViewer mode={viewerMode} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 md:p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold"><PlayCircle className="h-5 w-5" /> Vídeo de la dinámica molecular</h2>
              <p className="mt-1 text-sm text-slate-600">Trayectoria renderizada en formato MP4 para una visualización rápida.</p>
              <div className="mt-4">
                {PROJECT.videoUrl ? (
                  <video className="w-full rounded-2xl border bg-black" controls playsInline preload="metadata" src={PROJECT.videoUrl} />
                ) : (
                  <EmptyAsset icon={PlayCircle} title="Vídeo pendiente" text="Cuando tengas el MP4 subido, pega el enlace en PROJECT.videoUrl para que aparezca aquí." />
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 md:p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold"><Microscope className="h-5 w-5" /> Aminoácidos destacados</h2>
              <div className="mt-4 space-y-3">
                {HIGHLIGHTED_RESIDUES.map((group) => (
                  <div key={group.label} className="rounded-2xl border p-4">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: group.color }} />
                      <h3 className="font-semibold">{group.label}</h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{group.description}</p>
                    <p className="mt-2 text-xs font-medium text-slate-500">Residuos: {group.residues}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 md:p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold"><FileText className="h-5 w-5" /> Datos de la simulación</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {METHOD.map((item) => (
                  <div key={item.key} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.key}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold"><ImageIcon className="h-5 w-5" /> Figuras y material descargable</h2>
                  <p className="mt-1 text-sm text-slate-600">Resultados adicionales para quien quiera profundizar tras escanear el QR.</p>
                </div>
                {PROJECT.posterUrl && (
                  <Button asChild variant="outline">
                    <a href={PROJECT.posterUrl} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" /> Descargar póster</a>
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {IMAGES.map((image) => (
                  <div key={image.title} className="rounded-2xl border bg-white p-4">
                    {image.url ? (
                      <img src={image.url} alt={image.title} className="mb-3 aspect-video w-full rounded-xl object-cover" />
                    ) : (
                      <div className="mb-3 flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                    <h3 className="font-semibold">{image.title}</h3>
                    <p className="mt-1 min-h-[48px] text-sm leading-6 text-slate-600">{image.description}</p>
                    <Button className="mt-3 w-full" variant="outline" disabled={!image.url} asChild={Boolean(image.url)}>
                      {image.url ? (
                        <a href={image.url} download target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" /> Descargar</a>
                      ) : (
                        <span><Download className="mr-2 h-4 w-4" /> Pendiente</span>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="mt-8 rounded-2xl bg-slate-900 p-5 text-white">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="font-semibold">Página preparada para acceso mediante QR desde póster de congreso.</p>
              <p className="mt-1 text-sm text-slate-300">Siguiente paso: alojar la página y generar el QR con la URL pública.</p>
            </div>
            <Button variant="secondary" asChild>
              <a href={`mailto:${PROJECT.contact}`}><ExternalLink className="mr-2 h-4 w-4" /> Contacto</a>
            </Button>
          </div>
        </footer>
      </section>
    </main>
  );
}
