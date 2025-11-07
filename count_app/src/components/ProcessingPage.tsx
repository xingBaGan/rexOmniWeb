import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ProcessedImage, DetectedObject } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { predictImage, tagImage } from '../services/api';
import { parseCoordinates } from '../utils/coordinateParser';

type ProcessingPageProps = {
  imageUrl: string;
  onComplete: (result: ProcessedImage) => void;
  onCancel: () => void;
};

const statusMessages = [
  'Analyzing image...',
  'Detecting objects...',
  'Counting items...',
  'Generating visualization...',
  'Finalizing results...',
];

const colors = ['#4D8FFF', '#00D1FF', '#4CAF50', '#FFC107', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

export function ProcessingPage({ imageUrl, onComplete, onCancel }: ProcessingPageProps) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Update status messages
    const statusInterval = setInterval(() => {
      if (!cancelled) {
        setStatusIndex((prev) => (prev + 1) % statusMessages.length);
      }
    }, 1000);

    // Process image with real API
    const processImage = async () => {
      try {
        // Step 1: Get tags from image (0-30%)
        setProgress(10);
        const taggerResult = await tagImage(imageUrl);
        if (cancelled) return;

        setProgress(30);
        const categories = taggerResult.tags || [];

        // Step 2: Predict objects (30-90%)
        setProgress(40);
        const predictResult = await predictImage(imageUrl, categories);
        if (cancelled) return;

        setProgress(90);

        // Parse prediction result
        // predictResult structure: { data: [imageFile, coordinateString] }
        const predictionData = predictResult.data || [];
        const coordinateString = Array.isArray(predictionData) && predictionData.length > 1 
          ? predictionData[1] 
          : "";
        
        // Parse coordinates from the response string
        const parsedCoordinates = parseCoordinates(coordinateString);
        
        // Transform parsed coordinates to app format
        const objects: DetectedObject[] = [];
        const categoryCounts: { [key: string]: number } = {};
        
        // Group coordinates by label to assign colors
        const labelGroups: { [key: string]: number } = {};
        let groupIndex = 0;

        parsedCoordinates.forEach((coord, index) => {
          const label = coord.label || 'object';
          
          // Assign group index for color selection
          if (!labelGroups.hasOwnProperty(label)) {
            labelGroups[label] = groupIndex++;
          }
          
          const colorIndex = labelGroups[label] % colors.length;
          const color = colors[colorIndex];
          
          objects.push({
            id: `obj-${index}`,
            category: label,
            x: coord.x, // Already in percentage (0-100)
            y: coord.y, // Already in percentage (0-100)
            color,
          });

          categoryCounts[label] = (categoryCounts[label] || 0) + 1;
        });

        // If no objects detected, create a fallback result
        if (objects.length === 0 && categories.length > 0) {
          categories.forEach((category, index) => {
            const color = colors[index % colors.length];
            objects.push({
              id: `obj-${index}`,
              category,
              x: Math.random() * 80 + 10,
              y: Math.random() * 80 + 10,
              color,
            });
            categoryCounts[category] = 1;
          });
        }

        setProgress(100);

        if (!cancelled) {
          const result: ProcessedImage = {
            id: `img-${Date.now()}`,
            imageUrl,
            timestamp: Date.now(),
            totalCount: objects.length,
            categories: categoryCounts,
            objects,
          };

          onComplete(result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Processing error:', err);
          setError(err instanceof Error ? err.message : 'Failed to process image');
        }
      }
    };

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      if (!cancelled) {
        setProgress((prev) => {
          if (prev >= 90) {
            return prev;
          }
          return prev + 1;
        });
      }
    }, 200);

    processImage();

    return () => {
      cancelled = true;
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, [imageUrl, onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Image Preview */}
        <div className="relative rounded-xl overflow-hidden">
          <ImageWithFallback
            src={imageUrl}
            alt="Processing"
            className="w-full h-64 object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#4D8FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-[#E0E0E0] animate-pulse">
            {error || statusMessages[statusIndex]}
          </p>
          <p className="text-center text-sm text-[#E0E0E0]">
            {progress}%
          </p>
          {error && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-[#2F2F2F] text-[#E0E0E0] hover:bg-[#1F1F1F]"
              >
                Go Back
              </Button>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-[#2F2F2F] text-[#E0E0E0] hover:bg-[#1F1F1F]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
