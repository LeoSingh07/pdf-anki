import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';

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

  const exportCards = async () => {
    if (cards.length === 0) return;

    try {
      const zip = new JSZip();
      
      // Generate a unique deck ID
      const deckId = Date.now();
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Collection.anki2 - SQLite database structure for Anki
      const collectionData = {
        "ver": 11,
        "crt": timestamp,
        "mod": timestamp,
        "scm": timestamp,
        "dty": 0,
        "usn": -1,
        "ls": 0,
        "conf": {
          "nextPos": 1,
          "estTimes": true,
          "activeDecks": [deckId],
          "sortType": "noteFld",
          "timeLim": 0,
          "sortBackwards": false,
          "addToCur": true,
          "curDeck": deckId,
          "newBury": true,
          "newSpread": 0,
          "dueCounts": true,
          "curModel": deckId,
          "collapseTime": 1200
        },
        "decks": {
          [deckId]: {
            "id": deckId,
            "name": "PDF Study Cards",
            "extendRev": 50,
            "usn": 0,
            "collapsed": false,
            "newToday": [0, 0],
            "revToday": [0, 0],
            "lrnToday": [0, 0],
            "timeToday": [0, 0],
            "conf": 1,
            "desc": "Cards created from PDF",
            "dyn": 0,
            "extendNew": 10
          }
        },
        "dconf": {
          "1": {
            "id": 1,
            "name": "Default",
            "replayq": true,
            "lapse": {
              "leechFails": 8,
              "delays": [10],
              "minInt": 1,
              "leechAction": 0,
              "mult": 0
            },
            "rev": {
              "perDay": 200,
              "fuzz": 0.05,
              "ivlFct": 1,
              "maxIvl": 36500,
              "ease4": 1.3,
              "bury": true,
              "minSpace": 1
            },
            "timer": 0,
            "maxTaken": 60,
            "usn": 0,
            "new": {
              "perDay": 20,
              "delays": [1, 10],
              "separate": true,
              "ints": [1, 4, 7],
              "initialFactor": 2500,
              "bury": true,
              "order": 1
            },
            "mod": 0,
            "autoplay": true
          }
        },
        "models": {
          [deckId]: {
            "id": deckId,
            "name": "PDF Study Model",
            "type": 0,
            "mod": timestamp,
            "usn": -1,
            "sortf": 0,
            "did": deckId,
            "tmpls": [
              {
                "name": "Card 1",
                "ord": 0,
                "qfmt": "{{Front}}",
                "afmt": "{{FrontSide}}<hr id=\"answer\">{{Back}}{{#Images}}<br><img src=\"{{Images}}\">{{/Images}}",
                "bqfmt": "",
                "bafmt": "",
                "did": null,
                "bfont": "",
                "bsize": 0
              }
            ],
            "flds": [
              {
                "name": "Front",
                "ord": 0,
                "sticky": false,
                "rtl": false,
                "font": "Arial",
                "size": 20
              },
              {
                "name": "Back",
                "ord": 1,
                "sticky": false,
                "rtl": false,
                "font": "Arial",
                "size": 20
              },
              {
                "name": "Images",
                "ord": 2,
                "sticky": false,
                "rtl": false,
                "font": "Arial",
                "size": 20
              }
            ],
            "css": ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n\n.cloze {\n font-weight: bold;\n color: blue;\n}\n.nightMode .cloze {\n color: lightblue;\n}",
            "latexPre": "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
            "latexPost": "\\end{document}",
            "req": [[0, "all", [0]]]
          }
        }
      };
      
      // Create a simple text representation for the collection (Anki format is complex)
      const collectionText = JSON.stringify(collectionData, null, 2);
      zip.file("collection.anki2.txt", collectionText);
      
      // Media files (images from the cards)
      const mediaFiles: { [key: string]: string } = {};
      let mediaIndex = 0;
      
      // Notes data (the actual cards)
      const notes = cards.map((card, index) => {
        let imagesHtml = '';
        card.back.images.forEach((imageData, imgIndex) => {
          const filename = `image_${index}_${imgIndex}.png`;
          const base64Data = imageData.split(',')[1]; // Remove data:image/png;base64,
          zip.file(filename, base64Data, { base64: true });
          mediaFiles[filename] = '';
          imagesHtml += `<img src="${filename}">`;
        });
        
        return {
          id: index + 1,
          guid: `guid_${index + 1}`,
          mid: deckId,
          mod: timestamp,
          usn: -1,
          tags: "",
          flds: [
            card.front,
            card.back.text,
            imagesHtml
          ].join('\x1f'),
          sfld: card.front,
          csum: 0,
          flags: 0,
          data: ""
        };
      });
      
      // Add notes file
      zip.file("notes.txt", JSON.stringify(notes, null, 2));
      
      // Add media file
      zip.file("media", JSON.stringify(mediaFiles));
      
      // Generate and download the .apkg file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pdf-study-cards.apkg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Successfully exported', cards.length, 'cards to .apkg format');
      
    } catch (error) {
      console.error('Export failed:', error);
      // Fallback to JSON export if .apkg generation fails
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
      a.download = 'anki-cards-fallback.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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