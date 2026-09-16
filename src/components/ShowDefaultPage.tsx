'use client';

import { useIsExtension } from '@/hooks/useIsExtension';
import QuickLinks from './QuickLinks';
import SearchBar from './SearchBar';


export default function ShowDefaultPage() {
    const isExtension = useIsExtension();

    // If not in extension context, show a placeholder or redirect
    if (!isExtension) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="text-center">
                    <p className="text-muted-foreground">
                        This is the extension home page. Load as a Chrome Extension to use.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex w-full flex-col items-center justify-start overflow-y-auto bg-background pt-10">
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
                <SearchBar />
                <QuickLinks />
            </div>
        </div>
    );
}
