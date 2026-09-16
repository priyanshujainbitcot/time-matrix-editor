'use client';

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
];

type QuickLinksProps = {
    links?: QuickLink[];
};

export default function QuickLinks({ links = DEFAULT_QUICK_LINKS }: QuickLinksProps) {
    const isExtension = useIsExtension();

    if (!isExtension) {
        return null;
    }

    return (
        <nav aria-label="Suggested websites" className="w-full px-4 pb-8 animate-fade-in">
            <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-3">
                {links.map((link) => {
                    const hostname = new URL(link.url).hostname;
                    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;

                    return (
                        <a
                            key={link.url}
                            href={link.url}
                            className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-card-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-blue-500"
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
                    );
                })}
            </div>
        </nav>
    );
}