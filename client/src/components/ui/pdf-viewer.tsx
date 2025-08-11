import React, { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Upload, ZoomIn, ZoomOut, Hand, BoxSelect } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface PDFViewerProps {
  onAreaSelect?: (imageData: string) => void;
}

interface SelectionArea {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ onAreaSelect }) => {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selection, setSelection] = useState<SelectionArea | null>(null);
  const [mode, setMode] = useState<'scroll' | 'select'>('scroll');
  const pageRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
const selectedFile = event.target.files?.[0];
if (selectedFile) {
  const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    setFile(selectedFile);
    setPageNumber(1);
  } else {
    toast({
      title: 'Unsupported file',
      description: 'Please select a valid PDF file.',
      variant: 'destructive',
    });
  }
}
  };

  const goToPrevPage = () => {
    setPageNumber(page => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setPageNumber(page => Math.min(numPages, page + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (mode !== 'select') return;
    if (!pageRef.current) return;
    
    const rect = pageRef.current.getBoundingClientRect();
    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;
    
    setIsSelecting(true);
    setSelection({
      startX,
      startY,
      endX: startX,
      endY: startY,
    });
  }, [mode]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || !pageRef.current || !selection) return;
    
    const rect = pageRef.current.getBoundingClientRect();
    const endX = event.clientX - rect.left;
    const endY = event.clientY - rect.top;
    
    setSelection(prev => prev ? {
      ...prev,
      endX,
      endY,
    } : null);
  }, [isSelecting, selection]);

  const handleMouseUp = useCallback(async () => {
    if (!isSelecting || !selection || !pageRef.current) return;

    setIsSelecting(false);

    // Capture the selected area relative to the canvas, accounting for device pixel ratio
    const canvas = pageRef.current.querySelector('canvas');
    if (canvas && onAreaSelect) {
      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = pageRef.current.getBoundingClientRect();

      // Selection in container CSS pixels
      const selLeftCss = Math.min(selection.startX, selection.endX);
      const selTopCss = Math.min(selection.startY, selection.endY);
      const selWidthCss = Math.abs(selection.endX - selection.startX);
      const selHeightCss = Math.abs(selection.endY - selection.startY);

      // Convert container-relative CSS px to canvas-relative CSS px
      const leftOnCanvasCss = selLeftCss - (canvasRect.left - containerRect.left);
      const topOnCanvasCss = selTopCss - (canvasRect.top - containerRect.top);

      // Map CSS pixels to canvas pixel coordinates
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;

      const sx = Math.max(0, Math.round(leftOnCanvasCss * scaleX));
      const sy = Math.max(0, Math.round(topOnCanvasCss * scaleY));
      const sw = Math.max(1, Math.round(selWidthCss * scaleX));
      const sh = Math.max(1, Math.round(selHeightCss * scaleY));

      // Guard against tiny selections
      if (sw < 5 || sh < 5) {
        setSelection(null);
        toast({ title: 'Selection too small', description: 'Drag a larger area to capture.', variant: 'destructive' });
        return;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sw;
      tempCanvas.height = sh;
      const ctx = tempCanvas.getContext('2d');

      if (ctx) {
        try {
          ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
          const imageData = tempCanvas.toDataURL('image/png');
          onAreaSelect(imageData);
          toast({ title: 'Image added to back', description: 'Selected area captured from PDF.' });
        } catch (err) {
          console.error('Area capture error:', err);
          toast({ title: 'Capture failed', description: 'Try again or reload the PDF.', variant: 'destructive' });
        }
      }
    }

    setSelection(null);
  }, [isSelecting, selection, onAreaSelect]);

  const renderSelectionOverlay = () => {
    if (!selection) return null;
    
    const { startX, startY, endX, endY } = selection;
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    return (
      <div
        className="absolute border-2 border-selection bg-selection-bg pointer-events-none"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    );
  };

  return (
    <div className="h-full flex flex-col bg-pdf-area">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </span>
              </Button>
            </label>
          </div>
          
          {file && (
            <div className="text-sm text-muted-foreground truncate">
              {file.name}
            </div>
          )}
        </div>
        
        {file && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium px-3">
              {pageNumber} / {numPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="mx-4 w-px h-6 bg-border" />
            
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-sm px-2">{Math.round(scale * 100)}%</span>
            
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>

            <div className="mx-4 w-px h-6 bg-border" />

            <div className="ml-auto flex items-center gap-2">
              {mode === 'select' ? (
                <BoxSelect className="h-4 w-4" />
              ) : (
                <Hand className="h-4 w-4" />
              )}
              <Switch
                id="toggle-select-mode"
                checked={mode === 'select'}
                onCheckedChange={(checked) => setMode(checked ? 'select' : 'scroll')}
                aria-label="Toggle selection mode"
              />
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {mode === 'select' ? 'Select' : 'Scroll'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {file ? (
          <div className="flex justify-center">
            <div
              ref={pageRef}
              className={cn(
                "relative border border-border shadow-md select-none",
                mode === 'select' && "cursor-crosshair touch-none"
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(err) => {
                  console.error('PDF load error:', err);
                  toast({ title: 'Failed to open PDF', description: 'The file may be corrupted or encrypted.', variant: 'destructive' });
                }}
                onSourceError={(err) => {
                  console.error('PDF source error:', err);
                  toast({ title: 'Failed to read file', description: 'Please try another PDF.', variant: 'destructive' });
                }}
                loading={
                  <div className="flex items-center justify-center h-96 bg-muted">
                    <div className="text-muted-foreground">Loading PDF...</div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  onRenderError={(err) => {
                    console.error('Page render error:', err);
                    toast({ title: 'Failed to render page', description: 'Try zooming out or reloading.', variant: 'destructive' });
                  }}
                  loading={
                    <div className="flex items-center justify-center h-96 bg-muted">
                      <div className="text-muted-foreground">Loading page...</div>
                    </div>
                  }
                />
              </Document>
              {renderSelectionOverlay()}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div className="max-w-md">
              <div className="mb-4 p-8 rounded-full bg-muted mx-auto w-fit">
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload a PDF</h3>
              <p className="text-muted-foreground mb-4">
                Select a PDF file to start creating Anki cards. You can then select areas from the PDF to add as images to your cards.
              </p>
              <label htmlFor="pdf-upload">
                <Button asChild>
                  <span className="cursor-pointer">Choose PDF File</span>
                </Button>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};