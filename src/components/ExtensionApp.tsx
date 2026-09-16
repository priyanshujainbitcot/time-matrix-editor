'use client';

import { useAppSelector } from '@/store/hooks';
import ShowDefaultPage from './ShowDefaultPage';
import ShowNotesPage from './ShowNotesPage';
import ShowTasksPage from './ShowTasksPage';
import ShowMatrixPage from './ShowMatrixPage';
import Header from './hoc/LayoutComponent/AppHeader';

export default function ExtensionApp() {
  const currentView = useAppSelector((state) => state.navigation.currentView);

  const renderView = () => {
    switch (currentView) {
      case 'default':
        return <ShowDefaultPage />;
      case 'notes':
        return <ShowNotesPage />;
      case 'tasks':
        return <ShowTasksPage />;
      case 'matrix':
        return <ShowMatrixPage />;
      default:
        return <ShowDefaultPage />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
}
