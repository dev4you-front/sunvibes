import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import type { Podcast } from "../../@types/podcast";
import { stripHtml, truncateWords, formatDate, pickMembers, Colors, slugify } from "../../utils";
import { ROUTES } from "../../App";
import { coverOriginalUrl } from "../../utils/media";

//On récupère les données de l'api
async function fetchLatestPodcasts(limit = 3, signal?: AbortSignal): Promise<Podcast[]> {
    const { data } = await api.get("/podcasts", {
        params: {
            pagination: false,
        },
        signal,
        headers: { Accept: "application/ld+json, application/json" },
    });

    const raw: any[] = pickMembers(data);

    const last3 = raw
        .slice()
        .sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0))
        .slice(0, limit);

    // on gère l'url de l'image ou on en met une par defaut
    return last3.map((p: any): Podcast => {
        const src = p?.attributes ? { id: p.id, ...p.attributes } : p;

        const candidate =
            src.coverUrl ??
            src.cover?.url ??
            src.image?.url ??
            src.image ??
            undefined;

        return {
            id: src.id,
            title: src.title ?? "Sans titre",
            coverUrl: coverOriginalUrl(candidate), // prêt pour <img>
            description: src.description ?? src.content ?? src.summary ?? "",
            createdAt: src.createdAt ?? src.publishedAt ?? src.date ?? null,
            videoUrl: src.videoUrl ?? src.video ?? null,
        };
    });
}

export default function LatestPodcasts({ maxWords = 40 }: { maxWords?: number }) {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [pods, setPods] = useState<Podcast[]>([]);

    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            try {
                const list = await fetchLatestPodcasts(3, controller.signal);
                setPods(list);
            } catch (e: any) {
                if (e?.code !== "ERR_CANCELED" && e?.name !== "CanceledError") {
                    setErr(e?.message ?? "Erreur réseau");
                }
            } finally {
                setLoading(false);
            }
        })();
        return () => controller.abort();
    }, []);

    return (
        <section id="podcasts" className="relative isolate">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
                <div className="mb-6 md:mb-10 flex items-center justify-center sm:items-end sm:justify-between">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center sm:text-left">
                        Derniers podcasts
                    </h2>
                    <Link
                        to={ROUTES.PODCASTS}
                        className="hidden sm:inline-block text-sm font-semibold text-white/80 hover:text-white transition">
                        Tous les podcasts →
                    </Link>
                </div>

                <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {loading &&
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <div className="aspect-[16/9] w-full rounded-xl bg-white/10" />
                                <div className="mt-3 h-5 w-3/4 rounded bg-white/10" />
                                <div className="mt-2 h-4 w-full rounded bg-white/10" />
                                <div className="mt-2 h-4 w-5/6 rounded bg-white/10" />
                            </div>
                        ))}

                    {!loading && err && (
                        <div className="col-span-full rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
                            Erreur de chargement des podcasts : {err}
                        </div>
                    )}

                    {!loading && !err && pods.length === 0 && (
                        <div className="col-span-full rounded-xl border border-white/10 bg-white/5 p-6 text-white/80 text-center">
                            Aucun podcast pour le moment.
                        </div>
                    )}

                    {!loading && !err &&
                        pods.map((p) => {
                            const plain = truncateWords(stripHtml(p.description ?? ""), maxWords);

                            return (
                                <article
                                    key={p.id}
                                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-transform duration-300 hover:scale-[1.03]"
                                >
                                    <div className="aspect-[16/9] w-full overflow-hidden bg-white/5">
                                        <img
                                            src={p.coverUrl} // déjà placeholder si manquant
                                            alt={p.title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className="p-4">
                                        {p.createdAt && (
                                            <time className="text-xs uppercase tracking-wide text-white/60">
                                                {formatDate(p.createdAt)}
                                            </time>
                                        )}

                                        <h3 className="mt-1 line-clamp-2 text-lg font-bold text-white">
                                            {p.title}
                                        </h3>

                                        {plain && <p className="mt-2 text-sm text-white/70">{plain}</p>}

                                        <div className="mt-3">
                                            <Link
                                                to={`/podcasts/${p.id}-${slugify(p.title)}`}
                                                className="inline-block rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 transition"
                                            >
                                                Écouter
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                </div>

                <div className="mt-8 sm:hidden text-center">
                    <Link
                        to={ROUTES.PODCASTS}
                        className="inline-block rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5 transition">
                        Tous les podcasts
                    </Link>
                </div>
            </div>

            <div className="w-full">
                <svg
                    className="h-28 md:h-36 w-full"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1440 320"
                    preserveAspectRatio="none"
                    style={{ color: Colors.lightBg }}
                    aria-hidden="true">
                    <path
                        className="fill-current"
                        fillOpacity="0.99"
                        d="M0,272 C240,208 480,96 720,144 C960,192 1200,256 1440,224 L1440,320 L0,320 Z"
                        fill="currentColor" />
                </svg>
            </div>
        </section>
    );
}
