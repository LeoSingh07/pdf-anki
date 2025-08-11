import React, { useRef } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { PDFViewer } from '@/components/ui/pdf-viewer';
import { AnkiCardCreator } from '@/components/ui/anki-card-creator';

export const SplitLayout: React.FC = () => {
  const addImageRef = useRef<((imageData: string) => void) | null>(null);

  const handleAreaSelect = (imageData: string) => {
    if (addImageRef.current) {
      addImageRef.current(imageData);
    }
  };

  const handleAddImageRef = (addImageFn: (imageData: string) => void) => {
    addImageRef.current = addImageFn;
  };

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={50} minSize={30}>
          <PDFViewer onAreaSelect={handleAreaSelect} />
        </ResizablePanel>
        
        <ResizableHandle className="w-2 bg-border hover:bg-primary/20 transition-colors" />
        
        <ResizablePanel defaultSize={50} minSize={30}>
          <AnkiCardCreator onAddImage={handleAddImageRef} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};