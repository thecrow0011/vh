import React from 'react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTabTitle?: string;
  isMobileMockup?: boolean;
  setIsMobileMockup?: (val: boolean) => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] max-h-[100dvh] bg-[#0A0A0A] text-[#F0F0F0] flex flex-col overflow-hidden font-sans select-none">
      {/* Full screen main application container */}
      <div className="flex-1 h-full max-h-full flex flex-col overflow-hidden relative bg-[#0A0A0A] w-full">
        {children}
      </div>
    </div>
  );
};

