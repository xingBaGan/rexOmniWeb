import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Home, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ProcessedImage, UserTier } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';
import { getHistory, getGuestHistory, deleteHistoryItem, deleteGuestHistoryItem } from '../services/history';

type HistoryPageProps = {
  onBack: () => void;
  onSelectImage: (result: ProcessedImage) => void;
  userTier: UserTier;
};

export function HistoryPage({ onBack, onSelectImage, userTier }: HistoryPageProps) {
  const { isSignedIn, getToken } = useAuth();
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const maxFreeHistory = 3;
  const visibleHistory = userTier === 'pro' ? history : history.slice(0, maxFreeHistory);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        let data: ProcessedImage[] = [];
        if (isSignedIn) {
          const token = await getToken();
          if (token) {
            data = await getHistory(token);
          }
        } else {
          data = await getGuestHistory();
        }
        setHistory(data);
      } catch (error) {
        console.error('Failed to load history:', error);
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [isSignedIn, getToken]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          await deleteHistoryItem(token, id);
        }
      } else {
        await deleteGuestHistoryItem(id);
      }
      setHistory(history.filter(item => item.id !== id));
      toast.success('Item deleted from history');
    } catch (error) {
      console.error('Failed to delete history:', error);
      toast.error('Failed to delete history item');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1F1F1F] py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-[#E0E0E0] hover:text-white"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </Button>
          <h1 className="text-xl">History</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {userTier === 'free' && history.length > maxFreeHistory && (
            <Alert className="bg-[#1F1F1F] border-[#4D8FFF]">
              <AlertDescription className="text-[#4D8FFF]">
                You're viewing {maxFreeHistory} of {history.length} items. Upgrade to Pro to access unlimited history!
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-20">
              <p className="text-[#E0E0E0] text-lg">Loading history...</p>
            </div>
          ) : visibleHistory.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#E0E0E0] text-lg">No history yet</p>
              <p className="text-[#E0E0E0] text-sm mt-2">Start counting to see your history here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleHistory.map((item) => (
                <Card
                  key={item.id}
                  className="bg-[#1F1F1F] border-[#2F2F2F] overflow-hidden cursor-pointer hover:border-[#4D8FFF] transition-colors group"
                  onClick={() => onSelectImage(item)}
                >
                  <div className="aspect-video relative">
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt="History item"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#F44336] hover:bg-[#D32F2F]"
                      onClick={(e) => handleDelete(item.id, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl text-[#4D8FFF]">{item.totalCount}</span>
                      <span className="text-sm text-[#E0E0E0]">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-[#E0E0E0]">
                      {Object.keys(item.categories).length} categories detected
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(item.categories).slice(0, 3).map(([cat, count]) => (
                        <span key={cat} className="text-xs text-[#E0E0E0] bg-[#2F2F2F] px-2 py-1 rounded">
                          {cat}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
