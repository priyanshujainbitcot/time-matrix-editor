import Header from '@/components/hoc/LayoutComponent/AppHeader';
import DataLoader from '@/components/DataLoader';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            <Header />
            <DataLoader>
                <main className="flex-1 flex flex-col w-full overflow-hidden">
                    {children}
                </main>
            </DataLoader>
        </div>
    );
}