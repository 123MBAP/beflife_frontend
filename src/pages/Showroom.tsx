import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

type ApiShowroomVideo = {
    id: string;
    title: string;
    productLink: string;
    videoUrl: string;
    isActive?: boolean;
    createdAt?: string;
};

const getYouTubeEmbedSrc = (rawUrl: string): string | null => {
    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        return null;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    const host = url.hostname.toLowerCase();

    // youtu.be/<id>
    if (host === 'youtu.be') {
        const id = url.pathname.replace(/^\//, '').trim();
        if (!id) return null;
        return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
    }

    // youtube.com/watch?v=<id>
    if (host.endsWith('youtube.com')) {
        if (url.pathname.startsWith('/embed/')) {
            const id = url.pathname.replace('/embed/', '').trim();
            if (!id) return null;
            return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
        }

        const id = url.searchParams.get('v')?.trim();
        if (!id) return null;
        return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
    }

    return null;
};

const isDirectVideoUrl = (rawUrl: string): boolean => {
    const lowered = rawUrl.toLowerCase();
    return lowered.endsWith('.mp4') || lowered.endsWith('.webm') || lowered.endsWith('.ogg');
};

const Showroom: React.FC = () => {
    const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);

    const [videos, setVideos] = useState<ApiShowroomVideo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!apiBaseUrl) return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${apiBaseUrl}/api/showroom`);
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data?.ok) {
                    throw new Error(data?.error || 'Failed to load showroom videos');
                }
                const items: ApiShowroomVideo[] = Array.isArray(data?.videos) ? data.videos : [];
                setVideos(items);
            } catch (e: any) {
                const msg = e?.message || 'Failed to load showroom videos';
                setError(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [apiBaseUrl]);

    const activeVideos = useMemo(() => videos.filter((v) => v.isActive !== false), [videos]);

    return (
        <div className="bg-slate-50 min-h-screen pb-24 selection:bg-blue-600 selection:text-white">
            <div className="max-w-[1400px] mx-auto px-3 md:px-8 pt-6 md:pt-10">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
                    <div>
                        <h1 className="text-lg md:text-2xl font-extrabold text-slate-900">Showroom</h1>
                        <p className="text-xs md:text-sm text-slate-600 font-semibold">Watch product videos and jump straight to the product page.</p>
                    </div>
                    <Link
                        to="/products"
                        className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 transition no-underline w-max"
                    >
                        Browse Products
                    </Link>
                </div>

                {loading && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-widest animate-pulse">Loading…</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="bg-white rounded-2xl border border-red-100 p-10 text-center shadow-sm">
                        <span className="text-xs font-extrabold text-red-600 uppercase tracking-widest">{error}</span>
                    </div>
                )}

                {!loading && !error && activeVideos.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">No showroom videos yet</span>
                    </div>
                )}

                {!loading && !error && activeVideos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {activeVideos.map((v) => {
                            const embed = getYouTubeEmbedSrc(v.videoUrl);
                            const showVideoTag = !embed && isDirectVideoUrl(v.videoUrl);

                            return (
                                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-gray-100">
                                        <div className="text-[0.65rem] font-extrabold text-slate-900 uppercase tracking-widest line-clamp-2">{v.title}</div>
                                        <div className="text-[0.7rem] text-slate-500 font-semibold mt-1">{v.productLink}</div>
                                    </div>

                                    <div className="bg-black/5">
                                        {embed ? (
                                            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                                                <iframe
                                                    src={embed}
                                                    title={v.title}
                                                    className="absolute inset-0 w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            </div>
                                        ) : showVideoTag ? (
                                            <video src={v.videoUrl} controls className="w-full h-[240px] object-cover bg-black" />
                                        ) : (
                                            <div className="p-6 text-center">
                                                <a
                                                    href={v.videoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-600 font-extrabold text-xs hover:underline"
                                                >
                                                    Open video
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 flex items-center justify-between gap-3">
                                        <Link
                                            to={v.productLink}
                                            className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 transition no-underline flex-1"
                                        >
                                            View product
                                        </Link>
                                        <a
                                            href={v.videoUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center h-11 px-4 rounded-full border border-gray-200 text-slate-800 text-xs font-extrabold hover:border-blue-600 hover:text-blue-600 transition no-underline"
                                            aria-label="Open video in new tab"
                                        >
                                            Link
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Showroom;
