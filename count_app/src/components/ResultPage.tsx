import { useState, useRef, useEffect } from 'react';
import { Share, Download, Edit, Eye, EyeOff, Home, Plus, X, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { ProcessedImage, UserTier, DetectedObject } from '../App';
import { toast } from 'sonner@2.0.3';
import { UpgradeModal } from './UpgradeModal';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

type ResultPageProps = {
  result: ProcessedImage;
  onBack: () => void;
  userTier: UserTier;
  onUpgrade: () => void;
};

const allCategories = ['Apple', 'Orange', 'Banana', 'Bottle', 'Cup', 'Book', 'Phone', 'Laptop', 'Other'];

export function ResultPage({ result: initialResult, onBack, userTier, onUpgrade }: ResultPageProps) {
  const [result, setResult] = useState(initialResult);
  const [showMarkers, setShowMarkers] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const imageRef = useRef<HTMLDivElement>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<DetectedObject | null>(null);

  const maxCategoriesInFree = 2;
  const visibleCategories = userTier === 'pro' 
    ? Object.keys(result.categories)
    : Object.keys(result.categories).slice(0, maxCategoriesInFree);

  useEffect(() => {
    const updateImageSize = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        setImageSize({ width: rect.width, height: rect.height });
      }
    };

    updateImageSize();
    window.addEventListener('resize', updateImageSize);
    return () => window.removeEventListener('resize', updateImageSize);
  }, []);

  const handleCategoryFilter = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleExport = () => {
    if (userTier === 'free') {
      setShowUpgradeModal(true);
      return;
    }
    toast.success('Image exported successfully!');
  };

  const handleShare = () => {
    toast.success('Share link copied to clipboard!');
  };

  const handleEditToggle = () => {
    if (userTier === 'free' && !isEditMode) {
      setShowUpgradeModal(true);
      return;
    }
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // Save changes
      toast.success('Changes saved!');
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicked on existing marker
    const clickedMarker = result.objects.find(obj => {
      const distance = Math.sqrt(Math.pow(obj.x - x, 2) + Math.pow(obj.y - y, 2));
      return distance < 3; // Within 3% radius
    });

    if (clickedMarker) {
      setSelectedMarker(clickedMarker);
      setShowCategoryDialog(true);
    } else {
      // Add new marker
      setNewMarkerPosition({ x, y });
      setShowCategoryDialog(true);
    }
  };

  const handleAddMarker = (category: string) => {
    if (!newMarkerPosition) return;

    const colors = ['#4D8FFF', '#00D1FF', '#4CAF50', '#FFC107', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
    const categoryIndex = allCategories.indexOf(category);
    const color = colors[categoryIndex % colors.length];

    const newObject: DetectedObject = {
      id: `obj-${Date.now()}`,
      category,
      x: newMarkerPosition.x,
      y: newMarkerPosition.y,
      color,
    };

    const newObjects = [...result.objects, newObject];
    const newCategories = { ...result.categories };
    newCategories[category] = (newCategories[category] || 0) + 1;

    setResult({
      ...result,
      objects: newObjects,
      categories: newCategories,
      totalCount: result.totalCount + 1,
    });

    setNewMarkerPosition(null);
    setShowCategoryDialog(false);
    toast.success(`${category} added`);
  };

  const handleDeleteMarker = () => {
    if (!selectedMarker) return;

    const newObjects = result.objects.filter(obj => obj.id !== selectedMarker.id);
    const newCategories = { ...result.categories };
    newCategories[selectedMarker.category] -= 1;
    if (newCategories[selectedMarker.category] === 0) {
      delete newCategories[selectedMarker.category];
    }

    setResult({
      ...result,
      objects: newObjects,
      categories: newCategories,
      totalCount: result.totalCount - 1,
    });

    setSelectedMarker(null);
    setShowCategoryDialog(false);
    toast.success('Marker deleted');
  };

  const handleChangeCategory = (newCategory: string) => {
    if (!selectedMarker) return;

    const newObjects = result.objects.map(obj => 
      obj.id === selectedMarker.id 
        ? { ...obj, category: newCategory }
        : obj
    );

    const newCategories = { ...result.categories };
    newCategories[selectedMarker.category] -= 1;
    if (newCategories[selectedMarker.category] === 0) {
      delete newCategories[selectedMarker.category];
    }
    newCategories[newCategory] = (newCategories[newCategory] || 0) + 1;

    setResult({
      ...result,
      objects: newObjects,
      categories: newCategories,
    });

    setSelectedMarker(null);
    setShowCategoryDialog(false);
    toast.success('Category updated');
  };

  const filteredObjects = selectedCategory
    ? result.objects.filter(obj => obj.category === selectedCategory)
    : result.objects;
  
  // Create a map of object IDs to their global index for proper numbering
  const objectIndexMap = new Map(result.objects.map((obj, index) => [obj.id, index + 1]));

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
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-[#E0E0E0] hover:text-white"
            >
              <Share className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              className="text-[#E0E0E0] hover:text-white"
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              variant={isEditMode ? "default" : "ghost"}
              onClick={handleEditToggle}
              className={isEditMode ? "bg-[#4D8FFF] hover:bg-[#3D7FEF]" : "text-[#E0E0E0] hover:text-white"}
            >
              <Edit className="w-5 h-5 mr-2" />
              {isEditMode ? 'Save' : 'Edit'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Results Summary */}
          <Card className="bg-[#1F1F1F] border-[#2F2F2F] p-6">
            <div className="text-center mb-6">
              <div className="text-6xl text-[#4D8FFF] mb-2">{result.totalCount}</div>
              <div className="text-[#E0E0E0]">Total Count</div>
            </div>

            {/* Category Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-[#E0E0E0]">Categories</h3>
                {userTier === 'free' && Object.keys(result.categories).length > maxCategoriesInFree && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-[#4D8FFF] p-0 h-auto"
                  >
                    View All
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleCategories.map((category) => (
                  <Badge
                    key={category}
                    onClick={() => handleCategoryFilter(category)}
                    className={`cursor-pointer transition-all ${
                      selectedCategory === category
                        ? 'bg-[#4D8FFF] text-white'
                        : 'bg-[#2F2F2F] text-[#E0E0E0] hover:bg-[#3F3F3F]'
                    }`}
                  >
                    {category}: {result.categories[category]}
                  </Badge>
                ))}
                {userTier === 'free' && Object.keys(result.categories).length > maxCategoriesInFree && (
                  <Badge
                    className="bg-[#2F2F2F] text-[#4D8FFF] cursor-pointer"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    +{Object.keys(result.categories).length - maxCategoriesInFree} more
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Image with Markers */}
          <Card className="bg-[#1F1F1F] border-[#2F2F2F] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showMarkers}
                  onCheckedChange={setShowMarkers}
                  className="data-[state=checked]:bg-[#4D8FFF]"
                />
                <span className="text-sm text-[#E0E0E0]">
                  {showMarkers ? 'Hide' : 'Show'} Markers
                </span>
              </div>
              {isEditMode && (
                <div className="flex items-center gap-2 text-sm text-[#4D8FFF]">
                  <Plus className="w-4 h-4" />
                  Click to add markers
                </div>
              )}
            </div>

            <div
              ref={imageRef}
              className={`relative rounded-lg overflow-hidden ${isEditMode ? 'cursor-crosshair' : ''}`}
              onClick={handleImageClick}
            >
              <ImageWithFallback
                src={result.imageUrl}
                alt="Result"
                className="w-full h-auto"
              />

              {/* Markers Overlay */}
              {showMarkers && imageSize.width > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {filteredObjects.map((obj) => {
                    const globalIndex = objectIndexMap.get(obj.id) || 0;
                    return (
                      <div
                        key={obj.id}
                        className="absolute pointer-events-auto"
                        style={{
                          left: `${obj.x}%`,
                          top: `${obj.y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all hover:scale-125"
                          style={{
                            borderColor: obj.color,
                            backgroundColor: `${obj.color}40`,
                            color: obj.color,
                          }}
                        >
                          {globalIndex}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          onUpgrade();
          setShowUpgradeModal(false);
        }}
      />

      {/* Category Selection Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="bg-[#1F1F1F] border-[#2F2F2F] text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedMarker ? 'Edit Marker' : 'Add Marker'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#E0E0E0] mb-2 block">Category</label>
              <Select
                onValueChange={(value) => {
                  if (selectedMarker) {
                    handleChangeCategory(value);
                  } else {
                    handleAddMarker(value);
                  }
                }}
                defaultValue={selectedMarker?.category}
              >
                <SelectTrigger className="bg-[#2F2F2F] border-[#3F3F3F]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#2F2F2F] border-[#3F3F3F]">
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedMarker && (
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleDeleteMarker}
                className="bg-[#F44336] hover:bg-[#D32F2F]"
              >
                <X className="w-4 h-4 mr-2" />
                Delete Marker
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
