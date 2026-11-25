import { Sidebar } from './Sidebar';

export const DashboardContainer = ({ user, onLogout, children }) => {
  return (
    <div className='min-h-screen bg-surface lg:flex'>
      <Sidebar user={user} onLogout={onLogout} />
      <main className='min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8'>
        <div className='mx-auto max-w-[1200px]'>{children}</div>
      </main>
    </div>
  );
};
