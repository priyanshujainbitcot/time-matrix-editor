'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { useIsExtension } from '@/hooks/useIsExtension';

export type QuickLink = {
    name: string;
    url: string;
};

export const DEFAULT_QUICK_LINKS: QuickLink[] = [
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Reddit', url: 'https://www.reddit.com' },
    { name: 'Gmail', url: 'https://mail.google.com' },
    { name: 'ChatGPT', url: 'https://chatgpt.com' },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org' },
];

const CUSTOM_LINKS_STORAGE_KEY = 'tnmatrix-custom-quick-links';
const HIDDEN_LINKS_STORAGE_KEY = 'tnmatrix-hidden-quick-links';

type ChromeTopSite = {
    title: string;
    url: string;
};

type ChromeTopSitesApi = {
    get: (callback: (sites: ChromeTopSite[]) => void) => void;
};

declare global {
    interface Window {
        chrome?: {
            topSites?: ChromeTopSitesApi;
        };
    }
}

type QuickLinksProps = {
    links?: QuickLink[];
};

function readStoredLinks(): QuickLink[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const storedLinks = JSON.parse(window.localStorage.getItem(CUSTOM_LINKS_STORAGE_KEY) ?? '[]');

        if (!Array.isArray(storedLinks)) {
            return [];
        }

        return storedLinks.filter(
            (link): link is QuickLink =>
                typeof link?.name === 'string' && typeof link?.url === 'string',
        );
    } catch {
        return [];
    }
}

function readHiddenLinks(): string[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const storedLinks = JSON.parse(window.localStorage.getItem(HIDDEN_LINKS_STORAGE_KEY) ?? '[]');
        return Array.isArray(storedLinks) && storedLinks.every((url) => typeof url === 'string')
            ? storedLinks
            : [];
    } catch {
        return [];
    }
}

export default function QuickLinks({ links = DEFAULT_QUICK_LINKS }: QuickLinksProps) {
    const isExtension = useIsExtension();
    const [topSites, setTopSites] = useState<QuickLink[]>(links);
    const [customLinks, setCustomLinks] = useState<QuickLink[]>(readStoredLinks);
    const [hiddenLinks, setHiddenLinks] = useState<string[]>(readHiddenLinks);
    const [isAdding, setIsAdding] = useState(false);
    const [siteName, setSiteName] = useState('');
    const [siteUrl, setSiteUrl] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (!isExtension) {
            return;
        }

        const chromeTopSites = window.chrome?.topSites;

        if (!chromeTopSites) {
            return;
        }

        chromeTopSites.get((sites) => {
            if (sites.length === 0) {
                setTopSites(links);
                return;
            }

            setTopSites(
                sites.slice(0, 8).map(({ title, url }) => ({
                    name: title || url,
                    url,
                })),
            );
        });
    }, [isExtension, links]);

    const visibleLinks = [
        ...customLinks,
        ...topSites.filter((link) => !hiddenLinks.includes(link.url)),
    ].slice(0, 8);

    const handleAddSite = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const enteredUrl = siteUrl.trim();
        const normalizedUrl = /^https?:\/\//i.test(enteredUrl) ? enteredUrl : `https://${enteredUrl}`;

        try {
            const parsedUrl = new URL(normalizedUrl);
            const newLink = {
                name: siteName.trim() || parsedUrl.hostname.replace(/^www\./, ''),
                url: parsedUrl.toString(),
            };

            if (visibleLinks.some((link) => link.url === newLink.url)) {
                setFormError('That website is already in your quick links.');
                return;
            }

            const nextCustomLinks = [newLink, ...customLinks];
            setCustomLinks(nextCustomLinks);
            setHiddenLinks((currentLinks) => currentLinks.filter((url) => url !== newLink.url));
            window.localStorage.setItem(CUSTOM_LINKS_STORAGE_KEY, JSON.stringify(nextCustomLinks));
            setSiteName('');
            setSiteUrl('');
            setFormError('');
            setIsAdding(false);
        } catch {
            setFormError('Enter a valid website URL.');
        }
    };

    const handleRemoveSite = (link: QuickLink) => {
        const isCustomLink = customLinks.some((customLink) => customLink.url === link.url);

        if (isCustomLink) {
            const nextCustomLinks = customLinks.filter((customLink) => customLink.url !== link.url);
            setCustomLinks(nextCustomLinks);
            window.localStorage.setItem(CUSTOM_LINKS_STORAGE_KEY, JSON.stringify(nextCustomLinks));
            return;
        }

        setHiddenLinks((currentLinks) => {
            const nextHiddenLinks = currentLinks.includes(link.url)
                ? currentLinks
                : [...currentLinks, link.url];
            window.localStorage.setItem(HIDDEN_LINKS_STORAGE_KEY, JSON.stringify(nextHiddenLinks));
            return nextHiddenLinks;
        });
    };

    if (!isExtension) {
        return null;
    }

    return (
        <nav aria-label="Suggested websites" className="w-full px-4 pb-8 animate-fade-in">
            <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
                {visibleLinks.map((link) => {
                    const hostname = new URL(link.url).hostname;
                    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;

                    return (
                        <div key={link.url} className="group relative inline-flex">
                            <a
                                href={link.url}
                                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 pr-10 text-sm text-card-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-blue-500"
                            >
                                <img
                                    src={faviconUrl}
                                    alt=""
                                    width={20}
                                    height={20}
                                    loading="lazy"
                                    className="size-5 shrink-0 rounded-sm transition-transform duration-200 group-hover:scale-105"
                                />
                                <span>{link.name}</span>
                            </a>
                            <button
                                type="button"
                                aria-label={`Remove ${link.name}`}
                                title={`Remove ${link.name}`}
                                onClick={() => handleRemoveSite(link)}
                                className="absolute right-1 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                            >
                                <X className="size-3.5" aria-hidden="true" />
                            </button>
                        </div>
                    );
                })}
                {isAdding ? (
                    <form onSubmit={handleAddSite} className="flex w-full max-w-md flex-wrap items-start justify-center gap-2">
                        <input
                            value={siteName}
                            onChange={(event) => setSiteName(event.target.value)}
                            placeholder="Website name"
                            aria-label="Website name"
                            className="h-11 min-w-32 flex-1 rounded-full border border-border bg-card px-4 text-sm text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <input
                            value={siteUrl}
                            onChange={(event) => setSiteUrl(event.target.value)}
                            placeholder="example.com"
                            aria-label="Website URL"
                            className="h-11 min-w-40 flex-1 rounded-full border border-border bg-card px-4 text-sm text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="h-11 rounded-full bg-primary px-4 text-sm text-primary-foreground transition hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsAdding(false);
                                setFormError('');
                            }}
                            className="h-11 rounded-full border border-border px-4 text-sm text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Cancel
                        </button>
                        {formError && <p className="w-full text-center text-xs text-destructive">{formError}</p>}
                    </form>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        <span>Add website</span>
                    </button>
                )}
            </div>
        </nav>
    );
}