import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import initSqlJs from 'sql.js';

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
      
      // Generate unique IDs
      const deckId = Math.floor(Math.random() * 1000000000);
      const modelId = Math.floor(Math.random() * 1000000000);
      const timestamp = Date.now();
      
      // Media files mapping for Anki
      const mediaFiles: { [key: string]: string } = {};
      
      // Process images and create media files
      let mediaIndex = 0;
      const processedCards = cards.map((card, cardIndex) => {
        let imageReferences = '';
        
        card.back.images.forEach((imageData, imgIndex) => {
          const filename = `${mediaIndex}.png`;
          const base64Data = imageData.split(',')[1]; // Remove data:image/png;base64,
          
          // Add image to zip
          zip.file(filename, base64Data, { base64: true });
          
          // Add to media mapping
          mediaFiles[mediaIndex.toString()] = filename;
          
          // Create HTML reference for the image
          imageReferences += `<br><img src="${filename}">`;
          
          mediaIndex++;
        });
        
        return {
          ...card,
          imageHtml: imageReferences
        };
      });
      
      // Create media file (required by Anki)
      zip.file("media", JSON.stringify(mediaFiles));
      
      // Create proper SQLite database for Anki
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });
      
      const db = new SQL.Database();
      
      // Create Anki database schema
      db.exec(`
        CREATE TABLE col (
          id integer primary key,
          crt integer not null,
          mod integer not null,
          scm integer not null,
          ver integer not null,
          dty integer not null,
          usn integer not null,
          ls integer not null,
          conf text not null,
          models text not null,
          decks text not null,
          dconf text not null,
          tags text not null
        );
        
        CREATE TABLE notes (
          id integer primary key,
          guid text not null,
          mid integer not null,
          mod integer not null,
          usn integer not null,
          tags text not null,
          flds text not null,
          sfld text not null,
          csum integer not null,
          flags integer not null,
          data text not null
        );
        
        CREATE TABLE cards (
          id integer primary key,
          nid integer not null,
          did integer not null,
          ord integer not null,
          mod integer not null,
          usn integer not null,
          type integer not null,
          queue integer not null,
          due integer not null,
          ivl integer not null,
          factor integer not null,
          reps integer not null,
          lapses integer not null,
          left integer not null,
          odue integer not null,
          odid integer not null,
          flags integer not null,
          data text not null
        );
        
        CREATE INDEX ix_notes_usn on notes (usn);
        CREATE INDEX ix_cards_usn on cards (usn);
        CREATE INDEX ix_notes_csum on notes (csum);
      `);
      
      // Insert collection data
      const confData = JSON.stringify({
        nextPos: 1,
        estTimes: true,
        activeDecks: [deckId],
        sortType: "noteFld",
        timeLim: 0,
        sortBackwards: false,
        addToCur: true,
        curDeck: deckId,
        newBury: true,
        newSpread: 0,
        dueCounts: true,
        curModel: modelId,
        collapseTime: 1200
      });
      
      const decksData = JSON.stringify({
        [deckId]: {
          id: deckId,
          name: "PDF Study Cards",
          extendRev: 50,
          usn: 0,
          collapsed: false,
          newToday: [0, 0],
          revToday: [0, 0],
          lrnToday: [0, 0],
          timeToday: [0, 0],
          conf: 1,
          desc: "Cards created from PDF",
          dyn: 0,
          extendNew: 10
        }
      });
      
      const dconfData = JSON.stringify({
        1: {
          id: 1,
          name: "Default",
          replayq: true,
          lapse: {
            leechFails: 8,
            delays: [10],
            minInt: 1,
            leechAction: 0,
            mult: 0
          },
          rev: {
            perDay: 200,
            fuzz: 0.05,
            ivlFct: 1,
            maxIvl: 36500,
            ease4: 1.3,
            bury: true,
            minSpace: 1
          },
          timer: 0,
          maxTaken: 60,
          usn: 0,
          new: {
            perDay: 20,
            delays: [1, 10],
            separate: true,
            ints: [1, 4, 7],
            initialFactor: 2500,
            bury: true,
            order: 1
          },
          mod: 0,
          autoplay: true
        }
      });
      
      const modelsData = JSON.stringify({
        [modelId]: {
          id: modelId,
          name: "Basic",
          type: 0,
          mod: timestamp,
          usn: -1,
          sortf: 0,
          did: deckId,
          tmpls: [
            {
              name: "Card 1",
              ord: 0,
              qfmt: "{{Front}}",
              afmt: "{{FrontSide}}<hr id='answer'>{{Back}}",
              bqfmt: "",
              bafmt: "",
              did: null,
              bfont: "",
              bsize: 0
            }
          ],
          flds: [
            {
              name: "Front",
              ord: 0,
              sticky: false,
              rtl: false,
              font: "Arial",
              size: 20
            },
            {
              name: "Back",
              ord: 1,
              sticky: false,
              rtl: false,
              font: "Arial",
              size: 20
            }
          ],
          css: ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}",
          latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
          latexPost: "\\end{document}",
          req: [[0, "all", [0]]]
        }
      });
      
      db.exec(`
        INSERT INTO col VALUES (
          1, 1640995200, ${timestamp}, ${timestamp}, 11, 0, 0, 0,
          '${confData.replace(/'/g, "''")}',
          '${modelsData.replace(/'/g, "''")}',
          '${decksData.replace(/'/g, "''")}',
          '${dconfData.replace(/'/g, "''")}',
          '{}'
        );
      `);
      
      // Insert notes and cards
      processedCards.forEach((card, index) => {
        const noteId = index + 1;
        const guid = `guid${noteId}${timestamp}`;
        const front = card.front.replace(/'/g, "''");
        const back = (card.back.text + card.imageHtml).replace(/'/g, "''");
        const fields = `${front}\x1f${back}`;
        
        db.exec(`
          INSERT INTO notes VALUES (
            ${noteId}, '${guid}', ${modelId}, ${timestamp}, -1, '',
            '${fields}', '${front}', ${Math.floor(Math.random() * 1000000)}, 0, ''
          );
          
          INSERT INTO cards VALUES (
            ${noteId}, ${noteId}, ${deckId}, 0, ${timestamp}, -1, 0, 0, ${noteId}, 0, 2500, 0, 0, 0, 0, 0, 0, ''
          );
        `);
      });
      
      // Export database as binary data
      const data = db.export();
      zip.file("collection.anki2", data);
      
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
      
      alert(`✅ Successfully exported ${cards.length} cards to .apkg format!

The file 'pdf-study-cards.apkg' has been downloaded. Simply double-click it or import it directly into Anki.

Your images will display properly as separate media files in Anki.`);
      
      console.log('Successfully exported', cards.length, 'cards to .apkg format with', mediaIndex, 'images');
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ Export failed. Please try again or check the console for details.');
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