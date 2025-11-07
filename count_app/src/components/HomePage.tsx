import { useRef, useState } from 'react';
import { Upload, History, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { UserTier, ProcessedImage } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { uploadImage } from '../services/api';
import { UserMenu } from './UserMenu';

type HomePageProps = {
  onImageUpload: (imageUrl: string) => void;
  onNavigateHistory: () => void;
  userTier: UserTier;
  dailyCount: number;
};

export function HomePage({ onImageUpload, onNavigateHistory, userTier, dailyCount }: HomePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const history: ProcessedImage[] = JSON.parse(localStorage.getItem('countHistory') || '[]');
  const recentImages = history.slice(0, 3);
  const freeLimit = 5;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user can upload
    if (userTier !== 'pro' && dailyCount >= freeLimit) {
      return;
    }

    setUploading(true);
    try {
      // Upload to server
      const uploadResult = await uploadImage(file);
      setUploading(false);
      onImageUpload(uploadResult.imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      // Fallback to local preview if upload fails
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        onImageUpload(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const canUpload = userTier === 'pro' || dailyCount < freeLimit;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1F1F1F] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4D8FFF] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-xl">AI Count</h1>
          </div>
          {userTier === 'free' && (
            <Badge variant="outline" className="border-[#4D8FFF] text-[#4D8FFF]">
              Free {dailyCount}/{freeLimit}
            </Badge>
          )}
          {userTier === 'pro' && (
            <Badge className="bg-[#4D8FFF]">Pro</Badge>
          )}
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Free Tier Warning */}
          {userTier === 'free' && dailyCount >= freeLimit && (
            <Alert className="bg-[#1F1F1F] border-[#F44336]">
              <AlertDescription className="text-[#F44336]">
                You've reached your daily limit of {freeLimit} counts. Upgrade to Pro for unlimited counts!
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl">Count Anything with AI</h2>
            <p className="text-[#E0E0E0] max-w-2xl mx-auto">
              Upload an image and let AI automatically detect and count objects with precision
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={!canUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={!canUpload || uploading}
              size="lg"
              className="bg-[#4D8FFF] hover:bg-[#3D7FEF] text-white h-14 px-12 rounded-xl"
            >
              <Upload className="w-5 h-5 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </div>

          {/* Recent Processing */}
          {recentImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl">Recent Processing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentImages.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-[#1F1F1F] border-[#2F2F2F] overflow-hidden cursor-pointer hover:border-[#4D8FFF] transition-colors"
                    onClick={() => {
                      // Navigate to result page with this image
                      window.dispatchEvent(new CustomEvent('viewResult', { detail: item }));
                    }}
                  >
                    <div className="aspect-video relative">
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt="Recent processing"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl text-[#4D8FFF]">{item.totalCount}</span>
                        <span className="text-sm text-[#E0E0E0]">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-[#E0E0E0] mt-1">
                        {Object.keys(item.categories).length} categories
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-[#1F1F1F] py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-center gap-8">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 text-[#4D8FFF]"
          >
            <Upload className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Button>
          <Button
            variant="ghost"
            onClick={onNavigateHistory}
            className="flex flex-col items-center gap-1 h-auto py-2 text-[#E0E0E0] hover:text-[#4D8FFF]"
          >
            <History className="w-6 h-6" />
            <span className="text-xs">History</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
