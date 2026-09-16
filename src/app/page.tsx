import ExtensionApp from '@/components/ExtensionApp';
import DataLoader from '@/components/DataLoader';
import ClientInit from './client-init';

export default function RootPage() {
    return (
        <>
            <ClientInit />
            <DataLoader />
            <ExtensionApp />
        </>
    );
}