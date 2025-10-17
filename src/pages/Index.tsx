import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  timestamp: Date;
}

export default function Index() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([
    {
      id: '1',
      prompt: 'Modern AI-generated abstract art',
      url: 'https://cdn.poehali.dev/projects/922b0d60-5d6c-4aa7-88bd-2f177617e60b/files/e374aad8-a33f-4c20-9cdc-99deac52dfdc.jpg',
      timestamp: new Date()
    },
    {
      id: '2',
      prompt: 'Surreal landscape with floating islands',
      url: 'https://cdn.poehali.dev/projects/922b0d60-5d6c-4aa7-88bd-2f177617e60b/files/2f9d1075-4922-42eb-be32-c5bbc84ae405.jpg',
      timestamp: new Date()
    },
    {
      id: '3',
      prompt: 'Abstract geometric patterns',
      url: 'https://cdn.poehali.dev/projects/922b0d60-5d6c-4aa7-88bd-2f177617e60b/files/f9db3644-dc16-4791-ab91-79c828351a76.jpg',
      timestamp: new Date()
    }
  ]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Введите описание изображения');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('https://functions.poehali.dev/8f6a647f-8263-4634-886d-d420930fe4a0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error('Ошибка генерации');
      }

      const data = await response.json();
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        url: data.imageUrl,
        timestamp: new Date()
      };
      
      setImages([newImage, ...images]);
      setPrompt('');
      toast.success('Изображение создано!');
    } catch (error) {
      toast.error('Ошибка генерации изображения');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (image: GeneratedImage, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-image-${image.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Изображение скачано!');
    } catch (error) {
      toast.error('Ошибка скачивания');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
            <Icon name="Sparkles" size={40} className="text-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            AI Генератор Изображений
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Превратите ваши идеи в потрясающие визуальные образы с помощью искусственного интеллекта
          </p>
        </div>

        <Card className="p-8 mb-16 shadow-2xl border-0 bg-white/80 backdrop-blur-sm animate-scale-in">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Icon name="Wand2" size={24} className="text-primary mt-2 flex-shrink-0" />
              <div className="flex-1">
                <label htmlFor="prompt" className="block text-sm font-semibold mb-2 text-foreground">
                  Опишите желаемое изображение
                </label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Например: Космический пейзаж с фиолетовыми планетами и звёздами..."
                  className="min-h-[120px] text-base resize-none border-2 focus:border-primary transition-colors"
                  disabled={isGenerating}
                />
              </div>
            </div>
            
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              size="lg"
              className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity text-white font-semibold text-lg h-14"
            >
              {isGenerating ? (
                <>
                  <Icon name="Loader2" size={24} className="mr-2 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Icon name="Sparkles" size={24} className="mr-2" />
                  Создать изображение
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="Image" size={28} className="text-primary" />
            <h2 className="text-3xl font-bold">Галерея</h2>
            <span className="text-muted-foreground">({images.length})</span>
          </div>
          
          {images.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-2">
              <Icon name="ImageOff" size={64} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                Пока нет созданных изображений. Начните генерировать!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <Card
                  key={image.id}
                  className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(image);
                          }}
                        >
                          <Icon name="Maximize2" size={20} />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                          onClick={(e) => handleDownload(image, e)}
                        >
                          <Icon name="Download" size={20} />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">
                      {image.prompt}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Icon name="Clock" size={14} />
                      <span>Только что</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.prompt}
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                  onClick={(e) => handleDownload(selectedImage, e)}
                >
                  <Icon name="Download" size={20} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                  onClick={() => setSelectedImage(null)}
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white text-lg font-medium">{selectedImage.prompt}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
    </div>
  );
}