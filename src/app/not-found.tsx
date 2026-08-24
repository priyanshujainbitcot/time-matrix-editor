import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
            <div className="flex flex-col items-center text-center p-8 bg-white border border-gray-200 rounded-2xl shadow-sm max-w-md">

                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <FileQuestion size={32} strokeWidth={2} />
                </div>


                <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                <p className="text-gray-500 mb-8 text-sm">
                    We couldn&apos;t find the page you were looking for. It might have been moved or deleted.
                </p>

                <Link
                    href="/notes"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm w-full"
                >
                    Return to Notes
                </Link>

            </div>
        </div>
    );
}