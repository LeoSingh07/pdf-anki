import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnkiCard {
  id: string;
  front: string;
  back: {
    text: string;
    images: string[];
  };
}

interface AnkiCardCreatorProps {
  onAddImage?: (addImageFn: (imageData: string) => void) => void;
}

export const AnkiCardCreator: React.FC<AnkiCardCreatorProps> = ({ onAddImage }) => {
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [currentCard, setCurrentCard] = useState<AnkiCard>({
    id: '',
    front: '',
    back: { text: '', images: [] },
  });

  const handleAddImage = (imageData: string) => {
    setCurrentCard(prev => ({
      ...prev,
      back: {
        ...prev.back,
        images: [...prev.back.images, imageData],
      },
    }));
  };

  React.useEffect(() => {
    if (onAddImage) {
      onAddImage(handleAddImage);
    }
  }, [onAddImage]);

  const removeImage = (index: number) => {
    setCurrentCard(prev => ({
      ...prev,
      back: {
        ...prev.back,
        images: prev.back.images.filter((_, i) => i !== index),
      },
    }));
  };

  const saveCard = () => {
    if (!currentCard.front.trim()) return;
    
    const cardToSave = {
      ...currentCard,
      id: Date.now().toString(),
    };
    
    setCards(prev => [...prev, cardToSave]);
    setCurrentCard({
      id: '',
      front: '',
      back: { text: '', images: [] },
    });
  };

  const deleteCard = (cardId: string) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
  };

  const exportCards = () => {
    // For now, we'll create a simple JSON export
    // In a real implementation, this would generate an actual .apkg file
    const exportData = {
      cards: cards.map(card => ({
        front: card.front,
        back: card.back.text,
        images: card.back.images,
      })),
      metadata: {
        name: 'PDF Study Cards',
        created: new Date().toISOString(),
        count: cards.length,
      },
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anki-cards.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-card-area">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Anki Card Creator</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{cards.length} cards</Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportCards}
              disabled={cards.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Current Card Editor */}
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Create New Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Front (Question)
              </label>
              <Textarea
                placeholder="Enter your question or prompt here..."
                value={currentCard.front}
                onChange={(e) => setCurrentCard(prev => ({ ...prev, front: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Back (Answer - Text)
              </label>
              <Textarea
                placeholder="Enter additional text for the answer..."
                value={currentCard.back.text}
                onChange={(e) => setCurrentCard(prev => ({
                  ...prev,
                  back: { ...prev.back, text: e.target.value }
                }))}
                className="min-h-[80px]"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Back (Answer - Images)
              </label>
              {currentCard.back.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {currentCard.back.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Selected area ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted rounded border-2 border-dashed">
                  Select areas from the PDF to add images here
                </div>
              )}
            </div>
            
            <Button 
              onClick={saveCard}
              className="w-full"
              disabled={!currentCard.front.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Save Card
            </Button>
          </CardContent>
        </Card>
        
        {/* Saved Cards */}
        {cards.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Saved Cards</h3>
            {cards.map((card) => (
              <Card key={card.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">Front:</div>
                      <div className="text-sm text-muted-foreground mb-3">
                        {card.front}
                      </div>
                      
                      {card.back.text && (
                        <>
                          <div className="font-medium text-sm mb-1">Back (Text):</div>
                          <div className="text-sm text-muted-foreground mb-3">
                            {card.back.text}
                          </div>
                        </>
                      )}
                      
                      {card.back.images.length > 0 && (
                        <>
                          <div className="font-medium text-sm mb-1">Back (Images):</div>
                          <div className="grid grid-cols-3 gap-1">
                            {card.back.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Card image ${index + 1}`}
                                className="w-full h-12 object-cover rounded border"
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCard(card.id)}
                      className="ml-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {cards.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="mb-4 p-6 rounded-full bg-muted mx-auto w-fit">
              <Plus className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium mb-2">No cards yet</h3>
            <p className="text-sm">
              Create your first Anki card by filling out the form above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};